# Technical Design: Flow-Node Strict Validation

**Change**: `flow-node-validation`  
**Artifact store**: hybrid (`openspec/changes/flow-node-validation/design.md` + Engram `sdd/flow-node-validation/design`)  
**Version**: 1.0  
**Status**: draft

---

## 1. Goal

Implement the Zod schema layers described in SKILL.md v2.0 R6 that let `flow-node` validate every `IReactFlowNode` JSON before returning it to `flow-ing`. Schemas live in `.agents/skills/flow-node/schemas/` as TypeScript files loaded at runtime by the `flow-node` agent. This is Slice 2 of the proposal.

---

## 2. File Structure

```
.agents/skills/flow-node/
  schemas/
    index.ts           # re-exports all schemas + top-level runValidation()
    common.ts          # ReactFlowNodeSchema + NodeDataSchema
    agentflow.ts       # AgentFlowNodeSchema
    chatflow.ts        # ChatFlowNodeSchema
    issues.ts          # FlowNodeIssue type + error codes
    __tests__/
      common.test.ts
      agentflow.test.ts
      chatflow.test.ts
  templates/           # existing JSON templates (15 AgentFlow)
  SKILL.md
```

**Design decision**: schemas live inside the skill directory (not a shared package) because they're agent-local and must be colocated with the templates for checksum-referenced validation.

---

## 3. Error Codes (`issues.ts`)

All error codes are exported as constants so `flow-node` agents and test assertions can reference them without string literals.

```ts
// .agents/skills/flow-node/schemas/issues.ts

export const ErrorCodes = {
    // Hard failures
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    PLACEHOLDER_ID_REMAINING: 'PLACEHOLDER_ID_REMAINING',
    INVALID_CREDENTIAL_FORMAT: 'INVALID_CREDENTIAL_FORMAT',
    UNSUPPORTED_NODE_TYPE: 'UNSUPPORTED_NODE_TYPE',
    WRONG_FLOW_TYPE: 'WRONG_FLOW_TYPE',
    EMPTY_REQUIRED_PARAM: 'EMPTY_REQUIRED_PARAM',
    MISSING_MODEL_NAME: 'MISSING_MODEL_NAME',
    INVALID_ANCHOR_SHAPE: 'INVALID_ANCHOR_SHAPE',
    UNKNOWN_NODE_NAME: 'UNKNOWN_NODE_NAME',

    // Warnings
    STALE_CHECKSUM: 'STALE_CHECKSUM',
    MISSING_OPTIONAL_CREDENTIAL: 'MISSING_OPTIONAL_CREDENTIAL',
    EXTRA_UNKNOWN_FIELD: 'EXTRA_UNKNOWN_FIELD',
    DEPRECATED_VERSION: 'DEPRECATED_VERSION'
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

export interface FlowNodeIssue {
    path: string // e.g., "data.inputParams[0].name"
    code: string // e.g., "MISSING_REQUIRED_PARAM"
    message: string
    severity: 'error' | 'warning'
}
```

---

## 4. Schema Definitions

### 4.1 `common.ts` — `ReactFlowNodeSchema` + `NodeDataSchema`

#### `ReactFlowNodeSchema`

Two-phase design: **auto-fix pass** then **validate pass**.

**Auto-fix** (applied in order):

1. Missing `id` → hard failure (id is required input, never auto-generated)
2. Missing `position` → default `{ x: 0, y: 0 }`
3. Missing `positionAbsolute` → copy from `position`
4. Missing `width` → default `320`
5. Missing `height` → default `200`
6. Missing `selected` → default `false`
7. Missing `dragging` → default `false`
8. `type` missing → hard failure (type is required to route the flow)

**Validate** (strict after auto-fix):

-   `id`: non-empty string, no `PLACEHOLDER_ID`
-   `position`: `{ x: number, y: number }`
-   `positionAbsolute`: `{ x: number, y: number }` (now required because canvas breaks without it)
-   `type`: union of known node types (`'agentFlow' | 'customNode' | string` — we allow any string here, the flow-type schemas are more restrictive)
-   `data`: `NodeDataSchema`
-   `width`: `number > 0`
-   `height`: `number > 0`
-   `selected`: `boolean`
-   `dragging`: `boolean`

