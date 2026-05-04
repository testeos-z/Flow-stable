# Archive Report — flow-node-validation

**Change**: `flow-node-validation`
**Version**: 1.0
**Mode**: hybrid (`openspec/` + Engram)
**Archived**: 2026-05-03
**Status**: COMPLETE

---

## Change Summary

Evolve `flow-node` from passive AgentFlow template bank to strict validator + factory for AgentFlow and ChatFlow nodes. This is Slice 2 of a multi-slice proposal (Slices 3–6 remain).

---

## Deliverables (Slice 2)

| File                                     | Status                |
| ---------------------------------------- | --------------------- |
| `schemas/issues.ts`                      | ✅ Created            |
| `schemas/common.ts`                      | ✅ Created            |
| `schemas/agentflow.ts`                   | ✅ Created            |
| `schemas/chatflow.ts`                    | ✅ Created            |
| `schemas/index.ts`                       | ✅ Created            |
| `schemas/__tests__/common.test.ts`       | ✅ Created (14 tests) |
| `schemas/__tests__/agentflow.test.ts`    | ✅ Created (15 tests) |
| `schemas/__tests__/chatflow.test.ts`     | ✅ Created (15 tests) |
| `schemas/__tests__/validateNode.test.ts` | ✅ Created (25 tests) |
| `SKILL.md` (updated)                     | ✅ Updated            |
| **Total**                                | **69 tests passing**  |

---

## Key Decisions

-   **Zod schema layering**: `ReactFlowNodeSchema` → `NodeDataSchema` → `AgentFlowNodeSchema | ChatFlowNodeSchema` → semantic checks
-   **Auto-fix before validation** (position, width/height, selected, dragging, inputs)
-   **Hard failure rule**: `errors.length > 0 → node: null`
-   **Allowlists**: 15 AgentFlow names, 10 ChatFlow MVP names
-   **UNSUPPORTED_NODE_TYPE** for non-MVP ChatFlow nodes (via `validateChatFlowSemantics`)
-   `runValidation()` made async (required by async `validateNode`)
-   Credential UUID validation NOT wired in this slice (documented gap)

---

## Implementation Notes

### PR Chain

-   **PR 1** (T1, T2, T3, T7): Infrastructure + common schemas
-   **PR 2** (T4, T5, T6, T8, T9): AgentFlow + ChatFlow schemas
-   **PR 3** (T10, T11, T12): Tests + SKILL.md + verification

### Test Results

-   69/69 tests passing
-   `tsc --noEmit` clean (zero TypeScript errors)
-   SKILL.md updated with "Schema Validation (implemented)" section

---

## Known Gaps (documented, not blocking)

| Gap                                                                                         | Status                                                                                | Future Slice |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------ |
| Credential UUID validation (`INVALID_CREDENTIAL_FORMAT`)                                    | Not wired to validateNode                                                             | Slice 6      |
| `STALE_CHECKSUM` warning                                                                    | Not implemented in validateNode                                                       | Slice 3      |
| `validateAgentFlowSemantics` / `validateChatFlowSemantics` not called from `validateNode()` | Semantic validation exists but not wired into node-level validation pipeline          | Slice 3      |
| UNSUPPORTED_NODE_TYPE error code                                                            | Used by `validateChatFlowSemantics()` (graph-level), not by `validateNode()` directly | Slice 3      |

---

## Next Steps (Slices 3–6)

| Slice   | Focus                                                                         | Status  |
| ------- | ----------------------------------------------------------------------------- | ------- |
| Slice 3 | AgentFlow strict validation on 15 existing templates                          | Pending |
| Slice 4 | ChatFlow MVP templates + per-node schemas                                     | Pending |
| Slice 5 | Category schemas (Chat Models, Tools, Memory, Vector Stores, Embeddings)      | Pending |
| Slice 6 | Per-node schemas for critical nodes (credential constraints, required params) | Pending |

---

## Artifacts

### Filesystem

```
openspec/changes/archive/2026-05-03-flow-node-validation/
├── proposal.md
├── design.md
├── tasks.md
├── verify-report.md
└── archive-report.md (this file)
```

### Engram Topics

| Topic Key                                 | Description                |
| ----------------------------------------- | -------------------------- |
| `sdd/flow-node-validation/proposal`       | Proposal (3rd obs)         |
| `sdd/flow-node-validation/design`         | Technical design           |
| `sdd/flow-node-validation/tasks`          | Task breakdown             |
| `sdd/flow-node-validation/apply-progress` | 3 PRs complete, 69 tests   |
| `sdd/flow-node-validation/verify-report`  | Verification report (PASS) |
| `sdd/flow-node-validation/archive-report` | This report                |

---

## Verification Summary

-   **Tasks**: 12/12 complete
-   **Tests**: 69/69 passing
-   **TypeScript**: Clean
-   **SKILL.md**: Updated with implementation evidence
-   **Verdict**: PASS

---

_Archive created by sdd-archive skill — SDD cycle complete for flow-node-validation Slice 2._
