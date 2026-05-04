# Exploration: Slice 4 — ChatFlow MVP Templates

## Current State

Slice 2 built Zod schema infrastructure (`ReactFlowNodeSchema`, `NodeDataSchema`, `AgentFlowNodeSchema`, `ChatFlowNodeSchema`). Slice 3 validated 15 AgentFlow templates (87 tests). Now we need **ChatFlow MVP templates** for 8 critical nodes.

The `CHATFLOW_MVP_ALLOWLIST` in `chatflow.ts` already defines the target nodes:

-   `chatOpenRouter`, `chatOpenAI`, `chatAnthropic`
-   `bufferMemory`
-   `huggingFaceInferenceEmbedding`
-   `supabase`
-   `retrieverTool`
-   `toolAgent`

**No ChatFlow templates exist today.** The `templates/` directory only contains 15 AgentFlow `.json` files.

---

## Node Structure Analysis

### Source of Truth

All node definitions live in `packages/components/nodes/`. Each node class implements `INode` from `packages/components/src/Interface.ts`. The `NodesPool` loads them at runtime, injecting `filePath` and resolving icon paths.

When Flowise serializes a ChatFlow node to JSON (e.g., marketplace flows), it produces an `IReactFlowNode` with:

-   `type: "customNode"`
-   `data.name` = node class `name`
-   `data.type` = node class `type`
-   `data.category` = real category (Chat Models, Memory, etc.)
-   `data.inputParams` = full `inputs[]` array from the node class
-   `data.inputAnchors` = inputs filtered to `type` values that are **not** primitive UI types (string/number/boolean/json/etc.) — i.e., connection points
-   `data.inputs` = current user-supplied values
-   `data.outputAnchors` = derived from `baseClasses` or explicit `outputs`

### Per-Node Field Summary

| #   | Node Name                       | Category      | `data.type`                      | Credential                 | `baseClasses` (output)                                                        | Complexity |
| --- | ------------------------------- | ------------- | -------------------------------- | -------------------------- | ----------------------------------------------------------------------------- | ---------- |
| 1   | `chatOpenRouter`                | Chat Models   | `ChatOpenRouter`                 | `openRouterApi` (optional) | `["ChatOpenRouter", "BaseChatModel", "BaseLanguageModel", "Runnable"]`        | Medium     |
| 2   | `chatOpenAI`                    | Chat Models   | `ChatOpenAI`                     | `openAIApi`                | `["ChatOpenAI", "BaseChatModel", "BaseLanguageModel", "Runnable"]`            | High       |
| 3   | `chatAnthropic`                 | Chat Models   | `ChatAnthropic`                  | `anthropicApi`             | `["ChatAnthropic", "BaseChatModel", "BaseLanguageModel", "Runnable"]`         | High       |
| 4   | `bufferMemory`                  | Memory        | `BufferMemory`                   | —                          | `["BufferMemory", "BaseChatMemory", "BaseMemory"]`                            | Low        |
| 5   | `huggingFaceInferenceEmbedding` | Embeddings    | `HuggingFaceInferenceEmbeddings` | `huggingFaceApi`           | `["HuggingFaceInferenceEmbeddings", "Embeddings"]`                            | Low        |
| 6   | `supabase`                      | Vector Stores | `Supabase`                       | `supabaseApi`              | `["Supabase", "VectorStoreRetriever", "BaseRetriever"]` + vectorStore output  | High       |
| 7   | `retrieverTool`                 | Tools         | `RetrieverTool`                  | —                          | `["RetrieverTool", "DynamicTool", "StructuredTool", "Tool", "BaseLangChain"]` | Medium     |
| 8   | `toolAgent`                     | Agents        | `AgentExecutor`                  | —                          | `["AgentExecutor", "BaseChain", "Runnable"]`                                  | High       |

### Credential Requirements

