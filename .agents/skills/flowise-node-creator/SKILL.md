---
name: flowise-node-creator
description: |
    When an agent needs to create or validate a SINGLE Flowise node JSON,
    regardless of node type or flow context. Provides a 7-step methodology
    for discovering schemas via MCP, mapping to a golden template, generating
    handle IDs, resolving credentials, and validating before return.
    Does NOT catalogue nodes, provide domain rules, or assemble flows.
    Out of scope: flow-level design, node selection/catalog queries,
    domain-specific rule application, flow assembly/saving.
---

# Critical Rule

ALWAYS call `flow-control_get_node(nodeName)` first. NEVER guess, hardcode,
or assume any node schema. The MCP response is the single source of truth for
inputs, anchors, baseClasses, category, version, and credential requirements.
If the MCP returns an error or empty definition, halt and report:
"Node not found. Verify exact node name via flow-control_list_nodes."

# 7-Step Methodology

1. **Discover** — Call `flow-control_get_node(nodeName)`. Extract `inputs`,
   `inputParams`, `outputAnchors`, `baseClasses`, `category`, `version`,
   and `credential` from the response. Load `references/mcp-discovery-guide.md`
   if the response is unexpected.
2. **Check Compatibility** — Determine target flow type (CHATFLOW, AGENTFLOW,
   SEQUENTIAL). Confirm the node is compatible and note its role:
   input/intermediate or ending. Consult `flowise-node-reference/05` for the
   compatibility matrix. Reject immediately if incompatible.
3. **Resolve Credential** — If the node requires a credential, map the type
   name to its UUID using the project's credential registry (CLAUDE.md or
   `flowise-node-reference/01`). Embed the UUID in `data.credential`. Never
   use the human-readable type name as the value.
4. **Build Node JSON** — Load `assets/node-golden-template.json`. Substitute
   placeholders with discovered values. Populate every field:
   `id`, `type`, `position`, `data.*`, `inputs`, `inputAnchors`,
   `outputAnchors`, `inputParams`, `credential`.
5. **Generate Anchors** — Build handle IDs programmatically from discovery
   data. `inputAnchors` and `outputAnchors` must match the `sourceHandle` and
   `targetHandle` values used in edges. See Handle ID Formulas below.
6. **Validate** — Run the pre-return checklist (inline below or load
   `assets/creation-checklist.md`). Catch boolean-as-string, missing fields,
   wrong credential format, orphaned handles, and known gotchas. If any item
   fails, set `valid: false` and list actionable errors.
7. **Return** — Emit the exact return shape. Do NOT proceed to flow assembly
   until `valid === true`.

# Golden Template (Inline)

```json
{
    "id": "{nodeName}_{N}",
    "type": "customNode",
    "position": { "x": 0, "y": 0 },
    "data": {
        "name": "{nodeName}_{N}",
        "type": "{nodeName}",
        "label": "{nodeName}",
        "category": "{category_from_mcp}",
        "version": "{version_from_mcp}",
        "baseClasses": ["{from_mcp}"],
        "inputs": {
            /* populated from mcp.inputs */
        },
        "inputAnchors": [
            /* populated from mcp.inputAnchors */
        ],
        "outputAnchors": [
            /* populated from mcp.outputAnchors */
        ],
        "inputParams": [
            /* populated from mcp.inputParams */
        ],
        "credential": "{uuid_or_empty}"
    }
}
```

Load `assets/node-golden-template.json` for the fully annotated version with
all placeholder comments.

# Field Mapping Table

| MCP Response Field       | flowData Node Field      | Notes                                       |
| ------------------------ | ------------------------ | ------------------------------------------- |
| `name` (node type)       | `data.type`, `data.name` | Append `_{N}` to `data.name` for uniqueness |
| `category`               | `data.category`          | e.g., "Chat Models", "Agent Flows"          |
| `version`                | `data.version`           | Discovered version string                   |
| `baseClasses`            | `data.baseClasses`       | Array of strings; must match exactly        |
| `inputs`                 | `data.inputs`            | Object keyed by input name                  |
| `inputAnchors`           | `data.inputAnchors`      | Array; generate handle IDs from these       |
| `outputAnchors`          | `data.outputAnchors`     | Array; generate handle IDs from these       |
| `inputParams`            | `data.inputParams`       | Array of parameter definitions              |
| `credential` (type name) | `data.credential`        | Resolve to UUID before embedding            |

# Template Syntax Decision Matrix

