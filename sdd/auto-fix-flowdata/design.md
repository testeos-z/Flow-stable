# Design: Auto-Fix FlowData in Chatflow Handlers

## Approach

Agregar una llamada a `fixFlowData` como middleware dentro de los handlers existentes. No se crea nueva infraestructura.

## Implementation Details

### Import

```typescript
import { fixFlowData } from './flow-validation.js'
```

### Helper interno (opcional pero DRY)

```typescript
async function validateAndFixFlowData(flowData: { nodes: unknown[]; edges: unknown[] }) {
    const result = fixFlowData(JSON.stringify(flowData))
    if (!result.valid) {
        throw new Error(`Invalid flowData: ${result.errors.map((e) => e.message).join(', ')}`)
    }
    return result.data!
}
```

### handleCreateChatflow

```typescript
const fixedFlowData = await validateAndFixFlowData(params.flowData)
const chatflow = await api.request('POST', '/chatflows', {
    name: params.name,
    flowData: JSON.stringify(fixedFlowData),
    type: params.type || 'CHATFLOW',
    chatbotConfig: params.chatbotConfig ? JSON.stringify(params.chatbotConfig) : undefined
})
```

### handleUpdateChatflow

```typescript
if (params.flowData) {
    const fixedFlowData = await validateAndFixFlowData(params.flowData)
    updateData.flowData = JSON.stringify(fixedFlowData)
}
```

## Tradeoffs

| Opción                 | Pro               | Contra                    |
| ---------------------- | ----------------- | ------------------------- |
| Helper interno         | DRY, reutilizable | Función nueva en handlers |
| Inline en cada handler | Más explícito     | Código duplicado          |

Decisión: helper interno por DRY.
