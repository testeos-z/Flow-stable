# MCP Discovery Guide

How to discover and parse Flowise node schemas using `flow-control_get_node()`.
Load this guide during Step 1 of the flowise-node-creator methodology.

## 1. Request Format

Call the MCP tool with the exact node type name:

```
flow-control_get_node(nodeName: "chatOpenRouter")
```

**Rules:**

-   Use the exact node name as it appears in Flowise. Casing matters.
-   If unsure of the exact name, call `flow-control_list_nodes` first and search
    the returned list.
-   Only these MCP tools are referenced by this skill:
    `flow-control_get_node`, `flow-control_validate_chatflow`,
    `flow-control_validate_agentflow`.

## 2. Response Anatomy

A successful response is a JSON object with these top-level keys. Extract all
of them for Step 4 (Build Node JSON).

| Key             | Type           | Purpose                                          |
| --------------- | -------------- | ------------------------------------------------ |
| `name`          | string         | Node type identifier (e.g., `chatOpenRouter`)    |
| `category`      | string         | Category name (e.g., `Chat Models`)              |
| `version`       | string         | Node version string                              |
| `baseClasses`   | string[]       | Runtime type tags (e.g., `["chatModel", "llm"]`) |
| `inputs`        | object         | Configurable inputs keyed by name                |
| `inputAnchors`  | array[]        | Input connection points for edges                |
| `outputAnchors` | array[]        | Output connection points for edges               |
| `inputParams`   | array[]        | Parameter definitions                            |
| `credential`    | object \| null | Credential requirement (type name inside)        |

**Extraction order:**

1. Copy `name`, `category`, `version`, `baseClasses` verbatim.
2. Iterate `inputs` to build `data.inputs`.
3. Iterate `inputAnchors` and `outputAnchors` to build handle IDs.
4. Iterate `inputParams` to build `data.inputParams`.
5. If `credential` is present, note the `credentialName` for Step 3 resolution.

## 3. Example — chatOpenRouter

Below is a representative snippet of what `flow-control_get_node("chatOpenRouter")`
returns. Highlighted fields (>>>) are the ones you MUST extract.

```json
{
    ">>> name": "chatOpenRouter",
    ">>> category": "Chat Models",
    ">>> version": "1.0.0",
    ">>> baseClasses": ["chatModel", "llm"],
    ">>> inputs": {
        "model": { "type": "string", "default": "openai/gpt-4o" },
        ">>> temperature": { "type": "number", "default": 0.7 },
        ">>> streaming": { "type": "boolean", "default": true }
    },
    ">>> inputAnchors": [],
    ">>> outputAnchors": [
        {
            "name": "output",
            "type": "options",
            ">>> id": "chatOpenRouter-output-chatOpenRouter-chatModel-0",
            ">>> label": "chatModel"
        }
    ],
    ">>> inputParams": [
        { "label": "Model", "name": "model", "type": "string" },
        { "label": "Temperature", "name": "temperature", "type": "number" },
        { "label": "Streaming", "name": "streaming", "type": "boolean" }
    ],
    ">>> credential": {
        "credentialName": "openRouterApi",
        "label": "Connect Credential"
    }
}
```

**What to do with this data:**

-   `name` → `data.type` and base for `data.name` (`chatOpenRouter_0`).
-   `baseClasses` → `data.baseClasses` exactly `["chatModel", "llm"]`.
-   `outputAnchors[0].id` → handle ID formula base.
-   `credential.credentialName` → resolve `openRouterApi` to UUID in Step 3.
-   `inputs.streaming.default` is `true` (boolean), NOT `"true"` (string).

## 4. Troubleshooting

### Error: Node not found

-   **Symptom**: MCP returns empty object or error after `flow-control_get_node()`.
-   **Cause**: Typo in node name, or the node does not exist in this Flowise version.
-   **Fix**:
    1. Call `flow-control_list_nodes` and search the list for the exact name.
    2. Check casing: `chatOpenRouter` is correct; `chatopenrouter` or
       `chatOpenAi` are not.
    3. If the node is still missing, report: "Node not found. Verify exact node
       name via flow-control_list_nodes."

### Error: Empty or malformed response

-   **Symptom**: Response is `{}`, `null`, or missing expected keys.
-   **Cause**: MCP server timeout, Flowise restart, or schema change.
-   **Fix**:
    1. Retry the `flow-control_get_node` call once.
    2. If still empty, abort and report: "Empty MCP response for {nodeName}.
       Retry failed. Halt node creation."

### Error: Missing credential field in response

-   **Symptom**: The response has no `credential` key, but you expected one.
-   **Cause**: The node genuinely does not require a credential.
-   **Fix**:
    1. Confirm the node type: Chat Models usually need credentials; Memory or
       Utility nodes often do not.
    2. If `credential` is absent, set `data.credential` to `""` (empty string).
    3. Do NOT invent a credential requirement.