```ts
// .agents/skills/flow-node/schemas/common.ts

import { z } from 'zod'
import { FlowNodeIssue, ErrorCodes } from './issues.js'

// -----------------------------------------------
// Position
// -----------------------------------------------

export const PositionSchema = z.object({
    x: z.number(),
    y: z.number()
})

// -----------------------------------------------
// ReactFlowNodeSchema
// -----------------------------------------------

export interface AutoFixResult {
    node: Record<string, unknown>
    fixes: FlowNodeIssue[]
}

/**
 * Phase 1: Auto-fix fixable fields in-place.
 * Returns the mutated node and a list of fixes applied.
 */
export function autoFixNode(node: Record<string, unknown>): AutoFixResult {
    const fixes: FlowNodeIssue[] = []

    // position
    if (!node.position) {
        node.position = { x: 0, y: 0 }
        fixes.push({ path: 'position', code: 'AUTO_FIX', message: 'Missing position, defaulting to { x: 0, y: 0 }', severity: 'warning' })
    }

    // positionAbsolute
    if (!node.positionAbsolute) {
        node.positionAbsolute = { ...(node.position as object) }
        fixes.push({
            path: 'positionAbsolute',
            code: 'AUTO_FIX',
            message: 'Missing positionAbsolute, mirroring position',
            severity: 'warning'
        })
    }

    // width / height
    if (node.width === undefined) {
        node.width = 320
        fixes.push({ path: 'width', code: 'AUTO_FIX', message: 'Missing width, defaulting to 320', severity: 'warning' })
    }
    if (node.height === undefined) {
        node.height = 200
        fixes.push({ path: 'height', code: 'AUTO_FIX', message: 'Missing height, defaulting to 200', severity: 'warning' })
    }

    // UI flags
    if (node.selected === undefined) {
        node.selected = false
        fixes.push({ path: 'selected', code: 'AUTO_FIX', message: 'Missing selected, defaulting to false', severity: 'warning' })
    }
    if (node.dragging === undefined) {
        node.dragging = false
        fixes.push({ path: 'dragging', code: 'AUTO_FIX', message: 'Missing dragging, defaulting to false', severity: 'warning' })
    }

    return { node, fixes }
}

/**
 * Phase 2: Strict Zod validation after auto-fix.
 */
export const ReactFlowNodeSchema = z
    .object({
        id: z.string().min(1, 'id is required'),
        position: PositionSchema,
        positionAbsolute: PositionSchema,
        type: z.string().min(1, 'type is required'),
        data: z.any(), // validated separately by NodeDataSchema
        width: z.number().gt(0, 'width must be > 0'),
        height: z.number().gt(0, 'height must be > 0'),
        selected: z.boolean(),
        dragging: z.boolean(),
        z: z.number().optional(),
        handleBounds: z.any().optional(),
        parentNode: z.string().optional(),
        extent: z.string().optional()
    })
    .passthrough()

export type ReactFlowNodeType = z.infer<typeof ReactFlowNodeSchema>

// -----------------------------------------------
// NodeDataSchema
// -----------------------------------------------

export const NodeDataSchema = z
    .object({
        id: z.string().min(1, 'data.id is required'),
        name: z.string().min(1, 'data.name is required'),
        type: z.string().min(1, 'data.type is required'),
        label: z.string().min(1, 'data.label is required'),
        category: z.string().min(1, 'data.category is required'),
        version: z.string().optional(),
        description: z.string().optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
        baseClasses: z.array(z.string()).optional(),
        filePath: z.string().optional(),
        hideInput: z.boolean().optional(),
        loadMethods: z.record(z.string(), z.any()).optional(),

        // inputs: Record<string, unknown> — we allow extra fields (custom configs)
        inputs: z.record(z.string(), z.any()).default({}),

        // Configuration parameters (used to render UI forms)
        inputParams: z.array(z.any()).default([]),

        // Connection anchors
        inputAnchors: z.array(z.any()).default([]),
        outputAnchors: z.array(z.any()).default([]),
        outputs: z.record(z.string(), z.any()).default({})
    })
    .passthrough()
    .transform((data) => {
        // Enforce invariants that Zod can't express declaratively
        if (data.inputParams && !Array.isArray(data.inputParams)) {
            throw new z.ZodError([{ path: 'data.inputParams', message: 'inputParams must be an array', code: 'invalid_type' }])
        }
        return data
    })

export type NodeDataType = z.infer<typeof NodeDataSchema>
```

**Key design decisions**:

-   `inputs` uses `z.record(z.string(), z.any())` — we allow extra unknown fields since custom node configs are dynamic.
-   `data` is validated separately (`z.any()` at this layer) so the top-level schema can be composed without circular issues.
-   `inputParams`, `inputAnchors`, `outputAnchors` default to `[]` so templates don't need to explicitly empty them.

---

### 4.2 `agentflow.ts` — `AgentFlowNodeSchema`

