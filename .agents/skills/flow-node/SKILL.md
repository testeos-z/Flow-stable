---
name: flow-node
description: |
Node JSON factory and strict validator for Flowise nodes. Supports both
AgentFlow and ChatFlow node types. Given a `FlowNodeRequest`, returns a
complete `IReactFlowNode` JSON suitable for backend execution AND UI
rendering, or fails hard if the node does not exactly satisfy the rules.

    Trigger: When `flow-ing` needs a node JSON during flow assembly. Invoked
    in parallel by `flow-ing`, one agent per node. Never called by
    `flow-architect` directly for production builds, and never interacts with
    the Flowise server/API.
license: MIT
metadata:
    version: "2.0"
    flowiseVersion: "2.2.7"
    agentFlowTemplateCount: 15
    chatFlowSupport: "MVP critical nodes"
---

# Flow-Node Factory + Validator

## Role

You are a **node JSON factory + strict validator** for Flowise nodes. Your job is to take a `FlowNodeRequest` and return a complete `IReactFlowNode` JSON that:

1. Executes correctly in the Flowise backend.
2. Renders correctly in the Flowise canvas UI.
3. Passes strict per-node schema validation.

If the requested node cannot be produced with full correctness, you **must fail hard** and return `valid: false` with structured errors. `flow-ing` depends on this contract to stop bad flows from being written to Flowise.

### Scope

-   **AgentFlow nodes**: full support via 15 ground-truth templates in `templates/`.
-   **ChatFlow nodes**: MVP support for critical nodes (`chatOpenAI`, `chatAnthropic`, `chatOpenRouter`, `bufferMemory`, embeddings, Supabase vector store, retriever tool, tool agent). Other ChatFlow nodes progressively added by category.

### Non-Responsibilities

You MUST NOT:

-   Call the Flowise server or API (`flow-ing` owns that).
-   Assemble full `flowData` (`flow-ing` owns that).
-   Validate edges, graph connectivity, or cycles (`flow-ing` owns that).
-   Run smoke or integration tests (`flow-ing` owns that).
-   Decide architecture (`flow-architect` owns that).

You handle ONE node at a time, in isolation. `flow-ing` may invoke you many times in parallel.

## Contract

### Request (from `flow-ing`)

```ts
interface FlowNodeRequest {
    flowType: 'AGENTFLOW' | 'CHATFLOW'
    nodeType: string // e.g., 'agentAgentflow', 'chatOpenRouter'
    nodeId: string // deterministic, assigned by flow-ing
    position?: { x: number; y: number }
    params?: Record<string, unknown>
    credentials?: Record<string, string> // UUIDs only
    connections?: {
        inputAnchors?: string[]
        outputAnchors?: string[]
    }
    requirements?: {
        uiRenderable?: true
        backendExecutable?: true
        toolCalling?: boolean
        streaming?: boolean
        category?: string
    }
    strict?: true // default true
}
```

Rules:

-   `flowType` is **required**. Never infer it.
-   `nodeType` must map to a known template or metadata source.
-   `nodeId` is **required**; you must substitute every `PLACEHOLDER_ID` occurrence.
-   `strict: true` by default — any hard failure returns `valid: false`.

### Response (to `flow-ing`)

```ts
interface FlowNodeResponse {
    valid: boolean
    node: IReactFlowNode | null
    errors: FlowNodeIssue[]
    warnings: FlowNodeIssue[]
    metadata: {
        flowType: 'AGENTFLOW' | 'CHATFLOW'
        nodeType: string
        source: 'static-template' | 'generated-template' | 'flowise-metadata'
        schemaVersion: string
        templateVersion?: string
    }
}

interface FlowNodeIssue {
    path: string
    code: string
    message: string
    severity: 'error' | 'warning'
}
```

**Hard rule**: if `errors.length > 0`, `node` MUST be `null`. Never return "almost correct" JSON.

## Rules

### R1: ID Substitution is Mandatory

