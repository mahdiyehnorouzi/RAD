#!/usr/bin/env python3
"""Bounded RAD deploy transport.

The GitHub-hosted runner and the VPS forced command both move one tar
stream across an SSH session. OpenSSH's ConnectTimeout only bounds the TCP
handshake. After authentication, a stalled channel or a remote read that is
waiting for stdin EOF blocks until something else kills the session.

This module is the deadline for that byte stream:

- ``recv`` runs on the VPS, as the unprivileged ``rad-deploy`` account,
  before any broker invocation. It stops on idle, on an overall deadline,
  and on the size cap. A failed receive deletes its partial file.
- ``ship`` runs on the GitHub-hosted runner. It copies ``tar`` into ``ssh``
  while reading the remote stdout/stderr at the same time, so a progress
  line cannot fill the channel window and stall the upload. If the upload
  stalls or the remote closes early, it terminates both child processes.
  The broker is not this module's concern: the remote entrypoint invokes it
  only after a completed, validated receive. A single transient stall
  (never a sustained-slow-link deadline, a size violation, or anything the
  remote itself rejected) gets one retry from a fresh, empty start - see
  ``RETRYABLE_REASONS``.

Logs are fixed stage lines on stderr. They include byte counts and the
reason the transfer stopped. They do not include file contents, environment
values, or credentials.
"""
import argparse
import os
import re
import select
import signal
import subprocess
import sys
import time

DEFAULT_MAX_BYTES = 2200000000
# Run #45023030859 (after the run_id/deadline fix in #204) sent 36012032
# bytes at healthy throughput - most 1 MiB progress steps logged 1-3s apart
# - then went completely silent for just over 45s and failed
# reason=stalled. That is a single transient gap on an otherwise-healthy
# tailnet path, not a sustained slow link (which is what
# DEFAULT_DEADLINE_SECONDS below already covers). Raised from 45 to 90s so
# one short latency spike (a DERP relay reselect, a brief path flap) does
# not fail an upload that was otherwise progressing well; a link that is
# truly dead for 90s still fails closed exactly as before.
DEFAULT_IDLE_SECONDS = 90
# Run #45004239836 failed this deadline at bytes_sent=50069504 (~48 MiB) -
# well under DEFAULT_MAX_BYTES - meaning the tailnet path sustained well
# below 600s/48MiB (~83 KiB/s) that attempt, with no single idle gap over
# DEFAULT_IDLE_SECONDS (the failure reason was "deadline", not "stalled").
# A fixed 600s window gives a merely-slow-but-still-moving transfer no
# margin over a degraded link. Raising it to 1200s keeps the intent (fail
# closed on a transfer that is taking unreasonably long) while giving a
# transfer at that same degraded throughput room for an artifact roughly
# twice this one's size before hitting the deadline again. It does not
# remove the idle timeout (a true stall still fails at 45s) or the size cap.
DEFAULT_DEADLINE_SECONDS = 1200
# A "stalled" failure (see RETRYABLE_REASONS below) gets exactly one retry.
# Not retried: "deadline" (the attempt already used its whole time budget),
# "too_large"/"bad_request"/"empty" (not transient), "remote_closed" (the
# remote end itself ended the session, not a timeout). Each retried
# attempt starts a brand-new tar/ssh pair from byte zero - there is no
# resume - because the receiver's trust boundary only ever validates and
# extracts a complete tar after a fully finished receive (see
# rad_deploy_entrypoint.py), and partial/incomplete-transfer cleanup on
# both ends must stay unconditional; keeping cross-attempt byte-range
# state to resume from would mean trusting a partial, unvalidated upload
# across a cleanup boundary, which is exactly what that cleanup exists to
# prevent.
DEFAULT_MAX_ATTEMPTS = 2
DEFAULT_RETRY_BACKOFF_SECONDS = 5
PROGRESS_EVERY_BYTES = 1024 * 1024
READ_CHUNK = 1024 * 1024

