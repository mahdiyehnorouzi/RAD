#!/usr/bin/env bash
#
# Fake `curl` for scripts/test/test-retry-curl.sh: replays a fixed,
# comma-separated sequence of outcomes from $FAKE_CURL_SEQUENCE_FILE (one
# consumed per invocation), mimicking just enough of real curl's behavior
# for retry-curl.sh to exercise against - the `-o <file>` / `-w` /
# fail-on-HTTP-error (`-f`) contract it actually relies on, nothing more.
#
# Each entry is one of:
#   200        -> writes "ok" to the output file, prints "200", exits 0
#   000:<exit> -> no output file, prints "000", exits <exit> (connect-level
#                 failure, e.g. 7/28/52/56)
#   <code>     -> no output file, prints <code> (e.g. 404/429/504),
#                 exits 22 (curl's real exit code for `-f` on an HTTP error)
set -euo pipefail

out=""
args=("$@")
for ((i = 0; i < ${#args[@]}; i++)); do
  if [[ "${args[$i]}" == "-o" ]]; then
    out="${args[$((i + 1))]}"
  fi
done

sequence_file="${FAKE_CURL_SEQUENCE_FILE:?FAKE_CURL_SEQUENCE_FILE not set}"
state_file="${sequence_file}.pos"
pos=0
[[ -f "$state_file" ]] && pos=$(<"$state_file")

IFS=',' read -ra entries <"$sequence_file"
last=$((${#entries[@]} - 1))
if [[ "$pos" -le "$last" ]]; then
  entry="${entries[$pos]}"
else
  entry="${entries[$last]}"
fi
echo $((pos + 1)) >"$state_file"

if [[ "$entry" == "200" ]]; then
  [[ -n "$out" ]] && printf 'ok' >"$out"
  printf '200'
  exit 0
elif [[ "$entry" == 000:* ]]; then
  printf '000'
  exit "${entry#000:}"
else
  printf '%s' "$entry"
  exit 22
fi
