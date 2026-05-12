# Proposal: Flowise → Grafana Monitoring Integration

## Intent

Flowise (Flow-stable) no tiene métricas expuestas. Necesitamos habilitar Prometheus metrics y visualizarlas en Grafana para monitorear chatflows, predicciones, uso de tools, y salud del runtime Node.js en producción.

## Scope

### In Scope

-   Habilitar métricas Prometheus en Flow-stable (env vars en Railway flow env)
-   Generar API Key en Flowise para autenticación del scrape
-   Configurar scrape job en Prometheus (Railway logs env) para Flow-stable sin depender de SSH
-   Importar dashboards prebuilt de Flowise en Grafana

### Out of Scope

-   Alertas de Grafana (creación futura)
-   Métricas nodo-por-nodo dentro de flows (usar Analytics)
-   OpenTelemetry (solo Prometheus provider en esta iteración)
-   Dashboard custom más allá de los prebuilt

## Capabilities

### New Capabilities

-   `flowise-metrics`: Exposición de métricas Prometheus desde Flowise (endpoint `/api/v1/metrics`, variables `ENABLE_METRICS`, `METRICS_PROVIDER`, `METRICS_INCLUDE_NODE_METRICS`)

### Modified Capabilities

-   None

## Approach

Configuración infrastructural test-first. El plan NO depende de SSH; SSH es solo una vía rápida si funciona.

1. **Railway (flow env)**: Setear 3 env vars en Flow-stable → redeploy → endpoint métricas activo
2. **Prometheus (logs env)**: Preferir config-as-code/redeploy. Si el Prometheus existente es immutable, crear `Prometheus-Flowise` dedicado y conectar Grafana con datasource propio.
3. **Grafana (logs env)**: Importar `grafana.dashboard.app.json` y `grafana.dashboard.server.json`, reemplazando datasource UID por el datasource activo.
4. **testman verification**: Probar auth negativa/positiva del endpoint, `up{job="flowise"} == 1`, `scrape_samples_scraped > 0`, dashboard import y smoke prediction.

## Affected Areas

| Area                             | Impact   | Description                                                                              |
| -------------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| Railway → Flow-stable (flow env) | Modified | 3 nuevas env vars (`ENABLE_METRICS`, `METRICS_PROVIDER`, `METRICS_INCLUDE_NODE_METRICS`) |
| Railway → Flow-stable (flow env) | Modified | Generar 1 API Key en Flowise UI                                                          |
| Railway → Prometheus (logs env)  | Modified | Nuevo scrape job en config                                                               |
| Grafana (logs env)               | New      | 2 dashboards importados                                                                  |

## Risks

| Risk                                      | Likelihood | Mitigation                                                                              |
| ----------------------------------------- | ---------- | --------------------------------------------------------------------------------------- |
| API Key se filtra en Prometheus config    | Med        | Usar `credentials_file` en Prometheus, no hardcodear en YAML                            |
| Métricas degradan performance de Flowise  | Low        | Son métricas ligeras (contadores); `METRICS_INCLUDE_NODE_METRICS=false` si hay impacto  |
| Prometheus no alcanza Flow-stable por red | Low        | Usar target público HTTPS como baseline; private DNS solo si se verifica puerto interno |
| Railway SSH no funciona                   | Med        | No depender de SSH; usar config-as-code/redeploy o Prometheus dedicado                  |
| Dashboard IDs incorrectos post-import     | Low        | Verificar datasource UID en Grafana antes de importar                                   |

## Rollback Plan

1. Quitar las 3 env vars de Flow-stable (`railway variables delete`)
2. Eliminar el scrape job de Prometheus o borrar el Prometheus dedicado si se usó Path C
3. Los dashboards de Grafana pueden quedarse (no causan daño sin datos)

## Dependencies

-   Acceso admin a Grafana (ya disponible via MCP)
-   Acceso a Railway CLI (ya configurado, proyecto GoberAI linkeado)
-   Acceso a Flowise UI para generar API Key
-   Prometheus deployado y corriendo en Railway logs env (confirmado)

## Success Criteria

-   [ ] Flow-stable expone métricas en `https://flow-stable-flow.up.railway.app/api/v1/metrics` (200 OK con Bearer token)
-   [ ] `up{job="flowise"}` devuelve 1 en Prometheus
-   [ ] `scrape_samples_scraped{job="flowise"}` devuelve `> 0`
-   [ ] Dashboard "Flowise App Metrics" muestra datos en Grafana
-   [ ] Dashboard "Flowise Server Metrics" muestra heap/CPU/RAM en Grafana
-   [ ] Métricas persisten tras redeploy de Flow-stable
