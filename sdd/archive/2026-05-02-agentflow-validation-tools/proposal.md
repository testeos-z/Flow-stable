# Proposal: AgentFlow Validation Tools

## Intent

The current `flow-validation` MCP tools are CHATFLOW-centric. They force `type: "customNode"` defaults, do not recognize AGENTFLOW node types (`Start`, `Agent`, `Condition`, `Loop`, `DirectReply`), and cannot validate AGENTFLOW-specific semantics (ending nodes, model embedding, tool arrays). This causes false negatives when validating AGENTFLOWs and breaks canvas rendering when `fixFlowData` overwrites `agentFlow` nodes with `customNode`.

We need dedicated validation tooling for AGENTFLOW that understands its distinct JSON schema and semantic rules.

## Scope

### In Scope

-   Separate `validate_chatflow` and `validate_agentflow` MCP tools with distinct Zod schemas
-   Zod schema `ZodAgentFlowObject` with `type: "agentFlow"`, `data.type` enum for Agent Flows nodes
-   Semantic validation for AGENTFLOW: exactly one `Start`, valid ending nodes (`DirectReply`/`ExecuteFlow`/`HumanInput`/`End`), no `Chain` nodes, `Condition` with ≥2 outgoing edges, `Loop` pointing backward, `Agent` with `agentModelConfig`
-   Fix `fixFlowData` to preserve `node.type` when it is already set (do not overwrite `agentFlow` with `customNode`)
-   Preserve backward compatibility for existing CHATFLOW validation

### Out of Scope

-   UI changes in Flowise canvas
-   Runtime execution validation (test_chatflow already exists)
-   Sequential Agent type validation (deferred — different node set)
-   Auto-fix of semantic errors (e.g., auto-adding `DirectReply`) — validation only reports

## Capabilities

### New Capabilities

-   `agentflow-validation`: Validate AGENTFLOW JSON structure, node types, and semantic rules before save or execution

### Modified Capabilities

-   `flow-validation`: Rename/refine existing validation to be explicitly CHATFLOW-only; ensure `fixFlowData` does not corrupt AGENTFLOW node types

## Approach

Split the monolithic validation into two explicit paths:

1. **Schema layer**: Two Zod schemas (`ZodChatFlowObject`, `ZodAgentFlowObject`) that validate `node.type`, `data.type`, and `data.category` according to the flow type
2. **Semantic layer**: Two semantic validators — `validateChatFlowSemantics()` checks CHATFLOW rules (ending node is Chain/Agent/Engine), `validateAgentFlowSemantics()` checks AGENTFLOW rules (Start, ending nodes, Conditions, Loops, Agent config)
3. **Fix layer**: Update `fixFlowData` to branch on flow type or, minimally, preserve existing `node.type` instead of forcing `customNode`
4. **MCP layer**: Register `validate_chatflow` (refined) and `validate_agentflow` (new) as separate tools; each receives `type` parameter

## Affected Areas

| Area                                                      | Impact   | Description                                                                                                                                   |
| --------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/flowise-mcp-server/src/flow-validation.ts`      | Modified | Add `ZodAgentFlowObject`, `validateAgentFlowData`, `validateAgentFlowSemantics`; refactor `fixFlowData` to preserve `node.type`               |
| `packages/flowise-mcp-server/src/handlers.ts`             | Modified | Add `handleValidateAgentflow`; update `handleValidateChatflow` to accept `type` param; update `validateAndFixFlowData` to branch on flow type |
| `packages/flowise-mcp-server/src/index.ts`                | Modified | Register `validate_agentflow` tool; update `validate_chatflow` schema to include `type`                                                       |
| `packages/flowise-mcp-server/src/flow-validation.test.ts` | Modified | Add tests for AGENTFLOW validation; add tests for `fixFlowData` preserving `agentFlow` type                                                   |

## Risks

| Risk                                                 | Likelihood | Mitigation                                                                                                            |
| ---------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------- |
| Breaking existing CHATFLOW validation behavior       | Low        | Keep `ZodReactFlowObject` as fallback; `validate_chatflow` defaults to CHATFLOW; extensive test coverage before merge |
| Flowise backend rejects AGENTFLOW with strict schema | Med        | Use `.passthrough()` on `ZodNodeData`; schema validates known fields, allows unknown extras                           |
| `fixFlowData` still corrupts mixed flows             | Low        | Add explicit test: node with `type: "agentFlow"` must remain `agentFlow` after fix                                    |

## Rollback Plan

Revert commit. The change is additive (new tool + schema) plus a conservative fix to `fixFlowData` (preserve existing type instead of overwrite). No database migrations. Existing CHATFLOW validation continues working via the old code path.

## Dependencies

-   None external. Uses existing `zod`, `vitest` dependencies.

## Success Criteria

-   [ ] `validate_agentflow` tool returns valid for a well-formed AGENTFLOW JSON
-   [ ] `validate_agentflow` tool catches missing `Start`, missing ending node, `Condition` with <2 edges, `Loop` pointing forward
-   [ ] `validate_chatflow` tool continues to catch CHATFLOW errors (ending node, orphan nodes)
-   [ ] `fixFlowData` preserves `node.type: "agentFlow"` instead of overwriting to `"customNode"`
-   [ ] All new code covered by Vitest tests