```ts
// .agents/skills/flow-node/schemas/agentflow.ts

import { z } from 'zod'
import { ReactFlowNodeSchema, NodeDataSchema } from './common.js'
import { FlowNodeIssue } from './issues.js'

// -----------------------------------------------
// Allowlist of 15 known AgentFlow node names
// -----------------------------------------------

export const AGENTFLOW_ALLOWLIST = [
    'agentAgentflow',
    'llmAgentflow',
    'startAgentflow',
    'conditionAgentflow',
    'conditionAgentAgentflow',
    'customFunctionAgentflow',
    'directReplyAgentflow',
    'executeFlowAgentflow',
    'humanInputAgentflow',
    'httpAgentflow',
    'iterationAgentflow',
    'loopAgentflow',
    'retrieverAgentflow',
    'stickyNoteAgentflow',
    'toolAgentflow'
] as const

// -----------------------------------------------
// AgentFlowNodeSchema
// -----------------------------------------------

/**
 * AgentFlow extends ReactFlowNode + NodeData with strict type constraints:
 * - type must be 'agentFlow'
 * - category must be 'Agent Flows' (exception: stickyNote → 'Utilities')
 * - data.name must be in the 15-node allowlist
 */
export const AgentFlowNodeSchema = ReactFlowNodeSchema.extend({
    type: z.literal('agentFlow'),
    data: NodeDataSchema.extend({
        type: z.enum([
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
        ]),
        category: z.string(),
        name: z.string()
    })
}).passthrough()

export type AgentFlowNodeType = z.infer<typeof AgentFlowNodeSchema>

// -----------------------------------------------
// Semantic validation (post-schema)
// -----------------------------------------------

export interface AgentFlowValidationInput {
    node: unknown
    templateName: string
}

export function validateAgentFlowSemantics(input: AgentFlowValidationInput): FlowNodeIssue[] {
    const issues: FlowNodeIssue[] = []
    const data = (input.node as Record<string, unknown>).data as Record<string, unknown>

    // 1. data.name must be in allowlist
    if (!AGENTFLOW_ALLOWLIST.includes(data.name as (typeof AGENTFLOW_ALLOWLIST)[number])) {
        issues.push({
            path: 'data.name',
            code: 'UNKNOWN_NODE_NAME',
            message: `AgentFlow node name "${data.name}" is not in the known allowlist`,
            severity: 'error'
        })
    }

    // 2. StickyNote is the only node with a non-Agent Flows category
    if (data.name === 'stickyNoteAgentflow') {
        if (data.category !== 'Utilities') {
            issues.push({
                path: 'data.category',
                code: 'WRONG_FLOW_TYPE',
                message: 'stickyNoteAgentflow must have category "Utilities"',
                severity: 'error'
            })
        }
    } else {
        if (data.category !== 'Agent Flows') {
            issues.push({
                path: 'data.category',
                code: 'WRONG_FLOW_TYPE',
                message: 'AgentFlow node must have category "Agent Flows"',
                severity: 'error'
            })
        }
    }

    // 3. inputAnchors and outputAnchors must be present (even if empty)
    if (!Array.isArray(data.inputAnchors)) {
        issues.push({
            path: 'data.inputAnchors',
            code: 'MISSING_REQUIRED_FIELD',
            message: 'data.inputAnchors is required',
            severity: 'error'
        })
    }
    if (!Array.isArray(data.outputAnchors)) {
        issues.push({
            path: 'data.outputAnchors',
            code: 'MISSING_REQUIRED_FIELD',
            message: 'data.outputAnchors is required',
            severity: 'error'
        })
    }

    return issues
}
```

---

### 4.3 `chatflow.ts` — `ChatFlowNodeSchema`

