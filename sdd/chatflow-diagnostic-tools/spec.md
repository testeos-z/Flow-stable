# Spec: Chatflow Diagnostic & Repair Tools

## Requirements

### Requirement: Diagnose Chatflow

**Description**: Tool `diagnose_chatflow` acepta un `chatflowId` y opcionalmente `fixSuggestions: boolean`. Se conecta directo a la DB de Railway, lee el flowData y retorna un reporte de campos faltantes.

**Scenarios**:

-   **Chatflow válido**: Retorna `{"status": "ok", "issues": []}`
-   **Viewport faltante**: Retorna `{"status": "warning", "issues": [{"field": "viewport", "severity": "critical", "description": "Canvas will not render"}]}`
-   **Node metadata faltante**: Retorna issues por cada nodo con campos faltantes (inputAnchors, outputAnchors, etc.)
-   **Chatflow no existe**: Retorna error
-   **DB no configurada**: Retorna error claro con instrucciones

### Requirement: Repair Chatflow

**Description**: Tool `repair_chatflow` acepta un `chatflowId`. Lee flowData de DB, aplica `fixFlowData`, y hace UPDATE directo a la DB.

**Scenarios**:

-   **Reparación exitosa**: Retorna `{"status": "repaired", "fixed_fields": ["viewport", "inputAnchors", ...]}`
-   **Ya estaba reparado**: Retorna `{"status": "ok", "message": "No repairs needed"}`
-   **Chatflow no existe**: Retorna error
-   **DB no configurada**: Retorna error claro

### Requirement: DB Connection

**Description**: La conexión a Railway PostgreSQL se configura via variables de entorno. Si no están configuradas, las tools retornan error informativo.

**Variables**:

-   `FLOWISE_DB_HOST` (required)
-   `FLOWISE_DB_PORT` (required)
-   `FLOWISE_DB_NAME` (required)
-   `FLOWISE_DB_USER` (required)
-   `FLOWISE_DB_PASSWORD` (required)
-   `FLOWISE_DB_SSL` (optional, default: false)

## Acceptance Criteria

1. `pg` agregado como dependencia
2. `chatflow-db.ts` maneja conexión con pool
3. `diagnose_chatflow` detecta viewport faltante
4. `repair_chatflow` aplica fixFlowData y UPDATE
5. Credenciales por env vars, no hardcodeadas
6. `.env.example` documenta las variables
