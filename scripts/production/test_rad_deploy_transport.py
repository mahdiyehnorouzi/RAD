#!/usr/bin/env python3
"""Regression tests for bounded deploy transport. No SSH, VPS, or root."""
import importlib.util
import io
import os
import subprocess
import sys
import tarfile
import tempfile
import textwrap
import time
import unittest
from pathlib import Path

SPEC = importlib.util.spec_from_file_location(
    "rad_deploy_transport", Path(__file__).with_name("rad_deploy_transport.py")
)
transport = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(transport)
TransportError = transport.TransportError


class Capture:
    def __init__(self):
        self.buf = io.BytesIO()
        self.encoding = "utf-8"

    def write(self, data):
        if isinstance(data, str):
            data = data.encode()
        self.buf.write(data)
        return len(data)

    def flush(self):
        return None

    def isatty(self):
        return False

    @property
    def buffer(self):
        return self

    def text(self):
        return self.buf.getvalue().decode()


class Pipe:
    def __init__(self):
        read_fd, write_fd = os.pipe()
        self.read = os.fdopen(read_fd, "rb", buffering=0)
        self.write = os.fdopen(write_fd, "wb", buffering=0)

    def close(self):
        for end in (self.read, self.write):
            try:
                end.close()
            except OSError:
                pass


def command(action="migrate"):
    commit = "a" * 40
    if action == "migrate":
        return f"migrate commit={commit} run_id=11 run_attempt=1"
    return f"deploy kind=api commit={commit} run_id=11 run_attempt=1"


class CopyBoundedTests(unittest.TestCase):
    def test_clean_eof_copies_bytes_and_logs_no_payload(self):
        payload = b"UNIQUE_PAYLOAD_SHOULD_NOT_LOG"
        pipe = Pipe()
        self.addCleanup(pipe.close)
        pipe.write.write(payload)
        pipe.write.close()
        destination = self.output()
        logs = []
        copied = transport.copy_bounded(
            pipe.read, destination, 1000, 2, 5,
            on_progress=logs.append,
        )
        destination.close()
        self.assertEqual(copied, len(payload))
        self.assertEqual(Path(destination.name).read_bytes(), payload)
        self.assertFalse(logs)

    def test_empty_eof_is_rejected(self):
        pipe = Pipe()
        self.addCleanup(pipe.close)
        pipe.write.close()
        with self.assertRaises(TransportError) as caught:
            transport.copy_bounded(pipe.read, self.output(), 1000, 2, 5)
        self.assertEqual(caught.exception.reason, "empty")
        self.assertEqual(caught.exception.bytes_copied, 0)

    def test_stall_fails_without_treating_partial_bytes_as_complete(self):
        pipe = Pipe()
        self.addCleanup(pipe.close)
        pipe.write.write(b"partial")
        pipe.write.flush()
        started = time.monotonic()
        with self.assertRaises(TransportError) as caught:
            transport.copy_bounded(pipe.read, self.output(), 1000, 0.4, 5)
        self.assertEqual(caught.exception.reason, "stalled")
        self.assertEqual(caught.exception.bytes_copied, len(b"partial"))
        self.assertLess(time.monotonic() - started, 3)

    def test_deadline_fails_while_bytes_are_still_trickling(self):
        pipe = Pipe()
        self.addCleanup(pipe.close)
        pipe.write.write(b"abc")
        pipe.write.flush()
        with self.assertRaises(TransportError) as caught:
            transport.copy_bounded(pipe.read, self.output(), 1000, 5, 0.4)
        self.assertEqual(caught.exception.reason, "deadline")
        self.assertEqual(caught.exception.bytes_copied, 3)

    def test_oversize_does_not_write_the_overflowing_chunk(self):
        pipe = Pipe()
        self.addCleanup(pipe.close)
        pipe.write.write(b"0123456789")
        pipe.write.close()
        destination = self.output()
        with self.assertRaises(TransportError) as caught:
            transport.copy_bounded(pipe.read, destination, 4, 2, 5)
        destination.close()
        self.assertEqual(caught.exception.reason, "too_large")
        self.assertLessEqual(Path(destination.name).stat().st_size, 4)
        self.assertNotIn(b"0123456789", Path(destination.name).read_bytes())

    def output(self):
        handle = tempfile.NamedTemporaryFile(delete=False)
        self.addCleanup(lambda: Path(handle.name).unlink(missing_ok=True))
        return handle


class ReceiveUploadTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.output = Path(self.tmp.name) / "upload.tar"

    def test_completed_upload_is_kept(self):
        pipe = Pipe()
        self.addCleanup(pipe.close)
        pipe.write.write(b"archive-bytes")
        pipe.write.close()
        code = transport.receive_upload(self.output, 1000, 2, 5, src=pipe.read)
        self.assertEqual(code, 0)
        self.assertEqual(self.output.read_bytes(), b"archive-bytes")

    def test_stalled_upload_removes_the_partial_file(self):
        pipe = Pipe()
        self.addCleanup(pipe.close)
        pipe.write.write(b"partial")
        pipe.write.flush()
        code = transport.receive_upload(self.output, 1000, 0.4, 5, src=pipe.read)
        self.assertEqual(code, 1)
        self.assertFalse(self.output.exists())

    def test_oversize_upload_removes_the_partial_file(self):
        pipe = Pipe()
        self.addCleanup(pipe.close)
        pipe.write.write(b"0123456789")
        pipe.write.close()
        code = transport.receive_upload(self.output, 4, 2, 5, src=pipe.read)
        self.assertEqual(code, 1)
        self.assertFalse(self.output.exists())


class ShipTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.stage = self.root / "stage"
        self.stage.mkdir()
        (self.stage / "release.json").write_bytes(b'{"ok":true}')
        (self.stage / "release.sigstore.json").write_bytes(b"sigstore-bundle")
        self.stdout = Capture()
        self.stderr = Capture()
        self.previous_stdout = sys.stdout
        self.previous_stderr = sys.stderr
        sys.stdout = self.stdout
        sys.stderr = self.stderr

    def tearDown(self):
        sys.stdout = self.previous_stdout
        sys.stderr = self.previous_stderr

    def stub(self, body):
        path = self.root / f"stub-{len(list(self.root.iterdir()))}.py"
        path.write_text(textwrap.dedent(body))
        return path

    def ship(self, mode, files=None, payload=b"small", **kwargs):
        (self.stage / "api-release.tar.gz").write_bytes(payload)
        script = self.stub(
            """
            import os, sys, time, pathlib
            mode = os.environ["STUB_MODE"]
            if mode == "stall":
                pathlib.Path(os.environ["STUB_PIDFILE"]).write_text(str(os.getpid()))
                time.sleep(30)
            elif mode == "partial":
                sys.stdin.buffer.read(8)
                raise SystemExit(0)
            elif mode == "reject":
                sys.stdin.buffer.read()
                sys.stderr.write("Release failed (RuntimeError): Host release approval missing: enabled\\n")
                raise SystemExit(1)
            else:
                data = sys.stdin.buffer.read()
                pathlib.Path(os.environ["STUB_BODY"]).write_bytes(data)
                sys.stdout.write("fake broker: release verified healthy\\n")
                raise SystemExit(0)
            """
        )
        os.environ["STUB_MODE"] = mode
        os.environ["STUB_PIDFILE"] = str(self.root / "pid")
        os.environ["STUB_BODY"] = str(self.root / "body")
        return transport.ship(
            str(self.stage),
            files or ["release.json", "release.sigstore.json", "api-release.tar.gz"],
            "rad-deploy@100.103.104.79",
            command(),
            ssh_bin=sys.executable,
            include_ssh_options=kwargs.get("include_ssh_options", False),
            extra_ssh_args=(str(script),),
            idle_seconds=kwargs.get("idle_seconds", 2),
            deadline_seconds=kwargs.get("deadline_seconds", 5),
            max_bytes=kwargs.get("max_bytes", transport.DEFAULT_MAX_BYTES),
        )

    def test_stall_kills_the_remote_and_does_not_report_completion(self):
        started = time.monotonic()
        code = self.ship("stall", payload=b"x" * (512 * 1024), idle_seconds=0.4, deadline_seconds=5)
        self.assertEqual(code, 1)
        self.assertLess(time.monotonic() - started, 5)
        self.assertIn("reason=stalled", self.stderr.text())
        self.assertNotIn("stage=transfer_local_complete", self.stderr.text())
        self.assertNotIn("stage=broker_start", self.stderr.text())
        pid = int((self.root / "pid").read_text())
        with self.assertRaises(ProcessLookupError):
            os.kill(pid, 0)

    def test_remote_close_before_eof_is_a_transfer_failure(self):
        # Larger than a default pipe buffer so the writer cannot finish
        # before the stub has closed its end.
        code = self.ship("partial", payload=b"y" * (512 * 1024))
        self.assertEqual(code, 1)
        self.assertIn("reason=remote_closed", self.stderr.text())
        self.assertNotIn("stage=transfer_local_complete", self.stderr.text())

    def test_full_upload_reaches_eof_and_returns_the_remote_status(self):
        code = self.ship("ok")
        self.assertEqual(code, 0)
        self.assertIn("stage=transfer_local_complete", self.stderr.text())
        self.assertIn("stage=ssh_finished exit=0", self.stderr.text())
        self.assertIn("fake broker: release verified healthy", self.stdout.text())
        with tarfile.open(self.root / "body", "r:") as archive:
            self.assertEqual(
                sorted(archive.getnames()),
                ["api-release.tar.gz", "release.json", "release.sigstore.json"],
            )
        self.assertNotIn(b"UNIQUE_PAYLOAD_SHOULD_NOT_LOG", self.stderr.buf.getvalue())

    def test_broker_rejection_is_not_reported_as_a_stalled_transfer(self):
        code = self.ship("reject")
        self.assertEqual(code, 1)
        text = self.stderr.text()
        self.assertIn("Host release approval missing: enabled", text)
        self.assertIn("stage=transfer_local_complete", text)
        self.assertNotIn("stage=transfer_failed", text)

    def test_bad_command_does_not_start_ssh(self):
        with self.assertRaises(TransportError) as caught:
            transport.ship(
                str(self.stage),
                ["release.json"],
                "rad-deploy@100.103.104.79",
                "rm -rf /",
                ssh_bin=sys.executable,
                include_ssh_options=False,
                extra_ssh_args=(str(self.stub("import os, pathlib\npathlib.Path(os.environ['STUB_PIDFILE']).write_text('started')\n")),),
            )
        self.assertEqual(caught.exception.reason, "bad_request")
        self.assertFalse((self.root / "pid").exists())

    def test_cli_sends_keepalive_options_and_does_not_discard_stdin(self):
        payload_marker = b"cli-payload"
        (self.stage / "api-release.tar.gz").write_bytes(payload_marker)
        script = self.root / "ssh-stub.py"
        script.write_text(
            "#!/usr/bin/env python3\n"
            "import os, sys, pathlib\n"
            "pathlib.Path(os.environ['STUB_ARGV']).write_text('\\n'.join(sys.argv))\n"
            "pathlib.Path(os.environ['STUB_BODY']).write_bytes(sys.stdin.buffer.read())\n"
            "raise SystemExit(0)\n"
        )
        script.chmod(0o755)
        env = os.environ.copy()
        env["STUB_ARGV"] = str(self.root / "argv")
        env["STUB_BODY"] = str(self.root / "body")
        env["COPYFILE_DISABLE"] = "1"
        completed = subprocess.run(
            [
                sys.executable, "-B", str(Path(__file__).with_name("rad_deploy_transport.py")),
                "ship",
                "--host", "rad-deploy@100.103.104.79",
                "--stage", str(self.stage),
                "--remote-command", command("deploy"),
                "--ssh-bin", str(script),
                "--idle-seconds", "2",
                "--deadline-seconds", "5",
                "--",
                "release.json", "release.sigstore.json", "api-release.tar.gz",
            ],
            env=env,
            check=False,
            capture_output=True,
            timeout=10,
        )
        self.assertEqual(completed.returncode, 0, completed.stderr.decode())
        argv = (self.root / "argv").read_text().splitlines()
        # The stub is executed by python, so ssh options are argv of that python.
        self.assertIn("BatchMode=yes", argv)
        self.assertIn("IPQoS=none", argv)
        self.assertIn("ServerAliveInterval=15", argv)
        self.assertNotIn("-n", argv)
        self.assertEqual(argv[-1], command("deploy"))
        with tarfile.open(self.root / "body", "r:") as archive:
            member = archive.extractfile("api-release.tar.gz").read()
        self.assertEqual(member, payload_marker)


if __name__ == "__main__":
    unittest.main()