```ts
// .agents/skills/flow-node/schemas/chatflow.ts

import { z } from 'zod'
import { ReactFlowNodeSchema, NodeDataSchema } from './common.js'
import { FlowNodeIssue } from './issues.js'

// -----------------------------------------------
// Allowlist of MVP ChatFlow node names
// -----------------------------------------------

export const CHATFLOW_MVP_ALLOWLIST = [
    'chatOpenRouter',
    'chatOpenAI',
    'chatAnthropic',
    'chatGoogleGenerativeAI',
    'bufferMemory',
    'huggingFaceEmbeddings',
    'openAiEmbeddings',
    'supabase',
    'retrieverTool',
    'toolAgent'
] as const

export type ChatFlowMvpNodeName = (typeof CHATFLOW_MVP_ALLOWLIST)[number]

// -----------------------------------------------
// ChatFlowNodeSchema
// -----------------------------------------------

/**
 * ChatFlow extends ReactFlowNode + NodeData with:
 * - type must be 'customNode'
 * - category must NOT be 'Agent Flows'
 * - data.name must be in MVP allowlist OR pass UNSUPPORTED_NODE_TYPE
 */
export const ChatFlowNodeSchema = ReactFlowNodeSchema.extend({
    type: z.literal('customNode'),
    data: NodeDataSchema.extend({
        type: z.string(), // ChatFlow nodes use string type names, not enum
        category: z.string(),
        name: z.string()
    })
}).passthrough()

export type ChatFlowNodeType = z.infer<typeof ChatFlowNodeSchema>

// -----------------------------------------------
// Semantic validation (post-schema)
// -----------------------------------------------

export interface ChatFlowValidationInput {
    node: unknown
}

export function validateChatFlowSemantics(input: ChatFlowValidationInput): FlowNodeIssue[] {
    const issues: FlowNodeIssue[] = []
    const data = (input.node as Record<string, unknown>).data as Record<string, unknown>

    // 1. category must not be Agent Flows
    if (data.category === 'Agent Flows') {
        issues.push({
            path: 'data.category',
            code: 'WRONG_FLOW_TYPE',
            message: 'ChatFlow node cannot have category "Agent Flows"',
            severity: 'error'
        })
    }

    // 2. data.name must be in MVP allowlist
    if (!CHATFLOW_MVP_ALLOWLIST.includes(data.name as (typeof CHATFLOW_MVP_ALLOWLIST)[number])) {
        issues.push({
            path: 'data.name',
            code: 'UNSUPPORTED_NODE_TYPE',
            message: `ChatFlow node "${data.name}" is not in the MVP allowlist. Supported: ${CHATFLOW_MVP_ALLOWLIST.join(', ')}`,
            severity: 'error'
        })
    }

    // 3. Anchors must be present
    if (!Array.isArray(data.inputAnchors)) {
        issues.push({
            path: 'data.inputAnchors',
            code: 'MISSING_REQUIRED_FIELD',
            message: 'data.inputAnchors is required',
            severity: 'error'
        })
    }
    if (!Array.isArray(data.outputAnchors)) {
        issues.push({
            path: 'data.outputAnchors',
            code: 'MISSING_REQUIRED_FIELD',
            message: 'data.outputAnchors is required',
            severity: 'error'
        })
    }

    // 4. inputParams must be present (even if empty — form rendering depends on it)
    if (!Array.isArray(data.inputParams)) {
        issues.push({
            path: 'data.inputParams',
            code: 'MISSING_REQUIRED_FIELD',
            message: 'data.inputParams is required (can be empty array)',
            severity: 'error'
        })
    }

    return issues
}
```

---

## 5. `validateNode()` Function

