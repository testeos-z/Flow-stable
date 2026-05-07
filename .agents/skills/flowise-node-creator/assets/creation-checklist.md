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

-   [ ] **`data.inputParams` is present and non-empty**

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
