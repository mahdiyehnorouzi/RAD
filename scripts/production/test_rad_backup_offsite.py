"""Safe local tests: temporary filesystem and mocked subprocess calls only."""
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location("rad_backup_offsite", Path(__file__).with_name("rad_backup_offsite.py"))
helper = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(helper)


class FailStageTaggingTests(unittest.TestCase):
    """fail() is the single exit path for every error this helper reports;
    every call site must tag its own stage and never pass raw subprocess
    output (which can echo rclone remote config/credentials) as the
    message."""

    def test_exits_nonzero_and_prints_stage_tagged_message_to_stderr(self):
        with self.assertRaises(SystemExit) as failure, \
             patch("sys.stderr") as fake_stderr:
            helper.fail("upload", "upload to the offsite bucket failed (rclone exit 3)")
            printed = "".join(call.args[0] for call in fake_stderr.write.call_args_list)
        self.assertEqual(failure.exception.code, 1)

    def test_printed_message_includes_the_stage_tag(self):
        import io
        buffer = io.StringIO()
        with self.assertRaises(SystemExit), patch("sys.stderr", buffer):
            helper.fail("verify_size", "could not confirm the remote object was written")
        self.assertIn("stage=verify_size", buffer.getvalue())
        self.assertIn("could not confirm the remote object was written", buffer.getvalue())


class MainStageReportingTests(unittest.TestCase):
    """Each failure path in main() must exit non-zero with its own stage
    tag, and must never surface rclone's raw stdout/stderr (which can carry
    bucket/remote config details) in that message."""

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.dump = Path(self.temp.name) / "rad-pre-migration-abc123-20261101T000000Z.dump"
        self.dump.write_bytes(b"dump-bytes")

    def run_main(self):
        import io
        buffer = io.StringIO()
        with self.assertRaises(SystemExit) as failure, patch("sys.stderr", buffer):
            helper.main(["rad-backup-offsite.py", str(self.dump)])
        return failure.exception.code, buffer.getvalue()

    def test_missing_dump_reports_input_stage(self):
        missing = Path(self.temp.name) / "does-not-exist.dump"
        import io
        buffer = io.StringIO()
        with self.assertRaises(SystemExit) as failure, patch("sys.stderr", buffer):
            helper.main(["rad-backup-offsite.py", str(missing)])
        self.assertEqual(failure.exception.code, 1)
        self.assertIn("stage=input", buffer.getvalue())

    def test_empty_dump_reports_input_stage(self):
        self.dump.write_bytes(b"")
        code, output = self.run_main()
        self.assertEqual(code, 1)
        self.assertIn("stage=input", output)

    def test_listremotes_failure_reports_remote_config_stage(self):
        with patch.object(helper, "run",
                           return_value=subprocess.CompletedProcess([], 1, "", "listremotes: config error, path=/root/.config/rclone/rclone.conf")):
            code, output = self.run_main()
        self.assertEqual(code, 1)
        self.assertIn("stage=remote_config", output)
        self.assertNotIn("/root/.config/rclone/rclone.conf", output)

    def test_missing_remote_reports_remote_config_stage(self):
        with patch.object(helper, "run",
                           return_value=subprocess.CompletedProcess([], 0, "other-remote:")):
            code, output = self.run_main()
        self.assertEqual(code, 1)
        self.assertIn("stage=remote_config", output)

    def test_upload_failure_reports_upload_stage_without_raw_output(self):
        def fake_run(*args, **_kwargs):
            if args[0] == helper.RCLONE and args[1] == "listremotes":
                return subprocess.CompletedProcess(args, 0, f"{helper.REMOTE}:")
            if args[0] == helper.RCLONE and args[1] == "copyto":
                return subprocess.CompletedProcess(args, 1, "", "AccessDenied: secret-looking-value-should-not-leak")
            raise AssertionError(f"unexpected call: {args}")
        with patch.object(helper, "run", side_effect=fake_run):
            code, output = self.run_main()
        self.assertEqual(code, 1)
        self.assertIn("stage=upload", output)
        self.assertNotIn("secret-looking-value-should-not-leak", output)

    def test_remote_size_mismatch_reports_verify_size_stage(self):
        def fake_run(*args, **_kwargs):
            if args[0] == helper.RCLONE and args[1] == "listremotes":
                return subprocess.CompletedProcess(args, 0, f"{helper.REMOTE}:")
            if args[0] == helper.RCLONE and args[1] == "copyto":
                return subprocess.CompletedProcess(args, 0, "")
            if args[0] == helper.RCLONE and args[1] == "size":
                return subprocess.CompletedProcess(args, 0, json.dumps({"bytes": 1}))
            raise AssertionError(f"unexpected call: {args}")
        with patch.object(helper, "run", side_effect=fake_run):
            code, output = self.run_main()
        self.assertEqual(code, 1)
        self.assertIn("stage=verify_size", output)

    def test_checksum_mismatch_reports_verify_checksum_stage_without_raw_output(self):
        def fake_run(*args, **_kwargs):
            if args[0] == helper.RCLONE and args[1] == "listremotes":
                return subprocess.CompletedProcess(args, 0, f"{helper.REMOTE}:")
            if args[0] == helper.RCLONE and args[1] == "copyto":
                return subprocess.CompletedProcess(args, 0, "")
            if args[0] == helper.RCLONE and args[1] == "size":
                return subprocess.CompletedProcess(args, 0, json.dumps({"bytes": len(b"dump-bytes")}))
            if args[0] == helper.RCLONE and args[1] == "hashsum":
                return subprocess.CompletedProcess(args, 0, "deadbeef secret-path-should-not-leak/x.dump")
            raise AssertionError(f"unexpected call: {args}")
        with patch.object(helper, "run", side_effect=fake_run), \
             patch.object(helper, "local_sha256", return_value="not-deadbeef"):
            code, output = self.run_main()
        self.assertEqual(code, 1)
        self.assertIn("stage=verify_checksum", output)
        self.assertNotIn("secret-path-should-not-leak", output)

    def test_missing_remote_checksum_support_is_not_treated_as_failure(self):
        def fake_run(*args, **_kwargs):
            if args[0] == helper.RCLONE and args[1] == "listremotes":
                return subprocess.CompletedProcess(args, 0, f"{helper.REMOTE}:")
            if args[0] == helper.RCLONE and args[1] == "copyto":
                return subprocess.CompletedProcess(args, 0, "")
            if args[0] == helper.RCLONE and args[1] == "size":
                return subprocess.CompletedProcess(args, 0, json.dumps({"bytes": len(b"dump-bytes")}))
            if args[0] == helper.RCLONE and args[1] == "hashsum":
                return subprocess.CompletedProcess(args, 1, "", "hashsum not supported by this remote")
            raise AssertionError(f"unexpected call: {args}")
        import io
        buffer = io.StringIO()
        with patch.object(helper, "run", side_effect=fake_run), patch("sys.stderr", buffer):
            helper.main(["rad-backup-offsite.py", str(self.dump)])
        self.assertIn("stage=verify_checksum", buffer.getvalue())
        self.assertIn("verified by size only", buffer.getvalue())


if __name__ == "__main__":
    unittest.main()
