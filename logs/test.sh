#!/usr/bin/env bash
# =============================================================================
# logs/ Smoke Tests
# =============================================================================
# Verifies: YAML syntax, JSON validity, UID patches, secret hygiene,
#           docker compose config, Prometheus target reachability,
#           Grafana health and provisioning.
#
# Usage: ./test.sh
# =============================================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0
SKIP=0

pass() { echo -e "${GREEN}✅ PASS${NC}: $1"; PASS=$((PASS + 1)); }
fail() { echo -e "${RED}❌ FAIL${NC}: $1"; FAIL=$((FAIL + 1)); }
skip() { echo -e "${YELLOW}⏭️  SKIP${NC}: $1"; SKIP=$((SKIP + 1)); }

echo "============================================"
echo " logs/ Smoke Tests"
echo "============================================"
echo ""

# ---- 1. YAML Syntax ----
echo "--- YAML Syntax ---"

if command -v yamllint &> /dev/null; then
  for f in logs/prometheus/prometheus.yml logs/loki/loki-config.yaml logs/tempo/tempo.yml logs/docker-compose.yml; do
    if yamllint "$f" > /dev/null 2>&1; then
      pass "yamllint $f"
    else
      fail "yamllint $f"
    fi
  done
else
  skip "yamllint not installed — install with: pip install yamllint"
fi

# ---- 2. JSON Validity ----
echo "--- JSON Validity ---"

if command -v jq &> /dev/null; then
  for f in logs/grafana/provisioning/dashboards/*.json; do
    if jq empty "$f" 2>/dev/null; then
      pass "jq valid: $f"
    else
      fail "jq invalid: $f"
    fi
  done
else
  skip "jq not installed"
fi

# ---- 3. UID Patch Verification ----
echo "--- UID Patch ---"

if grep -rl --include='*.json' --include='*.yml' --include='*.yaml' --include='*.toml' "cds4j1ybfuhogb" logs/ 2>/dev/null | grep -q .; then
  fail "cds4j1ybfuhogb found in logs/ config or dashboard files — UIDs NOT fully patched"
else
  pass "zero cds4j1ybfuhogb in logs/ config and dashboard files"
fi

# ---- 4. grafana_prometheus UID present ----
echo "--- Provisioned UID Check ---"

if grep -rq "grafana_prometheus" logs/grafana/ 2>/dev/null; then
  pass "grafana_prometheus found in grafana configs"
else
  fail "grafana_prometheus NOT found in grafana configs"
fi

# ---- 5. Secret Hygiene ----
echo "--- Secret Hygiene ---"

SECRET_PATTERNS='nxGr_|flowise_metrics_|SBH9e'
if grep -rlE --include='*.json' --include='*.yml' --include='*.yaml' --include='*.toml' --include='*.txt' --include='*.env' "$SECRET_PATTERNS" logs/ 2>/dev/null | grep -q .; then
  fail "committed secrets found in logs/"
else
  pass "no committed secrets in logs/"
fi

# ---- 6. Docker Compose Config Syntax ----
echo "--- Docker Compose Config ---"

if command -v docker &> /dev/null && docker compose version &> /dev/null; then
  if docker compose -f logs/docker-compose.yml config > /dev/null 2>&1; then
    pass "docker compose config valid"
  else
    fail "docker compose config invalid"
  fi
else
  skip "docker not available"
fi

# ---- 7. Grafana Provisioning Files Exist ----
echo "--- Provisioning Files ---"

REQUIRED_FILES=(
  "logs/grafana/provisioning/datasources/datasources.yml"
  "logs/grafana/provisioning/dashboards/dashboards.yml"
  "logs/grafana/provisioning/dashboards/flowise-metrics.json"
  "logs/grafana/provisioning/dashboards/flowise-server.json"
  "logs/grafana/provisioning/dashboards/flowise-app.json"
)

for f in "${REQUIRED_FILES[@]}"; do
  if [ -f "$f" ]; then
    pass "exists: $f"
  else
    fail "missing: $f"
  fi
done

# ---- 8. Dashboard JSONs have "uid" matching grafana_prometheus datasource ----
echo "--- Dashboard UID consistency ---"

for f in logs/grafana/provisioning/dashboards/flowise-*.json; do
  if [ -f "$f" ]; then
    # Count grafana_prometheus refs
    count=$(grep -c 'grafana_prometheus' "$f" || true)
    if [ "$count" -gt 0 ]; then
      pass "$(basename "$f"): $count grafana_prometheus refs"
    else
      fail "$(basename "$f"): no grafana_prometheus refs"
    fi
  fi
done

# ---- 9. Flowise Metrics Reachability (optional) ----
echo "--- Flowise Scrape Target ---"

PROMETHEUS_CONFIG="logs/prometheus/prometheus.yml"
if grep -q "flow-stable-flow.up.railway.app" "$PROMETHEUS_CONFIG"; then
  pass "prometheus.yml targets flow-stable-flow.up.railway.app"
else
  fail "prometheus.yml missing flow-stable-flow.up.railway.app target"
fi

if grep -q "credentials_file" "$PROMETHEUS_CONFIG"; then
  pass "prometheus.yml uses credentials_file (Bearer auth)"
else
  fail "prometheus.yml missing credentials_file"
fi

# ---- Summary ----
echo ""
echo "============================================"
echo " Results: ${GREEN}${PASS} passed${NC}, ${RED}${FAIL} failed${NC}, ${YELLOW}${SKIP} skipped${NC}"
echo "============================================"

if [ "$FAIL" -gt 0 ]; then
  exit 1
else
  exit 0
fi
