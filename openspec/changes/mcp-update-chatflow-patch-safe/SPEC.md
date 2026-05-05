# Delta Spec: MCP Update Chatflow Patch-Safe

## Overview

This delta spec describes modifications to the `update_chatflow` MCP tool to prevent silent data loss during partial updates. The current implementation sends incomplete flowData payloads without fetching existing data, causing node configurations to be overwritten.

## ADDED Requirements

### Requirement: GET-Before-PUT Update Strategy

When `handleUpdateChatflow` receives a request with `flowData`, the handler MUST first fetch the existing chatflow from the server via GET `/chatflows/{id}` before sending any PUT request.

-   GIVEN an existing chatflow with 10 nodes and full node configurations
-   WHEN `update_chatflow` is called with `flowData` containing only 1 node
-   THEN the handler MUST fetch the existing 10-node flowData first
-   AND merge the incoming node with the existing nodes before PUT

### Requirement: Patch Mode (Default)

The system SHALL default to `mode: "patch"` when no mode is specified.

-   GIVEN `update_chatflow` called without explicit `mode` parameter
-   WHEN the request includes `flowData` with partial nodes
-   THEN the handler MUST perform GET → merge → PUT strategy
-   AND preserve all existing nodes not present in the incoming payload

### Requirement: Full-Replace Mode

When `mode: "full-replace"` is explicitly specified, the handler MUST send the payload as-is without fetching existing data.

-   GIVEN `update_chatflow` called with `mode: "full-replace"`
-   WHEN the request includes `flowData`
-   THEN the handler MUST skip the GET request
-   AND send the payload directly to PUT `/chatflows/{id}`

### Requirement: Destructive Update Guardrail

The system MUST block updates that would remove more than 30% of existing nodes in patch mode, unless `forceOverwrite: true` is specified.

-   GIVEN an existing chatflow with 10 nodes
-   WHEN `update_chatflow` is called with `flowData` containing only 5 nodes (50% reduction)
-   THEN the handler MUST return error: "Update would remove 5 of 10 nodes (50%). Threshold is 30%. Use forceOverwrite: true to override."
-   AND MUST NOT persist any changes

### Requirement: Force Overwrite Override

When `forceOverwrite: true` is specified, the 30% guardrail is bypassed with a warning.

-   GIVEN an existing chatflow with 10 nodes
-   WHEN `update_chatflow` is called with `flowData` containing 3 nodes AND `forceOverwrite: true`
-   THEN the handler MUST proceed with the update
-   AND return warning: "forceOverwrite: true bypassed 70% node reduction guardrail"

### Requirement: Alias for forceOverwrite

`allowDestructiveUpdate` SHALL be accepted as an alias for `forceOverwrite`.

-   GIVEN `update_chatflow` called with `allowDestructiveUpdate: true`
-   THEN the handler MUST treat it identically to `forceOverwrite: true`

### Requirement: Validation on Merged Data

Validation MUST be performed on the merged flowData, not the raw incoming payload.

-   GIVEN incoming flowData that is structurally valid
-   WHEN merge with existing flowData produces invalid structure (e.g., orphaned edges)
-   THEN validation MUST fail on the merged result
-   AND the handler MUST return clear error describing the merge issue
-   AND MUST NOT save any changes

## MODIFIED Requirements

### Requirement: update_chatflow Tool Schema

The `update_chatflow` tool in `index.ts` MUST accept new parameters:

| Parameter                | Type                          | Required | Default   | Description              |
| ------------------------ | ----------------------------- | -------- | --------- | ------------------------ |
| `mode`                   | `"patch"` \| `"full-replace"` | No       | `"patch"` | Update strategy          |
| `forceOverwrite`         | boolean                       | No       | `false`   | Bypass 30% guardrail     |
| `allowDestructiveUpdate` | boolean                       | No       | `false`   | Alias for forceOverwrite |

(Previously: Only chatflowId, name, flowData, chatbotConfig)

#### Scenario: CHATFLOW Patch Update

-   GIVEN existing CHATFLOW with 9 nodes including configurations
-   WHEN `update_chatflow` called with flowData containing 1 modified node
-   THEN all 9 existing nodes remain with their configurations
-   AND the modified node reflects the new configuration

#### Scenario: AGENTFLOW Patch Update

-   GIVEN existing AGENTFLOW with 10 nodes and full configs
-   WHEN `update_chatflow` called with flowData containing 1 node
-   THEN all 10 nodes persist (incoming node merges with existing 9)
-   AND node count remains 10 after update

## REMOVED Requirements

### Requirement: (None)

No existing requirements are being removed. This change only adds protective behavior.

## Test Scenarios

