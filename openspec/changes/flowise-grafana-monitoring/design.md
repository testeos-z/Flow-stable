# Design: Flowise → Grafana Monitoring Integration

## Technical Approach

Configuración infrastructural con verificación test-first. La integración NO debe depender de SSH. El camino garantizable es: activar métricas en Flowise → validar endpoint con API key → configurar Prometheus por config-as-code/redeploy o crear un Prometheus dedicado controlado si el stack existente es immutable → conectar Grafana por datasource y dashboards.

## Architecture Decisions

| Option                                                                  | Tradeoff                                                                    | Decision                                                                                                             |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Prometheus provider** vs OpenTelemetry                                | Prometheus es más simple (3 vars), OpenTelemetry requiere collector externo | **Prometheus** — menor superficie, dashboards prebuilt listos                                                        |
| **API Key en credentials_file** vs hardcode en YAML                     | `credentials_file` permite rotación sin tocar config de Prometheus          | **credentials_file** — más seguro, pero requiere escribir archivo en volumen                                         |
| **Railway internal DNS** (`flow-stable.railway.internal`) vs public URL | internal DNS evita salir a internet, mismo proyecto                         | **Internal DNS** — menor latencia, sin CORS, ya funciona cross-environment en GoberAI                                |
| **SSH in-place** vs **config-as-code/redeploy**                         | SSH es rápido pero hoy dio timeout; config-as-code es reproducible          | **Config-as-code como camino principal**; SSH queda solo como optimización si funciona                               |
| **Modificar Prometheus existente** vs **Prometheus Flowise dedicado**   | Existente integra con datasource actual; dedicado evita tocar stack crítico | Primero intentar config-as-code del existente; si es immutable, crear Prometheus dedicado y datasource Grafana nuevo |

### Prometheus config approach

El Prometheus actual usa `MykalMachon/railway-grafana-stack`, volumen `/prometheus`, datasource Grafana `grafana_prometheus`. Como `railway ssh` dio timeout, el diseño usa una matriz de paths:

1. **Path B — preferido**: config-as-code/redeploy del Prometheus existente si podemos controlar su config.
2. **Path A — oportunista**: SSH in-place si Railway SSH funciona; validar con `promtool`, backup y reload/restart.
3. **Path C — garantizado si A/B fallan**: desplegar un Prometheus dedicado `Prometheus-Flowise` con config versionada en este repo y agregar datasource Grafana `grafana_prometheus_flowise` apuntando a `http://prometheus-flowise.railway.internal:9090`.

Scrape job esperado:

```yaml
scrape_configs:
    - job_name: 'flowise'
      metrics_path: '/api/v1/metrics'
      authorization:
          type: Bearer
          credentials_file: '/prometheus/flowise_api_key.txt'
      static_configs:
          - targets: ['flow-stable-flow.up.railway.app']
      scheme: https
```

Se prefiere URL pública HTTPS para no asumir puerto interno Railway. El dominio privado (`flow-stable.railway.internal:3000`) solo se usa si se confirma desde Prometheus.

## Data Flow

```
Flow-stable (flow env)          Prometheus* (logs env)        Grafana (logs env)
┌─────────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│ /api/v1/metrics     │ scrape  │ scrape_interval  │ query   │ Prometheus       │
│ (Prometheus format) │────────→│ 15s              │────────→│ datasource       │
│ Bearer auth         │         │                  │         │ UID: grafana_    │
│ port 3000           │         │ /prometheus/     │         │ prometheus       │
└─────────────────────┘         └──────────────────┘         └──────────────────┘
  ENABLE_METRICS=true             HTTPS public target          Dashboards:
  METRICS_PROVIDER=prometheus     flow-stable → prometheus     - App Metrics
  METRICS_INCLUDE_NODE_METRICS…   *existing or dedicated       - Server Metrics
```

## File / Config Changes

| Target                                     | Action        | Detail                                                                                    |
| ------------------------------------------ | ------------- | ----------------------------------------------------------------------------------------- |
| Railway Flow-stable vars                   | Add           | `ENABLE_METRICS=true`, `METRICS_PROVIDER=prometheus`, `METRICS_INCLUDE_NODE_METRICS=true` |
| Flowise API Keys                           | Create        | 1 API Key (read-only, nombre: `prometheus-scraper`) en Flowise UI → Authorization         |
| `metrics/prometheus/prometheus.config.yml` | Modify        | Crear variante Flowise scrape validable con `promtool`                                    |
| Prometheus existing or dedicated           | Modify/Create | Cargar scrape job `flowise` por config-as-code; SSH solo si disponible                    |
| Prometheus secret                          | Create        | API Key como archivo/secret; nunca hardcodear en repo                                     |
| Grafana datasource                         | Use/Create    | Usar `grafana_prometheus`; si Prometheus dedicado, crear `grafana_prometheus_flowise`     |
| Grafana dashboards                         | Import        | 2 dashboards desde `metrics/grafana/`, datasource UID correcto según path                 |

## Testing Strategy

| Layer         | What                                      | How                                                           |
| ------------- | ----------------------------------------- | ------------------------------------------------------------- |
| Auth negative | Endpoint bloquea sin token/token inválido | `curl -i /api/v1/metrics` → 401/403                           |
| Smoke         | Flowise expone métricas con token válido  | Prometheus text contiene `# HELP` / `# TYPE`                  |
| Config        | Prometheus config válida                  | `promtool check config prometheus.yml` antes de reload/deploy |
| Connectivity  | Prometheus scrapea Flowise                | `up{job="flowise"} == 1` vía Grafana MCP                      |
| Samples       | Prometheus recibe muestras                | `scrape_samples_scraped{job="flowise"} > 0`                   |
| E2E           | Predicción real visible                   | contador request/prediction sube o samples se mantienen > 0   |
| Dashboards    | Visualización                             | dashboards sin datasource roto ni paneles con error           |

## Rollout

1. **Fase 0**: Generar API key y ejecutar tests negativos/positivos contra `/api/v1/metrics`.
2. **Fase 1**: Activar env vars + redeploy Flow-stable; no avanzar si endpoint no emite formato Prometheus.
3. **Fase 2**: Intentar Prometheus existente por config-as-code. Si no es controlable, crear Prometheus dedicado `Prometheus-Flowise` y datasource Grafana nuevo.
4. **Fase 3**: Importar dashboards con datasource correcto.
5. **Fase 4**: Smoke E2E con predicción no destructiva + `up` + `scrape_samples_scraped`.

Rollback: eliminar vars de Flow-stable, quitar scrape job de Prometheus (o comentarlo), los dashboards pueden quedar.

## Open Questions

-   [ ] Elegir chatflow seguro/no crítico para el smoke prediction.
-   [ ] Confirmar si preferimos tocar Prometheus existente o crear Prometheus dedicado si el existente no es configurable por repo.
