# Tasks: AgentFlow Validation Tools

## Phase 1: Foundation — Schemas and Types

-   [ ] 1.1 Add `AgentFlowNodeType` enum constant in `flow-validation.ts` with all 13 valid AGENTFLOW node types
-   [ ] 1.2 Add `ZodAgentFlowNode` schema extending `ZodReactFlowNode` with `type: "agentFlow"` and `category: "Agent Flows"` constraints
-   [ ] 1.3 Add `ZodAgentFlowObject` schema extending `ZodReactFlowObject` with `nodes: z.array(ZodAgentFlowNode)`
-   [ ] 1.4 Export new types: `AgentFlowNode`, `AgentFlowObject` inferred from Zod schemas
-   [ ] 1.5 Refactor `fixFlowData()` line 352: change `type: 'customNode'` to preserve existing `node.type` if present, only inject default when missing

## Phase 2: Core Implementation — Validation Functions

-   [ ] 2.1 Implement `validateAgentFlowData()` function: parse JSON, validate against `ZodAgentFlowObject`, return `FlowValidationResult`
-   [ ] 2.2 Implement `validateAgentFlowSemantics()` function: check exactly one `Start`, at least one ending node (`DirectReply`/`ExecuteFlow`/`HumanInput`/`End`), no `Chain` category nodes
-   [ ] 2.3 Add `Condition`/`ConditionAgent` outgoing edge count validation (must be ≥2)
-   [ ] 2.4 Add `Loop` backward-pointing validation (target must be earlier in execution path)
-   [ ] 2.5 Add `Agent` node `agentModelConfig.modelName` presence validation
-   [ ] 2.6 Update `handleValidateChatflow()` signature to accept optional `type` parameter with CHATFLOW default
-   [ ] 2.7 Add `handleValidateAgentflow()` handler function in `handlers.ts`
-   [ ] 2.8 Update `validateAndFixFlowData()` to pass flow type context (or auto-detect from first node) to `fixFlowData`

## Phase 3: MCP Integration

-   [ ] 3.1 Register `validate_agentflow` MCP tool in `index.ts` with Zod schema for `flowData` parameter
-   [ ] 3.2 Update `validate_chatflow` MCP tool schema to include optional `type` enum parameter
-   [ ] 3.3 Update `.opencode/opencode.json` permissions to include `flow-validation_validate_agentflow` tool

## Phase 4: Testing

-   [ ] 4.1 Write Vitest test: `ZodAgentFlowObject.safeParse()` with valid AGENTFLOW JSON passes
-   [ ] 4.2 Write Vitest test: `ZodAgentFlowObject.safeParse()` with CHATFLOW node inside fails with clear error
-   [ ] 4.3 Write Vitest test: `validateAgentFlowSemantics()` returns error for zero Start nodes
-   [ ] 4.4 Write Vitest test: `validateAgentFlowSemantics()` returns error for multiple Start nodes
-   [ ] 4.5 Write Vitest test: `validateAgentFlowSemantics()` returns error for missing ending node
-   [ ] 4.6 Write Vitest test: `validateAgentFlowSemantics()` returns error for Condition with one outgoing edge
-   [ ] 4.7 Write Vitest test: `validateAgentFlowSemantics()` returns error for Loop pointing forward
-   [ ] 4.8 Write Vitest test: `validateAgentFlowSemantics()` returns error for Agent without `modelName`
-   [ ] 4.9 Write Vitest test: `fixFlowData()` preserves `type: "agentFlow"` on node with missing defaults
-   [ ] 4.10 Write Vitest test: `fixFlowData()` injects `type: "customNode"` only when type is completely missing
-   [ ] 4.11 Run existing test suite to ensure zero regressions in CHATFLOW validation
-   [ ] 4.12 Write integration test: `handleValidateAgentflow()` MCP handler end-to-end with valid AGENTFLOW fixture

## Phase 5: Verification and Documentation

-   [ ] 5.1 Update `flow-architect` skill reference to document the new `validate_agentflow` tool
-   [ ] 5.2 Update `flowise-node-reference` skill reference `04-flowdata-schema.md` to note AGENTFLOW-specific schema differences
-   [ ] 5.3 Verify all new code passes TypeScript compilation (`pnpm run build` in flowise-mcp-server)
-   [ ] 5.4 Verify all tests pass (`pnpm test` in flowise-mcp-server)
