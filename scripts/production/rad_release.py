#!/usr/bin/env python3
"""Root-owned, fixed-operation release broker. Install only after operator review.

No checkout code is imported/executed here. All supplied files are copied through
no-follow descriptors and cryptographically verified before privileged changes.
"""
import contextlib
import fcntl
import hashlib
import grp
import json
import os
from pathlib import Path, PurePosixPath
import pwd
import re
import shutil
import signal
import stat
import subprocess
import sys
import tarfile
import tempfile
import time
import urllib.error
import urllib.request

REPO = "mahdiyehnorouzi/RAD"
BASE = Path("/var/lib/rad-release")
INCOMING = BASE / "incoming"
RELEASES = Path("/opt/rad-releases")
LIVE = Path("/opt/rad/apps/api")
ENV_FILE = Path("/etc/rad/api.env")
FRONTEND = Path("/root/rad-frontend-deploy")
COMPOSE = FRONTEND / "docker-compose.frontend-vps.yml"
SERVICE = "rad-api.service"
GH = "/usr/local/bin/gh"
ACTIVATION = Path("/etc/rad-release/activation.json")
# Offline Sigstore trust root. This host's egress to the live public-good TUF
# CDN (tuf-repo-cdn.sigstore.dev) returns HTTP 403 even with no local firewall
# or proxy blocking it (verified: iptables OUTPUT policy ACCEPT, ufw allows
# outgoing, no proxy env) - the block is upstream of this host, not fixable
# here. `gh attestation verify` can use a pinned trusted_root.jsonl instead of
# fetching live TUF metadata; see docs/sigstore-trusted-root.md for how this
# file is produced, refreshed, and installed.
TRUSTED_ROOT = Path("/etc/rad-release/trusted_root.jsonl")
SAFE_ENV = {"PATH": "/usr/local/bin:/usr/bin:/bin", "HOME": "/root", "LANG": "C.UTF-8"}
SHA = re.compile(r"[0-9a-f]{40}")
DIGEST = re.compile(r"sha256:[0-9a-f]{64}")
STAGE = re.compile(r"release-[A-Za-z0-9_-]{6,80}")


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def run(*args, capture=True, check=True):
    return subprocess.run([str(a) for a in args], env=SAFE_ENV, check=check,
                          stdout=subprocess.PIPE if capture else None,
                          stderr=subprocess.PIPE, text=True, timeout=600)


def atomic_json(path, data):
    temporary = path.with_suffix(".tmp")
    with open(temporary, "w", encoding="utf8") as out:
        json.dump(data, out, sort_keys=True)
        out.flush()
        os.fsync(out.fileno())
    os.chmod(temporary, 0o600)
    os.replace(temporary, path)


