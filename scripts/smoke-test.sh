#!/usr/bin/env bash
#
# End-to-end smoke test for a RUNNING TrueSkill HRMS backend.
# Exercises health, registration, login, refresh-token ROTATION,
# reuse detection, and logout revocation against the live API.
#
# Usage:
#   BASE_URL=https://your-host/api/v1 ./scripts/smoke-test.sh
#   ./scripts/smoke-test.sh http://localhost:4000/api/v1
#
# Requires: bash, curl, node (already on the backend host).

set -u
BASE="${1:-${BASE_URL:-http://localhost:4000/api/v1}}"
EMAIL="smoke+$(date +%s)@example.com"
PASS="Passw0rd@123"
pass=0; fail=0

j() { node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const o=JSON.parse(s);const v=process.argv[1].split('.').reduce((a,k)=>a&&a[k],o);process.stdout.write(v==null?'':String(v))}catch(e){}})" "$1"; }
check() { if [ "$1" = "$2" ]; then echo "  PASS  $3 (got $1)"; pass=$((pass+1)); else echo "  FAIL  $3 (expected $2, got $1)"; fail=$((fail+1)); fi; }

echo "Target: $BASE"
echo

echo "1) Health"
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/health")
check "$code" "200" "GET /health"

echo "2) Register"
reg=$(curl -s -w '\n%{http_code}' -H 'Content-Type: application/json' \
  -d "{\"fullName\":\"Smoke Test\",\"email\":\"$EMAIL\",\"phone\":\"+91 9000000000\",\"password\":\"$PASS\"}" \
  "$BASE/auth/register")
check "$(echo "$reg" | tail -1)" "201" "POST /auth/register"

echo "3) Login"
login=$(curl -s -H 'Content-Type: application/json' \
  -d "{\"identifier\":\"$EMAIL\",\"password\":\"$PASS\"}" "$BASE/auth/login")
access=$(echo "$login" | j data.accessToken)
refresh=$(echo "$login" | j data.refreshToken)
[ -n "$access" ] && check "ok" "ok" "login returned access token" || check "missing" "ok" "login returned access token"
[ -n "$refresh" ] && check "ok" "ok" "login returned refresh token" || check "missing" "ok" "login returned refresh token"

echo "4) Authenticated /me"
code=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $access" "$BASE/me")
check "$code" "200" "GET /me with access token"

echo "4b) Onboarding gate (server-side): employee features locked until ACTIVE"
code=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $access" "$BASE/leaves")
check "$code" "403" "GET /leaves before activation -> 403"
code=$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $access" "$BASE/documents")
check "$code" "200" "GET /documents allowed during onboarding -> 200"

echo "5) Refresh ROTATES the token"
ref=$(curl -s -H 'Content-Type: application/json' -d "{\"refreshToken\":\"$refresh\"}" "$BASE/auth/refresh")
refresh2=$(echo "$ref" | j data.refreshToken)
if [ -n "$refresh2" ] && [ "$refresh2" != "$refresh" ]; then check "rotated" "rotated" "refresh returns a NEW token"; else check "same/none" "rotated" "refresh returns a NEW token"; fi

echo "6) Reusing the OLD refresh token is rejected"
code=$(curl -s -o /dev/null -w '%{http_code}' -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$refresh\"}" "$BASE/auth/refresh")
check "$code" "401" "reuse of rotated token -> 401"

echo "7) Logout revokes the active token"
curl -s -o /dev/null -H 'Content-Type: application/json' -d "{\"refreshToken\":\"$refresh2\"}" "$BASE/auth/logout"
code=$(curl -s -o /dev/null -w '%{http_code}' -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$refresh2\"}" "$BASE/auth/refresh")
check "$code" "401" "refresh after logout -> 401"

echo "8) Admin route blocked for unauthenticated"
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/admin/summary")
check "$code" "401" "GET /admin/summary without token -> 401"

echo
echo "==== $pass passed, $fail failed ===="
[ "$fail" -eq 0 ] && echo "Smoke test PASSED" || { echo "Smoke test FAILED"; exit 1; }
