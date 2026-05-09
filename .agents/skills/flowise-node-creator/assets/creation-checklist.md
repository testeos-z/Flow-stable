# Node Creation Checklist

Run this checklist during Step 6 of the flowise-node-creator methodology
before returning a node. Every item MUST pass.

-   [ ] **`type` is `"customNode"`**

    -   **Failure**: `type` is missing or has another value. Flowise ignores the node.
    -   **Fix**: Set `"type": "customNode"` explicitly.

-   [ ] **`id` and `data.name` are unique and deterministic**

    -   **Failure**: Duplicate IDs cause canvas rendering issues or silent overwrites.
    -   **Fix**: Use `{nodeName}_{N}` where N is the node's index in the flow.

-   [ ] **Boolean inputs are primitives, not strings**

    -   **Failure**: `"true"` is a string; Flowise may misinterpret it as truthy text.
    -   **Fix**: Use `true` or `false` without quotes.

-   [ ] **`data.inputParams` is present (required field)**

    -   **Failure**: Missing `inputParams` causes validation errors in Flowise.
    -   **Fix**: Always include `data.inputParams` as an array, even if empty: `[]`.

-   [ ] **`data.baseClasses` matches MCP response exactly**

    -   **Failure**: Mismatched base classes break node categorization and edge compatibility.
    -   **Fix**: Copy the `baseClasses` array from `flow-control_get_node()` verbatim.

-   [ ] **`data.credential` is a UUID or empty string**

    -   **Failure**: Using `"openRouterApi"` instead of its UUID fails authentication.
    -   **Fix**: Resolve the type name to UUID via the credential registry first.

-   [ ] **`data.version` matches discovered version**

    -   **Failure**: Version drift may cause runtime schema mismatches.
    -   **Fix**: Copy the `version` field from the MCP response.

-   [ ] **Output anchors have matching edge handles or are documented**

    -   **Failure**: Orphaned handles suggest missing connections or incorrect IDs.
    -   **Fix**: Verify every `outputAnchors[id]` appears in at least one edge's
        `sourceHandle`, or note in `warnings` why it is intentionally unconnected.

-   [ ] **`viewport` is present at the flowData level**

    -   **Failure**: Missing viewport crashes the Flowise canvas on load.
    -   **Fix**: Ensure `flowData.viewport = { x: 0, y: 0, zoom: 1 }`.

-   [ ] **DirectReply field uses `directReplyMessage`**

    -   **Failure**: Using `replyMessage` renders empty space in the canvas.
    -   **Fix**: The correct field name is `directReplyMessage`.

-   [ ] **Condition handles use exact `outputAnchors` IDs**

    -   **Failure**: Custom names like `goEvidence` break edge rendering.
    -   **Fix**: Use `conditionAgentflow_N-output-0` and `conditionAgentflow_N-output-1`.

-   [ ] **No required inputs are empty or undefined**
    -   **Failure**: Empty required fields crash the node at runtime.
    -   **Fix**: Verify every entry in `data.inputs` has a defined value.

## Registered Node Templates

Known nodes with golden templates and Zod schemas available for `flow-node`:

| Node type        | Template                               | Zod schema                                | Credential    |
| ---------------- | -------------------------------------- | ----------------------------------------- | ------------- |
| `SupabaseSelect` | `assets/templates/SupabaseSelect.json` | `assets/schemas/SupabaseSelect.schema.ts` | `supabaseApi` |
| `SupabaseInsert` | `assets/templates/SupabaseInsert.json` | `assets/schemas/SupabaseInsert.schema.ts` | `supabaseApi` |
| `SupabaseUpdate` | `assets/templates/SupabaseUpdate.json` | `assets/schemas/SupabaseUpdate.schema.ts` | `supabaseApi` |
| `SupabaseDelete` | `assets/templates/SupabaseDelete.json` | `assets/schemas/SupabaseDelete.schema.ts` | `supabaseApi` |
| `SupabaseUpsert` | `assets/templates/SupabaseUpsert.json` | `assets/schemas/SupabaseUpsert.schema.ts` | `supabaseApi` |

### Supabase CRUD Node Conventions

All five nodes share:

-   **Category**: `Tools`
-   **Version**: `1.0`
-   **Icon**: `supabase-storage.svg`
-   **Credential**: `supabaseApi` (UUID: `0df85d26-749b-4fac-9a88-7399663a3099`)

**Design-time inputs** (never exposed to LLM as tool args):

1. `supabaseProjUrl` (string) — Supabase project URL
2. `tableName` (string) — Immutable table name

**BaseClasses**: `[<TypeName>, 'DynamicStructuredTool', 'StructuredTool', 'Tool']`

**Output anchor handle ID**: `{nodeName}-output`

**Security constraints**:

-   Update and Delete require `.min(1)` on `filters` (Zod) + runtime guard
-   Select limits are capped to `Math.min(limit, 1000)` at runtime
-   `tableName` is hardcoded at design time, never exposed as an LLM tool arg
-   Credential is resolved from UUID, never transmitted to the LLM