```ts
// .agents/skills/flow-node/schemas/common.ts (exported from index.ts)

import { FlowNodeIssue } from './issues.js'
import { ReactFlowNodeSchema, NodeDataSchema, autoFixNode } from './common.js'
import { AgentFlowNodeSchema, validateAgentFlowSemantics } from './agentflow.js'
import { ChatFlowNodeSchema, validateChatFlowSemantics } from './chatflow.js'

export interface FlowNodeRequest {
    flowType: 'AGENTFLOW' | 'CHATFLOW'
    node: Record<string, unknown> // raw IReactFlowNode-like object
    templateName?: string // for checksum tracking
}

export interface FlowNodeResponse {
    valid: boolean
    node: Record<string, unknown> | null
    errors: FlowNodeIssue[]
    warnings: FlowNodeIssue[]
    metadata: {
        flowType: 'AGENTFLOW' | 'CHATFLOW'
        schemaVersion: string
        autoFixed: boolean
    }
}

/**
 * Two-phase validateNode():
 *   Phase 1 (auto-fix): inject defaults for known-safe missing fields.
 *   Phase 2 (validate):  run ReactFlowNodeSchema → NodeDataSchema →
 *                        AgentFlowNodeSchema | ChatFlowNodeSchema →
 *                        semantic checks.
 *
 * Hard rule: errors.length > 0 → node: null.
 */
export function validateNode(request: FlowNodeRequest, templateName?: string): FlowNodeResponse {
    const errors: FlowNodeIssue[] = []
    const warnings: FlowNodeIssue[] = []
    let autoFixed = false

    // Clone to avoid mutating caller's object
    let node = structuredClone(request.node) as Record<string, unknown>

    // ----------------------------------------
    // Phase 1: Auto-fix
    // ----------------------------------------

    const { node: fixedNode, fixes } = autoFixNode(node)
    node = fixedNode
    if (fixes.length > 0) {
        autoFixed = true
        warnings.push(...fixes)
    }

    // Check for PLACEHOLDER_ID remaining (post-fix check for id fields)
    const idStr = JSON.stringify(node.id)
    if (idStr.includes('PLACEHOLDER_ID')) {
        errors.push({
            path: 'id',
            code: 'PLACEHOLDER_ID_REMAINING',
            message: 'node.id still contains PLACEHOLDER_ID after auto-fix',
            severity: 'error'
        })
    }

    const dataIdStr = JSON.stringify(node.data?.id ?? '')
    if (dataIdStr.includes('PLACEHOLDER_ID')) {
        errors.push({
            path: 'data.id',
            code: 'PLACEHOLDER_ID_REMAINING',
            message: 'node.data.id still contains PLACEHOLDER_ID',
            severity: 'error'
        })
    }

    if (errors.length > 0) {
        return { valid: false, node: null, errors, warnings, metadata: { flowType: request.flowType, schemaVersion: '1.0', autoFixed } }
    }

    // ----------------------------------------
    // Phase 2: Schema validation layers
    // ----------------------------------------

    // Layer 1: ReactFlowNodeSchema
    const rfResult = ReactFlowNodeSchema.safeParse(node)
    if (!rfResult.success) {
        for (const issue of rfResult.error.issues) {
            errors.push({
                path: issue.path.join('.'),
                code: 'MISSING_REQUIRED_FIELD',
                message: issue.message,
                severity: 'error'
            })
        }
    }

    if (errors.length > 0) {
        return { valid: false, node: null, errors, warnings, metadata: { flowType: request.flowType, schemaVersion: '1.0', autoFixed } }
    }

    // Layer 2: NodeDataSchema
    const data = node.data as Record<string, unknown>
    const ndResult = NodeDataSchema.safeParse(data)
    if (!ndResult.success) {
        for (const issue of ndResult.error.issues) {
            errors.push({
                path: `data.${issue.path.join('.')}`,
                code: 'MISSING_REQUIRED_FIELD',
                message: issue.message,
                severity: 'error'
            })
        }
    }

    if (errors.length > 0) {
        return { valid: false, node: null, errors, warnings, metadata: { flowType: request.flowType, schemaVersion: '1.0', autoFixed } }
    }

    // Layer 3: Flow-type specific schema
    if (request.flowType === 'AGENTFLOW') {
        // Layer 3a: AgentFlowNodeSchema
        const afResult = AgentFlowNodeSchema.safeParse(node)
        if (!afResult.success) {
            for (const issue of afResult.error.issues) {
                errors.push({
                    path: issue.path.join('.'),
                    code: 'WRONG_FLOW_TYPE',
                    message: issue.message,
                    severity: 'error'
                })
            }
        }

        // Layer 3b: AgentFlow semantic checks
        const semanticIssues = validateAgentFlowSemantics({ node, templateName: templateName ?? '' })
        errors.push(...semanticIssues)
    } else {
        // Layer 3a: ChatFlowNodeSchema
        const cfResult = ChatFlowNodeSchema.safeParse(node)
        if (!cfResult.success) {
            for (const issue of cfResult.error.issues) {
                errors.push({
                    path: issue.path.join('.'),
                    code: 'WRONG_FLOW_TYPE',
                    message: issue.message,
                    severity: 'error'
                })
            }
        }

        // Layer 3b: ChatFlow semantic checks
        const semanticIssues = validateChatFlowSemantics({ node })
        errors.push(...semanticIssues)
    }

    // ----------------------------------------
    // Hard failure if any errors
    // ----------------------------------------

    if (errors.length > 0) {
        return { valid: false, node: null, errors, warnings, metadata: { flowType: request.flowType, schemaVersion: '1.0', autoFixed } }
    }

    return {
        valid: true,
        node,
        errors: [],
        warnings,
        metadata: { flowType: request.flowType, schemaVersion: '1.0', autoFixed }
    }
}
```

---

## 6. Top-Level `runValidation()` (`index.ts`)

```ts
// .agents/skills/flow-node/schemas/index.ts

export { validateNode } from './common.js'
export type { FlowNodeRequest, FlowNodeResponse } from './common.js'
export { ErrorCodes } from './issues.js'
export type { FlowNodeIssue } from './issues.js'
export { ReactFlowNodeSchema, NodeDataSchema, autoFixNode } from './common.js'
export { AgentFlowNodeSchema, validateAgentFlowSemantics, AGENTFLOW_ALLOWLIST } from './agentflow.js'
export { ChatFlowNodeSchema, validateChatFlowSemantics, CHATFLOW_MVP_ALLOWLIST } from './chatflow.js'

/**
 * runValidation — top-level entry point matching SKILL.md R6 contract.
 *
 * @param request       FlowNodeRequest (flowType + raw node)
 * @param template     IReactFlowNode template (used for checksum metadata)
 * @param versionInfo   { templateVersion, checksum } from _version.json
 */
export function runValidation(
    request: FlowNodeRequest,
    template: Record<string, unknown>,
    versionInfo: { templateVersion: string; checksum: string }
): FlowNodeResponse {
    const result = validateNode(request)

    // Attach version metadata (even on error)
    result.metadata.templateVersion = versionInfo.templateVersion
    result.metadata.checksum = versionInfo.checksum

    return result
}
```

