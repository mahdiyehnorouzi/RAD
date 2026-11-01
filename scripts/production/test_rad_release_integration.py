"""Integration tests against a REAL, ephemeral PostgreSQL 16 instance.

Starts a throwaway `postgres:16-alpine` Docker container, points a
production-shaped extract of `apps/api` (the tree `package-api.sh` ships)
at it, and exercises the broker's
migration functions (migration_show, backup_database, run_pending_migrations,
reconcile_migrations) with nothing mocked except the three Postgres
client-binary paths (PG_DUMP/PG_RESTORE/PSQL), which this module redirects
into the same container via `docker exec` (it ships its own pg_dump/
pg_restore/psql — the host running this test may not; `npm`/`node` run
natively on the host either way, same as a real VPS release). Skips
cleanly — never fails — when Docker or this repository's own installed
Node dependencies aren't available, so it never blocks an environment that
genuinely can't run it.

Never touches any real/shared database: the container is created fresh
under a unique name, used only by this process, and force-removed in
tearDownClass (and via --rm if the process is killed before that runs).
"""
import hashlib
import importlib.util
import os
import shutil
import subprocess
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location("rad_release", Path(__file__).with_name("rad_release.py"))
broker = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(broker)

REPO_ROOT = Path(__file__).resolve().parents[2]
API_DIR = REPO_ROOT / "apps" / "api"
MIGRATIONS_DIR = API_DIR / "src" / "database" / "migrations"
# Same selection `scripts/production/make-manifest.py` signs into release.json.
# The broker refuses when migration:show's count differs from that signed
# list, so this test must hash the staged artifact's files with that glob
# rather than a hand-maintained subset.
PHONE_MIGRATION = "1793510000000-AddUserContactPhone.ts"
ADDRESS_BOOK_MIGRATION = "1793600000000-AddCustomerAddressBook.ts"
CLI_DATA_SOURCE = API_DIR / "src" / "database" / "cli-data-source.ts"

DOCKER = shutil.which("docker")
NPM = shutil.which("npm")


def _docker_daemon_reachable():
    if not DOCKER:
        return False
    try:
        subprocess.run([DOCKER, "version", "--format", "{{.Server.Version}}"],
                       capture_output=True, timeout=10, check=True)
        return True
    except (OSError, subprocess.SubprocessError):
        return False


def _prerequisites_met():
    return bool(
        DOCKER and NPM and (MIGRATIONS_DIR / PHONE_MIGRATION).exists()
        and CLI_DATA_SOURCE.exists()
        and (REPO_ROOT / "node_modules" / "typeorm" / "cli.js").exists()
        and _docker_daemon_reachable()
    )


def file_sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


@unittest.skipUnless(_prerequisites_met(),
                     "Requires Docker (daemon reachable) and this repo's own installed Node "
                     "dependencies (npm ci) — skipped, not failed, when either is unavailable.")
