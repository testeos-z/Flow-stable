# Design: AgentFlow Validation Tools

## Technical Approach

Introduce a flow-type-aware validation pipeline. The existing `flow-validation.ts` becomes a dispatcher: given a flow type (`CHATFLOW` | `AGENTFLOW`), it selects the correct Zod schema + semantic validator. The `fixFlowData` function learns to preserve `node.type` instead of blindly injecting `customNode`.

## Architecture Decisions

### Decision: Two Zod Schemas Instead of One Union

**Choice**: `ZodChatFlowObject` and `ZodAgentFlowObject` as separate schemas, selected by flow type.
**Alternatives considered**: Single union schema with `.or()` — rejected because error messages are confusing and CHATFLOW/AGENTFLOW node sets are mutually exclusive.
**Rationale**: Separate schemas give clear, contextual error messages. A `Chain` node in an AGENTFLOW fails with "AGENTFLOW cannot contain Chain nodes" instead of a generic union parse error.

### Decision: Preserve `node.type` in `fixFlowData`

**Choice**: If `node.type` already exists, keep it. Only inject `customNode` when the field is missing.
**Alternatives considered**: Branch `fixFlowData` by flow type parameter — rejected because it requires callers to know the type upfront, which they often don't.
**Rationale**: Non-destructive fix is safer. If the input already declares `agentFlow`, trust it.

### Decision: Semantic Validation After Schema Validation

**Choice**: Schema validation (structure) runs first. If it passes, semantic validation (graph rules) runs second.
**Alternatives considered**: Merge into one Zod schema with custom refinements — rejected because graph traversals (cycle detection, reachability) are too complex for Zod refinements.
**Rationale**: Separation of concerns. Schema = "Is the JSON well-formed?" Semantics = "Does the graph make sense for this flow type?"

## Data Flow

```
Input: flowData JSON string + type ('CHATFLOW' | 'AGENTFLOW')
         │
         ▼
    ┌─────────────────┐
    │  fixFlowData()  │ ← Preserve node.type, inject missing defaults
    └────────┬────────┘
             │
             ▼
    ┌──────────────────────────┐
    │  Schema Validator        │
    │  (ZodChatFlowObject or   │
    │   ZodAgentFlowObject)    │
    └────────┬─────────────────┘
             │
      ┌──────┴──────┐
      │ Invalid     │ Valid
      ▼             ▼
   Return errors   Semantic Validator
                   (validateChatFlowSemantics
                    or validateAgentFlowSemantics)
                          │
                    ┌─────┴─────┐
                    │ Invalid   │ Valid
                    ▼           ▼
                 Return      Return valid
                 errors      + metadata
```

## File Changes

| File                                                      | Action | Description                                                                                                                                                                                  |
| --------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/flowise-mcp-server/src/flow-validation.ts`      | Modify | Add `ZodAgentFlowNode`, `ZodAgentFlowObject`, `AgentFlowNodeType` enum, `validateAgentFlowData()`, `validateAgentFlowSemantics()`, refactor `fixFlowData()` line 352 to preserve `node.type` |
| `packages/flowise-mcp-server/src/handlers.ts`             | Modify | Add `handleValidateAgentflow()`; update `handleValidateChatflow()` signature to accept `type`; update `validateAndFixFlowData()` to pass `type` or auto-detect from nodes                    |
| `packages/flowise-mcp-server/src/index.ts`                | Modify | Register `validate_agentflow` tool; update `validate_chatflow` to accept optional `type` param                                                                                               |
| `packages/flowise-mcp-server/src/flow-validation.test.ts` | Modify | Add AGENTFLOW schema tests, AGENTFLOW semantic tests, `fixFlowData` preservation test                                                                                                        |

## Interfaces / Contracts

```typescript
// flow-validation.ts

export const AgentFlowNodeType = z.enum([
    'Start',
    'Agent',
    'LLM',
    'ToolNode',
    'Condition',
    'ConditionAgent',
    'CustomFunction',
    'ExecuteFlow',
    'Loop',
    'End',
    'State',
    'HumanInput',
    'DirectReply'
])

export const ZodAgentFlowNode = ZodReactFlowNode.extend({
    type: z.literal('agentFlow'),
    data: ZodNodeData.extend({
        type: AgentFlowNodeType,
        category: z.literal('Agent Flows')
    })
})

export const ZodAgentFlowObject = ZodReactFlowObject.extend({
    nodes: z.array(ZodAgentFlowNode)
})

export function validateAgentFlowData(flowData: string): FlowValidationResult
export function validateAgentFlowSemantics(nodes: ReactFlowNode[], edges: ReactFlowEdge[]): ValidationError[]
```

```typescript
// handlers.ts

export async function handleValidateAgentflow(params: { flowData: { nodes: unknown[]; edges: unknown[] } }): Promise<ToolResponse>

// Updated signature:
export async function handleValidateChatflow(params: {
    flowData: { nodes: unknown[]; edges: unknown[] }
    type?: 'CHATFLOW' | 'MULTIAGENT' | 'ASSISTANT'
}): Promise<ToolResponse>
```

## Testing Strategy

| Layer       | What to Test                                                                                              | Approach                                 |
| ----------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Unit        | `ZodAgentFlowObject.safeParse()` with valid/invalid AGENTFLOW                                             | Vitest, inline JSON fixtures             |
| Unit        | `validateAgentFlowSemantics()` — Start count, ending nodes, Condition edges, Loop direction, Agent config | Vitest, mock nodes + edges arrays        |
| Unit        | `fixFlowData()` preserves `type: "agentFlow"`                                                             | Vitest, input with `agentFlow` type      |
| Integration | `handleValidateAgentflow()` MCP tool end-to-end                                                           | Vitest, call handler with AGENTFLOW JSON |
| Regression  | `handleValidateChatflow()` still works for CHATFLOW                                                       | Vitest, existing test suite must pass    |

## Migration / Rollout

No migration required. This is an additive change:

-   New MCP tool: `validate_agentflow`
-   Existing tool `validate_chatflow` gains optional `type` param with CHATFLOW default
-   `fixFlowData` becomes less destructive — no breaking change

## Open Questions

-   [ ] Should `validateAndFixFlowData` in `create_chatflow`/`update_chatflow` handlers auto-detect flow type from the first node, or should it receive an explicit `type` parameter?
-   [ ] Do we need to validate `agentModelConfig.modelName` against a known model list, or is any string acceptable?