---

## 7. Auto-Fix vs Hard Failure (Explicit List)

| Field                                   | Auto-fix? | Strategy                                         |
| --------------------------------------- | --------- | ------------------------------------------------ |
| `position` missing                      | ✅        | Default `{ x: 0, y: 0 }`                         |
| `positionAbsolute` missing              | ✅        | Mirror `position`                                |
| `width` missing                         | ✅        | Default `320`                                    |
| `height` missing                        | ✅        | Default `200`                                    |
| `selected` missing                      | ✅        | Default `false`                                  |
| `dragging` missing                      | ✅        | Default `false`                                  |
| `data.inputs` missing                   | ✅        | Default `{}`                                     |
| `data.inputParams` missing              | ✅        | Default `[]`                                     |
| `data.inputAnchors` missing             | ✅        | Default `[]`                                     |
| `data.outputAnchors` missing            | ✅        | Default `[]`                                     |
| `data.outputs` missing                  | ✅        | Default `{}`                                     |
| `PLACEHOLDER_ID` in `id`                | ❌        | **Hard failure** → `PLACEHOLDER_ID_REMAINING`    |
| `PLACEHOLDER_ID` in `data.id`           | ❌        | **Hard failure** → `PLACEHOLDER_ID_REMAINING`    |
| `PLACEHOLDER_ID` in `inputParams[*].id` | ❌        | **Hard failure** → `PLACEHOLDER_ID_REMAINING`    |
| Missing `id` (top-level)                | ❌        | **Hard failure** → `MISSING_REQUIRED_FIELD`      |
| Missing `type`                          | ❌        | **Hard failure** → `MISSING_REQUIRED_FIELD`      |
| Wrong `type` for flowType               | ❌        | **Hard failure** → `WRONG_FLOW_TYPE`             |
| `data.name` not in allowlist            | ❌        | **Hard failure** → `UNKNOWN_NODE_TYPE`           |
| Empty credential UUID                   | ⚠️        | **Warning** only (`MISSING_OPTIONAL_CREDENTIAL`) |
| Invalid UUID format                     | ❌        | **Hard failure** → `INVALID_CREDENTIAL_FORMAT`   |
| Required param empty                    | ❌        | **Hard failure** → `EMPTY_REQUIRED_PARAM`        |
| Missing `modelName` on chat model       | ❌        | **Hard failure** → `MISSING_MODEL_NAME`          |
| Stale checksum                          | ⚠️        | **Warning** only (`STALE_CHECKSUM`)              |

---

## 8. Integration with flow-node SKILL.md

The schemas are loaded at runtime by the `flow-node` agent when it reaches **R6: Strict Schema Validation** in its process:

```
Receive FlowNodeRequest
  ↓
Resolve template/metadata
  ↓
Deep-clone via structuredClone()
  ↓
Apply auto-fix defaults          ← autoFixNode() from schemas/common.ts
  ↓
Substitute IDs (R1)              ← handled by flow-node agent (not schema)
  ↓
Merge params into inputs (R5)    ← handled by flow-node agent (not schema)
  ↓
Validate credential format (R4)  ← handled by flow-node agent (not schema)
  ↓
Run schema layers:               ← validateNode() from schemas/index.ts
  ReactFlowNode → NodeData →
  AgentFlowNode | ChatFlowNode →
  semantic checks
  ↓ (any error → valid:false, node:null)
Return FlowNodeResponse
```

The schemas **do not** handle:

-   ID substitution (R1) — done by the agent before validation
-   Param merging (R5) — done by the agent before validation
-   Credential UUID validation (R4) — done by the agent before validation
-   Edge/graph connectivity — owned by `flow-ing`

**Version tracking integration**: `runValidation()` accepts `versionInfo` from `_version.json` and attaches `{ templateVersion, checksum }` to the response metadata. If the node's checksum doesn't match `_version.json`, `flow-ing` emits a `STALE_CHECKSUM` warning.

---

## 9. Testing Approach

Each schema layer gets its own Vitest test file under `schemas/__tests__/`. Tests use both valid and invalid cases. Minimum 2 cases per schema (as specified).

### `common.test.ts`

