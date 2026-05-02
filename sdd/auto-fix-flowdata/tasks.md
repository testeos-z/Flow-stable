# Tasks: Auto-Fix FlowData in Chatflow Handlers

-   [x] **Task 1**: Agregar import de `fixFlowData` en `handlers.ts`
-   [x] **Task 2**: Crear helper interno `validateAndFixFlowData`
-   [x] **Task 3**: Modificar `handleCreateChatflow` para usar el helper
-   [x] **Task 4**: Modificar `handleUpdateChatflow` para usar el helper
-   [x] **Task 5**: Verificar que tests siguen pasando (55/55 passing)

## Deviations

-   Fixed bug in `fixFlowData`: missing `name` and `type` defaults in node.data (required by Zod schema)
-   Fixed type error in `createDefaultNode`: cast `data: {}` to `ReactFlowNode['data']`
-   Updated tests to use `vi.mocked()` and parse flowData from API call args
