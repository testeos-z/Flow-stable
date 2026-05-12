# flowise-metrics Specification

## Purpose

Exposición de métricas del runtime Flowise en formato Prometheus para monitoreo vía Grafana.

## Requirements

### Requirement: Metrics Endpoint

Flowise MUST exponer un endpoint `/api/v1/metrics` en formato Prometheus cuando `ENABLE_METRICS=true`.

#### Scenario: Endpoint activo con variables correctas

-   GIVEN `ENABLE_METRICS=true` y `METRICS_PROVIDER=prometheus`
-   WHEN se consulta `GET /api/v1/metrics` con header `Authorization: Bearer <api_key>`
-   THEN el endpoint devuelve HTTP 200 con métricas en formato texto Prometheus
-   AND las métricas incluyen `flowise_chatflow_total`, `flowise_prediction_total`

#### Scenario: Endpoint rechaza sin autenticación

-   GIVEN `ENABLE_METRICS=true`
-   WHEN se consulta `GET /api/v1/metrics` SIN header Authorization
-   THEN el endpoint devuelve HTTP 401

#### Scenario: Métricas deshabilitadas por defecto

-   GIVEN `ENABLE_METRICS` no está seteado o es `false`
-   WHEN se consulta `GET /api/v1/metrics`
-   THEN el endpoint NO está disponible (404 o no expone métricas)

### Requirement: Prometheus Scrape

Prometheus MUST scrapear el endpoint de métricas de Flowise con autenticación Bearer.

#### Scenario: Scrape exitoso

-   GIVEN Prometheus configurado con `job_name: flowise`, target `flow-stable.railway.internal:3000`, y `credentials_file` válido
-   WHEN Prometheus ejecuta el scrape
-   THEN `up{job="flowise"}` devuelve 1
-   AND `scrape_samples_scraped{job="flowise"}` es mayor que 0

#### Scenario: API Key inválida

-   GIVEN Prometheus configurado con API Key incorrecta
-   WHEN Prometheus ejecuta el scrape
-   THEN `up{job="flowise"}` devuelve 0
-   AND los logs de Prometheus contienen error HTTP 401

#### Scenario: SSH no disponible no bloquea integración

-   GIVEN Railway SSH al Prometheus existente falla o queda en timeout
-   WHEN se configura Prometheus por config-as-code/redeploy o Prometheus dedicado
-   THEN Grafana puede consultar `up{job="flowise"} == 1`
-   AND la decisión queda documentada en `verify-report.md`

### Requirement: Grafana Dashboards

Grafana MUST visualizar métricas de Flowise mediante dashboards prebuilt.

#### Scenario: Datasource correcto

-   GIVEN el scrape Prometheus de Flowise está activo
-   WHEN se importan dashboards Flowise en Grafana
-   THEN todos los paneles usan `grafana_prometheus` o `grafana_prometheus_flowise`
-   AND ningún panel queda apuntando a placeholder sin resolver

#### Scenario: Dashboard App Metrics muestra datos

-   GIVEN Prometheus scrapeando Flowise exitosamente
-   WHEN se abre el dashboard "Flowise App Metrics" en Grafana
-   THEN los paneles muestran datos de chatflows y predicciones

#### Scenario: Dashboard Server Metrics muestra datos

-   GIVEN `METRICS_INCLUDE_NODE_METRICS=true`
-   WHEN se abre el dashboard "Flowise Server Metrics" en Grafana
-   THEN los paneles muestran heap, CPU y RAM de Node.js

### Requirement: Persistencia Cross-Deploy

Las métricas SHALL persistir a través de redeploys de Flowise.

#### Scenario: Métricas tras redeploy

-   GIVEN Flowise con métricas activas y sirviendo tráfico
-   WHEN se ejecuta un redeploy de Flow-stable
-   THEN el endpoint `/api/v1/metrics` vuelve a estar disponible en < 60s
-   AND Prometheus reanuda el scrape automáticamente