```ts
describe('ReactFlowNodeSchema', () => {
    test('valid node passes', () => {
        const node = {
            id: 'node_0',
            position: { x: 100, y: 200 },
            positionAbsolute: { x: 100, y: 200 },
            type: 'agentFlow',
            width: 260,
            height: 500,
            selected: false,
            dragging: false,
            data: {}
        }
        expect(() => ReactFlowNodeSchema.parse(node)).not.toThrow()
    })

    test('missing positionAbsolute fails', () => {
        const node = {
            id: 'node_0',
            position: { x: 0, y: 0 },
            type: 'agentFlow',
            width: 260,
            height: 500,
            selected: false,
            dragging: false,
            data: {}
        }
        expect(() => ReactFlowNodeSchema.parse(node)).toThrow()
    })
})

describe('autoFixNode', () => {
    test('injects position defaults', () => {
        const node = { id: 'node_0', type: 'agentFlow', width: 260, height: 500, selected: false, dragging: false, data: {} }
        const { node: fixed } = autoFixNode(structuredClone(node))
        expect(fixed.position).toEqual({ x: 0, y: 0 })
        expect(fixed.positionAbsolute).toEqual({ x: 0, y: 0 })
    })

    test('leaves PLACEHOLDER_ID in id — does not auto-fix', () => {
        const node = {
            id: 'PLACEHOLDER_ID',
            position: { x: 0, y: 0 },
            type: 'agentFlow',
            width: 260,
            height: 500,
            selected: false,
            dragging: false,
            data: {}
        }
        const { fixes } = autoFixNode(structuredClone(node))
        // autoFixNode does NOT touch PLACEHOLDER_ID — that's a hard failure in validateNode
        expect(fixes.filter((f) => f.path === 'id')).toHaveLength(0)
    })
})
```

### `agentflow.test.ts`

```ts
describe('AgentFlowNodeSchema', () => {
    test('valid agentFlow node passes', () => {
        const node = loadAgentFlowTemplate('agentAgentflow.json')
        const result = AgentFlowNodeSchema.safeParse(node)
        expect(result.success).toBe(true)
    })

    test('customNode type fails for AgentFlow schema', () => {
        const node = { ...loadAgentFlowTemplate('agentAgentflow.json'), type: 'customNode' }
        const result = AgentFlowNodeSchema.safeParse(node)
        expect(result.success).toBe(false)
    })
})

describe('validateAgentFlowSemantics', () => {
    test('unknown node name fails', () => {
        const node = buildMinimalNode({ data: { name: 'fakeNode', category: 'Agent Flows' } })
        const issues = validateAgentFlowSemantics({ node, templateName: 'fake.json' })
        expect(issues.some((i) => i.code === 'UNKNOWN_NODE_NAME')).toBe(true)
    })

    test('stickyNoteAgentflow with wrong category fails', () => {
        const node = buildMinimalNode({ data: { name: 'stickyNoteAgentflow', category: 'Agent Flows' } })
        const issues = validateAgentFlowSemantics({ node, templateName: 'stickyNoteAgentflow.json' })
        expect(issues.some((i) => i.code === 'WRONG_FLOW_TYPE')).toBe(true)
    })
})
```

### `chatflow.test.ts`

```ts
describe('ChatFlowNodeSchema', () => {
    test('valid chatOpenRouter node passes', () => {
        const node = buildMinimalNode({ type: 'customNode', data: { name: 'chatOpenRouter', category: 'Chat Models' } })
        const result = ChatFlowNodeSchema.safeParse(node)
        expect(result.success).toBe(true)
    })

    test('agentFlow type fails for ChatFlow schema', () => {
        const node = buildMinimalNode({ type: 'agentFlow', data: { name: 'chatOpenRouter', category: 'Chat Models' } })
        const result = ChatFlowNodeSchema.safeParse(node)
        expect(result.success).toBe(false)
    })
})

describe('validateChatFlowSemantics', () => {
    test('unknown node name fails with UNSUPPORTED_NODE_TYPE', () => {
        const node = buildMinimalNode({ type: 'customNode', data: { name: 'unknownChatNode', category: 'Chat Models' } })
        const issues = validateChatFlowSemantics({ node })
        expect(issues.some((i) => i.code === 'UNSUPPORTED_NODE_TYPE')).toBe(true)
    })

    test('Agent Flows category fails for ChatFlow', () => {
        const node = buildMinimalNode({ type: 'customNode', data: { name: 'chatOpenRouter', category: 'Agent Flows' } })
        const issues = validateChatFlowSemantics({ node })
        expect(issues.some((i) => i.code === 'WRONG_FLOW_TYPE')).toBe(true)
    })
})
```

### `validateNode.integration.test.ts`

Full pipeline tests covering the complete `validateNode()` flow:

