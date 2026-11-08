#!/usr/bin/env bash
#
# Thin wrapper around `curl -fsSL` for CI steps that download a single
# external file: retries only transient network failures (connect/DNS/TLS/
# timeout, HTTP 429, and 5xx) with bounded exponential backoff. Everything
# else - a 4xx other than 429, a bad URL, a local filesystem error - fails
# immediately on the first attempt, unretried. This script only ever wraps
# the download itself; it has no opinion on what the caller does with the
# downloaded file (a checksum check, signature verification, etc.), and
# none of that caller logic should ever be retried by proxy of retrying
# this script - call it once per file, outside of whatever it is you don't
# want silently re-run.
#
# Usage: retry-curl.sh <url> <output-file>
# Env (all optional):
#   RETRY_CURL_MAX_ATTEMPTS       default 5
#   RETRY_CURL_BASE_DELAY_SECONDS default 2 (doubles each retry: 2,4,8,16s)
#   RETRY_CURL_CONNECT_TIMEOUT    default 10 (seconds, per attempt)
#   RETRY_CURL_MAX_TIME           default 60 (seconds, per attempt)
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: retry-curl.sh <url> <output-file>" >&2
  exit 64
fi

url="$1"
out="$2"
max_attempts="${RETRY_CURL_MAX_ATTEMPTS:-5}"
base_delay="${RETRY_CURL_BASE_DELAY_SECONDS:-2}"
connect_timeout="${RETRY_CURL_CONNECT_TIMEOUT:-10}"
max_time="${RETRY_CURL_MAX_TIME:-60}"

attempt=1
while true; do
  http_code=$(curl -fsSL --proto '=https' --tlsv1.2 \
    --connect-timeout "$connect_timeout" --max-time "$max_time" \
    -w '%{http_code}' -o "$out" "$url" 2>"${out}.stderr") && curl_status=0 || curl_status=$?

  if [[ "$curl_status" -eq 0 ]]; then
    rm -f "${out}.stderr"
    exit 0
  fi

  # curl -f makes curl exit non-zero on an HTTP error response without ever
  # writing the body to $out, and -w still reports the real status code it
  # received (e.g. "504") in that case. A connection-level failure (no HTTP
  # response at all - DNS, connect, TLS, or a hung transfer) instead reports
  # "000" and is distinguished by curl's own exit code: 6 (resolve host),
  # 7 (connect), 28 (timeout), 35 (SSL connect), 52 (empty reply), 56
  # (receive failure). Both kinds are transient and retried the same way;
  # anything else (a 404, a local write failure, bad arguments, ...) is not.
  retryable=false
  case "$curl_status" in
    6 | 7 | 28 | 35 | 52 | 56) retryable=true ;;
  esac
  case "$http_code" in
    429 | 5??) retryable=true ;;
  esac

  if [[ "$retryable" != true || "$attempt" -ge "$max_attempts" ]]; then
    echo "retry-curl: giving up on $url after $attempt attempt(s) (curl exit $curl_status, http ${http_code:-none})" >&2
    cat "${out}.stderr" >&2 2>/dev/null || true
    rm -f "${out}.stderr" "$out"
    exit "$curl_status"
  fi

  delay=$((base_delay * (2 ** (attempt - 1))))
  echo "retry-curl: attempt $attempt/$max_attempts for $url failed (curl exit $curl_status, http ${http_code:-none}) - retrying in ${delay}s" >&2
  rm -f "${out}.stderr"
  sleep "$delay"
  attempt=$((attempt + 1))
done
