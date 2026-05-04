# Design: Slice 4 — ChatFlow MVP Templates

## Technical Approach

Add 8 ChatFlow node templates under `templates/chatflow/`, a `validateChatFlowTemplate()` validator, and integrity tests. Templates are extracted from Flowise component sources (`packages/components/nodes/`) by mapping `this.*` → `data.*` and splitting `this.inputs[]` into `inputParams` (primitives) and `inputAnchors` (class connections).

## Architecture Decisions

| Decision                    | Choice                                                                  | Rationale                                                                                                         |
| --------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Directory layout            | `templates/chatflow/` subdirectory                                      | Keeps 15 AgentFlow + 8 ChatFlow templates separate; avoids name collisions and simplifies glob patterns in tests. |
| inputParams vs inputAnchors | Primitives → `inputParams`; class types → `inputAnchors`                | Matches Flowise runtime: primitives render as UI fields, class types render as connection handles.                |
| outputAnchors naming        | Derive from `baseClasses[0]` or `this.outputs[].name`                   | `baseClasses[0]` is the node's primary output type; explicit `outputs[]` handles dual-output nodes like supabase. |
| handleBounds                | Synthetic, generated from anchor counts                                 | Canvas requires `handleBounds` for rendering; autoFixNode already injects `{source:[], target:[]}`.               |
| Credential fields           | `this.credential` → first `inputParam` with `type: 'credential'`        | Preserves `optional` flag; aligns with Flowise UI pattern where credentials appear as form fields.                |
| PLACEHOLDER_ID              | Warning in `validateChatFlowTemplate()`, hard error in `validateNode()` | Templates are blueprints; production nodes must have real IDs. Same pattern as AgentFlow.                         |

## Data Flow

```
Flowise source (.ts)
    │
    ▼
Map this.* → data.*
Split inputs[] → inputParams / inputAnchors
Build outputAnchors from baseClasses/outputs[]
    │
    ▼
Template JSON (templates/chatflow/*.json)
    │
    ▼
validateChatFlowTemplate()
  ├─ autoFixNode()
  ├─ ReactFlowNodeSchema
  ├─ NodeDataSchema
  └─ ChatFlowNodeSchema (PLACEHOLDER_ID → warning)
    │
    ▼
FlowNodeResponse { valid, node, errors, warnings }
```

## File Changes

| File                                           | Action | Description                                                                                               |
| ---------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| `templates/chatflow/*.json` (8 files)          | Create | MVP node templates extracted from source.                                                                 |
| `templates/_version.json`                      | Modify | Add 8 entries with SHA256 checksums.                                                                      |
| `schemas/chatflow.ts`                          | Modify | Add `validateChatFlowTemplate()` export; remove `openaiEmbedding` and `chat Ollama` from stale allowlist. |
| `schemas/__tests__/chatflow-templates.test.ts` | Create | Integrity tests: glob, validate count, assert valid + warnings.                                           |

## Interfaces / Contracts

### validateChatFlowTemplate()

```typescript
export function validateChatFlowTemplate(request: FlowNodeRequest, template: Record<string, unknown>): FlowNodeResponse
```

Mirrors `validateTemplate()` from `agentflow.ts`:

1. `structuredClone(template)` → `autoFixNode()`
2. `ReactFlowNodeSchema.safeParse()` — hard errors
3. `NodeDataSchema.safeParse()` — hard errors
4. `ChatFlowNodeSchema.safeParse()` — filter `PLACEHOLDER_ID` issues to `warnings`
5. Explicit `node.id` / `data.id` PLACEHOLDER_ID checks → warnings

### Template Shape (bufferMemory example)

```json
{
  "id": "PLACEHOLDER_ID",
  "position": { "x": 0, "y": 0 },
  "positionAbsolute": { "x": 0, "y": 0 },
  "type": "customNode",
  "width": 320,
  "height": 200,
  "selected": false,
  "dragging": false,
  "data": {
    "id": "PLACEHOLDER_ID",
    "label": "Buffer Memory",
    "name": "bufferMemory",
    "type": "BufferMemory",
    "category": "Memory",
    "description": "Retrieve chat messages stored in database",
    "icon": "memory.svg",
    "baseClasses": ["BufferMemory", "FlowiseMemory"],
    "filePath": ".../memory/BufferMemory/BufferMemory.js",
    "inputs": {},
    "inputParams": [
      { "label": "Session Id", "name": "sessionId", "type": "string", ... },
      { "label": "Memory Key", "name": "memoryKey", "type": "string", ... }
    ],
    "inputAnchors": [],
    "outputAnchors": [
      { "id": "bufferMemory-output", "name": "bufferMemory", "label": "Buffer Memory", "type": "BufferMemory", "baseClasses": ["BufferMemory", "FlowiseMemory"] }
    ],
    "outputs": {}
  }
}
```

**Anchor ID convention**: `{nodeName}-{paramName}` for inputAnchors, `{nodeName}-output` for single-output nodes.

## Testing Strategy

| Layer       | What                         | Approach                                                                                                                                        |
| ----------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit        | `validateChatFlowTemplate()` | Same pattern as `template-integrity.test.ts`: glob `templates/chatflow/*.json`, run validator, assert `valid: true`, `errors: []`, count === 8. |
| Unit        | Missing required field       | Remove an `inputParam` from a cloned template, assert `valid: false`.                                                                           |
| Integration | `_version.json` checksums    | Load manifest, assert 8 entries exist, keys match filenames.                                                                                    |

## Migration / Rollout

No migration required. New directory and tests are additive.

## PR Split Strategy

| PR  | Content                                                                                                                                                    | Est. Lines |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| PR1 | `validateChatFlowTemplate()` + `chatflow.ts` allowlist cleanup + 4 simple templates (bufferMemory, huggingFaceInferenceEmbedding, supabase, retrieverTool) | ~380       |
| PR2 | 3 chat models (chatOpenRouter, chatOpenAI, chatAnthropic) + `_version.json`                                                                                | ~320       |
| PR3 | toolAgent + `chatflow-templates.test.ts` + `_version.json` update                                                                                          | ~200       |

## Open Questions

-   [ ] Should `openaiEmbedding` and `chat Ollama` be removed from `CHATFLOW_MVP_ALLOWLIST` now, or deferred to Slice 5? **Decision: remove now** — they are not in the 8 MVP templates and cause stale allowlist drift.
-   [ ] Supabase has dual outputs (`retriever`, `vectorStore`). Should both be in `outputAnchors`? **Decision: yes** — match `this.outputs[]` exactly.