Every template uses `PLACEHOLDER_ID` as the target for substitution. Before returning a node, substitute all ID fields:

| Field path                      | Pattern             | Example                                              |
| ------------------------------- | ------------------- | ---------------------------------------------------- |
| `node.id`                       | Full replacement    | `agentAgentflow_0` → `myAgent_2`                     |
| `node.data.id`                  | Full replacement    | Same                                                 |
| `node.data.inputParams[*].id`   | Prefix substitution | `agentAgentflow-agentModel` → `myAgent_2-agentModel` |
| `node.data.inputAnchors[*].id`  | Prefix substitution | `agentAgentflow-output` → `myAgent_2-output`         |
| `node.data.outputAnchors[*].id` | Prefix substitution | Same pattern                                         |

If any `PLACEHOLDER_ID` remains after substitution → **hard failure**.

### R2: Never Return Partial Nodes

Return the FULL `IReactFlowNode` structure or `null`. No fragments, no "best effort" nodes.

### R3: Support Both Flow Types

-   `flowType: 'AGENTFLOW'` → use templates from `templates/` (15 node types).
-   `flowType: 'CHATFLOW'` → use ChatFlow templates/metadata (MVP critical nodes first, expanding by category).

If the requested `nodeType` is not supported yet for the given `flowType`, return `valid: false` with error code `UNSUPPORTED_NODE_TYPE` and a list of currently supported types for that `flowType`.

### R4: Credential Handling

-   If the node requires a credential and `params.credential` (or `credentials` map) is missing → **warning** (not error). `flow-ing` may resolve and inject later.
-   If a credential value is provided but it's NOT a valid UUID → **hard failure** with `code: INVALID_CREDENTIAL_FORMAT`.
-   Never invent credential UUIDs.

### R5: Merge Supplied Params

If the caller supplies `params`, shallow-merge them into `node.data.inputs`. Template defaults fill in where params are absent. **Hard failure** if a required param (no `optional: true` in the template) remains empty after merge.

### R6: Strict Schema Validation

After substitution and merge, validate the node against these schemas in order:

1. `ReactFlowNodeSchema` — UI render fields.
2. `NodeDataSchema` — backend + UI metadata inside `data`.
3. `AgentFlowNodeSchema` or `ChatFlowNodeSchema` — flow-type specific.
4. Category schema (when available) — Chat Models, Tools, Memory, etc.
5. Per-node schema (when available) — for critical nodes.

Any schema error → **hard failure**.

## Validation Layers

### `ReactFlowNodeSchema` — UI render correctness

Required fields on the top-level node:

-   `id: string`
-   `position: { x: number, y: number }`
-   `positionAbsolute: { x: number, y: number }`
-   `type: 'customNode' | 'agentFlow' | string`
-   `data: object`
-   `width: number`
-   `height: number`
-   `selected: boolean`
-   `dragging: boolean`

Missing `positionAbsolute`, `width`, `height`, `selected`, or `dragging` → the Flowise canvas breaks. These are **hard errors**.

### `NodeDataSchema` — backend + UI metadata

Required fields on `data`:

-   `id: string`
-   `name: string`
-   `label: string`
-   `category: string`
-   `inputs: Record<string, unknown>`
-   `inputParams: unknown[]`
-   `inputAnchors: unknown[]`
-   `outputAnchors: unknown[]`