ALLOWED_FILES = ("release.json", "release.sigstore.json", "api-release.tar.gz")
DEPLOY_COMMAND = re.compile(
    r"^deploy kind=(api|frontend) commit=[0-9a-f]{40} run_id=[0-9]{1,18} run_attempt=[0-9]{1,18}$"
)
MIGRATE_COMMAND = re.compile(
    r"^migrate commit=[0-9a-f]{40} run_id=[0-9]{1,18} run_attempt=[0-9]{1,18}$"
)
HOST = re.compile(r"^[A-Za-z0-9._-]+@[A-Za-z0-9.:-]+$")

# ConnectTimeout limits only connection establishment. ServerAliveInterval
# detects a peer that stops answering keepalives; it does not notice a live
# TCP session whose channel window has stopped moving. IPQoS=none avoids the
# well-known class of paths that accept SSH handshake packets and then drop
# or throttle DSCP-marked bulk segments. It is a client mitigation, not
# evidence that any particular failure was caused by DSCP.
SSH_OPTIONS = (
    "-o", "BatchMode=yes",
    "-o", "StrictHostKeyChecking=yes",
    "-o", "ConnectTimeout=15",
    "-o", "ServerAliveInterval=15",
    "-o", "ServerAliveCountMax=4",
    "-o", "TCPKeepAlive=yes",
    "-o", "IPQoS=none",
)


class TransportError(Exception):
    def __init__(self, reason, message, bytes_copied=0):
        self.reason = reason
        self.bytes_copied = bytes_copied
        super().__init__(message)


def log_stage(prefix, stage, **fields):
    parts = [f"{prefix}: stage={stage}"]
    for key, value in fields.items():
        parts.append(f"{key}={value}")
    print(" ".join(parts), file=sys.stderr, flush=True)


def _wait_for(fd, want_write, idle_seconds, deadline):
    """Return 'ready', 'idle', or 'deadline'. Does not block past either limit."""
    remaining = deadline - time.monotonic()
    if remaining <= 0:
        return "deadline"
    timeout = idle_seconds if idle_seconds < remaining else remaining
    if timeout < 0:
        timeout = 0
    readable, writable, _ = select.select(
        [] if want_write else [fd],
        [fd] if want_write else [],
        [],
        timeout,
    )
    if writable if want_write else readable:
        return "ready"
    if time.monotonic() >= deadline:
        return "deadline"
    return "idle"


def _fail_wait(state, copied):
    if state == "deadline":
        raise TransportError("deadline", f"transfer deadline exceeded after {copied} bytes", copied)
    raise TransportError("stalled", f"transfer stalled after {copied} bytes", copied)


def copy_bounded(src, dst, max_bytes, idle_seconds, deadline_seconds, on_progress=None):
    """Copy until clean EOF. Never treats a short or stalled stream as done.

    ``src`` and ``dst`` are binary file objects with fileno(). Both are put in
    non-blocking mode so a full SSH window cannot sit inside ``os.write``
    outside the idle deadline. On a clean EOF of one or more bytes, returns
    the count. Zero bytes is ``empty``. More than ``max_bytes`` is
    ``too_large`` and the overflowing chunk is not written.
    """
    if max_bytes < 1 or idle_seconds <= 0 or deadline_seconds <= 0:
        raise TransportError("invalid_limit", "transfer limits must be positive", 0)
    src_fd = src.fileno()
    dst_fd = dst.fileno()
    os.set_blocking(src_fd, False)
    os.set_blocking(dst_fd, False)
    copied = 0
    next_progress = PROGRESS_EVERY_BYTES
    deadline = time.monotonic() + deadline_seconds
    while True:
        state = _wait_for(src_fd, False, idle_seconds, deadline)
        if state != "ready":
            _fail_wait(state, copied)
        try:
            chunk = os.read(src_fd, READ_CHUNK)
        except InterruptedError:
            continue
        except BlockingIOError:
            continue
        if not chunk:
            if copied == 0:
                raise TransportError("empty", "empty upload", 0)
            return copied
        if copied + len(chunk) > max_bytes:
            raise TransportError("too_large", f"upload exceeds {max_bytes} bytes", copied)
        view = memoryview(chunk)
        while view:
            state = _wait_for(dst_fd, True, idle_seconds, deadline)
            if state != "ready":
                _fail_wait(state, copied)
            try:
                written = os.write(dst_fd, view)
            except InterruptedError:
                continue
            except BlockingIOError:
                continue
            except BrokenPipeError:
                raise TransportError(
                    "remote_closed",
                    f"remote closed after {copied} bytes, before the upload finished",
                    copied,
                ) from None
            except OSError as error:
                if error.errno == 32:  # EPIPE
                    raise TransportError(
                        "remote_closed",
                        f"remote closed after {copied} bytes, before the upload finished",
                        copied,
                    ) from None
                raise
            if written <= 0:
                raise TransportError("stalled", f"transfer stalled after {copied} bytes", copied)
            view = view[written:]
            copied += written
            if on_progress is not None and copied >= next_progress:
                on_progress(copied)
                while next_progress <= copied:
                    next_progress += PROGRESS_EVERY_BYTES


