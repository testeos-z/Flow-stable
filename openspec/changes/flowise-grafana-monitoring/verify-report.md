# Verification Report — flowise-grafana-monitoring

## Flowise Metrics Configuration

-   Service ID: `51327026-1a43-4778-9fcc-c40c2d005d1d`
-   Environment: `flow`
-   Verified env vars:
    -   [ ] `ENABLE_METRICS=true`
    -   [ ] `METRICS_PROVIDER=prometheus`
    -   [ ] `METRICS_INCLUDE_NODE_METRICS=true`
-   Redeploy:
    -   timestamp:
    -   deployment ID:
    -   status:
    -   health check command:
    -   health check result:

## Metrics Endpoint Auth

-   Missing token result: expected `401/403`, actual:
-   Invalid token result: expected `401/403`, actual:
-   Valid token result: expected `200` Prometheus text, actual:
-   ## Sample metric names observed:

## Prometheus Integration Path

-   Selected path: `A SSH in-place` / `B config-as-code existing Prometheus` / `C dedicated Prometheus-Flowise`
-   Why this path was selected:
-   If SSH failed:
    -   command attempted:
    -   timeout/error evidence:
    -   fallback used:
-   Config validation:
    -   command:
    -   result:
-   Reload/redeploy:
    -   command:
    -   result:

## Prometheus Queries

-   Query: `up{job="flowise"}`
    -   expected: `1`
    -   actual:
-   Query: `scrape_samples_scraped{job="flowise"}`
    -   expected: `> 0`
    -   actual:
-   Target health / last error:
    -   actual:

## Grafana Verification

-   Datasource UID: `grafana_prometheus` / `grafana_prometheus_flowise`
-   Datasource URL:
-   Datasource query health:
    -   command/API/MCP:
    -   result:
-   Dashboards imported:
    -   Flowise App:
    -   Flowise Server:
-   Datasource UID patched/resolved: yes/no
-   Broken panels: none/list

## End-to-End Smoke

-   Chatflow used:
-   Prediction command:
-   Prediction result:
-   Post-prediction metrics query:
-   Evidence that data is visible in Grafana/Prometheus:

## Final Result

-   Status: PASS / FAIL
-   Blocking issues:
-   Follow-up actions:
