#!/usr/bin/env python3
"""Regression tests for scripts/production/rad_deploy_entrypoint.py.

Run with: python3 -B -m unittest discover -s scripts/production -p 'test_*.py'
(same invocation as test_rad_release.py - these are picked up by the same
discovery call). No root, sudo, or network access required.
"""
import importlib.util
import io
import tarfile
import tempfile
import unittest
from pathlib import Path

# Loaded by file path (same convention as test_rad_release.py), not a plain
# import - this file's directory is not guaranteed to be on sys.path under
# every unittest discovery invocation.
SPEC = importlib.util.spec_from_file_location(
    "rad_deploy_entrypoint", Path(__file__).with_name("rad_deploy_entrypoint.py")
)
entrypoint = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(entrypoint)
RejectedUpload = entrypoint.RejectedUpload
validate_and_extract = entrypoint.validate_and_extract


def make_tar(path: Path, members: list[tuple[str, bytes]]) -> None:
    with tarfile.open(path, "w") as archive:
        for name, content in members:
            info = tarfile.TarInfo(name=name)
            info.size = len(content)
            archive.addfile(info, fileobj=io.BytesIO(content))


class ValidateAndExtractTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.tar_path = self.root / "upload.tar"
        self.stage_dir = self.root / "stage"

    def test_valid_api_upload_extracts_all_three_files(self):
        make_tar(self.tar_path, [
            ("release.json", b'{"ok":true}'),
            ("release.sigstore.json", b"sigstore-bundle"),
            ("api-release.tar.gz", b"fake-gzip-bytes"),
        ])
        validate_and_extract(self.tar_path, self.stage_dir, "api")
        self.assertEqual((self.stage_dir / "release.json").read_bytes(), b'{"ok":true}')
        self.assertEqual((self.stage_dir / "release.sigstore.json").read_bytes(), b"sigstore-bundle")
        self.assertEqual((self.stage_dir / "api-release.tar.gz").read_bytes(), b"fake-gzip-bytes")

    def test_valid_frontend_upload_extracts_without_tarball(self):
        make_tar(self.tar_path, [
            ("release.json", b'{"ok":true}'),
            ("release.sigstore.json", b"sigstore-bundle"),
        ])
        validate_and_extract(self.tar_path, self.stage_dir, "frontend")
        self.assertEqual(sorted(p.name for p in self.stage_dir.iterdir()), ["release.json", "release.sigstore.json"])

    def test_frontend_upload_rejects_unexpected_api_tarball(self):
        make_tar(self.tar_path, [
            ("release.json", b"{}"),
            ("release.sigstore.json", b"x"),
            ("api-release.tar.gz", b"x"),
        ])
        with self.assertRaises(RejectedUpload):
            validate_and_extract(self.tar_path, self.stage_dir, "frontend")
        self.assertFalse(self.stage_dir.exists() and any(self.stage_dir.iterdir()))

    def test_api_upload_missing_tarball_is_rejected(self):
        make_tar(self.tar_path, [
            ("release.json", b"{}"),
            ("release.sigstore.json", b"x"),
        ])
        with self.assertRaises(RejectedUpload):
            validate_and_extract(self.tar_path, self.stage_dir, "api")

    def test_missing_required_entry_is_rejected(self):
        make_tar(self.tar_path, [("release.json", b"{}")])
        with self.assertRaises(RejectedUpload):
            validate_and_extract(self.tar_path, self.stage_dir, "frontend")

    def test_unknown_kind_is_rejected(self):
        make_tar(self.tar_path, [("release.json", b"{}"), ("release.sigstore.json", b"x")])
        with self.assertRaises(RejectedUpload):
            validate_and_extract(self.tar_path, self.stage_dir, "storefront-only")

    def test_unexpected_extra_entry_is_rejected(self):
        make_tar(self.tar_path, [
            ("release.json", b"{}"),
            ("release.sigstore.json", b"x"),
            ("unexpected.txt", b"surprise"),
        ])
        with self.assertRaises(RejectedUpload):
            validate_and_extract(self.tar_path, self.stage_dir, "frontend")

    def test_duplicate_entry_names_are_rejected(self):
        with tarfile.open(self.tar_path, "w") as archive:
            for _ in range(2):
                info = tarfile.TarInfo(name="release.json")
                info.size = 2
                archive.addfile(info, fileobj=io.BytesIO(b"{}"))
            info = tarfile.TarInfo(name="release.sigstore.json")
            info.size = 1
            archive.addfile(info, fileobj=io.BytesIO(b"x"))
        with self.assertRaises(RejectedUpload):
            validate_and_extract(self.tar_path, self.stage_dir, "frontend")

    def test_too_many_entries_is_rejected(self):
        with tarfile.open(self.tar_path, "w") as archive:
            for name in ("release.json", "release.sigstore.json", "api-release.tar.gz", "one-too-many"):
                info = tarfile.TarInfo(name=name)
                info.size = 1
                archive.addfile(info, fileobj=io.BytesIO(b"x"))
        with self.assertRaises(RejectedUpload):
            validate_and_extract(self.tar_path, self.stage_dir, "api")

    def test_oversized_member_is_rejected_before_writing(self):
        with tarfile.open(self.tar_path, "w") as archive:
            info = tarfile.TarInfo(name="release.json")
            info.size = 65537  # one byte over the cap
            archive.addfile(info, fileobj=io.BytesIO(b"x" * 65537))
            info2 = tarfile.TarInfo(name="release.sigstore.json")
            info2.size = 1
            archive.addfile(info2, fileobj=io.BytesIO(b"x"))
        with self.assertRaises(RejectedUpload):
            validate_and_extract(self.tar_path, self.stage_dir, "frontend")
        self.assertFalse(self.stage_dir.exists() and any(self.stage_dir.iterdir()))

    def test_path_traversal_entry_name_is_rejected(self):
        with tarfile.open(self.tar_path, "w") as archive:
            info = tarfile.TarInfo(name="../../etc/passwd")
            info.size = 1
            archive.addfile(info, fileobj=io.BytesIO(b"x"))
            info2 = tarfile.TarInfo(name="release.sigstore.json")
            info2.size = 1
            archive.addfile(info2, fileobj=io.BytesIO(b"x"))
        with self.assertRaises(RejectedUpload):
            validate_and_extract(self.tar_path, self.stage_dir, "frontend")

    def test_absolute_path_entry_name_is_rejected(self):
        with tarfile.open(self.tar_path, "w") as archive:
            info = tarfile.TarInfo(name="/etc/passwd")
            info.size = 1
            archive.addfile(info, fileobj=io.BytesIO(b"x"))
        with self.assertRaises(RejectedUpload):
            validate_and_extract(self.tar_path, self.stage_dir, "frontend")

    def test_symlink_entry_is_rejected(self):
        with tarfile.open(self.tar_path, "w") as archive:
            info = tarfile.TarInfo(name="release.json")
            info.type = tarfile.SYMTYPE
            info.linkname = "/etc/passwd"
            archive.addfile(info)
            info2 = tarfile.TarInfo(name="release.sigstore.json")
            info2.size = 1
            archive.addfile(info2, fileobj=io.BytesIO(b"x"))
        with self.assertRaises(RejectedUpload):
            validate_and_extract(self.tar_path, self.stage_dir, "frontend")
        self.assertFalse((self.stage_dir / "release.json").exists())

    def test_hardlink_entry_is_rejected(self):
        with tarfile.open(self.tar_path, "w") as archive:
            info = tarfile.TarInfo(name="release.sigstore.json")
            info.size = 1
            archive.addfile(info, fileobj=io.BytesIO(b"x"))
            link = tarfile.TarInfo(name="release.json")
            link.type = tarfile.LNKTYPE
            link.linkname = "release.sigstore.json"
            archive.addfile(link)
        with self.assertRaises(RejectedUpload):
            validate_and_extract(self.tar_path, self.stage_dir, "frontend")

    def test_directory_entry_is_rejected(self):
        with tarfile.open(self.tar_path, "w") as archive:
            info = tarfile.TarInfo(name="release.json")
            info.type = tarfile.DIRTYPE
            archive.addfile(info)
            info2 = tarfile.TarInfo(name="release.sigstore.json")
            info2.size = 1
            archive.addfile(info2, fileobj=io.BytesIO(b"x"))
        with self.assertRaises(RejectedUpload):
            validate_and_extract(self.tar_path, self.stage_dir, "frontend")

    def test_fifo_entry_is_rejected(self):
        with tarfile.open(self.tar_path, "w") as archive:
            info = tarfile.TarInfo(name="release.json")
            info.type = tarfile.FIFOTYPE
            archive.addfile(info)
            info2 = tarfile.TarInfo(name="release.sigstore.json")
            info2.size = 1
            archive.addfile(info2, fileobj=io.BytesIO(b"x"))
        with self.assertRaises(RejectedUpload):
            validate_and_extract(self.tar_path, self.stage_dir, "frontend")

    def test_not_a_tar_stream_is_rejected(self):
        self.tar_path.write_bytes(b"this is not a tar file at all, just garbage bytes")
        with self.assertRaises(RejectedUpload):
            validate_and_extract(self.tar_path, self.stage_dir, "frontend")

    def test_empty_archive_is_rejected(self):
        with tarfile.open(self.tar_path, "w"):
            pass
        with self.assertRaises(RejectedUpload):
            validate_and_extract(self.tar_path, self.stage_dir, "frontend")

    def test_rejection_leaves_no_partial_files_behind(self):
        # release.json (small, allowed first) must not survive on disk if a
        # later member in the same archive is rejected.
        with tarfile.open(self.tar_path, "w") as archive:
            info = tarfile.TarInfo(name="release.json")
            info.size = 2
            archive.addfile(info, fileobj=io.BytesIO(b"{}"))
            info2 = tarfile.TarInfo(name="unexpected.bin")
            info2.size = 1
            archive.addfile(info2, fileobj=io.BytesIO(b"x"))
        with self.assertRaises(RejectedUpload):
            validate_and_extract(self.tar_path, self.stage_dir, "frontend")
        # Validation happens in a pass over all members before any file is
        # written, so nothing should have been extracted at all.
        self.assertFalse(self.stage_dir.exists() and any(self.stage_dir.iterdir()))


if __name__ == "__main__":
    unittest.main()
