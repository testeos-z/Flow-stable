# Spec: Auto-Fix FlowData in Chatflow Handlers

## Requirements

### Requirement: Create Chatflow Auto-Fix

**Description**: Cuando se llama a `handleCreateChatflow`, se DEBE aplicar `fixFlowData` al flowData antes de enviar al backend de Flowise.

**Scenarios**:

-   **Valid flowData**: `fixFlowData` retorna `valid: true`. Se usa `fixedFlowData.data` como payload.
-   **Fixable flowData**: `fixFlowData` retorna `valid: true, fixed: true`. Se usa `fixedFlowData.data` (con defaults inyectados).
-   **Unfixable flowData**: `fixFlowData` retorna `valid: false`. Se retorna errorResponse con mensajes.

### Requirement: Update Chatflow Auto-Fix

**Description**: Cuando se llama a `handleUpdateChatflow` con flowData, se DEBE aplicar `fixFlowData` antes de enviar al backend.

**Scenarios**:

-   **Con flowData**: Mismos escenarios que create.
-   **Sin flowData** (solo nombre/config): Se omite la validación (comportamiento actual).

### Requirement: Error Handling

**Description**: Si `fixFlowData` falla, el handler DEBE retornar un error claro con la lista de problemas.

## Acceptance Criteria

1. `fixFlowData` se importa desde `./flow-validation.js`
2. `handleCreateChatflow` llama a `fixFlowData` antes del POST
3. `handleUpdateChatflow` llama a `fixFlowData` antes del PUT (solo si hay flowData)
4. Error messages incluyen todos los `errors` del resultado de validación
5. Tests existentes siguen pasando