```ts
describe('validateNode (full pipeline)', () => {
    test('AgentFlow template passes all layers', () => {
        const node = loadAgentFlowTemplate('agentAgentflow.json')
        const result = validateNode({ flowType: 'AGENTFLOW', node }, 'agentAgentflow.json')
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
    })

    test('PLACEHOLDER_ID remaining → hard failure', () => {
        const node = { ...loadAgentFlowTemplate('agentAgentflow.json'), id: 'PLACEHOLDER_ID' }
        const result = validateNode({ flowType: 'AGENTFLOW', node }, 'agentAgentflow.json')
        expect(result.valid).toBe(false)
        expect(result.errors.some((e) => e.code === 'PLACEHOLDER_ID_REMAINING')).toBe(true)
        expect(result.node).toBeNull()
    })

    test('ChatFlow unknown node type → UNSUPPORTED_NODE_TYPE', () => {
        const node = buildMinimalNode({ type: 'customNode', data: { name: 'futureNode', category: 'Future' } })
        const result = validateNode({ flowType: 'CHATFLOW', node })
        expect(result.valid).toBe(false)
        expect(result.errors.some((e) => e.code === 'UNSUPPORTED_NODE_TYPE')).toBe(true)
    })

    test('auto-fixed fields appear in warnings', () => {
        const node = {
            id: 'node_0',
            type: 'customNode',
            data: {
                id: 'node_0',
                name: 'chatOpenRouter',
                label: 'Chat',
                category: 'Chat Models',
                inputs: {},
                inputAnchors: [],
                outputAnchors: [],
                inputParams: []
            }
        }
        // omit position, width, height, selected, dragging to trigger auto-fix
        const result = validateNode({ flowType: 'CHATFLOW', node })
        expect(result.warnings.length).toBeGreaterThan(0)
    })
})
```

**Test runner**: Vitest. Config at `.agents/skills/flow-node/schemas/vitest.config.ts` (or `vitest.config.js` at project root with test path configured). All tests use `describe/it/test` (Vitest), assertions via `expect`.

---

## 10. Key Design Decisions Resolved

| Question                                                                               | Decision                                               | Rationale                                                                                                                              |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Should `ReactFlowNodeSchema` auto-fix AND validate, or just validate?                  | **Auto-fix first pass, then validate**                 | Auto-fix injects defaults for safe missing fields; validation runs after so we catch what couldn't be fixed. Two distinct phases.      |
| Should `NodeDataSchema` allow extra unknown fields in `data.inputs`?                   | **Yes**                                                | `inputs` is `Record<string, unknown>` with `.default({})`. Custom node configs are dynamic and we must not reject valid custom fields. |
| Should `AgentFlowNodeSchema` include a hardcoded allowlist of the 15 known node names? | **Yes**                                                | Proposal Slice 2 explicitly calls for an allowlist. We use `AGENTFLOW_ALLOWLIST` constant. Tests verify unknown names are rejected.    |
| Should `ChatFlowNodeSchema` include an allowlist of MVP node names?                    | **Yes, return `UNSUPPORTED_NODE_TYPE` for others**     | MVP scope is defined in SKILL.md. `UNSUPPORTED_NODE_TYPE` code is used for nodes outside the allowlist.                                |
| Should credential UUID validation be in the schema layer?                              | **No — handled by the agent before schema validation** | R4 in SKILL.md says credential format is validated separately. Schema layer focuses on structure, not credential content.              |

---

## 11. Package / Dependency Requirements

-   `zod@^3.23.0` (current project dependency — matches flow-validation.ts)
-   `vitest@^2.0.0` for tests
-   TypeScript `^5.4` (schemas are `.ts` files, loaded at runtime)

No new external dependencies beyond what the project already has.

---

## 12. Slice 2 Deliverables Summary

| File                                     | Status                                                                              |
| ---------------------------------------- | ----------------------------------------------------------------------------------- |
| `schemas/issues.ts`                      | New — error codes + `FlowNodeIssue` type                                            |
| `schemas/common.ts`                      | New — `ReactFlowNodeSchema`, `NodeDataSchema`, `autoFixNode()`, `validateNode()`    |
| `schemas/agentflow.ts`                   | New — `AgentFlowNodeSchema`, `validateAgentFlowSemantics()`, `AGENTFLOW_ALLOWLIST`  |
| `schemas/chatflow.ts`                    | New — `ChatFlowNodeSchema`, `validateChatFlowSemantics()`, `CHATFLOW_MVP_ALLOWLIST` |
| `schemas/index.ts`                       | New — re-exports + `runValidation()` top-level function                             |
| `schemas/__tests__/common.test.ts`       | New — ReactFlowNodeSchema + autoFixNode tests                                       |
| `schemas/__tests__/agentflow.test.ts`    | New — AgentFlowNodeSchema + semantics tests                                         |
| `schemas/__tests__/chatflow.test.ts`     | New — ChatFlowNodeSchema + semantics tests                                          |
| `schemas/__tests__/validateNode.test.ts` | New — full pipeline integration tests                                               |

Future slices add category schemas and per-node schemas progressively.
