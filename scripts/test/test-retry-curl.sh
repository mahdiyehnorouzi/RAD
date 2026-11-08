#!/usr/bin/env bash
#
# Local, isolated test of scripts/ci/retry-curl.sh: a fake `curl` on PATH
# (scripts/test/fake-curl-sequence.sh) replays scripted outcomes so this
# never touches the network. Confirms the three behaviors the release-
# signatures CI job actually depends on:
#   1. a transient 504 is retried and a later success is still returned
#   2. a non-transient error (404) fails immediately, with no retries
#   3. a transient failure that never recovers still fails the job once
#      the bounded attempt budget is spent (no infinite retry)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
RETRY_CURL="${ROOT}/scripts/ci/retry-curl.sh"
FAKE_CURL="${ROOT}/scripts/test/fake-curl-sequence.sh"
TMPROOT="$(mktemp -d)"
trap 'rm -rf "$TMPROOT"' EXIT

FAKEBIN="${TMPROOT}/fakebin"
mkdir -p "$FAKEBIN"
ln -s "$FAKE_CURL" "${FAKEBIN}/curl"
export PATH="${FAKEBIN}:${PATH}"

PASS=0
FAIL=0
check() {
  local desc="$1" ok="$2"
  if [[ "$ok" == "true" ]]; then
    echo "  [PASS] $desc"
    PASS=$((PASS + 1))
  else
    echo "  [FAIL] $desc"
    FAIL=$((FAIL + 1))
  fi
}

run_with_sequence() {
  local sequence="$1" out="$2"
  local seq_file="${TMPROOT}/sequence-$$-${RANDOM}"
  echo "$sequence" >"$seq_file"
  FAKE_CURL_SEQUENCE_FILE="$seq_file" RETRY_CURL_BASE_DELAY_SECONDS=0 \
    "$RETRY_CURL" "https://example.invalid/fixture" "$out"
}

# 1. A transient 504 then a 200 - retry-curl.sh must retry and succeed,
#    and the downloaded body must actually land in the output file.
out1="${TMPROOT}/out1"
if run_with_sequence "504,200" "$out1" 2>"${TMPROOT}/log1"; then
  check "a 504 followed by a 200 succeeds after one retry" "true"
  check "the output file holds the successful response body" \
    "$([[ "$(cat "$out1" 2>/dev/null)" == "ok" ]] && echo true || echo false)"
else
  check "a 504 followed by a 200 succeeds after one retry" "false"
fi

# 2. A 404 must fail on the first attempt, with no retry at all.
out2="${TMPROOT}/out2"
if run_with_sequence "404,200" "$out2" 2>"${TMPROOT}/log2"; then
  check "a 404 is not retried into a false success" "false"
else
  check "a 404 is not retried into a false success" "true"
  check "a 404 fails without ever attempting a second request" \
    "$(grep -q 'giving up .* after 1 attempt' "${TMPROOT}/log2" && echo true || echo false)"
fi

# 3. A transient failure that never clears must still fail once the
#    bounded attempt budget (here, 3) is exhausted - not hang or loop forever.
out3="${TMPROOT}/out3"
seq_file3="${TMPROOT}/sequence-3"
echo "504,504,504,504,504" >"$seq_file3"
if FAKE_CURL_SEQUENCE_FILE="$seq_file3" RETRY_CURL_BASE_DELAY_SECONDS=0 \
  RETRY_CURL_MAX_ATTEMPTS=3 "$RETRY_CURL" "https://example.invalid/fixture" "$out3" 2>"${TMPROOT}/log3"; then
  check "a persistent 504 fails once the attempt budget is spent" "false"
else
  check "a persistent 504 fails once the attempt budget is spent" "true"
  check "exactly 3 attempts were made, not more" \
    "$(grep -q 'after 3 attempt(s)' "${TMPROOT}/log3" && echo true || echo false)"
fi

echo
echo "retry-curl.sh: ${PASS} passed, ${FAIL} failed"
[[ "$FAIL" -eq 0 ]]
