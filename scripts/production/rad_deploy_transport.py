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
  only after a completed, validated receive.

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
DEFAULT_IDLE_SECONDS = 45
DEFAULT_DEADLINE_SECONDS = 600
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
):
    """Stream a stage directory to ssh. Return the remote exit code.

    On a transfer failure, kill ``tar`` and ``ssh`` and return 1. A later
    non-zero ssh status (broker rejection after a complete upload) is
    returned unchanged so the workflow still fails closed.
    """
    import threading

    validate_ship_request(host, remote_command, files)
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
        return 1
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
        return tar_code or 1
    return ssh_code


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
        )
    except TransportError as error:
        log_stage("rad-deploy-send", "transfer_failed", bytes_sent=error.bytes_copied, reason=error.reason)
        print(f"rad-deploy-send: {error}", file=sys.stderr, flush=True)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