def file_hash(path):
    with open(path, "rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


def protected(path):
    """Require all ancestors to be root-owned and not group/world writable."""
    path = Path(path)
    for item in (path, *path.parents):
        info = item.lstat()
        require(not stat.S_ISLNK(info.st_mode) and info.st_uid == 0
                and not info.st_mode & 0o022, f"Unprotected path: {item}")


def validate_activation():
    """An off-host variable/merge cannot grant host release authority.

    This file is installed separately by the root operator only after verifying
    scheduling, Environment restrictions, host preflight and a safe rehearsal.
    Pinning the installed broker forces re-approval when privileged code changes.
    The same applies to the pinned Sigstore trusted root: rotating it (see
    docs/sigstore-trusted-root.md) requires root to re-approve the new hash
    here too, exactly like a broker update does.
    """
    protected(ACTIVATION)
    require(ACTIVATION.stat().st_mode & 0o077 == 0, "Activation policy must be root-private")
    policy = json.loads(ACTIVATION.read_text())
    require(isinstance(policy, dict), "Invalid activation policy")
    require(type(policy.get("schema")) is int and policy["schema"] == 1
            and policy.get("repository") == REPO, "Wrong activation policy origin/schema")
    for requirement in ("enabled", "runner_workflow_policy_verified", "production_environments_verified",
                        "host_preflight_verified", "nonproduction_rehearsal_verified"):
        require(policy.get(requirement) is True, f"Host release approval missing: {requirement}")
    require(policy.get("broker_sha256") == file_hash(Path(__file__)), "Installed broker requires root re-approval")
    protected(TRUSTED_ROOT)
    require(TRUSTED_ROOT.stat().st_mode & 0o022 == 0, "Trusted root must not be group/world writable")
    require(policy.get("trusted_root_sha256") == file_hash(TRUSTED_ROOT),
            "Installed Sigstore trusted root requires root re-approval")


def snapshot_input(stage, name, destination, limit):
    # Open each directory relative to the already-open trusted parent. Renaming
    # the runner's directory or replacing a file with a symlink cannot redirect it.
    with contextlib.ExitStack() as stack:
        parent = os.open(INCOMING, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
        stack.callback(os.close, parent)
        directory = os.open(stage, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=parent)
        stack.callback(os.close, directory)
        descriptor = os.open(name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=directory)
        source = stack.enter_context(os.fdopen(descriptor, "rb"))
        info = os.fstat(source.fileno())
        require(stat.S_ISREG(info.st_mode) and info.st_size <= limit, "Invalid input file")
        with open(destination, "xb") as target:
            remaining = limit
            while chunk := source.read(min(1024 * 1024, remaining + 1)):
                remaining -= len(chunk)
                require(remaining >= 0, "Input size limit exceeded")
                target.write(chunk)


def validate_manifest(manifest, request):
    require(type(manifest.get("schema")) is int and manifest.get("schema") == 1 and manifest.get("repository") == REPO, "Wrong manifest origin/schema")
    require(manifest.get("kind") == request["kind"], "Wrong release kind")
    require(manifest.get("commit") == request["commit"] and SHA.fullmatch(request["commit"]), "Commit mismatch")
    for key in ("run_id", "run_attempt"):
        require(type(manifest.get(key)) is int and manifest[key] > 0 and manifest[key] == request[key], "Run mismatch")
    if request["kind"] == "api":
        require(re.fullmatch(r"[0-9a-f]{64}", manifest.get("archive_sha256", "")), "Invalid archive digest")
        require(re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+(?:[-+][A-Za-z0-9.-]+)?", manifest.get("version", "")), "Invalid version")
    else:
        images = manifest.get("images", {})
        require(isinstance(images, dict) and 1 <= len(images) <= 2, "No images selected")
        for service, image in images.items():
            require(service in ("storefront", "admin"), "Unknown service")
            prefix = f"ghcr.io/mahdiyehnorouzi/rad-{service}@"
            require(isinstance(image, str) and image.startswith(prefix) and DIGEST.fullmatch(image[len(prefix):]), "Unpinned/wrong image")


def verify_manifest(directory, request):
    path = directory / "release.json"
    manifest = json.loads(path.read_text())
    validate_manifest(manifest, request)
    workflow = f"{REPO}/.github/workflows/deploy-{request['kind'] if request['kind'] == 'api' else 'frontend'}-vps.yml"
    # Fail closed if gh is old, Sigstore trust is unavailable, or the signer,
    # source commit/ref, runner type or subject hash does not match policy.
    # --custom-trusted-root: this host's egress to the live public-good TUF
    # CDN is blocked upstream (see TRUSTED_ROOT comment above), so verification
    # uses a pinned, hash-approved trusted_root.jsonl instead of a live TUF
    # fetch. validate_activation() already required this file to be
    # root-protected and hash-matched to the activation policy before any
    # release request reaches here - this does not weaken what is verified,
    # only where the trust root comes from.
    protected(TRUSTED_ROOT)
    run(GH, "attestation", "verify", path, "--bundle", directory / "release.sigstore.json",
        "--repo", REPO, "--signer-workflow", workflow, "--source-ref", "refs/heads/main",
        "--source-digest", request["commit"], "--signer-digest", request["commit"],
        "--deny-self-hosted-runners", "--custom-trusted-root", TRUSTED_ROOT)
    return manifest


def unpack_api(archive, target):
    """Extract regular files/dirs then contained symlinks; never tar.extractall."""
    with tarfile.open(archive, "r:gz") as source:
        members = []
        names = set()
        links = set()
        total = 0
        for member in source:
            require(len(members) < 250000, "Too many archive entries")
            members.append(member)
            require(len(member.name) <= 4096 and len(member.linkname) <= 4096, "Archive path exceeds limit")
            require(member.size >= 0, "Negative archive entry size")
            path = PurePosixPath(member.name)
            require(not path.is_absolute() and ".." not in path.parts and path.parts, "Unsafe archive path")
            require(path.parts[0] in ("node_modules", "apps", "packages", "VERSION", "tsconfig.json"), "Unexpected archive root")
            require(path not in names, "Duplicate archive path")
            names.add(path)
            require(member.isfile() or member.isdir() or member.issym(), "Unsupported archive entry")
            if member.issym():
                links.add(path)
                link = PurePosixPath(member.linkname)
                require(not link.is_absolute(), "Absolute archive symlink")
                resolved = (target / str(path.parent) / str(link)).resolve()
                require(resolved.is_relative_to(target.resolve()), "Escaping archive symlink")
            total += member.size
            require(total <= 4 * 1024**3, "Archive expands beyond 4 GiB")
        require(all(not any(parent in links for parent in p.parents) for p in names), "Entry below symlink")
        for member in members:
            destination = target / member.name
            destination.parent.mkdir(parents=True, exist_ok=True, mode=0o755)
            if member.isdir():
                destination.mkdir(exist_ok=True, mode=0o755)
            elif member.isfile():
                with source.extractfile(member) as src, open(destination, "xb") as dst:
                    shutil.copyfileobj(src, dst)
                destination.chmod(0o755 if member.mode & 0o111 else 0o644)
        for folder, _, _ in os.walk(target):
            Path(folder).chmod(0o755)
        for member in members:
            if member.issym():
                (target / member.name).symlink_to(member.linkname)
        # Resolve symlink chains after all links exist as well (chains can escape
        # even when each lexical link initially appeared to be contained).
        for link in links:
            require((target / str(link)).resolve().is_relative_to(target.resolve()), "Escaping symlink chain")


def request_url(url, accepted=(200,)):
    try:
        with urllib.request.urlopen(url, timeout=15) as response:
            require(response.status in accepted, "Unexpected HTTP status")
            return response.read(16 * 1024 * 1024)
    except urllib.error.HTTPError as error:
        if error.code in accepted:
            return b""
        raise


def health(url, version=None):
    data = json.loads(request_url(url))
    require(data.get("ok") is True and data.get("db") is True, "API/database unhealthy")
    require(data.get("env") == "production", "API not in production mode")
    if version is not None:
        require(data.get("version") == version, "Wrong API version")
    return data


def poll(check, attempts=36):
    for attempt in range(attempts):
        try:
            return check()
        except (RuntimeError, OSError, ValueError):
            if attempt == attempts - 1:
                raise
            time.sleep(5)


def api_smoke(version):
    health("https://api.rad-object.com/health", version)
    request_url("https://api.rad-object.com/session", (200, 401))
    artworks = json.loads(request_url("https://api.rad-object.com/artworks"))
    require(isinstance(artworks, list), "Invalid public catalog")
    require(not any(isinstance(image.get("src"), str) and image["src"].startswith("/catalog/photos/")
                    for artwork in artworks for image in artwork.get("images", [])), "Stale registry media")


def service_property(name):
    return run("/usr/bin/systemctl", "show", SERVICE, f"--property={name}", "--value").stdout.strip()


def api_preflight():
    require(os.uname().machine == "x86_64", "API artifact requires Linux x86_64")
    node_version = run("/usr/bin/node", "--version").stdout.strip()
    require(re.fullmatch(r"v[0-9]+\.[0-9]+\.[0-9]+", node_version) and int(node_version.split(".")[0][1:]) >= 22,
            "API requires Node.js 22 or newer at /usr/bin/node")
    protected(ENV_FILE)
    protected(RELEASES)
    protected(LIVE.parent)
    require(LIVE.is_symlink(), "Bootstrap release layout first")
    previous = LIVE.resolve(strict=True)
    require(previous.is_relative_to(RELEASES.resolve()), "Live release outside release tree")
    protected(previous)
    user = service_property("User")
    require(user and user not in ("root", "rad-runner") and pwd.getpwnam(user).pw_uid > 0, "API must run as separate non-root user")
    account = pwd.getpwnam(user)
    groups = {grp.getgrgid(group).gr_name for group in os.getgrouplist(user, account.pw_gid)}
    require(not groups & {"root", "docker", "sudo"}, "API account has privileged groups")
    require(service_property("Group") not in ("root", "docker", "sudo"), "Unsafe API group")
    require(not set(service_property("SupplementaryGroups").split()) & {"root", "docker", "sudo"}, "Unsafe API supplementary groups")
    # Prevent the legacy wrapper's sync-schema/ensure-staff/seed execution.
    for hook in ("ExecStartPre", "ExecStartPost", "ExecCondition"):
        require(not service_property(hook), "Review service startup hooks before releasing")
    require(service_property("Type") in ("simple", "exec"), "Unexpected API service Type")
    require(service_property("KillMode") == "control-group", "API must terminate its entire process group")
    start = service_property("ExecStart")
    require("path=/usr/bin/node ;" in start and start.count("argv[]=") == 1, "Unexpected API start commands")
    require(re.search(r"argv\[\]=/usr/bin/node (?:/opt/rad/apps/api/)?dist/main\.js\s*;", start), "ExecStart must run compiled dist/main.js directly")
    require(service_property("NoNewPrivileges") == "yes", "API NoNewPrivileges must be enabled")
    require(not service_property("AmbientCapabilities") and not service_property("CapabilityBoundingSet"), "API capabilities must be empty")
    require(service_property("WorkingDirectory") == str(LIVE), "Wrong API working directory")
    require(service_property("EnvironmentFiles") == f"{ENV_FILE} (ignore_errors=no)", "Unexpected API EnvironmentFiles")
    environment = ENV_FILE.read_text()
    def value(key):
        values = re.findall(rf"^\s*{key}\s*=\s*[\"']?([^\"'\n]*?)[\"']?\s*$", environment, re.MULTILINE)
        return values[-1].strip() if values else None
    require(value("NODE_ENV") == "production" and value("TYPEORM_SYNCHRONIZE") == "false", "Explicit production/no-schema-sync settings required")
    # Reject overrides embedded in the unit, rather than silently overriding
    # the operator's production configuration in the release helper.
    require(not service_property("Environment"), "Review/remove inline service Environment overrides first")
    before = health("http://127.0.0.1:4000/health")
    return {"previous": str(previous), "version": before["version"], "env_sha256": file_hash(ENV_FILE)}


def swap_release(path):
    pending = LIVE.parent / ".api-release-pending"
    require(not pending.exists() and not pending.is_symlink(), "Pending link requires operator inspection")
    pending.symlink_to(path)
    os.replace(pending, LIVE)


def restart_api(version):
    run("/usr/bin/systemctl", "restart", SERVICE)
    poll(lambda: health("http://127.0.0.1:4000/health", version))


def release_api(manifest, directory, transaction):
    previous = api_preflight()
    archive = directory / "api-release.tar.gz"
    require(file_hash(archive) == manifest["archive_sha256"], "API artifact checksum mismatch")
    target = RELEASES / f"release-{manifest['commit']}-{manifest['run_id']}-{manifest['run_attempt']}"
    require(not target.exists(), "Immutable release already exists; use a new run attempt")
    target.mkdir(mode=0o755)
    target.chmod(0o755)
    unpack_api(archive, target)
    for path in ("apps/api/dist/main.js", "apps/api/package.json", "tsconfig.json", "node_modules/@nestjs", "node_modules/@rad/artworks"):
        require((target / path).exists(), f"Incomplete artifact: {path}")
    require((target / "VERSION").read_text().strip() == manifest["version"], "Artifact version mismatch")
    atomic_json(transaction / "rollback.json", {"kind": "api", **previous, "target": str(target / "apps/api")})
    # Snapshot for audit/recovery; the helper never rewrites production env.
    shutil.copyfile(ENV_FILE, transaction / "api.env.snapshot")
    (transaction / "api.env.snapshot").chmod(0o600)
    try:
        swap_release(target / "apps/api")
        restart_api(manifest["version"])
        api_smoke(manifest["version"])
        require(file_hash(ENV_FILE) == previous["env_sha256"], "Environment changed during release")
        atomic_json(target / ".rad-release.json", manifest)
    except BaseException:
        rollback(transaction)
        raise


def inspect_container(service):
    value = json.loads(run("/usr/bin/docker", "inspect", f"rad-{service}").stdout)[0]
    require(value["State"].get("Health", {}).get("Status") == "healthy", f"Previous {service} is not healthy")
    require(DIGEST.fullmatch(value["Image"]), "Invalid existing image ID")
    return {"image": value["Image"], "reference": value["Config"]["Image"]}


def compose(images, directory, *arguments):
    override = directory / "compose-images.json"
    atomic_json(override, {"services": {name: {"image": image} for name, image in images.items()}})
    return run("/usr/bin/docker", "compose", "--project-directory", FRONTEND,
               "-f", COMPOSE, "-f", override, *arguments)


def frontend_health(images):
    for service in images:
        inspect_container(service)


def frontend_smoke(services):
    if "storefront" in services:
        base = "https://www.rad-object.com"
        request_url(base + "/fa")
        page = request_url(base + "/fa/products").decode()
        link = re.search(r'href="(/fa/products/[a-z0-9-]+)"', page)
        if link:
            request_url(base + link[1])
        request_url(base + "/backend/session", (200, 401))
    if "admin" in services:
        request_url("https://admin.rad-object.com/login")


def release_frontend(manifest, directory, transaction):
    protected(COMPOSE)
    for name in (".env.storefront.production", ".env.admin.production"):
        protected(FRONTEND / name)
    images = manifest["images"]
    previous = {service: inspect_container(service) for service in images}
    # Fail closed if the root-owned compose no longer names the expected
    # services/containers; never accept a workflow-supplied compose file.
    config = json.loads(compose(images, directory, "config", "--format", "json").stdout)
    for service in images:
        service_config = config["services"][service]
        require(service_config.get("container_name") == f"rad-{service}", "Unexpected compose container")
        require(not service_config.get("build"), "Production builds are forbidden")
        running_id = run("/usr/bin/docker", "inspect", "--format", "{{.Id}}", f"rad-{service}").stdout.strip()
        compose_id = compose(images, directory, "ps", "-q", service).stdout.strip()
        require(compose_id and run("/usr/bin/docker", "inspect", "--format", "{{.Id}}", compose_id).stdout.strip() == running_id,
                "Compose project does not own the running container")
    # Pull every selected digest BEFORE touching a container.
    compose(images, directory, "pull", *images)
    atomic_json(transaction / "rollback.json", {"kind": "frontend", "previous": previous})
    try:
        compose(images, directory, "up", "-d", "--no-deps", "--no-build", "--pull", "never", *images)
        def check():
            frontend_health(images)
            for service, reference in images.items():
                actual = inspect_container(service)
                expected = run("/usr/bin/docker", "image", "inspect", "--format", "{{.Id}}", reference).stdout.strip()
                require(actual["image"] == expected, "Wrong running image")
        poll(check)
        frontend_smoke(images)
        # Merge selected services only, retaining untouched sibling history.
        history = FRONTEND / ".last-healthy-images.json"
        state = json.loads(history.read_text()) if history.exists() else {}
        state.update(images)
        atomic_json(history, state)
    except BaseException:
        rollback(transaction)
        raise


def rollback(transaction):
    data = json.loads((transaction / "rollback.json").read_text())
    if data["kind"] == "api":
        require(file_hash(ENV_FILE) == data["env_sha256"], "Env changed; operator must reconcile before rollback")
        require(str(LIVE.resolve()) == data["target"], "Rollback target is stale")
        swap_release(data["previous"])
        restart_api(data["version"])
        api_smoke(data["version"])
    else:
        images = {service: info["image"] for service, info in data["previous"].items()}
        # Local immutable image IDs, never mutable tags/latest or a registry pull.
        compose(images, transaction, "up", "-d", "--no-deps", "--no-build", "--pull", "never", *images)
        def check():
            frontend_health(images)
            for service, image in images.items():
                require(inspect_container(service)["image"] == image, "Wrong rollback image")
        poll(check)
        frontend_smoke(images)
    atomic_json(transaction / "rolled-back.json", {"verified": True})
    print("Rollback verified healthy", flush=True)


def validate_sequence(manifest, state):
    sequence = [manifest["run_id"], manifest["run_attempt"]]
    require(sequence > state.get("sequence", [0, 0]), "Stale/replayed deployment")
    return sequence


def read_request():
    def timed_out(_signum, _frame):
        raise RuntimeError("Timed out reading release request")
    signal.signal(signal.SIGALRM, timed_out)
    signal.alarm(15)
    try:
        data = sys.stdin.buffer.read(4097)
        require(len(data) <= 4096, "Release request exceeds 4 KiB")
        request = json.loads(data)
        require(isinstance(request, dict), "Request must be an object")
        return request
    finally:
        signal.alarm(0)


def main():
    require(os.geteuid() == 0, "Root-owned broker must be invoked through the exact sudoers rule")
    def interrupted(signum, _frame):
        # Let an in-flight activation roll back on cancellation/termination.
        # SIGKILL/power failure requires the documented transaction recovery.
        signal.signal(signal.SIGTERM, signal.SIG_IGN)
        signal.signal(signal.SIGINT, signal.SIG_IGN)
        raise RuntimeError(f"Release interrupted by signal {signum}")
    signal.signal(signal.SIGTERM, interrupted)
    signal.signal(signal.SIGINT, interrupted)
    os.umask(0o077)
    os.environ.clear()
    os.environ.update(SAFE_ENV)
    protected(BASE)
    protected(Path(__file__).absolute())
    protected(Path(GH))
    # A caller cannot hold the production lock by keeping stdin open. Refuse
    # concurrent broker processes instead of accumulating privileged waiters.
    if len(sys.argv) == 1:
        validate_activation()
    request = read_request() if len(sys.argv) == 1 else None
    with open(BASE / "release.lock", "a") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise RuntimeError("Another production release/recovery is active") from None
        if len(sys.argv) == 3 and sys.argv[1] == "rollback":
            # This argv mode is intentionally NOT allowed by sudoers.
            name = sys.argv[2]
            require(re.fullmatch(r"[0-9]+-[0-9]+-(api|frontend)", name), "Invalid transaction")
            rollback(BASE / "transactions" / name)
            return
        require(len(sys.argv) == 1, "Arguments are not accepted")
        require(request.get("kind") in ("api", "frontend"), "Invalid release kind")
        require(isinstance(request.get("stage"), str) and STAGE.fullmatch(request["stage"]), "Invalid staging directory")
        require(isinstance(request.get("commit"), str) and SHA.fullmatch(request["commit"]), "Invalid commit")
        for key in ("run_id", "run_attempt"):
            require(type(request.get(key)) is int and 0 < request[key] < 10**18, "Invalid run identity")
        with tempfile.TemporaryDirectory(prefix="verified-", dir=BASE) as temp:
            directory = Path(temp)
            snapshot_input(request["stage"], "release.json", directory / "release.json", 65536)
            snapshot_input(request["stage"], "release.sigstore.json", directory / "release.sigstore.json", 4 * 1024**2)
            manifest = verify_manifest(directory, request)
            state_path = BASE / f"last-{request['kind']}.json"
            state = json.loads(state_path.read_text()) if state_path.exists() else {}
            sequence = validate_sequence(manifest, state)
            transaction = BASE / "transactions" / f"{sequence[0]}-{sequence[1]}-{request['kind']}"
            transaction.mkdir(parents=True, mode=0o700)
            atomic_json(transaction / "release.json", manifest)
            # Burn this sequence BEFORE activation; retry requires a new attempt.
            atomic_json(state_path, {"sequence": sequence, "status": "attempting", "commit": manifest["commit"]})
            if request["kind"] == "api":
                snapshot_input(request["stage"], "api-release.tar.gz", directory / "api-release.tar.gz", 2 * 1024**3)
                release_api(manifest, directory, transaction)
            else:
                release_frontend(manifest, directory, transaction)
            atomic_json(state_path, {"sequence": sequence, "status": "healthy", "commit": manifest["commit"]})
            atomic_json(transaction / "successful.json", {"verified": True})
            print(f"Release verified healthy: {request['kind']} {manifest['commit']}")


if __name__ == "__main__":
    try:
        main()
    except BaseException as error:
        # No subprocess stderr, env values, compose config or service logs in CI.
        print(f"Release failed ({type(error).__name__}): {error if isinstance(error, RuntimeError) else 'inspect protected host diagnostics'}", file=sys.stderr)
        sys.exit(1)
