# Design: Chatflow Diagnostic & Repair Tools

## Architecture

```
MCP Tool: diagnose_chatflow  →  handleDiagnoseChatflow  →  chatflow-db.ts  →  PostgreSQL (Railway)
MCP Tool: repair_chatflow    →  handleRepairChatflow    →  chatflow-db.ts  →  PostgreSQL (Railway)
                                                                        ↓
                                                              fixFlowData (flow-validation.ts)
```

## Implementation Details

### chatflow-db.ts

```typescript
import { Pool } from 'pg'
import { fixFlowData } from './flow-validation.js'

export interface ChatflowDiagnosticResult {
    status: 'ok' | 'warning' | 'error'
    issues: Array<{ field: string; severity: 'critical' | 'warning'; description: string }>
    fixedFields?: string[]
}

export function getDbConfig() {
    // Read from env vars, throw if missing
    return { ... }
}

export async function diagnoseChatflow(chatflowId: string): Promise<ChatflowDiagnosticResult> {
    const pool = new Pool(getDbConfig())
    const row = await pool.query('SELECT id, name, "flowData" FROM "chat_flow" WHERE id = $1', [chatflowId])
    // Parse flowData, check fields, return report
}

export async function repairChatflow(chatflowId: string): Promise<ChatflowDiagnosticResult> {
    const pool = new Pool(getDbConfig())
    // SELECT → fixFlowData → UPDATE → return report
}
```

### .env.example additions

```
# Railway PostgreSQL (direct DB access for chatflow repair)
FLOWISE_DB_HOST=shinkansen.proxy.rlwy.net
FLOWISE_DB_PORT=42841
FLOWISE_DB_NAME=railway
FLOWISE_DB_USER=postgres
FLOWISE_DB_PASSWORD=
FLOWISE_DB_SSL=false
```

## Tradeoffs

| Opción           | Pro                         | Contra                        |
| ---------------- | --------------------------- | ----------------------------- |
| Pool por request | Simple, no connection leaks | Overhead de conexión cada vez |
| Pool singleton   | Reutiliza conexiones        | Requiere cleanup              |

Decisión: Pool por request para simplicity. Son calls poco frecuentes.