Empty `inputParams` on a node that should have config options → **hard error** (Flowise UI won't render the form).

### `AgentFlowNodeSchema`

-   `node.type === 'agentFlow'`
-   `data.category === 'Agent Flows'` (exception: `stickyNoteAgentflow` → `Utilities`)
-   `data.name` in the allowlist of 15 AgentFlow types
-   Anchors compatible with AgentFlow

### `ChatFlowNodeSchema`

-   `node.type === 'customNode'`
-   `data.category !== 'Agent Flows'`
-   `data.name` matches a known ChatFlow node type
-   `inputParams`, `inputAnchors`, `outputAnchors` all present
-   `data.inputs` contains defaults or required values

### Category schemas (progressive)

Priority categories:

1.  Chat Models
2.  Tools
3.  Memory
4.  Vector Stores
5.  Embeddings
6.  Agents
7.  Chains
8.  Retrievers
9.  Document Loaders

### Per-node schemas (critical nodes)

Initial set:

-   `chatOpenRouter`, `chatOpenAI`, `chatAnthropic`
-   `bufferMemory`
-   `supabase` (vector store)
-   embeddings (HuggingFace / OpenAI)
-   `retrieverTool`
-   `toolAgent`

## Auto-fix vs Hard Failure

### Auto-fixable (before validation)

-   `position` default `{ x: 0, y: 0 }`
-   `positionAbsolute` mirrors `position` if missing
-   `width` / `height` from template or category default
-   `selected: false`, `dragging: false`
-   `data.inputs: {}` if absent
-   ID substitution from `PLACEHOLDER_ID`
-   Param defaults from template

### Hard failures (after all fixes)

-   Unknown `flowType`
-   Unknown `nodeType` for the given `flowType`
-   Missing `nodeId`
-   Missing template or metadata source
-   `data.name` doesn't match node type expected value
-   Wrong `node.type` (`agentFlow` vs `customNode` mismatch)
-   Required `inputParams` missing or empty
-   Required credential missing for a node that can't run without one
-   Required backend config missing (e.g. `modelName` for a chat model)
-   Anchor shape invalid
-   `PLACEHOLDER_ID` still present after substitution
-   ChatFlow node requested without a trustworthy template/metadata source

### Warnings (allowed)

-   Optional credential empty
-   Optional params not set
-   Deprecated node version
-   Template checksum stale
-   Extra unknown but harmless field

## Process

```
Receive FlowNodeRequest
  ↓
Resolve template/metadata (static-template | generated-template | flowise-metadata)
  ↓ (unknown → valid:false, UNSUPPORTED_NODE_TYPE)
Deep-clone via structuredClone()
  ↓
Apply auto-fix defaults (position, UI flags, inputs)
  ↓
Substitute IDs (R1)
  ↓
Merge params into inputs (R5)
  ↓
Validate credential format (R4)
  ↓
Run schema layers: ReactFlowNode → NodeData → FlowType → Category → PerNode
  ↓ (any error → valid:false, node:null, errors)
Return { valid: true, node, errors: [], warnings, metadata }
```

## Parallel Invocation (from `flow-ing`)

`flow-ing` may launch multiple `flow-node` agents in parallel when nodes are independent. Each call processes exactly one node.

Example:

```ts
const requests = [
    { flowType: 'CHATFLOW', nodeType: 'chatOpenRouter', nodeId: 'chatOpenRouter_0', params: {...} },
    { flowType: 'CHATFLOW', nodeType: 'bufferMemory',   nodeId: 'bufferMemory_0',   params: {...} },
    { flowType: 'CHATFLOW', nodeType: 'toolAgent',      nodeId: 'toolAgent_0',      params: {...} }
]
```

Rules for `flow-ing`:

-   Assign all `nodeId`s **before** fan-out (so anchors and future edges stay consistent).
-   If ANY response has `valid: false` → abort flow assembly, do NOT save.
-   Edge/graph validation happens in `flow-ing` after all node responses arrive.

## Relationship with Other Agents

### `flow-architect`

-   Designs the flow topology and emits a `FlowBuildSpec` / Execution Envelope.
-   Does NOT call `flow-node` directly for production builds.
-   Delegates everything to `flow-ing`.

### `flow-ing`

-   Sole caller of `flow-node` in production.
-   Allocates IDs, fetches Flowise state, invokes `flow-node` (often in parallel), assembles `flowData`, runs final validation pipeline, saves to Flowise.

### `node-specialist-*`

-   Domain experts for chat models, embeddings, tools, vector stores, etc.
-   They decide WHICH config/model/credential to use.
-   `flow-node` produces/validates the final `IReactFlowNode` JSON structure.
-   Clean split: specialists know domain, `flow-node` knows node structure, `flow-ing` knows Flowise server.

## Supported AgentFlow Types

| #   | Type           | Template Name           | node.name               | inputParams | Category    |
| --- | -------------- | ----------------------- | ----------------------- | ----------- | ----------- |
| 1   | Agent          | agentAgentflow          | agentAgentflow          | 16          | Agent Flows |
| 2   | LLM            | llmAgentflow            | llmAgentflow            | 10          | Agent Flows |
| 3   | Start          | startAgentflow          | startAgentflow          | 7           | Agent Flows |
| 4   | Condition      | conditionAgentflow      | conditionAgentflow      | 1           | Agent Flows |
| 5   | ConditionAgent | conditionAgentAgentflow | conditionAgentAgentflow | 10          | Agent Flows |
| 6   | CustomFunction | customFunctionAgentflow | customFunctionAgentflow | 3           | Agent Flows |
| 7   | DirectReply    | directReplyAgentflow    | directReplyAgentflow    | 1           | Agent Flows |
| 8   | ExecuteFlow    | executeFlowAgentflow    | executeFlowAgentflow    | 6           | Agent Flows |
| 9   | HumanInput     | humanInputAgentflow     | humanInputAgentflow     | 5           | Agent Flows |
| 10  | HTTP           | httpAgentflow           | httpAgentflow           | 8           | Agent Flows |
| 11  | Iteration      | iterationAgentflow      | iterationAgentflow      | 1           | Agent Flows |
| 12  | Loop           | loopAgentflow           | loopAgentflow           | 4           | Agent Flows |
| 13  | Retriever      | retrieverAgentflow      | retrieverAgentflow      | 4           | Agent Flows |
| 14  | StickyNote     | stickyNoteAgentflow     | stickyNoteAgentflow     | 1           | Utilities   |
| 15  | Tool           | toolAgentflow           | toolAgentflow           | 3           | Agent Flows |

## Supported ChatFlow Types (MVP, expanding)

Current MVP set:

-   `chatOpenRouter`, `chatOpenAI`, `chatAnthropic` (Chat Models)
-   `bufferMemory` (Memory)
-   Supabase pgvector (Vector Stores)
-   HuggingFace / OpenAI embeddings
-   `retrieverTool` (Tools)
-   `toolAgent` (Agents)

Additional ChatFlow nodes are added by priority category (Chat Models → Tools → Memory → Vector Stores → Embeddings → Agents → Chains → Retrievers → Document Loaders).

For unsupported ChatFlow nodes: return `valid: false` with `code: UNSUPPORTED_NODE_TYPE` and the current supported list.

## Templates Reference

All AgentFlow templates reside in `templates/*.json` relative to this skill directory. Each file is a complete `IReactFlowNode` JSON object with `PLACEHOLDER_ID`.

Version tracking: `templates/_version.json`.

ChatFlow templates: added progressively under `templates/chatflow/` as the MVP and category phases roll out.

## Implementation Slices

The transition from "knowledge bank" to "factory + validator" ships in slices:

| Slice | Content                                                                  |
| ----- | ------------------------------------------------------------------------ |
| 1     | Contract + docs (this file, flow-ing, flow-architect)                    |
| 2     | Schemas: `ReactFlowNode`, `NodeData`, `AgentFlowNode`, `ChatFlowNode`    |
| 3     | AgentFlow strict validation on the 15 existing templates                 |
| 4     | ChatFlow MVP templates + schemas for critical nodes                      |
| 5     | Category schemas (Chat Models, Tools, Memory, Vector Stores, Embeddings) |
| 6     | Per-node schemas for critical nodes                                      |
| 7     | Full coverage generator (metadata-driven)                                |

## Schema Validation (implemented)

The validation schemas are implemented in `schemas/`:

| Schema              | File                   | Validates                                                                                                          |
| ------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| ReactFlowNodeSchema | `schemas/common.ts`    | UI render fields (`id`, `position`, `positionAbsolute`, `type`, `data`, `width`, `height`, `selected`, `dragging`) |
| NodeDataSchema      | `schemas/common.ts`    | `data.id`, `name`, `label`, `category`, `inputs`, `inputParams`, `anchors`                                         |
| AgentFlowNodeSchema | `schemas/agentflow.ts` | `node.type='agentFlow'`, category, 15-name allowlist, no `PLACEHOLDER_ID`                                          |
| ChatFlowNodeSchema  | `schemas/chatflow.ts`  | `node.type='customNode'`, not AgentFlow, 10-node MVP allowlist                                                     |

The top-level entry point is `runValidation()` in `schemas/index.ts`.

**Auto-fix happens BEFORE validation:**

-   `position` default → `{x:0, y:0}`
-   `positionAbsolute` mirrors `position` if missing
-   `width`/`height` defaults if missing
-   `selected`/`dragging` → `false` if missing
-   `data.inputs` → `{}` if missing

**Test coverage:** `schemas/__tests__/` contains unit tests for each schema file and full pipeline integration tests in `validateNode.test.ts`.

## Generator & CI Commands

### Running the Generator

```bash
# Generate all node schemas from the node catalogue
npm run generate

# Generate AND check drift in one command
npm run generate:check
```

The generator (`scripts/generate-node-schemas.ts`):

1. Reads `.agents/skills/flowise-node-reference/references/00-node-catalogue.md`
2. Reads `.agents/skills/flowise-node-reference/references/01-credential-map.md`
3. Generates 171 Zod schemas in `schemas/nodes/generated/{category}/`
4. Produces `schemas/nodes/generated/_version.json` with SHA256 checksums

### Verifying Drift

```bash
# Check if any template drifted from registered checksums
npm run check-drift
```

The drift checker compares current template checksums against `_version.json`. Exit code 1 means drift detected — templates have changed since last generation.

### CI Testing

```bash
# Run all tests (no watch mode)
npm run test:ci

# Run schema tests specifically
npm run test:ci:schemas
```

### Adding New Node Types

1. **Add to node catalogue**: Edit `.agents/skills/flowise-node-reference/references/00-node-catalogue.md`
2. **Update credential map**: Edit `.agents/skills/flowise-node-reference/references/01-credential-map.md` if the new node requires credentials
3. **Regenerate schemas**: `npm run generate`
4. **Verify no drift**: `npm run check-drift` (should exit 0)
5. **Run tests**: `npm run test:ci` (all 217+ tests should pass)

### Schema Coverage

| Category          | Hand-crafted | Generated | Total   |
| ----------------- | ------------ | --------- | ------- |
| Chat Models       | 3            | 28        | 31      |
| Memory            | 1            | 14        | 15      |
| Embeddings        | 1            | 15        | 16      |
| Vector Stores     | 1            | 22        | 23      |
| Tools             | 1            | 35        | 36      |
| Agents            | 1            | —         | 1       |
| Retrievers        | —            | 15        | 15      |
| Chains            | —            | 13        | 13      |
| Text Splitters    | —            | 6         | 6       |
| Utilities         | —            | 5         | 5       |
| Cache             | —            | 5         | 5       |
| Multi Agents      | —            | 2         | 2       |
| Sequential Agents | —            | 11        | 11      |
| **Total**         | **8**        | **171**   | **179** |

Hand-crafted schemas (`chatOpenRouter`, `chatOpenAI`, `chatAnthropic`, `bufferMemory`, `huggingFaceInferenceEmbedding`, `supabase`, `retrieverTool`, `toolAgent`) take precedence over generated ones and include full business logic (temperature ranges, required fields, etc.). Generated schemas provide credential-only validation for coverage of all 302 Flowise node types.
