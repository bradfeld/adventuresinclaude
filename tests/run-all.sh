#!/bin/bash
# Run all tests for Adventures in Claude
# Usage: ./tests/run-all.sh

set -e
cd "$(dirname "$0")/.."

PASS=0
FAIL=0

run_suite() {
  local name="$1"
  local script="$2"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  $name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  if node "$script"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
  fi
}

run_suite "Theme Completeness" "tests/theme-completeness.js"
run_suite "Studio Logic" "tests/studio-logic.js"
run_suite "Build Smoke Tests" "tests/build-smoke.js"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  OVERALL: $PASS suites passed, $FAIL suites failed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit $FAIL
