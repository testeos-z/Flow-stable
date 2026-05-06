# A2A Schema Reference

All A2A data types are defined as Zod schemas in `packages/components/src/A2AStorageAdapter.ts`.

## AgentCard

```typescript
AgentCardSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(128),
    description: z.string().max(1024),
    capabilities: z.array(z.string()),
    mcpEndpoints: z.array(z.string().url()).optional().default([]),
    artifactTypes: z.array(z.string()).optional().default([]),
    ownerId: z.string().uuid(),
    status: z.enum(['active', 'idle', 'offline']),
    metadata: z.record(z.unknown()).optional().default({})
})
```

## A2ATask

```typescript
A2ATaskSchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(256),
    description: z.string().max(4096),
    status: z.enum(['submitted', 'working', 'completed', 'failed', 'canceled']),
    requesterId: z.string().uuid(),
    assigneeId: z.string().uuid().optional(),
    artifactIds: z.array(z.string().uuid()).optional().default([]),
    sessionId: z.string().uuid().optional(),
    result: z.unknown().optional(),
    error: z.string().optional(),
    metadata: z.record(z.unknown()).optional().default({})
})
```

## Task State Machine

```
submitted → working → completed/failed/canceled
```

**Valid transitions:**

-   submitted → working, canceled
-   working → completed, failed, canceled

**Terminal states:** completed, failed, canceled

## A2AMessage

```typescript
A2AMessageSchema = z.object({
    id: z.string().uuid(),
    taskId: z.string().uuid(),
    senderId: z.string().uuid(),
    content: z.string().max(32768),
    role: z.enum(['instruction', 'query', 'response', 'status', 'error']),
    timestamp: z.string().datetime()
})
```

## A2AArtifact

```typescript
A2AArtifactSchema = z.object({
    id: z.string().uuid(),
    taskId: z.string().uuid().optional(),
    name: z.string().min(1).max(256),
    type: z.string(),
    content: z.unknown(),
    ownerId: z.string().uuid(),
    permissions: z
        .record(z.enum(['read', 'write', 'admin']))
        .optional()
        .default({})
})
```

**Permission levels:** read, write, admin (admin can re-grant with audit trail).

## A2ASession / A2AClaim / A2ADecision / A2AObservation

See `packages/components/src/A2AStorageAdapter.ts` for full schema definitions.
