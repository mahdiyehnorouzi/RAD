# One-time bootstrap: /opt/rad → releases + symlink layout

`scripts/deploy-api-systemd.sh` (added alongside this doc) requires `/opt/rad`
to be a **symlink** into `/opt/rad-releases/<version>-<timestamp>/`, so every
deploy can build a brand-new release in isolation and only atomically
repoint the symlink once it's built and health-checked. As of this task's
verification, production's `/opt/rad` is still a **plain directory**
(the live checkout) — the deploy script refuses to run until that's fixed,
on purpose, because migrating the layout is itself a production change this
automation will not perform for you.

This is a **manual, one-time, reviewed** procedure. Read it fully, then run
it yourself (or have an operator run it) on the VPS. Nothing here is
destructive if followed in order — the existing checkout is copied, not
moved, until the very last (trivially reversible) step.

## Prerequisites

- You can SSH to the VPS as the user that owns `/opt/rad` and manages
  `rad-api.service`.
- `rad-api.service`'s `EnvironmentFile=` is already at a path **outside**
  `/opt/rad` (e.g. `/etc/rad/api.env`). If it currently lives *inside*
  `/opt/rad` (e.g. `/opt/rad/.env`), move it out first and update the unit's
  `EnvironmentFile=` line + `systemctl daemon-reload` — the deploy script
  checks for and refuses to run against an env file still inside the
  release tree, since swapping releases would then lose or duplicate it.

## Steps

```bash
# 1. Confirm current state (read-only).
ls -la /opt/rad
systemctl show -p EnvironmentFiles rad-api.service
systemctl is-active rad-api.service

# 2. Capture what's currently running, for your own records.
git -C /opt/rad rev-parse HEAD
cat /opt/rad/VERSION

# 3. Create the releases directory and copy (not move) the current
#    checkout into it as the first "release". This does not touch the
#    running process at all — /opt/rad is untouched here.
mkdir -p /opt/rad-releases
FIRST_RELEASE="/opt/rad-releases/$(tr -d '[:space:]' < /opt/rad/VERSION)-bootstrap"
cp -a /opt/rad "$FIRST_RELEASE"

# 4. Rename the original directory out of the way (reversible — nothing
#    is deleted). The running rad-api.service process already has this
#    directory open by inode, so this rename does NOT affect it or require
#    a restart.
mv /opt/rad /opt/rad.pre-release-migration-backup

# 5. Symlink /opt/rad to the copied release. This is the only step that
#    changes what `/opt/rad` resolves to.
ln -s "$FIRST_RELEASE" /opt/rad

# 6. Verify the service still reports healthy against the SAME commit as
#    before (nothing should have changed from its perspective, since the
#    files are byte-identical copies and the process was never restarted).
curl -s http://127.0.0.1:4000/health
git -C /opt/rad rev-parse HEAD   # should match step 2's output

# 7. Only once you're satisfied: restart the service once, confirm health
#    again, to prove the symlinked layout actually works end-to-end before
#    relying on it for the next real deploy.
systemctl restart rad-api.service
curl -s http://127.0.0.1:4000/health

# 8. Keep /opt/rad.pre-release-migration-backup around for a while (it
#    costs disk space but nothing else) until you're confident in the new
#    layout, then remove it manually whenever you're ready — this script
#    deliberately does not delete it for you.
```

After this, `scripts/deploy-api-systemd.sh` (and the `deploy-api-vps.yml`
GitHub Actions workflow that calls it) can run against this host.

## Why not automate this step too

The deploy script could technically detect the plain-directory case and
perform steps 3–7 itself. It deliberately does not: this is the one
operation in the whole release pipeline that changes production's on-disk
layout rather than building something new alongside it, and the task
driving this work explicitly draws the line at "no production
infrastructure changes without approval" — this is exactly that line.
