# Tasks: Flowise → Grafana Monitoring Integration

## Review Workload Forecast

| Field                   | Value                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| Estimated changed lines | ~80-150 (config + verify docs; more if dedicated Prometheus service is needed) |
| 400-line budget risk    | Low                                                                            |
| Chained PRs recommended | No                                                                             |
| Suggested split         | Single PR                                                                      |
| Delivery strategy       | exception-ok                                                                   |
| Chain strategy          | pending                                                                        |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 0: Preflight testman — no avanzar a ciegas

-   [ ] 0.1 Confirmar datasource Grafana `grafana_prometheus` responde con query `up` vía Grafana MCP.
-   [ ] 0.2 Confirmar si el Prometheus existente es configurable por repo/config-as-code; NO depender de SSH para aceptar el plan.
-   [ ] 0.3 Seleccionar chatflow seguro/no crítico para smoke prediction E2E.

## Phase 1: Activar métricas en Flowise (Railway flow env)

-   [ ] 1.1 Setear `ENABLE_METRICS=true` en Flow-stable (`railway variables set`)
-   [ ] 1.2 Setear `METRICS_PROVIDER=prometheus` en Flow-stable
-   [ ] 1.3 Setear `METRICS_INCLUDE_NODE_METRICS=true` en Flow-stable
-   [ ] 1.4 Redeploy Flow-stable (`railway up` o `railway redeploy`)
-   [ ] 1.5 Verificar auth negativa: sin token y token inválido contra `/api/v1/metrics` devuelven 401/403.
-   [ ] 1.6 Verificar auth positiva: token válido devuelve Prometheus text (`# HELP`, `# TYPE`, métricas `flowise|nodejs|process|http`).

## Phase 2: Generar API Key en Flowise

-   [ ] 2.1 Acceder a Flowise UI → API Keys → generar key `prometheus-scraper` (read-only)
-   [ ] 2.2 Guardar key como secret para Prometheus (`FLOWISE_API_KEY`) o archivo `credentials_file`; nunca hardcodear en YAML versionado.

## Phase 3: Configurar Prometheus con fallback garantizado (Railway logs env)

-   [ ] 3.1 Path B preferido: crear/actualizar config-as-code de Prometheus con job `flowise`, target `flow-stable-flow.up.railway.app`, `scheme: https`, `metrics_path: /api/v1/metrics`, y Bearer auth.
-   [ ] 3.2 Validar config antes de deploy/reload con `promtool check config`.
-   [ ] 3.3 Si el Prometheus existente no es configurable sin SSH, crear servicio dedicado `Prometheus-Flowise` con config versionada y secret `FLOWISE_API_KEY`.
-   [ ] 3.4 Si se usa Prometheus dedicado, crear datasource Grafana `grafana_prometheus_flowise` apuntando a `http://prometheus-flowise.railway.internal:9090`.
-   [ ] 3.5 Path A opcional: si Railway SSH funciona, editar in-place con backup, validar con `promtool`, reload/restart; documentar evidencia.
-   [ ] 3.6 Verificar `up{job="flowise"} == 1` vía Grafana MCP/Explore.
-   [ ] 3.7 Verificar `scrape_samples_scraped{job="flowise"} > 0` vía Grafana MCP/Explore.

## Phase 4: Importar dashboards en Grafana

-   [ ] 4.1 Obtener `grafana.dashboard.app.json` desde [Flowise repo metrics/](https://github.com/FlowiseAI/Flowise/blob/main/metrics/grafana/grafana.dashboard.app.json.txt)
-   [ ] 4.2 Reemplazar datasource UID en el JSON por `grafana_prometheus` o `grafana_prometheus_flowise` según path elegido
-   [ ] 4.3 Importar dashboard "Flowise App Metrics" en Grafana
-   [ ] 4.4 Obtener `grafana.dashboard.server.json` desde [Flowise repo metrics/](https://github.com/FlowiseAI/Flowise/blob/main/metrics/grafana/grafana.dashboard.server.json.txt)
-   [ ] 4.5 Importar dashboard "Flowise Server Metrics"
-   [ ] 4.6 Verificar que ambos dashboards muestran datos (requiere tráfico previo en Flowise)

## Phase 5: Verificación y smoke tests

-   [ ] 5.1 Ejecutar un prediction no destructivo en el chatflow seguro seleccionado.
-   [ ] 5.2 Descubrir nombres reales desde `/api/v1/metrics` (`prediction|chatflow|flowise|request|http`) antes de asumir counters.
-   [ ] 5.3 Confirmar `up{job="flowise"} == 1` y `scrape_samples_scraped{job="flowise"} > 0` después de 1-2 intervalos de scrape.
-   [ ] 5.4 Si existe contador request/prediction, confirmar que aumenta con `increase(<metric>[5m]) > 0`.
-   [ ] 5.5 Confirmar paneles de ambos dashboards sin datasource roto ni errores de query.
-   [ ] 5.6 Crear `verify-report.md` con path elegido (A/B/C), comandos, outputs, queries Prometheus, dashboards y blockers.