def receive_upload(output_path, max_bytes, idle_seconds, deadline_seconds, src=None):
    """Read stdin into ``output_path``. Delete the file unless the read completes."""
    source = sys.stdin.buffer if src is None else src
    log_stage(
        "rad-deploy",
        "transfer_start",
        max_bytes=max_bytes,
        idle_seconds=idle_seconds,
        deadline_seconds=deadline_seconds,
    )

    def remove_partial():
        try:
            os.unlink(output_path)
        except OSError:
            pass

    def on_signal(signum, _frame):
        remove_partial()
        log_stage("rad-deploy", "transfer_failed", bytes=0, reason=f"signal_{signum}")
        raise SystemExit(128 + signum)

    previous = {}
    for sig in (signal.SIGTERM, signal.SIGINT, signal.SIGHUP):
        previous[sig] = signal.signal(sig, on_signal)
    try:
        with open(output_path, "wb") as destination:
            copied = copy_bounded(
                source,
                destination,
                max_bytes,
                idle_seconds,
                deadline_seconds,
                on_progress=lambda count: log_stage("rad-deploy", "transfer_progress", bytes=count),
            )
            destination.flush()
            os.fsync(destination.fileno())
    except TransportError as error:
        remove_partial()
        log_stage("rad-deploy", "transfer_failed", bytes=error.bytes_copied, reason=error.reason)
        return 1
    except OSError as error:
        remove_partial()
        log_stage("rad-deploy", "transfer_failed", bytes=0, reason="io_error")
        print(f"rad-deploy: transfer io error: {error.errno}", file=sys.stderr, flush=True)
        return 1
    finally:
        for sig, handler in previous.items():
            signal.signal(sig, handler)
    log_stage("rad-deploy", "transfer_complete", bytes=copied)
    return 0


def _terminate(process):
    if process.poll() is not None:
        return
    try:
        os.killpg(process.pid, signal.SIGTERM)
    except (ProcessLookupError, PermissionError, OSError):
        process.terminate()
    try:
        process.wait(timeout=2)
    except subprocess.TimeoutExpired:
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except (ProcessLookupError, PermissionError, OSError):
            process.kill()
        process.wait(timeout=2)


def _pump(source, destination, errors):
    try:
        while True:
            chunk = source.read(65536)
            if not chunk:
                break
            destination.write(chunk)
            destination.flush()
    except Exception as error:  # noqa: BLE001 - pump must not hide a child failure
        errors.append(error)


def validate_ship_request(host, remote_command, files):
    if not HOST.fullmatch(host):
        raise TransportError("bad_request", "refusing host value that is not user@host", 0)
    if not (DEPLOY_COMMAND.fullmatch(remote_command) or MIGRATE_COMMAND.fullmatch(remote_command)):
        raise TransportError("bad_request", "refusing remote command outside the fixed grammar", 0)
    if not files or any(name not in ALLOWED_FILES for name in files):
        raise TransportError("bad_request", "refusing unexpected archive members", 0)


