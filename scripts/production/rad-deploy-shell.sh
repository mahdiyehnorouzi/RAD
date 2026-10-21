#!/usr/bin/env bash
#
# Restricted login shell for the `rad-deploy` account (installed as its
# shell in /etc/passwd, e.g. via `usermod -s /usr/local/libexec/rad-deploy-shell.sh rad-deploy`).
#
# Why this exists: OpenSSH's authorized_keys `command="..."` forced-command
# restriction (see rad-deploy-ssh-entrypoint.sh) is enforced by sshd
# re-invoking the account's OWN LOGIN SHELL as `<shell> -c "<command>"` -
# it does not bypass the shell. A shell that can't run `-c` at all (e.g.
# /usr/sbin/nologin, which ignores its arguments and just refuses) makes
# the forced command never execute, silently breaking every deploy. A
# shell that CAN run `-c` but is otherwise a full, unrestricted shell
# (/bin/bash) is fine ONLY as long as nothing can ever invoke it any other
# way - which depends entirely on authorized_keys never losing its
# `command=` restriction and on this account never gaining another
# authentication method (password login is expected to stay disabled for
# this account - see docs/vps-tailscale-ssh-deploy.md).
#
# This script is the defense-in-depth layer for that "ONLY as long as"
# assumption: it is this account's shell instead of /bin/bash, and it will
# run ONE exact invocation shape - itself called as `-c
# <rad-deploy-ssh-entrypoint.sh's absolute path>` - and refuses, fail
# closed, with no shell, no arbitrary command, and no other behavior, for
# literally anything else: no args, a different path, extra args, an
# interactive attempt, whatever. Even if authorized_keys' `command=`
# restriction were ever accidentally dropped from the key, this shell by
# itself still only runs that one fixed script.
set -euo pipefail

ENTRYPOINT="${RAD_DEPLOY_ENTRYPOINT_PATH:-/usr/local/libexec/rad-deploy-ssh-entrypoint.sh}"

if [[ "$#" -eq 2 && "$1" == "-c" && "$2" == "$ENTRYPOINT" ]]; then
  exec "$ENTRYPOINT"
fi

echo "rad-deploy-shell: this account only runs the RAD deployment entrypoint; refusing." >&2
exit 1
