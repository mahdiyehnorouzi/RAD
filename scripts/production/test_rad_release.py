"""Safe local tests: temporary filesystem and mocked host operations only."""
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import tarfile
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location("rad_release", Path(__file__).with_name("rad_release.py"))
broker = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(broker)


class ReleaseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.request = dict(kind="api", commit="a" * 40, run_id=123, run_attempt=1, stage="release-123456")
        self.manifest = dict(schema=1, repository=broker.REPO, kind="api", commit="a" * 40,
                             run_id=123, run_attempt=1, version="1.5.1", archive_sha256="b" * 64)

    def test_replay_and_out_of_order_runs_are_rejected(self):
        for sequence in ([123, 1], [123, 2], [124, 1]):
            with self.subTest(sequence=sequence), self.assertRaisesRegex(RuntimeError, "Stale"):
                broker.validate_sequence(self.manifest, {"sequence": sequence})
        self.assertEqual(broker.validate_sequence(self.manifest, {"sequence": [122, 9]}), [123, 1])
        self.assertEqual(broker.validate_sequence({**self.manifest, "run_attempt": 2}, {"sequence": [123, 1]}), [123, 2])

    def test_api_root_service_is_rejected_before_activation(self):
        live = self.root / "live"
        releases = self.root / "releases"
        releases.mkdir()
        (releases / "old").mkdir()
        live.symlink_to(releases / "old")
        with patch.object(broker, "LIVE", live), patch.object(broker, "RELEASES", releases), \
             patch.object(broker, "protected"), patch.object(broker, "service_property", return_value="root"), \
             patch.object(broker, "run", return_value=subprocess.CompletedProcess([], 0, "v22.16.0")):
            with self.assertRaisesRegex(RuntimeError, "non-root"):
                broker.api_preflight()

    def archive(self, entries):
        path = self.root / "api-release.tar.gz"
        with tarfile.open(path, "w:gz") as archive:
            for name, data, kind in entries:
                entry = tarfile.TarInfo(name)
                if kind == "link":
                    entry.type = tarfile.SYMTYPE
                    entry.linkname = data
                    archive.addfile(entry)
                elif kind == "hardlink":
                    entry.type = tarfile.LNKTYPE
                    entry.linkname = data
                    archive.addfile(entry)
                elif kind == "fifo":
                    entry.type = tarfile.FIFOTYPE
                    archive.addfile(entry)
                else:
                    entry.size = len(data)
                    entry.mode = 0o7777  # extraction must strip setuid/write bits
                    archive.addfile(entry, io.BytesIO(data))
        return path

    def unpack(self, entries):
        target = self.root / "extracted"
        target.mkdir()
        broker.unpack_api(self.archive(entries), target)
        return target

    def test_request_is_bounded_and_must_be_an_object(self):
        for data in (b"x" * 4097, b"[]", b"null"):
            with self.subTest(data=data[:10]), patch.object(broker.sys, "stdin", type("Input", (), {"buffer": io.BytesIO(data)})()):
                with self.assertRaises(RuntimeError):
                    broker.read_request()
        with patch.object(broker.sys, "stdin", type("Input", (), {"buffer": io.BytesIO(json.dumps(self.request).encode())})()):
            self.assertEqual(broker.read_request(), self.request)

    def test_host_activation_requires_separate_root_approval(self):
        policy_path = self.root / "activation.json"
        trusted_root_path = self.root / "trusted_root.jsonl"
        trusted_root_path.write_text('{"mediaType": "fixture"}\n')
        trusted_root_path.chmod(0o644)
        policy = dict(schema=1, repository=broker.REPO, enabled=True,
                      runner_workflow_policy_verified=True, production_environments_verified=True,
                      host_preflight_verified=True, nonproduction_rehearsal_verified=True,
                      broker_sha256=broker.file_hash(Path(broker.__file__)),
                      trusted_root_sha256=broker.file_hash(trusted_root_path))
        with patch.object(broker, "ACTIVATION", policy_path), patch.object(broker, "TRUSTED_ROOT", trusted_root_path), \
             patch.object(broker, "protected"):
            with self.assertRaises(FileNotFoundError):
                broker.validate_activation()
            policy_path.write_text(json.dumps(policy))
            policy_path.chmod(0o600)
            broker.validate_activation()
            for name in ("enabled", "runner_workflow_policy_verified", "production_environments_verified",
                         "host_preflight_verified", "nonproduction_rehearsal_verified"):
                policy_path.write_text(json.dumps({**policy, name: False}))
                with self.subTest(requirement=name), self.assertRaisesRegex(RuntimeError, "approval missing"):
                    broker.validate_activation()
            policy_path.write_text(json.dumps({**policy, "broker_sha256": "0" * 64}))
            with self.assertRaisesRegex(RuntimeError, "re-approval"):
                broker.validate_activation()
            policy_path.write_text(json.dumps({**policy, "trusted_root_sha256": "0" * 64}))
            with self.assertRaisesRegex(RuntimeError, "Sigstore trusted root requires root re-approval"):
                broker.validate_activation()
            # Rotating the trusted root's content without re-approving its hash
            # must fail closed too, not just a missing/wrong field.
            policy_path.write_text(json.dumps(policy))
            trusted_root_path.write_text('{"mediaType": "fixture", "rotated": true}\n')
            with self.assertRaisesRegex(RuntimeError, "Sigstore trusted root requires root re-approval"):
                broker.validate_activation()
            trusted_root_path.write_text('{"mediaType": "fixture"}\n')
            trusted_root_path.chmod(0o664)
            with self.assertRaisesRegex(RuntimeError, "group/world writable"):
                broker.validate_activation()
            trusted_root_path.chmod(0o644)
            policy_path.chmod(0o644)
            with self.assertRaisesRegex(RuntimeError, "root-private"):
                broker.validate_activation()

    def test_correct_manifest(self):
        broker.validate_manifest(self.manifest, self.request)

    def test_wrong_origin_kind_commit_run_and_schema(self):
        for key, value in [("repository", "evil/RAD"), ("kind", "frontend"),
                           ("commit", "c" * 40), ("run_id", 124), ("run_attempt", 2), ("schema", 2)]:
            with self.subTest(key=key), self.assertRaises(RuntimeError):
                broker.validate_manifest({**self.manifest, key: value}, self.request)

    def test_reject_bad_digests_versions_and_boolean_run(self):
        for key, value in [("archive_sha256", "wrong"), ("version", "$(cmd)"), ("run_id", True)]:
            with self.subTest(key=key), self.assertRaises(RuntimeError):
                broker.validate_manifest({**self.manifest, key: value}, self.request)

    def test_frontend_only_exact_allowed_digest_references(self):
        request = {**self.request, "kind": "frontend"}
        manifest = {**self.manifest, "kind": "frontend", "images": {"admin": "ghcr.io/mahdiyehnorouzi/rad-admin@sha256:" + "1" * 64}}
        broker.validate_manifest(manifest, request)
        for images in [{}, {"database": "anything"}, {"admin": "ghcr.io/mahdiyehnorouzi/rad-admin:latest"},
                       {"admin": "ghcr.io/evil/rad-admin@sha256:" + "1" * 64},
                       {"admin": "ghcr.io/mahdiyehnorouzi/rad-storefront@sha256:" + "1" * 64}]:
            with self.subTest(images=images), self.assertRaises(RuntimeError):
                broker.validate_manifest({**manifest, "images": images}, request)

    def test_attestation_policy_and_fail_closed(self):
        (self.root / "release.json").write_text(json.dumps(self.manifest))
        trusted_root_path = self.root / "trusted_root.jsonl"
        trusted_root_path.write_text('{"mediaType": "fixture"}\n')
        with patch.object(broker, "TRUSTED_ROOT", trusted_root_path), patch.object(broker, "protected"), \
             patch.object(broker, "run") as run:
            broker.verify_manifest(self.root, self.request)
            args = run.call_args.args
            for required in ("--bundle", "--repo", broker.REPO, "--source-ref", "refs/heads/main",
                             "--source-digest", "--signer-digest", self.request["commit"], "--deny-self-hosted-runners",
                             "--custom-trusted-root", trusted_root_path,
                             "mahdiyehnorouzi/RAD/.github/workflows/deploy-api-vps.yml"):
                self.assertIn(required, args)
        with patch.object(broker, "TRUSTED_ROOT", trusted_root_path), patch.object(broker, "protected"), \
             patch.object(broker, "run", side_effect=subprocess.CalledProcessError(1, "gh")):
            with self.assertRaises(subprocess.CalledProcessError):
                broker.verify_manifest(self.root, self.request)

    def test_contained_workspace_symlinks_and_normalized_modes(self):
        target = self.unpack([("packages/artworks/package.json", b"{}", "file"),
                              ("node_modules/@rad/artworks", "../../packages/artworks", "link")])
        self.assertTrue((target / "node_modules/@rad/artworks/package.json").is_file())
        self.assertEqual((target / "packages/artworks/package.json").stat().st_mode & 0o7777, 0o755)
        self.assertEqual((target / "packages/artworks").stat().st_mode & 0o7777, 0o755)

    def test_traversal_absolute_unexpected_duplicate_and_special_members_rejected(self):
        cases = [[("../escape", b"x", "file")], [("/etc/passwd", b"x", "file")],
                 [("other/path", b"x", "file")], [("VERSION", b"x", "file"), ("VERSION", b"y", "file")],
                 [("node_modules/x", "VERSION", "hardlink")], [("node_modules/pipe", "", "fifo")]]
        for i, entries in enumerate(cases):
            with self.subTest(entries=entries), self.assertRaises(RuntimeError):
                broker.unpack_api(self.archive(entries), self.root / f"case-{i}")
        self.assertFalse((self.root / "escape").exists())

    def test_escape_symlinks_and_children_of_symlink_rejected(self):
        for entries in [[("node_modules/x", "../../etc", "link")],
                        [("node_modules/x", "/tmp", "link")],
                        [("node_modules/x", "../packages", "link"), ("node_modules/x/payload", b"x", "file")]]:
            with self.subTest(entries=entries), self.assertRaises(RuntimeError):
                broker.unpack_api(self.archive(entries), self.root / "unused")

    def test_snapshot_rejects_symlink_and_oversized_files(self):
        incoming = self.root / "incoming"
        stage = incoming / self.request["stage"]
        stage.mkdir(parents=True)
        (stage / "release.json").symlink_to("/etc/passwd")
        with patch.object(broker, "INCOMING", incoming):
            with self.assertRaises(OSError):
                broker.snapshot_input(self.request["stage"], "release.json", self.root / "out", 10)
            (stage / "release.json").unlink()
            (stage / "release.json").write_bytes(b"x" * 11)
            with self.assertRaises(RuntimeError):
                broker.snapshot_input(self.request["stage"], "release.json", self.root / "out", 10)

    def test_snapshot_accepts_data_but_not_symlink_stage(self):
        incoming = self.root / "incoming"
        stage = incoming / self.request["stage"]
        stage.mkdir(parents=True)
        (stage / "release.json").write_bytes(b"safe")
        with patch.object(broker, "INCOMING", incoming):
            broker.snapshot_input(self.request["stage"], "release.json", self.root / "out", 10)
            self.assertEqual((self.root / "out").read_bytes(), b"safe")
            (incoming / "release-link123").symlink_to(stage)
            with self.assertRaises(OSError):
                broker.snapshot_input("release-link123", "release.json", self.root / "out2", 10)

    def api_fixture(self):
        previous = self.root / "releases/previous/apps/api"
        previous.mkdir(parents=True)
        live = self.root / "live/api"
        live.parent.mkdir()
        live.symlink_to(previous)
        env = self.root / "api.env"
        env.write_text("NODE_ENV=production\nTYPEORM_SYNCHRONIZE=false\n")
        transaction = self.root / "transaction"
        transaction.mkdir()
        entries = [(name, content, "file") for name, content in [
            ("apps/api/dist/main.js", b"// built"), ("apps/api/package.json", b"{}"),
            ("tsconfig.json", b"{}"), ("node_modules/@nestjs/core/package.json", b"{}"),
            ("packages/artworks/package.json", b"{}"), ("VERSION", b"1.5.1")]]
        entries.append(("node_modules/@rad/artworks", "../../packages/artworks", "link"))
        self.archive(entries)
        self.manifest["archive_sha256"] = broker.file_hash(self.root / "api-release.tar.gz")
        data = dict(previous=str(previous), version="1.5.0", env_sha256=broker.file_hash(env))
        for key, value in (("LIVE", live), ("RELEASES", self.root / "releases"), ("ENV_FILE", env)):
            patcher = patch.object(broker, key, value)
            patcher.start()
            self.addCleanup(patcher.stop)
        return previous, live, env, transaction, data

    def preflight_fixture(self):
        previous, live, env, transaction, data = self.api_fixture()
        properties = dict(User="rad-api", Group="rad-api", Type="simple", KillMode="control-group",
                          ExecStart="{ path=/usr/bin/node ; argv[]=/usr/bin/node dist/main.js ; ignore_errors=no ; }",
                          WorkingDirectory=str(live), EnvironmentFiles=f"{env} (ignore_errors=no)", NoNewPrivileges="yes")
        for name, value in (("protected", lambda _: None), ("service_property", lambda name: properties.get(name, "")),
                            ("run", lambda *args: subprocess.CompletedProcess([], 0, "v22.16.0")),
                            ("health", lambda _: {"version": "1.5.0"})):
            patcher = patch.object(broker, name, value)
            patcher.start()
            self.addCleanup(patcher.stop)
        for target, name, value in ((broker.pwd, "getpwnam", lambda _: SimpleNamespace(pw_uid=12345, pw_gid=12345)),
                                    (broker.grp, "getgrgid", lambda _: SimpleNamespace(gr_name="rad-api")),
                                    (broker.os, "getgrouplist", lambda *_: [12345])):
            patcher = patch.object(target, name, value)
            patcher.start()
            self.addCleanup(patcher.stop)
        return properties, env, data

    def test_valid_non_root_direct_runtime_preflight(self):
        properties, env, data = self.preflight_fixture()
        self.assertEqual(broker.api_preflight(), data)

    def test_preflight_rejects_initialization_wrapper_hooks_env_and_capabilities(self):
        properties, env, data = self.preflight_fixture()
        for name, value in (("ExecStart", "npx tsx seed/seed.ts"), ("ExecStartPre", "run migration"),
                            ("Environment", "TYPEORM_SYNCHRONIZE=true"), ("AmbientCapabilities", "cap_setuid"),
                            ("KillMode", "process"), ("NoNewPrivileges", "no")):
            old = properties.get(name)
            properties[name] = value
            with self.subTest(name=name), self.assertRaises(RuntimeError):
                broker.api_preflight()
            if old is None:
                properties.pop(name)
            else:
                properties[name] = old
        env.write_text('NODE_ENV="production"\nTYPEORM_SYNCHRONIZE="true"\n')
        with self.assertRaisesRegex(RuntimeError, "no-schema-sync"):
            broker.api_preflight()

    def test_api_restart_failure_restores_previous_release(self):
        previous, live, env, transaction, data = self.api_fixture()
        with patch.object(broker, "api_preflight", return_value=data), \
             patch.object(broker, "restart_api", side_effect=[RuntimeError("restart failed"), None]) as restart, \
             patch.object(broker, "api_smoke"):
            with self.assertRaisesRegex(RuntimeError, "restart failed"):
                broker.release_api(self.manifest, self.root, transaction)
        self.assertEqual(live.resolve(), previous)
        self.assertEqual(restart.call_args_list[-1].args, ("1.5.0",))
        self.assertTrue((transaction / "rolled-back.json").exists())
        self.assertEqual(broker.file_hash(env), data["env_sha256"])

    def test_api_public_smoke_failure_rolls_back_and_remains_failed(self):
        previous, live, env, transaction, data = self.api_fixture()
        with patch.object(broker, "api_preflight", return_value=data), patch.object(broker, "restart_api"), \
             patch.object(broker, "api_smoke", side_effect=[RuntimeError("public failure"), None]):
            with self.assertRaisesRegex(RuntimeError, "public failure"):
                broker.release_api(self.manifest, self.root, transaction)
        self.assertEqual(live.resolve(), previous)
        self.assertTrue((transaction / "rolled-back.json").exists())

    def test_api_tampered_archive_never_activates(self):
        previous, live, env, transaction, data = self.api_fixture()
        with open(self.root / "api-release.tar.gz", "ab") as out:
            out.write(b"tamper")
        with patch.object(broker, "api_preflight", return_value=data), patch.object(broker, "restart_api") as restart:
            with self.assertRaisesRegex(RuntimeError, "checksum"):
                broker.release_api(self.manifest, self.root, transaction)
            restart.assert_not_called()
        self.assertEqual(live.resolve(), previous)

    def test_api_success_keeps_env_and_writes_exact_metadata(self):
        previous, live, env, transaction, data = self.api_fixture()
        with patch.object(broker, "api_preflight", return_value=data), patch.object(broker, "restart_api"), patch.object(broker, "api_smoke"):
            broker.release_api(self.manifest, self.root, transaction)
        self.assertNotEqual(live.resolve(), previous)
        self.assertEqual(json.loads((live.resolve().parents[1] / ".rad-release.json").read_text()), self.manifest)
        self.assertEqual(broker.file_hash(env), data["env_sha256"])

    def test_rollback_refuses_changed_environment_or_stale_transaction(self):
        previous, live, env, transaction, data = self.api_fixture()
        broker.atomic_json(transaction / "rollback.json", {"kind": "api", **data, "target": "unexpected"})
        with self.assertRaisesRegex(RuntimeError, "stale"):
            broker.rollback(transaction)
        env.write_text("changed")
        with self.assertRaisesRegex(RuntimeError, "Env changed"):
            broker.rollback(transaction)

    def frontend_fixture(self):
        directory = self.root / "verified"
        directory.mkdir()
        transaction = self.root / "transaction"
        transaction.mkdir()
        frontend = self.root / "frontend"
        frontend.mkdir()
        old = "sha256:" + "1" * 64
        new = "sha256:" + "2" * 64
        reference = "ghcr.io/mahdiyehnorouzi/rad-storefront@sha256:" + "3" * 64
        state = {"storefront": old, "admin": "sha256:" + "4" * 64}
        calls = []
        def compose(images, directory, *args):
            calls.append((dict(images), args))
            if args[0] == "config":
                return subprocess.CompletedProcess([], 0, json.dumps({"services": {"storefront": {"container_name": "rad-storefront"}}}))
            if args[0] == "ps":
                return subprocess.CompletedProcess([], 0, "container-id\n")
            if args[0] == "up":
                for service, image in images.items():
                    state[service] = new if image == reference else image
            return subprocess.CompletedProcess([], 0, "")
        def run(*args, **kwargs):
            return subprocess.CompletedProcess([], 0, new if args[1:3] == ("image", "inspect") else "container-id\n")
        def inspect(service):
            return {"image": state[service], "reference": "old-tag"}
        for name, value in (("FRONTEND", frontend), ("protected", lambda _: None),
                            ("compose", compose), ("run", run), ("inspect_container", inspect)):
            patcher = patch.object(broker, name, value)
            patcher.start()
            self.addCleanup(patcher.stop)
        manifest = {**self.manifest, "kind": "frontend", "images": {"storefront": reference}}
        return manifest, directory, transaction, state, calls, old, new

    def test_frontend_smoke_failure_rolls_back_only_selected_service(self):
        manifest, directory, transaction, state, calls, old, new = self.frontend_fixture()
        sibling = state["admin"]
        with patch.object(broker, "frontend_smoke", side_effect=[RuntimeError("public failure"), None]):
            with self.assertRaisesRegex(RuntimeError, "public failure"):
                broker.release_frontend(manifest, directory, transaction)
        self.assertEqual(state, {"storefront": old, "admin": sibling})
        self.assertTrue((transaction / "rolled-back.json").exists())
        self.assertEqual(calls[-1][0], {"storefront": old})
        self.assertIn("never", calls[-1][1])

    def test_partial_frontend_activation_failure_rolls_back(self):
        manifest, directory, transaction, state, calls, old, new = self.frontend_fixture()
        real = broker.compose
        failed = False
        def partial(images, directory, *args):
            nonlocal failed
            result = real(images, directory, *args)
            if args[0] == "up" and not failed:
                failed = True
                raise RuntimeError("partial activation")
            return result
        with patch.object(broker, "compose", partial), patch.object(broker, "frontend_smoke"):
            with self.assertRaisesRegex(RuntimeError, "partial activation"):
                broker.release_frontend(manifest, directory, transaction)
        self.assertEqual(state["storefront"], old)

    def test_frontend_success_preserves_sibling_history(self):
        manifest, directory, transaction, state, calls, old, new = self.frontend_fixture()
        history = broker.FRONTEND / ".last-healthy-images.json"
        history.write_text(json.dumps({"admin": "previous-admin"}))
        with patch.object(broker, "frontend_smoke"):
            broker.release_frontend(manifest, directory, transaction)
        self.assertEqual(state["storefront"], new)
        self.assertEqual(json.loads(history.read_text()), {"admin": "previous-admin", **manifest["images"]})
        self.assertEqual(calls[-2][1][0], "pull")

    def test_rollback_failure_is_not_reported_as_healthy(self):
        manifest, directory, transaction, state, calls, old, new = self.frontend_fixture()
        with patch.object(broker, "frontend_smoke", side_effect=RuntimeError("still broken")):
            with self.assertRaisesRegex(RuntimeError, "still broken"):
                broker.release_frontend(manifest, directory, transaction)
        self.assertFalse((transaction / "rolled-back.json").exists())

    def test_frontend_smoke_checks_admin_root_not_login(self):
        # The admin app has no /login route; it serves its login UI from the
        # root page itself. Simulate the old (broken) /login URL 404ing and
        # assert the admin smoke still succeeds by hitting "/" instead.
        requested = []
        def fake_request_url(url, accepted=(200,)):
            requested.append(url)
            if url == "https://admin.rad-object.com/login":
                raise RuntimeError("Unexpected HTTP status")
            if url == "https://www.rad-object.com/fa/products":
                return b""
            return b""
        with patch.object(broker, "request_url", fake_request_url):
            broker.frontend_smoke({"storefront": "x", "admin": "y"})
        self.assertIn("https://admin.rad-object.com/", requested)
        self.assertNotIn("https://admin.rad-object.com/login", requested)

    def test_rollback_verification_succeeds_without_admin_login_route(self):
        transaction = self.root / "transaction"
        transaction.mkdir()
        image = "sha256:" + "1" * 64
        broker.atomic_json(transaction / "rollback.json", {
            "kind": "frontend",
            "previous": {"admin": {"image": image, "reference": "old-tag"}},
        })
        def compose(images, directory, *args):
            return subprocess.CompletedProcess([], 0, "")
        def inspect(service):
            return {"image": image, "reference": "old-tag"}
        def fake_request_url(url, accepted=(200,)):
            if url == "https://admin.rad-object.com/login":
                raise RuntimeError("Unexpected HTTP status")
            return b""
        for name, value in (("compose", compose), ("inspect_container", inspect),
                            ("request_url", fake_request_url)):
            patcher = patch.object(broker, name, value)
            patcher.start()
            self.addCleanup(patcher.stop)
        broker.rollback(transaction)
        self.assertTrue((transaction / "rolled-back.json").exists())
        self.assertEqual(json.loads((transaction / "rolled-back.json").read_text()), {"verified": True})


if __name__ == "__main__":
    unittest.main()
