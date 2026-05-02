# Proposal: Auto-Fix FlowData in Chatflow Handlers

## Intent

Chatflows creados/actualizados vía API del MCP server crashean el canvas de Flowise porque falta metadata esencial (`inputAnchors`, `outputAnchors`, etc.). La función `fixFlowData` ya existe en `flow-validation.ts` pero no se aplica antes de enviar al backend.

## Scope

### In Scope

-   Modificar `handleCreateChatflow` para auto-aplicar `fixFlowData` antes del POST
-   Modificar `handleUpdateChatflow` para auto-aplicar `fixFlowData` antes del PUT
-   Agregar import de `fixFlowData` en `handlers.ts`

### Out of Scope

-   Cambios al server de Flowise (`packages/server`)
-   Modificaciones al schema Zod
-   Nuevas funciones de validación

## Capabilities

### Modified Capabilities

-   `chatflow-creation`: Ahora valida y auto-fixea flowData antes de enviar al backend
-   `chatflow-update`: Ahora valida y auto-fixea flowData antes de enviar al backend

## Approach

Inyectar llamada a `fixFlowData(JSON.stringify(params.flowData))` antes de cada request:

1. Si `valid: true` → usar `fixedFlowData.data`
2. Si `valid: false` → throw error con mensajes

Esto asegura que NUNCA se envíe flowData incompleto.

## Affected Areas

| Area                                          | Impact   | Description                                 |
| --------------------------------------------- | -------- | ------------------------------------------- |
| `packages/flowise-mcp-server/src/handlers.ts` | Modified | Import fixFlowData + apply en create/update |

## Risks

| Risk                                 | Likelihood | Mitigation                                |
| ------------------------------------ | ---------- | ----------------------------------------- |
| fixFlowData modifica datos válidos   | Low        | Solo inyecta defaults en campos faltantes |
| Error en validación bloquea creación | Medium     | Error message claro con lista de issues   |

## Rollback Plan

Revertir commit de `handlers.ts`. Los handlers vuelven a mandar raw flowData.

## Dependencies

-   `fixFlowData` ya existe en `packages/flowise-mcp-server/src/flow-validation.ts`
-   Tests ya existen en `flow-validation.test.ts` (55 tests passing)

## Success Criteria

-   [ ] `handleCreateChatflow` aplica fixFlowData antes de POST
-   [ ] `handleUpdateChatflow` aplica fixFlowData antes de PUT
-   [ ] FlowData incompleto se auto-completa con defaults
-   [ ] Tests existentes siguen pasando
