# logs/ — Grafana Observability Stack

Prometheus, Grafana, Loki, and Tempo — infrastructure-as-code, deployed via Railway config-as-code.

## Services

| Service        | Port           | Purpose                                                                       |
| -------------- | -------------- | ----------------------------------------------------------------------------- |
| **Prometheus** | 9090           | Scrapes Flowise metrics from `flow-stable-flow.up.railway.app/api/v1/metrics` |
| **Grafana**    | 3000           | Dashboards with auto-provisioned datasources (Prometheus, Loki, Tempo)        |
| **Loki**       | 3100           | Log aggregation (future: Flowise log ingestion)                               |
| **Tempo**      | 3200/4317/4318 | Distributed tracing (OTLP gRPC + HTTP)                                        |

## Quick Start (Local)

```bash
# Copy env template and fill in values
cp .env.example .env

# Start the full stack
docker compose up -d

# Verify
./test.sh
```

## Railway Deployment

Each service has its own `railway.toml` for config-as-code deployment:

1. Create a Railway project (if needed)
2. Create one service per subdirectory (prometheus, grafana, loki, tempo)
3. Set each service's "Config File Path" to its `railway.toml`:
    - `logs/prometheus/railway.toml`
    - `logs/grafana/railway.toml`
    - `logs/loki/railway.toml`
    - `logs/tempo/railway.toml`
4. Set required environment variables in Railway dashboard:
    - `FLOWISE_METRICS_API_KEY` — Flowise API key for Prometheus scrape auth
    - `GF_SECURITY_ADMIN_USER` / `GF_SECURITY_ADMIN_PASSWORD` — Grafana admin
    - `LOKI_INTERNAL_URL`, `PROMETHEUS_INTERNAL_URL`, `TEMPO_INTERNAL_URL` — internal service URLs
5. Deploy each service

## Dashboard Auto-Provisioning

Grafana automatically imports dashboards from `provisioning/dashboards/`:

-   **Flowise Metrics** — Version, memory, CPU, event loop lag, HTTP request rate
-   **FlowiseAI Server** — Node.js prometheus client metrics (CPU, memory, heap, event loop)
-   **FlowiseAI App** — Application-level metrics (throughput, error rate, response time)

Datasources (Prometheus, Loki, Tempo) are auto-provisioned from `provisioning/datasources/`.

## Security

-   **NO secrets are committed** — `.env.example` documents required vars, `.gitignore` blocks `*.key`, `*_token`, and `secrets/`
-   Prometheus uses `credentials_file` pattern — API key mounted at `/run/secrets/flowise_api_key`
-   The old committed `metrics/prometheus/flowise_api_key.txt` has been rotated and deleted

## Directory Structure

```
logs/
├── README.md
├── .gitignore
├── .env.example
├── docker-compose.yml
├── test.sh
├── prometheus/
│   ├── Dockerfile
│   ├── prometheus.yml
│   └── railway.toml
├── loki/
│   ├── Dockerfile
│   ├── loki-config.yaml
│   └── railway.toml
├── tempo/
│   ├── Dockerfile
│   ├── tempo.yml
│   └── railway.toml
└── grafana/
    ├── Dockerfile
    ├── railway.toml
    └── provisioning/
        ├── datasources/
        │   └── datasources.yml
        └── dashboards/
            ├── dashboards.yml
            ├── flowise-metrics.json
            ├── flowise-server.json
            └── flowise-app.json
```