| Node                            | Credential Type  | Required?    | Field in `inputParams`                            |
| ------------------------------- | ---------------- | ------------ | ------------------------------------------------- |
| `chatOpenRouter`                | `openRouterApi`  | Optional     | `credential` (type: `credential`, optional: true) |
| `chatOpenAI`                    | `openAIApi`      | **Required** | `credential` (type: `credential`)                 |
| `chatAnthropic`                 | `anthropicApi`   | **Required** | `credential` (type: `credential`)                 |
| `huggingFaceInferenceEmbedding` | `huggingFaceApi` | **Required** | `credential` (type: `credential`)                 |
| `supabase`                      | `supabaseApi`    | **Required** | `credential` (type: `credential`)                 |
| `bufferMemory`                  | —                | —            | No credential field                               |
| `retrieverTool`                 | —                | —            | No credential field                               |
| `toolAgent`                     | —                | —            | No credential field                               |

### Key Differences: ChatFlow vs AgentFlow Node JSON

| Field               | AgentFlow                                          | ChatFlow                                                            |
| ------------------- | -------------------------------------------------- | ------------------------------------------------------------------- |
| `node.type`         | `"agentFlow"` or `"stickyNote"`                    | `"customNode"`                                                      |
| `data.category`     | `"Agent Flows"` (or `"Utilities"`)                 | Real category (Chat Models, Memory, etc.)                           |
| `data.inputParams`  | Custom agentflow params                            | Full `inputs[]` from component node                                 |
| `data.inputAnchors` | Usually empty (agentflow wires via edges metadata) | Derived from non-primitive `inputs` (e.g., `BaseChatModel`, `Tool`) |
| `data.inputs`       | `{}`                                               | `{}` or default values                                              |
| `data.baseClasses`  | `["Agent"]` etc.                                   | Full LangChain inheritance chain                                    |
| `data.filePath`     | Points to `agentflow/` subdir                      | Points to actual component `.js` path                               |
| `data.version`      | String (e.g., `"3.2"`)                             | Number-as-string or string (e.g., `"8.3"`)                          |

### What ChatFlow Nodes Have That AgentFlow Nodes Don't

1. **`data.baseClasses`** — Full output typing for canvas connections (e.g., `ChatOpenAI | BaseChatModel | BaseLanguageModel | Runnable`). AgentFlow nodes only declare `Agent`, `Tool`, etc.
2. **`data.inputAnchors`** — Connection handles for non-primitive inputs (e.g., `Cache: BaseCache`, `Tools: Tool[]`, `Memory: BaseChatMemory`). AgentFlow nodes wire via custom edge logic, not input anchors.
3. **`data.outputs`** — Some ChatFlow nodes (especially vector stores) have **options outputs** (e.g., Supabase can output `retriever` or `vectorStore`).
4. **`data.credential`** — Direct credential ID reference (present in `inputs`, but `credential` is also hoisted to `data.credential` in serialized flows).
5. **`loadMethods`** — Present on nodes with `asyncOptions` (chat models for model lists).

---

## Template Shape Recommendation

A ChatFlow template must be a **complete `IReactFlowNode`** that passes:

1. `ReactFlowNodeSchema`
2. `NodeDataSchema`
3. `ChatFlowNodeSchema`
4. `validateChatFlowSemantics()`

### Required Top-Level Fields

```json
{
  "id": "PLACEHOLDER_ID",
  "position": { "x": 0, "y": 0 },
  "positionAbsolute": { "x": 0, "y": 0 },
  "type": "customNode",
  "width": 300,
  "height": <dynamic>,
  "selected": false,
  "dragging": false,
  "data": { ... }
}
```

### Required `data` Fields

```json
{
  "id": "PLACEHOLDER_ID",
  "label": "<Human-readable label>",
  "name": "<nodeName from allowlist>",
  "type": "<Component type string>",
  "category": "<Real category>",
  "version": "<string>",
  "description": "<from component node>",
  "icon": "<resolved icon path or filename>",
  "baseClasses": ["..."],
  "filePath": "<absolute path to .js in node_modules>",
  "inputs": {},
  "inputParams": [ ... ],
  "inputAnchors": [ ... ],
  "outputAnchors": [ ... ],
  "outputs": {}
}
```

### Anchor ID Convention (from marketplace flows)

Flowise uses this pattern for anchor IDs:

-   Input: `{nodeId}-input-{paramName}-{type}`
-   Output: `{nodeId}-output-{nodeName}-{baseClasses joined with |}`

For templates, IDs can be simplified because `validateChatFlowSemantics` only checks handle **names** (not IDs) for edge validation.