def _ship_once(
    stage,
    files,
    host,
    remote_command,
    max_bytes,
    idle_seconds,
    deadline_seconds,
    ssh_bin,
    include_ssh_options,
    extra_ssh_args,
):
    """One attempt: stream ``stage`` to ssh once. Returns ``(exit_code, reason)``.

    ``reason`` is the ``TransportError.reason`` when the attempt failed
    before a complete upload (``None`` otherwise, including when the
    upload completed but the remote/broker itself rejected it - that is
    reported only through ``exit_code``, never retried).
    """
    import threading

    log_stage("rad-deploy-send", "ssh_start", host=host)
    ssh_argv = [ssh_bin]
    if include_ssh_options:
        ssh_argv.extend(SSH_OPTIONS)
    ssh_argv.extend(extra_ssh_args)
    ssh_argv.extend([host, remote_command])
    tar_env = dict(os.environ)
    tar_env["COPYFILE_DISABLE"] = "1"
    tar = subprocess.Popen(
        ["tar", "-cf", "-", "-C", stage, *files],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=tar_env,
        start_new_session=True,
    )
    ssh = subprocess.Popen(
        ssh_argv,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        start_new_session=True,
    )
    errors = []
    pumps = [
        threading.Thread(target=_pump, args=(ssh.stdout, sys.stdout.buffer, errors), daemon=True),
        threading.Thread(target=_pump, args=(ssh.stderr, sys.stderr.buffer, errors), daemon=True),
        threading.Thread(target=_pump, args=(tar.stderr, sys.stderr.buffer, errors), daemon=True),
    ]
    for pump in pumps:
        pump.start()
    try:
        copied = copy_bounded(
            tar.stdout,
            ssh.stdin,
            max_bytes,
            idle_seconds,
            deadline_seconds,
            on_progress=lambda count: log_stage("rad-deploy-send", "transfer_progress", bytes_sent=count),
        )
        try:
            ssh.stdin.close()
        except (BrokenPipeError, OSError):
            # All payload bytes were already accepted. EOF can race a remote
            # that exits as soon as it has finished reading.
            pass
        log_stage("rad-deploy-send", "transfer_local_complete", bytes_sent=copied)
    except TransportError as error:
        log_stage(
            "rad-deploy-send",
            "transfer_failed",
            bytes_sent=error.bytes_copied,
            reason=error.reason,
        )
        _terminate(tar)
        _terminate(ssh)
        for pump in pumps:
            pump.join(timeout=2)
        return 1, error.reason
    finally:
        try:
            tar.stdout.close()
        except OSError:
            pass
    ssh_code = ssh.wait()
    tar_code = tar.wait()
    for pump in pumps:
        pump.join(timeout=2)
    log_stage("rad-deploy-send", "ssh_finished", exit=ssh_code, tar_exit=tar_code)
    if tar_code != 0:
        log_stage("rad-deploy-send", "tar_failed", exit=tar_code)
        return tar_code or 1, None
    return ssh_code, None


# Retrying any attempt that reaches the broker (a non-zero ssh_code after
# transfer_local_complete) would risk a second migrate/release request for
# work the broker may already be mid-way through - _ship_once never
# retries that case, and this wrapper only ever sees it as a plain
# (code, None) to return unchanged. Only "stalled" is retried: a transient
# idle gap on an otherwise-healthy link (the pattern behind
# run #45023030859 - 36MB transferred at good throughput, then one >45s
# silent gap). "deadline" (the transfer used its whole time budget and is
# unlikely to do better immediately), "too_large"/"bad_request"/"empty"
# (not transient), and "remote_closed" (the remote end itself ended the
# session) are not retried - retrying those would not help and would just
# spend more of the job's time budget. Every retried attempt starts from
# zero bytes: the VPS always deletes its partial file and staging
# directory on a failed transfer (rad-deploy-ssh-entrypoint.sh's cleanup
# trap, rad_deploy_transport.py's receive_upload), and the broker is never
# invoked until a complete, validated receive, so a retried attempt cannot
# leave stale state behind or trigger a duplicate release/migration.
RETRYABLE_REASONS = ("stalled",)


