# Proposal: Flow-Node Strict Validation

## Intent

`flow-node` currently serves as a passive template bank (15 AgentFlow JSON blobs). It must evolve into a **strict node validator + factory** that guarantees every `IReactFlowNode` is correct for both backend execution AND Flowise canvas rendering. Without this, `flow-ing` can save broken flows that crash the canvas or fail silently at runtime.

## Scope

### In Scope (Slices 2–6)

| #   | Deliverable                                                                                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2   | Zod schemas: `ReactFlowNodeSchema`, `NodeDataSchema`, `AgentFlowNodeSchema`, `ChatFlowNodeSchema`                                                                                     |
| 3   | AgentFlow strict validation on all 15 templates (existing `templates/*.json`)                                                                                                         |
| 4   | ChatFlow MVP: templates + schemas for 8 critical nodes (chatOpenRouter, chatOpenAI, chatAnthropic, bufferMemory, HuggingFace embeddings, Supabase pgvector, retrieverTool, toolAgent) |
| 5   | Category schemas: Chat Models, Tools, Memory, Vector Stores, Embeddings                                                                                                               |
| 6   | Per-node schemas for the 8 MVP nodes (credential constraints, required inputParams, anchor shape)                                                                                     |

### Out of Scope

-   Slice 7 (full-coverage metadata-driven generator)
-   302 complete node schemas
-   Replacing `flow-ing`'s 5-stage pipeline
-   MCP tool-level Zod integration

## Capabilities

### Modified Capabilities

-   **flow-node**: Evolves from specification FN-001–FN-006 (passive template bank) to a strict validator + factory with 5-layer schema validation (R6 in SKILL.md v2.0). Core contract changes: `FlowNodeRequest` / `FlowNodeResponse` interfaces, hard-fail rule (`errors.length > 0 ⇒ node: null`), 5 validation layers, auto-fix boundary.

## Approach

**Schema delivery**: `.ts` files under `.agents/skills/flow-node/schemas/`. Flow-node agents import and execute them at runtime. Located in the skill directory (not a package) because they're agent-local, not deployed.

**Per-slice plan**:

-   **Slice 2**: Write `ReactFlowNodeSchema`, `NodeDataSchema` in Zod v4. Mirror existing conventions from `flow-validation.ts` but stricter (no `.optional()` on canvas-critical fields). Add `AgentFlowNodeSchema` / `ChatFlowNodeSchema`.
-   **Slice 3**: Write Vitest tests feeding each of the 15 templates through the 3-layer pipeline (ReactFlowNode → NodeData → AgentFlowNode). Fix any template gaps found.
-   **Slice 4**: Capture ground truth from running Flowise, create 8 ChatFlow templates under `templates/chatflow/`, write `ChatFlowNodeSchema` tests.
-   **Slice 5**: Extract category-level rules (e.g., all Chat Models must have `modelName` and a credential, all Tools must have `returnDirect`). Write schemas + tests.
-   **Slice 6**: Per-node constraints (e.g., `chatOpenRouter` requires `openRouterApi` credential UUID, `toolAgent` requires `tools[]` non-empty). Write schemas + tests.

## Affected Areas

| Path                                                 | Change                                         |
| ---------------------------------------------------- | ---------------------------------------------- |
| `.agents/skills/flow-node/schemas/`                  | New — all Zod schema `.ts` files               |
| `.agents/skills/flow-node/templates/`                | Modified — fix gaps found by strict validation |
| `.agents/skills/flow-node/templates/chatflow/`       | New — 8 ChatFlow MVP templates                 |
| `packages/flowise-mcp-server/src/flow-validation.ts` | Read-only reference — patterns reused          |

## Risks

| Risk                                                 | Mitigation                                                                                                    |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Template drift (Flowise updates change ground truth) | Version tracking per template (`_version.json`). Tests catch drift immediately.                               |
| ChatFlow node variety (no single source of truth)    | Capture ground truth from a running Flowise instance. Verify against `flow-doc` and `flowise-node-reference`. |
| Zod v4 API differences from v3                       | `flow-validation.ts` already uses Zod v4.3.5 — same version. No migration risk.                               |

## Rollback Plan

Delete `schemas/` directory and `templates/chatflow/`. SKILL.md v2.0 falls back to static template mode (Slice 1 already handles graceful degradation).

## Success Criteria

-   [ ] Slice 2: 4 Zod schemas pass Vitest with malicious template mutations
-   [ ] Slice 3: `test:coverage` > 90% for AgentFlow 15-template validation
-   [ ] Slice 4: 8 ChatFlow templates + schemas pass Vitest
-   [ ] Slice 5: Category schemas cover 5 priority categories with tests
-   [ ] Slice 6: Per-node schemas reject invalid configs (wrong credential, missing tools, empty modelName)

## Delivery Strategy

-   **Mode**: auto-chain (feature-branch-chain)
-   **Budget**: 400-line slices
-   **PR chain**: Slice 2 → 3 → 4 → 5 → 6 (sequential, each depends on previous schemas)