| Value Source                     | Syntax                                 | Example                                 |
| -------------------------------- | -------------------------------------- | --------------------------------------- |
| Runtime output from another node | `{{nodeId.data.instance}}`             | `{{chatOpenRouter_0.data.instance}}`    |
| Static configuration / literal   | Hardcode the value                     | `temperature: 0.7`                      |
| Connection via canvas wiring     | Use `edges` array, NOT template syntax | Edge with `source` + `target` + handles |

Rule of thumb: if the value is produced at runtime by another node, use template
syntax (AGENTFLOW) or an edge (CHATFLOW). If it is a fixed setting, hardcode it.
Never mix template syntax and edges for the same relationship.

# Handle ID Formulas

Use the discovered `name` and `id` to build deterministic handle strings.

**Output anchor handle ID:**

```
{nodeName}_{N}-output-{nodeName}-{baseClass}-{index}
```

Example for `chatOpenRouter_0` output index 0 with baseClass `chatModel`:
`chatOpenRouter_0-output-chatOpenRouter-chatModel-0`

**Input anchor handle ID:**

```
{nodeName}_{N}-input-{nodeName}-{inputName}-{index}
```

**Condition node output handles** (exception — use exact `outputAnchors` IDs):
`conditionAgentflow_N-output-0` (first branch) and
`conditionAgentflow_N-output-1` (else branch).
Do NOT invent custom names like `goEvidence` or `goFallback`.

Load `assets/edge-template.json` for a complete edge example with handle matching.

# Pre-Return Checklist

Run these checks before returning. Load `assets/creation-checklist.md` for the
full standalone version with failure descriptions and fixes.

-   [ ] `type` is `"customNode"` — not missing, not another value.
-   [ ] `id` and `data.name` are unique and deterministic (`{nodeName}_{N}`).
-   [ ] `data.inputs` values use correct types: booleans are primitives (`true`),
        not strings (`"true"`).
-   [ ] `data.inputParams` is present and non-empty (required field).
-   [ ] `data.baseClasses` matches the MCP response exactly.
-   [ ] `data.credential` is a UUID (or empty string), never a type name like
        `"openRouterApi"`.
-   [ ] `data.version` matches the discovered version.
-   [ ] Every `outputAnchors[id]` has a matching `sourceHandle` in at least one
        edge, OR is documented as intentionally orphaned.
-   [ ] `viewport` is present at the `flowData` level (`{ x: 0, y: 0, zoom: 1 }`),
        not inside the node.
-   [ ] DirectReply field name is `directReplyMessage`, NOT `replyMessage`.
-   [ ] Condition node handles use the exact IDs from `outputAnchors`, not custom
        labels.
-   [ ] No required `inputs` entries are empty or undefined.

# Return Format Contract

Return exactly this shape, regardless of success or failure:

```typescript
{
  valid: boolean;              // true ONLY if all checks pass
  node: object | null;         // the complete node JSON, or null if invalid
  handles: object;             // map of handle IDs for deterministic edge wiring
  errors: string[];            // actionable messages when valid === false
  warnings: string[];          // non-blocking issues when valid === true
}
```

If `valid === false`, `errors` MUST contain actionable messages. The agent MUST
NOT proceed to flow assembly until `valid === true`.

# Complementary Skills Loading Order

When multiple skills are relevant, load them in this order:

1. `flowise-node-creator` — generic methodology (this skill).
2. `node-specialist-*` — domain rules for the specific node category
   (e.g., `node-specialist-chat-models` for model-specific constraints).
3. `flowise-node-reference` — catalog info, compatibility matrices, design
   patterns. Restricted to `flow-architect` and `flow-ing` only.

Specialist skills add rules ON TOP of the generic methodology. They do NOT
re-teach how to discover schemas, build handle IDs, or resolve credentials.

# Common Gotchas

-   **Boolean-as-string**: `"true"` fails silently in Flowise. Use primitive
    `true`/`false`.
-   **Viewport**: Always inject `{ x: 0, y: 0, zoom: 1 }` at the `flowData` level.
    The MCP schema strips it; validate after creation.
-   **DirectReply field**: The correct field name is `directReplyMessage`.
    Using `replyMessage` renders an empty space.
-   **Condition handles**: Use exact `outputAnchors` IDs like
    `conditionAgentflow_N-output-0`. Custom names break canvas rendering.
-   **startTemplate**: The `startTemplate` field in AgentFlow Start nodes is
    UI-only and never read at runtime. Set flow state in the first processing node
    instead.

# Validation Tools Reference

For flow-level validation after node assembly, use ONLY these existing tools:

-   `flow-control_validate_chatflow` — structural validation for CHATFLOW.
-   `flow-control_validate_agentflow` — structural validation for AGENTFLOW.

There is no `flow-control_validate_node`. Node-level validation is the
responsibility of this skill's Step 6 checklist.