def ship(
    stage,
    files,
    host,
    remote_command,
    max_bytes=DEFAULT_MAX_BYTES,
    idle_seconds=DEFAULT_IDLE_SECONDS,
    deadline_seconds=DEFAULT_DEADLINE_SECONDS,
    ssh_bin="ssh",
    include_ssh_options=True,
    extra_ssh_args=(),
    max_attempts=DEFAULT_MAX_ATTEMPTS,
    retry_backoff_seconds=DEFAULT_RETRY_BACKOFF_SECONDS,
    sleep=time.sleep,
):
    """Stream a stage directory to ssh, retrying a transient stall.

    Returns the remote exit code (or 1 on a transport failure that
    exhausted every attempt). See ``RETRYABLE_REASONS`` for exactly which
    transport failures are retried, and ``_ship_once`` for the single-
    attempt mechanics (unchanged: idle/deadline/size bounds, killing both
    children on failure, never reporting a short or stalled stream as
    complete).
    """
    validate_ship_request(host, remote_command, files)
    attempt = 1
    while True:
        code, reason = _ship_once(
            stage,
            files,
            host,
            remote_command,
            max_bytes,
            idle_seconds,
            deadline_seconds,
            ssh_bin,
            include_ssh_options,
            extra_ssh_args,
        )
        if code == 0 or reason not in RETRYABLE_REASONS or attempt >= max_attempts:
            return code
        log_stage(
            "rad-deploy-send",
            "retry",
            attempt=attempt,
            reason=reason,
            backoff_seconds=retry_backoff_seconds,
        )
        sleep(retry_backoff_seconds)
        attempt += 1


def _positive_int(value):
    number = int(value)
    if number < 1:
        raise argparse.ArgumentTypeError("must be a positive integer")
    return number


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="mode", required=True)

    recv = sub.add_parser("recv", help="Read a size-bounded upload from stdin into a file.")
    recv.add_argument("--output", required=True)
    recv.add_argument("--max-bytes", type=_positive_int, default=DEFAULT_MAX_BYTES)
    recv.add_argument("--idle-seconds", type=_positive_int, default=DEFAULT_IDLE_SECONDS)
    recv.add_argument("--deadline-seconds", type=_positive_int, default=DEFAULT_DEADLINE_SECONDS)

    send = sub.add_parser("ship", help="Tar a stage directory and ship it over ssh.")
    send.add_argument("--host", required=True)
    send.add_argument("--remote-command", required=True)
    send.add_argument("--stage", required=True)
    send.add_argument("--max-bytes", type=_positive_int, default=DEFAULT_MAX_BYTES)
    send.add_argument("--idle-seconds", type=_positive_int, default=DEFAULT_IDLE_SECONDS)
    send.add_argument("--deadline-seconds", type=_positive_int, default=DEFAULT_DEADLINE_SECONDS)
    send.add_argument("--ssh-bin", default="ssh")
    send.add_argument("--max-attempts", type=_positive_int, default=DEFAULT_MAX_ATTEMPTS)
    send.add_argument(
        "--retry-backoff-seconds", type=_positive_int, default=DEFAULT_RETRY_BACKOFF_SECONDS
    )
    send.add_argument("files", nargs="+")

    args = parser.parse_args(argv)
    try:
        if args.mode == "recv":
            return receive_upload(args.output, args.max_bytes, args.idle_seconds, args.deadline_seconds)
        return ship(
            args.stage,
            args.files,
            args.host,
            args.remote_command,
            max_bytes=args.max_bytes,
            idle_seconds=args.idle_seconds,
            deadline_seconds=args.deadline_seconds,
            ssh_bin=args.ssh_bin,
            max_attempts=args.max_attempts,
            retry_backoff_seconds=args.retry_backoff_seconds,
        )
    except TransportError as error:
        log_stage("rad-deploy-send", "transfer_failed", bytes_sent=error.bytes_copied, reason=error.reason)
        print(f"rad-deploy-send: {error}", file=sys.stderr, flush=True)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