class RealPostgresMigrationTests(unittest.TestCase):
    """No broker function under test here is mocked — only the three
    Postgres client binary PATHS are redirected into the container, and
    SAFE_ENV's PATH is widened so the real local npm/node this test invokes
    can resolve their own dependencies on this machine."""

    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory(prefix="rad-migrate-it-")
        cls.backup_dir = Path(cls.tmp.name) / "backups"
        cls.backup_dir.mkdir(mode=0o700)
        cls.container = f"rad-migrate-it-{os.getpid()}-{int(time.time())}"
        subprocess.run([DOCKER, "rm", "-f", cls.container], capture_output=True)  # best-effort, stale name
        subprocess.run([
            DOCKER, "run", "-d", "--rm", "--name", cls.container,
            "-v", f"{cls.backup_dir}:{cls.backup_dir}",
            "-e", "POSTGRES_PASSWORD=postgres", "-e", "POSTGRES_DB=rad_migrate_it",
            "-p", "127.0.0.1::5432",
            "postgres:16-alpine",
        ], check=True, capture_output=True, text=True, timeout=60)
        try:
            cls.port = cls._published_port()
            cls._wait_ready()
            cls._stage_production_artifact()
            cls._create_baseline_schema()
        except Exception:
            subprocess.run([DOCKER, "rm", "-f", cls.container], capture_output=True)
            raise
        cls.database_url = f"postgresql://postgres:postgres@127.0.0.1:{cls.port}/rad_migrate_it"

    @classmethod
    def _stage_production_artifact(cls):
        """The layout `package-api.sh` gives the migrate broker: `apps/api/src`
        (migrations included) beside a root `node_modules`, so
        `npm run migration:show` resolves `tsx ../../node_modules/typeorm`
        from the extracted tree, not from the checkout the test was edited in.
        """
        root = Path(cls.tmp.name) / "artifact"
        api = root / "apps" / "api"
        shutil.copytree(API_DIR / "src", api / "src")
        for name in ("package.json", "tsconfig.json", "tsconfig.build.json"):
            shutil.copy2(API_DIR / name, api / name)
        shutil.copy2(REPO_ROOT / "tsconfig.json", root / "tsconfig.json")
        (root / "node_modules").symlink_to(REPO_ROOT / "node_modules", target_is_directory=True)
        overflow = API_DIR / "node_modules"
        if overflow.exists():
            (api / "node_modules").symlink_to(overflow, target_is_directory=True)
        cls.api_dir = api

    @classmethod
    def _create_baseline_schema(cls):
        # The real production database already has every OTHER table by
        # the time this migration ever runs there (see
        # docs/db-migration-runbook-product-attributes.md: "generated by
        # diffing the entities against a database that already had every
        # other table"). This fresh container has none of them. The
        # migration's up() only actually references "Product" (its
        # ProductAttributeValue.productId foreign key) — a minimal,
        # schema-accurate stand-in for that one dependency is enough to
        # exercise the real migration for real, without reimplementing this
        # repo's full entity set here. The second migration (gateway
        # columns) likewise only needs a bare "PaymentIntent" table to
        # ALTER — same reasoning, same minimal stand-in.
        subprocess.run(
            [DOCKER, "exec", cls.container, "psql",
             "postgresql://postgres:postgres@127.0.0.1:5432/rad_migrate_it", "-c",
             'CREATE TABLE IF NOT EXISTS "Product" (id text PRIMARY KEY);'
             'CREATE TABLE IF NOT EXISTS "PaymentIntent" (id text PRIMARY KEY);'
             'CREATE TABLE IF NOT EXISTS "User" ('
             '  id text PRIMARY KEY,'
             '  name text NOT NULL,'
             '  email text NOT NULL UNIQUE,'
             '  "passwordHash" text NOT NULL'
             ');'
             """INSERT INTO "User" (id, name, email, "passwordHash") VALUES
                ('u1', 'سارا', 'sara@example.com', 'hash-1'),
                ('u2', 'نسترن', 'nastaran@example.com', 'hash-2');"""],
            check=True, capture_output=True, text=True, timeout=15)

    @classmethod
    def _published_port(cls):
        out = subprocess.run([DOCKER, "port", cls.container, "5432/tcp"],
                             check=True, capture_output=True, text=True, timeout=15).stdout.strip()
        return out.rsplit(":", 1)[-1]

    @classmethod
    def _wait_ready(cls, attempts=40):
        # The official postgres image's entrypoint starts the server once
        # briefly during first-time initdb, shuts it down, then starts it
        # again for real — `pg_isready` can report ready during that first,
        # temporary startup. Only trust an actual successful SQL round trip
        # (via TCP, the same path every real command in this test uses),
        # polled repeatedly, not a single `pg_isready` pass.
        last_error = None
        for _ in range(attempts):
            result = subprocess.run(
                [DOCKER, "exec", cls.container, "psql",
                 "postgresql://postgres:postgres@127.0.0.1:5432/postgres", "-tAc", "SELECT 1;"],
                capture_output=True, text=True, timeout=10)
            if result.returncode == 0 and result.stdout.strip() == "1":
                return
            last_error = result.stderr.strip()
            time.sleep(0.5)
        raise RuntimeError(f"Postgres test container did not become ready in time: {last_error}")

    @classmethod
    def tearDownClass(cls):
        subprocess.run([DOCKER, "rm", "-f", cls.container], capture_output=True)
        cls.tmp.cleanup()

    def setUp(self):
        patch.object(broker, "BASE", Path(self.tmp.name)).start()
        patch.object(broker, "BACKUP_DIR", self.backup_dir).start()
        # protected() requires root ownership (the real production
        # invariant) — this test runs as the invoking developer/CI user, not
        # root, same as every other test in this suite that exercises a
        # function calling protected().
        patch.object(broker, "protected", lambda _path: None).start()
        self.env_file = Path(self.tmp.name) / "api.env"
        self.env_file.write_text("NODE_ENV=production\nTYPEORM_SYNCHRONIZE=false\n")
        patch.object(broker, "ENV_FILE", self.env_file).start()
        # The widened PATH is for the real local npm/node this test invokes
        # directly; it is never used for the PG_DUMP/PG_RESTORE/PSQL calls
        # below, which this test redirects into the container regardless of
        # host PATH.
        patch.object(broker, "SAFE_ENV", {**broker.SAFE_ENV, "PATH": os.environ.get("PATH", broker.SAFE_ENV["PATH"])}).start()
        real_run = broker.run
        container = self.container
        # The published host port (self.database_url) is only reachable from
        # the HOST — `npm run migration:show`/`migration:run` use it as-is.
        # A command run with `docker exec` is already INSIDE the container,
        # where Postgres listens on its own internal 5432 regardless of
        # which host port it's published as — so any PG client call this
        # test redirects into the container also needs its DATABASE_URL
        # argument rewritten to that internal address.
        internal_url = "postgresql://postgres:postgres@127.0.0.1:5432/rad_migrate_it"
        published_url = self.database_url
        mapping = {broker.PG_DUMP: "pg_dump", broker.PG_RESTORE: "pg_restore", broker.PSQL: "psql"}
        def dockerized_run(*args, **kwargs):
            args = list(args)
            if args and args[0] in mapping:
                binary = mapping[args[0]]
                rewritten = [a.replace(published_url, internal_url) if isinstance(a, str) else a for a in args[1:]]
                # Run as the HOST's own uid:gid, not the container's default
                # (postgres-alpine's "postgres" user) — on native Linux (real
                # CI, unlike Docker Desktop's bind-mount uid translation) a
                # file this writes to the bind-mounted backup_dir would
                # otherwise be owned by a uid the test process can't chmod.
                args = [DOCKER, "exec", "-u", f"{os.getuid()}:{os.getgid()}", container, binary, *rewritten]
                # The `docker` CLI itself (not the thing it execs INTO the
                # container) needs the real host environment to find the
                # Docker Desktop socket/context — SAFE_ENV's production
                # HOME=/root has no Docker config under it on this machine.
                # DATABASE_URL/etc. are irrelevant here regardless, since
                # the connection string is already in argv.
                kwargs = {**kwargs, "env": dict(os.environ)}
            return real_run(*args, **kwargs)
        patch.object(broker, "run", dockerized_run).start()
        self.addCleanup(patch.stopall)

    def manifest_for(self, *paths):
        return {"migrations": [{"name": path.name, "sha256": file_sha256(path)} for path in paths]}

    def table_names(self):
        result = broker.run(broker.PSQL, self.database_url, "-tAc",
                            "SELECT tablename FROM pg_tables WHERE schemaname='public';")
        return {line.strip() for line in result.stdout.splitlines() if line.strip()}

    def payment_intent_columns(self):
        result = broker.run(broker.PSQL, self.database_url, "-tAc",
                            "SELECT column_name FROM information_schema.columns "
                            "WHERE table_name = 'PaymentIntent';")
        return {line.strip() for line in result.stdout.splitlines() if line.strip()}

    def signed_manifest(self):
        """Hash the migrations inside the staged artifact, matching make-manifest.py."""
        migrations_dir = self.api_dir / "src" / "database" / "migrations"
        files = sorted(p for p in migrations_dir.glob("*.ts") if not p.name.endswith(".spec.ts"))
        names = [path.name for path in files]
        self.assertIn(PHONE_MIGRATION, names)
        self.assertIn(ADDRESS_BOOK_MIGRATION, names)
        self.assertEqual(names[-1], ADDRESS_BOOK_MIGRATION)
        return self.manifest_for(*files)

    def user_rows(self):
        result = broker.run(
            broker.PSQL, self.database_url, "-tAc",
            'SELECT id || \'|\' || name || \'|\' || email || \'|\' || "passwordHash" '
            'FROM "User" ORDER BY id;')
        return [line.strip() for line in result.stdout.splitlines() if line.strip()]

    def phone_facts(self):
        result = broker.run(
            broker.PSQL, self.database_url, "-tAc",
            "SELECT is_nullable FROM information_schema.columns "
            "WHERE table_name = 'User' AND column_name = 'phone';")
        nullable = result.stdout.strip()
        index = broker.run(
            broker.PSQL, self.database_url, "-tAc",
            "SELECT indexdef FROM pg_indexes "
            "WHERE schemaname = 'public' AND indexname = 'UQ_User_phone';")
        return nullable, index.stdout.strip()

    def previous_api_user_read(self):
        """The previous API release's User entity has no phone column."""
        result = broker.run(
            broker.PSQL, self.database_url, "-tAc",
            'SELECT id, name, email, "passwordHash" FROM "User" ORDER BY id;')
        return result.stdout.strip()

    def test_full_migration_lifecycle_against_real_postgres(self):
        manifest = self.signed_manifest()
        before = self.user_rows()
        self.assertEqual(before, [
            "u1|سارا|sara@example.com|hash-1",
            "u2|نسترن|nastaran@example.com|hash-2",
        ])

        # 1. Initial state: nothing applied yet, correctly detected as pending.
        shown = broker.migration_show(NPM, self.api_dir, self.database_url, "127.0.0.1")
        pending = broker.reconcile_migrations(manifest, shown)
        self.assertEqual(
            {m["name"] for m in pending},
            {entry["name"] for entry in manifest["migrations"]},
        )
        self.assertEqual(
            self.table_names()
            & {"ProductAttribute", "ProductAttributeValue", "CustomerAddress"},
            set(),
        )
        self.assertEqual(self.payment_intent_columns() & {"gatewayAuthority", "gatewayRefId", "verifiedAt"}, set())
        self.assertEqual(self.phone_facts()[0], "")

        # 2. A real backup, with a real, non-empty, structurally-valid dump.
        dump = broker.backup_database(self.database_url, "it")
        self.assertTrue(dump.exists())
        self.assertGreater(dump.stat().st_size, 0)

        # 3. A real `npm run migration:run` against the staged artifact.
        broker.run_pending_migrations(NPM, self.api_dir, self.database_url, "127.0.0.1")

        tables = self.table_names()
        for table in ("ProductAttribute", "ProductAttributeOption",
                      "ProductAttributeCategory", "ProductAttributeValue",
                      "CustomerAddress"):
            self.assertIn(table, tables)
        for column in ("gatewayAuthority", "gatewayRefId", "verifiedAt"):
            self.assertIn(column, self.payment_intent_columns())
        self.assertEqual(self.user_rows(), before)
        nullable, indexdef = self.phone_facts()
        self.assertEqual(nullable, "YES")
        self.assertIn("UNIQUE", indexdef)
        self.assertIn("(phone)", indexdef)
        phones = broker.run(
            broker.PSQL, self.database_url, "-tAc",
            'SELECT count(*) FROM "User" WHERE phone IS NULL;')
        self.assertEqual(phones.stdout.strip(), "2")
        broker.run(
            broker.PSQL, self.database_url, "-c",
            """UPDATE "User" SET phone = '09121234567' WHERE id = 'u1';""")
        with self.assertRaises(subprocess.CalledProcessError):
            broker.run(
                broker.PSQL, self.database_url, "-c",
                """UPDATE "User" SET phone = '09121234567' WHERE id = 'u2';""")
        broker.run(
            broker.PSQL, self.database_url, "-c",
            """UPDATE "User" SET phone = NULL WHERE id = 'u1';""")
        self.assertEqual(self.user_rows(), before)
        self.assertIn("u1|سارا|sara@example.com|hash-1", self.previous_api_user_read())

        # 4. migration:show now reports every signed migration applied.
        shown_after = broker.migration_show(NPM, self.api_dir, self.database_url, "127.0.0.1")
        self.assertEqual(broker.reconcile_migrations(manifest, shown_after), [])

        # 5. Reverting the last migration drops only the address book.
        #    The phone column from the previous migration stays, and accounts
        #    are unchanged. Order snapshots are not part of this table.
        broker.run(
            NPM, "run", "migration:revert",
            env={**broker.SAFE_ENV, "PATH": os.environ.get("PATH", ""),
                 "DATABASE_URL": self.database_url, "RAD_ALLOW_REMOTE_DB_WRITE": "127.0.0.1"},
            cwd=self.api_dir, timeout=1800)
        self.assertNotIn("CustomerAddress", self.table_names())
        nullable, indexdef = self.phone_facts()
        self.assertEqual(nullable, "YES")
        self.assertIn("UNIQUE", indexdef)
        self.assertEqual(self.user_rows(), before)
        self.assertIn("sara@example.com", self.previous_api_user_read())
        shown_reverted = broker.migration_show(NPM, self.api_dir, self.database_url, "127.0.0.1")
        pending_again = broker.reconcile_migrations(manifest, shown_reverted)
        self.assertEqual([entry["name"] for entry in pending_again], [ADDRESS_BOOK_MIGRATION])

    @unittest.skipUnless(os.environ.get("RAD_TEST_BACKUP_VERIFY_DATABASE_URL"),
                         "Set RAD_TEST_BACKUP_VERIFY_DATABASE_URL to a second, already-reachable, "
                         "isolated PostgreSQL 16 database (never the one this test provisions) to "
                         "exercise the real-restore verification path (verify_restore / concern #4).")
    def test_backup_is_actually_restorable_not_just_structurally_valid(self):
        broker.run_pending_migrations(NPM, self.api_dir, self.database_url, "127.0.0.1")
        verify_url = os.environ["RAD_TEST_BACKUP_VERIFY_DATABASE_URL"]
        self.env_file.write_text(
            self.env_file.read_text() + f"RAD_MIGRATION_BACKUP_VERIFY_DATABASE_URL={verify_url}\n")
        dump = broker.backup_database(self.database_url, "verify-it")
        self.assertTrue(dump.exists())


if __name__ == "__main__":
    unittest.main()