| ID  | Scenario                                 | Expected Result                    |
| --- | ---------------------------------------- | ---------------------------------- |
| T1  | Patch 1 node → existing 9 remain         | 10 nodes after update              |
| T2  | Patch removes node → blocked             | Error: "would remove X of Y nodes" |
| T3  | Force overwrite removes nodes → succeeds | Warning + success                  |
| T4  | AGENTFLOW 10 nodes, patch 1 → stays 10   | 10 nodes after update              |
| T5  | Replace mode replaces all nodes          | Incoming nodes only                |
| T6  | Validation fails on bad merge → no save  | Clear error, no DB change          |

## Restore Scenario (One-Time)

AGENTFLOW `c7a2f9be-07e9-4703-ac66-a3cecf60a9a6` is currently corrupted (3 nodes, no configs). A restore operation using `mode: "full-replace"` with known-good flowData will restore all 10 nodes with correct configurations.

-   This is a one-time operational task, not part of the permanent fix
-   After restore, the patch-safe behavior prevents future corruption

## Out of Scope

-   Changes to Flowise server (server-side merge works correctly)
-   Changes to `create_chatflow` (only update is affected)
-   Changes to other MCP tools
-   Auto-migration of existing flows (manual restore only)

## API Schema Changes

```typescript
// New tool definition for update_chatflow
server.tool('update_chatflow', ..., {
    chatflowId: z.string(),
    name: z.string().optional(),
    flowData: z.object({ nodes: z.array(z.any()), edges: z.array(z.any()) }).optional(),
    chatbotConfig: z.record(z.string(), z.any()).optional(),
    mode: z.enum(['patch', 'full-replace']).optional().default('patch'),
    forceOverwrite: z.boolean().optional().default(false),
    allowDestructiveUpdate: z.boolean().optional().default(false)  // alias
})
```

## Implementation Notes (NOT in specs)

-   Handler file: `packages/flowise-mcp-server/src/handlers.ts`
-   Function: `handleUpdateChatflow`
-   Add GET request before PUT in patch mode
-   Calculate node reduction percentage: `(existing.count - incoming.count) / existing.count`
-   Use Zod for schema validation in index.ts

## Tasks

| Phase                 | ID    | What                                                                                                        | Files                               | Verification                                    |
| --------------------- | ----- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------- |
| **Phase 0: Restore**  | T-0.1 | Restore AGENTFLOW c7a2f9be-07e9-4703-ac66-a3cecf60a9a6 to original 10-node state using mode: "full-replace" | Flowise DB                          | GET chatflow returns 10 nodes with full configs |
| **Phase 1: Core Fix** | T-1.1 | Add getExistingFlow() helper function                                                                       | handlers.ts                         | Returns parsed flowData or throws clear error   |
|                       | T-1.2 | Add mergeFlowData(existing, incoming) function                                                              | handlers.ts                         | Unit tests pass - deep merge by node.id/edge.id |
|                       | T-1.3 | Modify handleUpdateChatflow: GET → merge → validate → PUT                                                   | handlers.ts                         | Partial flowData preserves existing nodes       |
|                       | T-1.4 | Add node-count guardrail (30% threshold)                                                                    | handlers.ts                         | 50% reduction blocked, 20% allowed              |
|                       | T-1.5 | Add mode param: "patch" vs "full-replace"                                                                   | handlers.ts                         | full-replace skips GET, sends as-is             |
|                       | T-1.6 | Add forceOverwrite/allowDestructiveUpdate flags                                                             | handlers.ts                         | Bypasses guardrail with warning                 |
| **Phase 2: Schema**   | T-2.1 | Add mode param to update_chatflow schema                                                                    | index.ts                            | Tool accepts mode parameter                     |
|                       | T-2.2 | Add forceOverwrite param                                                                                    | index.ts                            | Tool accepts forceOverwrite                     |
|                       | T-2.3 | Add allowDestructiveUpdate alias                                                                            | index.ts                            | Alias works identically                         |
|                       | T-2.4 | Update tool descriptions                                                                                    | index.ts                            | Explains patch vs replace                       |
| **Phase 3: Tests**    | T-3.1 | Unit tests for mergeFlowData()                                                                              | **tests**/merge-flow-data.test.ts   | All test cases pass                             |
|                       | T-3.2 | Unit tests for guardrail                                                                                    | **tests**/guardrail.test.ts         | Threshold tests pass                            |
|                       | T-3.3 | Integration tests patch vs replace                                                                          | **tests**/update-chatflow.test.ts   | Patch preserves, replace overwrites             |
|                       | T-3.4 | AGENTFLOW restoration verification                                                                          | **tests**/agentflow-restore.test.ts | Restore verification passes                     |
