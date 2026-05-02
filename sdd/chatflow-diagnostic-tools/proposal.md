# Proposal: Chatflow Diagnostic & Repair Tools

## Intent

El API de Flowise strippea el `viewport` de flowData al guardar (PUT/POST). Esto causa que el canvas crashee al abrir chatflows creados vía API. Scripts sueltos como `fix-education-chatflow.mjs` con credenciales hardcodeadas no son solución.

## Scope

### In Scope

-   Crear módulo `chatflow-db.ts` con conexión a Railway PostgreSQL
-   Crear handler `handleDiagnoseChatflow`: detecta campos faltantes (viewport, inputAnchors, etc.)
-   Crear handler `handleRepairChatflow`: inyecta defaults faltantes directo a DB
-   Registrar nuevas tools MCP: `diagnose_chatflow`, `repair_chatflow`
-   Variables de entorno para credenciales DB (no hardcodeadas)

### Out of Scope

-   Cambios al backend de Flowise (packages/server)
-   Migración de credenciales hardcodeadas existentes
-   UI para gestión de chatflows

## Capabilities

### New Capabilities

-   `chatflow-diagnostic`: Detecta y reporta campos faltantes en chatflows
-   `chatflow-repair`: Repara chatflows inyectando defaults directo a DB

## Approach

Crear un cliente DB de Railway separado del API de Flowise:

-   `FLOWISE_DB_HOST`, `FLOWISE_DB_PORT`, `FLOWISE_DB_NAME`, etc.
-   Queries directas a `chat_flow` table
-   `fixFlowData` existente para generar el JSON reparado
-   UPDATE directo bypass del API (evita viewport stripping)

## Affected Areas

| Area                                             | Impact   | Description                           |
| ------------------------------------------------ | -------- | ------------------------------------- |
| `packages/flowise-mcp-server/src/chatflow-db.ts` | New      | DB client + diagnostic + repair logic |
| `packages/flowise-mcp-server/src/handlers.ts`    | Modified | Add diagnose/repair handlers          |
| `packages/flowise-mcp-server/src/index.ts`       | Modified | Register new MCP tools                |
| `packages/flowise-mcp-server/.env.example`       | Modified | Add DB connection vars                |

## Risks

| Risk                             | Likelihood | Mitigation                                |
| -------------------------------- | ---------- | ----------------------------------------- |
| UPDATE directo corrompe flowData | Medium     | Validar con fixFlowData antes de UPDATE   |
| Credenciales DB expuestas        | Low        | Variables de entorno, no hardcodeadas     |
| DB credentials no configuradas   | Medium     | Tool retorna error claro si no hay config |

## Rollback Plan

Remover tools de `index.ts` y archivo `chatflow-db.ts`. No afecta tools existentes.

## Dependencies

-   `pg` (node-postgres) — agregar como dependencia
-   `fixFlowData` ya existe en `flow-validation.ts`

## Success Criteria

-   [ ] `diagnose_chatflow` reporta viewport faltante en chatflows rotos
-   [ ] `repair_chatflow` repara chatflows inyectando defaults
-   [ ] Credenciales via env vars, no hardcodeadas
-   [ ] Tests para handlers nuevos
-   [ ] Documentado en README del MCP server
