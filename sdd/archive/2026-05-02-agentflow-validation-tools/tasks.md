# Tasks: AgentFlow Validation Tools

## Phase 1: Foundation — Schemas and Types

-   [x] 1.1 Add `AgentFlowNodeType` enum constant in `flow-validation.ts` with all 13 valid AGENTFLOW node types
-   [x] 1.2 Add `ZodAgentFlowNode` schema extending `ZodReactFlowNode` with `type: "agentFlow"` and `category: "Agent Flows"` constraints
-   [x] 1.3 Add `ZodAgentFlowObject` schema extending `ZodReactFlowObject` with `nodes: z.array(ZodAgentFlowNode)`
-   [x] 1.4 Export new types: `AgentFlowNode`, `AgentFlowObject` inferred from Zod schemas
-   [x] 1.5 Refactor `fixFlowData()` line 352: change `type: 'customNode'` to preserve existing `node.type` if present, only inject default when missing

## Phase 2: Core Implementation — Validation Functions

-   [x] 2.1 Implement `validateAgentFlowData()` function: parse JSON, validate against `ZodAgentFlowObject`, return `FlowValidationResult`
-   [x] 2.2 Implement `validateAgentFlowSemantics()` function: check exactly one `Start`, at least one ending node (`DirectReply`/`ExecuteFlow`/`HumanInput`/`End`), no `Chain` category nodes
-   [x] 2.3 Add `Condition`/`ConditionAgent` outgoing edge count validation (must be ≥2)
-   [x] 2.4 Add `Loop` backward-pointing validation (target must be earlier in execution path)
-   [x] 2.5 Add `Agent` node `agentModelConfig.modelName` presence validation
-   [x] 2.6 Update `handleValidateChatflow()` signature to accept optional `type` parameter with CHATFLOW default
-   [x] 2.7 Add `handleValidateAgentflow()` handler function in `handlers.ts`
-   [x] 2.8 Update `validateAndFixFlowData()` to auto-detect flow type from nodes and validate against correct schema after fix

## Phase 3: MCP Integration

-   [x] 3.1 Register `validate_agentflow` MCP tool in `index.ts` with Zod schema for `flowData` parameter
-   [x] 3.2 Update `validate_chatflow` MCP tool schema to include optional `type` enum parameter
-   [x] 3.3 Update `.opencode/opencode.json` permissions to include `flow-validation_validate_agentflow` tool for both flow-architect and flow-ing agents

## Phase 4: Testing

-   [x] 4.1 Write Vitest test: `ZodAgentFlowObject.safeParse()` with valid AGENTFLOW JSON passes
-   [x] 4.2 Write Vitest test: `ZodAgentFlowObject.safeParse()` with CHATFLOW node inside fails with clear error
-   [x] 4.3 Write Vitest test: `validateAgentFlowSemantics()` returns error for zero Start nodes
-   [x] 4.4 Write Vitest test: `validateAgentFlowSemantics()` returns error for multiple Start nodes
-   [x] 4.5 Write Vitest test: `validateAgentFlowSemantics()` returns error for missing ending node
-   [x] 4.6 Write Vitest test: `validateAgentFlowSemantics()` returns error for Condition with one outgoing edge
-   [x] 4.7 Write Vitest test: `validateAgentFlowSemantics()` returns error for Loop pointing forward
-   [x] 4.8 Write Vitest test: `validateAgentFlowSemantics()` returns error for Agent without `modelName`
-   [x] 4.9 Write Vitest test: `fixFlowData()` preserves `type: "agentFlow"` on node with missing defaults
-   [x] 4.10 Write Vitest test: `fixFlowData()` injects `type: "customNode"` only when type is completely missing
-   [x] 4.11 Run existing test suite to ensure zero regressions in CHATFLOW validation
-   [ ] 4.12 Write integration test: `handleValidateAgentflow()` MCP handler end-to-end with valid AGENTFLOW fixture

## Phase 5: Verification and Documentation

-   [ ] 5.1 Update `flow-architect` skill reference to document the new `validate_agentflow` tool
-   [ ] 5.2 Update `flowise-node-reference` skill reference `04-flowdata-schema.md` to note AGENTFLOW-specific schema differences
-   [x] 5.3 Verify all new code passes TypeScript compilation (`pnpm run build` in flowise-mcp-server)
-   [x] 5.4 Verify all tests pass (`pnpm test` in flowise-mcp-server)
