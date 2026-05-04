# Design: Slice 6 — Per-node Schemas + Credential Validation

## Technical Approach

Add Layer 5 (per-node validation) after Layer 4 (category validation) in `validateNodeImpl.ts`. Create 6 per-node schema files in `schemas/nodes/` plus `schemas/credentials.ts` for UUID + provider mapping. Uses Zod strict schemas with node-specific fields: credentialNames, modelName defaults, provider-specific params (extendedThinking, reasoningEffort, etc.).

## Architecture Decisions

| Decision              | Options                                           | Tradeoff                                                                                     | Choice                                                                                                    |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| File granularity      | 1 file per node vs grouped by category            | Per-node = 8 files, high churn. Per-category = 6 files, less churn, natural grouping         | **Grouped by category (6 files)** — matches existing template layout, less file overhead                  |
| Schemas type          | `ZodObject` strict vs `(node) => FlowNodeIssue[]` | Zod = runtime type checking, less flexible. Function = same pattern as Layer 4 semanticRules | **Zod strict** — per-node params are well-defined, Zod gives better error messages + TypeScript inference |
| Credential UUID check | Regex vs `z.string().uuid()`                      | `z.string().uuid()` = Zod built-in, handles edge cases                                       | **`z.string().uuid()`** — one line, no regex maintenance                                                  |
| Provider mapping      | Static map vs dynamic MCP lookup                  | Static = simple, couples to registry. Dynamic = resilient but adds I/O in validation         | **Static map with fallback** — matches credentialNames from templates, falls back gracefully for unknown  |

## Data Flow

```
validateNode()
  Layer 1: ReactFlowNodeSchema
  Layer 2: NodeDataSchema
  Layer 3: AgentFlowNodeSchema | ChatFlowNodeSchema
  Layer 4: validateCategory(node, category)
  **Layer 5: validatePerNode(node) [NEW]**
       │
       ├── getPerNodeSchema(node.data.name)
       │       └── NODE_SCHEMA_MAP[name]
       │
       ├── Zod safeParse → errors[]
       │
       └── validateCredential(node.data.inputs.credential, node.data.name)
               ├── UUID check (z.string().uuid)
               └── provider match (CREDENTIAL_PROVIDER_MAP)
```

## File Changes

| File                                    | Action | Description                                                                 |
| --------------------------------------- | ------ | --------------------------------------------------------------------------- |
| `schemas/nodes/chatModels.ts`           | Create | Schemas for chatOpenRouter, chatOpenAI, chatAnthropic                       |
| `schemas/nodes/memory.ts`               | Create | Schema for bufferMemory                                                     |
| `schemas/nodes/embeddings.ts`           | Create | Schema for huggingFaceInferenceEmbedding                                    |
| `schemas/nodes/vectorStores.ts`         | Create | Schema for supabase                                                         |
| `schemas/nodes/tools.ts`                | Create | Schema for retrieverTool                                                    |
| `schemas/nodes/agents.ts`               | Create | Schema for toolAgent                                                        |
| `schemas/nodes/index.ts`                | Create | Re-exports + NODE_SCHEMA_MAP + validatePerNode()                            |
| `schemas/credentials.ts`                | Create | validateCredential(), validateCredentialProvider(), CREDENTIAL_PROVIDER_MAP |
| `schemas/validateNodeImpl.ts`           | Modify | Add Layer 5 call + dynamic import of nodes/nodes                            |
| `schemas/index.ts`                      | Modify | Re-export per-node + credentials public API                                 |
| `schemas/issues.ts`                     | Modify | Add CREDENTIAL_NOT_FOUND, CREDENTIAL_PROVIDER_MISMATCH                      |
| `schemas/__tests__/perNode.test.ts`     | Create | 24+ tests (3 per node × 8 nodes)                                            |
| `schemas/__tests__/credentials.test.ts` | Create | UUID validation + provider mapping tests                                    |

## Interfaces

```typescript
// schemas/credentials.ts
type CredentialProvider = 'openRouterApi' | 'openAIApi' | 'anthropicApi' | 'huggingFaceApi' | 'supabaseApi'

function validateCredential(credentialId: unknown): boolean
// true if z.string().uuid().safeParse(credentialId).success
function validateCredentialProvider(nodeName: string, credentialId: string): boolean
// looks up nodeName in CREDENTIAL_PROVIDER_MAP, checks credentialId format

// schemas/nodes/index.ts
function getPerNodeSchema(nodeName: string): ZodObject | null
export function validatePerNode(node: Record<string, unknown>): FlowNodeIssue[]
```

## Testing Strategy

| Layer       | What                        | Approach                                                                                   |
| ----------- | --------------------------- | ------------------------------------------------------------------------------------------ |
| Unit        | Each of 8 per-node schemas  | Valid node → passes, missing/empty required param → fails, extra params → ok (passthrough) |
| Unit        | Credential UUID validation  | Valid UUID → true, empty/invalid → false                                                   |
| Unit        | Credential provider mapping | chatOpenRouter → openRouterApi, unknown → graceful                                         |
| Integration | Layer 5 wiring              | Full validateNode() with per-node validation enabled                                       |

## Migration / Rollout

No migration required. Layer 5 is purely additive — unknown node names skip validation (graceful degradation). Existing tests continue passing.

## Open Questions

-   [ ] Should per-node validation be mandatory or opt-in per node name? (Design assumes mandatory for known nodes, skip unknown)
-   [ ] Credential provider mapping: static map enough, or should it be backed by MCP credential registry in future slice?