### `inputParams` Structure

Each param is the full `INodeParams` object from the component node constructor, with an added `id` field:

```json
{
    "label": "Model Name",
    "name": "modelName",
    "type": "asyncOptions",
    "loadMethod": "listModels",
    "default": "gpt-4o-mini",
    "id": "chatOpenAI_0-input-modelName-asyncOptions",
    "display": true
}
```

**Important:** For ChatFlow templates, we should include the **full `inputs[]` array** from the component node definition (that's what the Flowise canvas stores). The only transformation needed is:

1. Add `id` to each param
2. Split `inputs[]` into `inputParams` (primitive params) and `inputAnchors` (connection params) OR keep them all in `inputParams` and put connection-capable ones in `inputAnchors` too.

Looking at real marketplace flows, Flowise keeps ALL params in `data.inputParams`, and additionally duplicates the connection-oriented ones into `data.inputAnchors` with slightly different shape (no `default`, `step`, etc.).

Actually, looking more carefully at `Tool Agent.json`:

-   `data.inputParams` contains params like `systemMessage`, `maxIterations`
-   `data.inputAnchors` contains connection points: `tools`, `memory`, `model`, `chatPromptTemplate`, `inputModeration`
-   Both have `id` fields

So the pattern is:

-   `inputParams` = all params where `type` is primitive UI type (string, number, boolean, options, asyncOptions, etc.) OR credential
-   `inputAnchors` = all params where `type` is a **class/type name** that can be connected (BaseChatModel, Tool, BaseChatMemory, Embeddings, etc.)

Wait, looking at `chatOpenAI` in `Tool Agent.json`:

-   `inputParams` includes `credential` (type: credential), `modelName` (asyncOptions), `temperature` (number), etc.
-   `inputAnchors` includes `cache` (type: BaseCache)

So `cache` is in `inputs[]` as `{ label: 'Cache', name: 'cache', type: 'BaseCache', optional: true }`. It appears in `inputAnchors` but NOT in `inputParams`. The `temperature` appears in `inputParams` but NOT in `inputAnchors`.

So the rule is: **a param from `inputs[]` goes into `inputAnchors` if its `type` is a non-primitive class name** (BaseCache, BaseChatModel, Tool, Embeddings, Document, etc.). It goes into `inputParams` if its `type` is a primitive UI control type (string, number, boolean, credential, asyncOptions, options, json, etc.).

### `outputAnchors` Structure

For most nodes, there's one output anchor:

```json
{
    "id": "nodeId-output-nodeName-baseClass1|baseClass2|...",
    "name": "nodeName",
    "label": "NodeLabel",
    "type": "BaseClass1 | BaseClass2 | ...",
    "description": "..."
}
```

For vector stores with dual output (e.g., Supabase), the output anchor uses `type: "options"` with nested `options` array:

```json
{
    "name": "output",
    "label": "Output",
    "type": "options",
    "options": [
        { "id": "...", "name": "retriever", "label": "Supabase Retriever", "type": "Supabase | VectorStoreRetriever | BaseRetriever" },
        { "id": "...", "name": "vectorStore", "label": "Supabase Vector Store", "type": "Supabase | SaveableVectorStore | VectorStore" }
    ],
    "default": "retriever"
}
```

---

## Strategy for Building Templates

### Option A: Extract from `packages/components/nodes/` (RECOMMENDED)

**How:** Read each node's `.ts` file, extract the `constructor()` definition:

-   `this.name`, `this.type`, `this.label`, `this.category`, `this.description`
-   `this.baseClasses`
-   `this.credential` → becomes first `inputParam`
-   `this.inputs[]` → split into `inputParams` and `inputAnchors`
-   `this.outputs[]` (if present) → becomes `outputAnchors`

**Pros:**

-   Authoritative source — matches exactly what `NodesPool` loads
-   Version is explicit in source (`this.version`)
-   No runtime Flowise needed
-   Can be scripted/automated

**Cons:**

-   Requires manual split of `inputs[]` into `inputParams` vs `inputAnchors`
-   Need to compute `filePath` (but that's deterministic: `node_modules/flowise-components/dist/nodes/{category}/{Label}/{Label}.js`)
-   Need to add `id` fields to each param

**Effort:** Medium upfront, but scriptable for future nodes.

### Option B: Copy from Existing Flowise Flows (Marketplace)

**How:** Use marketplace JSON files from `packages/server/marketplaces/chatflows/`.

**Pros:**

-   Already serialized in exact canvas format
-   `inputParams`, `inputAnchors`, `outputAnchors` already split correctly
-   `id` fields already present

**Cons:**

-   Marketplace flows may be outdated (version mismatch)
-   Not all 8 MVP nodes appear in every marketplace flow
-   Some marketplace flows contain extra non-MVP nodes
-   Node `id` values are flow-specific (e.g., `chatOpenAI_0` not generic)

**Effort:** Low per-node if found, but may need manual reconstruction for missing nodes.

### Option C: Reconstruct from MCP Tools (`flow-validation_list_nodes` / `get_node`)

**How:** Use Flowise MCP to query node metadata at runtime.

**Pros:**

-   Gets exactly what Flowise serves via API
-   Includes resolved `filePath` and icon paths

**Cons:**

-   MCP server was **unreachable** during this exploration (`Error: Unable to connect`)
-   Requires running Flowise instance
-   Returns `INode` shape, not `IReactFlowNode` shape — still need to convert

**Effort:** High due to connectivity issues and conversion step.

### Recommendation

**Use Option A (source extraction) as primary, Option B (marketplace) as validation/spot-check.**

The process per template:

1. Read the component `.ts` file
2. Map `this.*` fields to `data.*`
3. Split `this.inputs[]`:
    - Primitive types (string, number, boolean, credential, asyncOptions, options, json, code, etc.) → `inputParams`
    - Class types (BaseCache, BaseChatModel, Tool, BaseChatMemory, Embeddings, Document, etc.) → `inputAnchors`
4. Build `outputAnchors` from `this.baseClasses` (single output) or `this.outputs[]` (multi-output)
5. Generate synthetic `id` values using `PLACEHOLDER_ID` prefix (e.g., `PLACEHOLDER_ID-input-modelName-asyncOptions`)
6. Set `filePath` to the known dist path pattern
7. Wrap in ReactFlow node envelope with `type: "customNode"`

---

## Estimated Effort Per Template

| Node                            | Complexity | Why                                                                                                                      | Est. Lines |
| ------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ | ---------- |
| `bufferMemory`                  | **Low**    | No credential, 2 simple inputParams, no inputAnchors, 1 output                                                           | ~60        |
| `huggingFaceInferenceEmbedding` | **Low**    | 1 credential, 2 simple inputParams, no inputAnchors, 1 output                                                            | ~70        |
| `chatOpenRouter`                | **Medium** | 1 optional credential, ~11 inputParams, 1 inputAnchor (cache), 1 output                                                  | ~140       |
| `retrieverTool`                 | **Medium** | No credential, 4 inputParams, 1 inputAnchor (retriever), 1 output                                                        | ~90        |
| `chatOpenAI`                    | **High**   | 1 credential, ~15 inputParams with options/asyncOptions, 1 inputAnchor, 1 output, plus reasoning/tool-calling params     | ~180       |
| `chatAnthropic`                 | **High**   | 1 credential, ~12 inputParams with thinking options, 1 inputAnchor, 1 output                                             | ~160       |
| `supabase`                      | **High**   | 1 credential, 8 inputParams, 2 inputAnchors (document, embeddings), dual output (retriever/vectorStore), plus MMR params | ~170       |
| `toolAgent`                     | **High**   | No credential, 3 inputParams, 5 inputAnchors (tools, memory, model, chatPromptTemplate, inputModeration), 1 output       | ~150       |

**Total estimated template JSON lines:** ~1,020 lines across 8 files.

**Test effort:** Following Slice 3 pattern, ~8-10 tests per template = ~70 tests.

---

## Template Location

**Recommended:** `.agents/skills/flow-node/templates/chatflow/`

**Rationale:**

-   Keeps ChatFlow templates separate from AgentFlow templates
-   Mirrors the `schemas/chatflow.ts` / `schemas/agentflow.ts` split
-   Easy to glob for integrity tests: `templates/chatflow/*.json`
-   Version manifest can be `templates/chatflow/_version.json`

Alternative: `templates/chatflow-*.{nodeName}.json` in existing `templates/` dir. **Not recommended** — mixing flow types in one dir breaks clear separation and complicates test globbing.

---

## What a ChatFlow Template Integrity Test Should Look Like

Following the Slice 3 pattern in `template-integrity.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { ChatFlowNodeSchema, validateChatFlowSemantics } from '../chatflow.js'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('ChatFlow Template Integrity', () => {
    const templatesDir = join(__dirname, '../../templates/chatflow')
    const templateFiles = readdirSync(templatesDir).filter((f) => f.endsWith('.json') && !f.startsWith('_'))

    templateFiles.forEach((file) => {
        it(`template ${file} passes ChatFlowNodeSchema`, () => {
            const template = JSON.parse(readFileSync(join(templatesDir, file), 'utf-8'))
            const result = ChatFlowNodeSchema.safeParse(template)
            expect(result.success).toBe(true)
        })

        it(`template ${file} passes validateChatFlowSemantics`, () => {
            const template = JSON.parse(readFileSync(join(templatesDir, file), 'utf-8'))
            const issues = validateChatFlowSemantics({ nodes: [template], edges: [] })
            expect(issues).toHaveLength(0)
        })
    })

    it('all 8 ChatFlow MVP templates are tested', () => {
        expect(templateFiles.length).toBe(8)
    })
})
```

**Note:** Unlike AgentFlow templates, ChatFlow templates **must NOT contain `PLACEHOLDER_ID`** — `ChatFlowNodeSchema` has a hard `.refine()` that rejects it. This means ChatFlow templates need a different validation wrapper than AgentFlow, or the integrity test must pre-process the template (replace `PLACEHOLDER_ID` before validation).

Actually, looking again at `validateNode()` in `validateNodeImpl.ts`, `PLACEHOLDER_ID` is a **hard failure** for both flow types. But `template-integrity.test.ts` uses `validateTemplate()` from `agentflow.ts` which may have special handling. Let me check...

Looking at `agentflow.ts` offset 101+, `validateTemplate` likely exists there. Regardless, for ChatFlow templates we should either:

1. Generate templates with real-looking IDs (e.g., `chatOpenRouter_0`) and no `PLACEHOLDER_ID`, OR
2. Use a test helper that substitutes IDs before validation.

**Recommendation:** Use `PLACEHOLDER_ID` in templates (consistent with AgentFlow convention) but create a `validateChatFlowTemplate()` helper that swaps IDs before calling `ChatFlowNodeSchema.safeParse()`.

---

## Risks

1. **Version drift:** Flowise component nodes get updated (e.g., `chatOpenAI` is at v8.3 in source but marketplace shows v8.2). Templates need a `_version.json` manifest with checksums, just like AgentFlow.
2. **Anchor naming mismatch:** Edge validation in `validateChatFlowSemantics` checks that `sourceHandle` and `targetHandle` match anchor `name` values. If templates use generic names vs. flow-specific names, edges from actual flows may fail validation.
3. **Credential fields:** ChatFlow nodes have `credential` in `inputParams` AND a top-level `data.credential` field when serialized from a real flow. The template must match the expected shape for credential binding.
4. **Optional vs required credential:** `chatOpenRouter` has `optional: true` on its credential. The template must preserve this so validation doesn't fail when no credential is bound.
5. **`filePath` portability:** Absolute paths like `/usr/src/flowise/packages/server/node_modules/...` won't exist in all environments. Templates should use relative or placeholder paths, but the schema allows `filePath` to be optional.

---

## Ready for Proposal?

**Yes.** The exploration is complete. The orchestrator should proceed to `sdd-propose` for `slice4-chatflow-templates` with the following scope:

-   Create 8 ChatFlow node template JSON files in `.agents/skills/flow-node/templates/chatflow/`
-   Create `_version.json` manifest with checksums
-   Add `validateChatFlowTemplate()` helper (if needed for PLACEHOLDER_ID handling)
-   Add template integrity tests (~70 tests) in `schemas/__tests__/chatflow-templates.test.ts`
-   Update `CHATFLOW_MVP_ALLOWLIST` if any node names need adjustment

**Next recommended phase:** `sdd-propose`
