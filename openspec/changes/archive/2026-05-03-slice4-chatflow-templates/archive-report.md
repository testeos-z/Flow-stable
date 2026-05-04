# Archive Report

**Change**: slice4-chatflow-templates
**Archived**: 2026-05-03
**Status**: Complete

---

## Summary

Slice 4 delivered 8 ChatFlow MVP node templates, a template-specific validator, integrity tests, and version manifest updates. This unblocks ChatFlow flow creation in `flow-architect` by providing the same template infrastructure that already existed for AgentFlow.

---

## What Was Delivered

### 8 ChatFlow MVP Templates Created

| File                                                    | Category      | Description                                                              |
| ------------------------------------------------------- | ------------- | ------------------------------------------------------------------------ |
| `templates/chatflow/chatOpenRouter.json`                | Chat Models   | Optional credential, temperature, maxTokens                              |
| `templates/chatflow/chatOpenAI.json`                    | Chat Models   | Required credential, temperature, maxTokens, topP                        |
| `templates/chatflow/chatAnthropic.json`                 | Chat Models   | Required credential, temperature, maxTokens                              |
| `templates/chatflow/bufferMemory.json`                  | Memory        | Memory key, prefixes, returnMessages                                     |
| `templates/chatflow/huggingFaceInferenceEmbedding.json` | Embeddings    | Model + credential                                                       |
| `templates/chatflow/supabase.json`                      | Vector Stores | Dual outputAnchors (retriever + vectorStore), tableName, queryName, topK |
| `templates/chatflow/retrieverTool.json`                 | Tools         | Name, description, retriever inputAnchor                                 |
| `templates/chatflow/toolAgent.json`                     | Agents        | Model + tools inputAnchors, systemMessage, maxIterations                 |

### `validateChatFlowTemplate()` Added

Exported from `schemas/chatflow.ts` and re-exported from `schemas/index.ts`. Mirrors `validateTemplate()` from `agentflow.ts` but downgrades `PLACEHOLDER_ID` to warnings (templates are blueprints; production nodes must have real IDs).

Validation pipeline:

1. `structuredClone(template)` → `autoFixNode()`
2. `ReactFlowNodeSchema.safeParse()` — hard errors
3. `NodeDataSchema.safeParse()` — hard errors
4. `ChatFlowNodeSchema.safeParse()` — filter `PLACEHOLDER_ID` issues to warnings
5. Explicit `node.id` / `data.id` PLACEHOLDER_ID checks → warnings

### 135+ Tests Passing

`schemas/__tests__/chatflow-templates.test.ts` (48 tests) validates:

-   All 8 templates pass `validateChatFlowTemplate()` with `valid: true`
-   `PLACEHOLDER_ID` is a warning, not an error
-   Substituted IDs pass clean
-   `ChatFlowNodeSchema` accepts all templates after ID substitution
-   Credential optional/required flags are correct
-   Category validation per template
-   Missing required field causes `valid: false`
-   `validateChatFlowTemplate` is re-exported from `index.ts`

Total test suite: 135 tests across 6 test files, all passing.

### `_version.json` Updated with Checksums

`templates/_version.json` now contains a `chatflowTemplates` block with 8 entries, each tracking:

-   `templateName`
-   `flowiseVersion` (2.2.7)
-   `checksum` (SHA256)
-   `lastUpdated` (2026-05-03)

### `CHATFLOW_MVP_ALLOWLIST` Cleaned

Removed `openaiEmbedding` and `chat Ollama` from the allowlist in `schemas/chatflow.ts`. The allowlist now contains exactly the 8 MVP node names.

### PLACEHOLDER_ID Handled as Warning for Templates

`validateChatFlowTemplate()` treats `PLACEHOLDER_ID` as a warning (expected in templates, must be substituted before production). The production validator `validateNode()` continues to treat it as a hard error.

---

## Specs Synced

| Domain      | Action  | Details                                              |
| ----------- | ------- | ---------------------------------------------------- |
| `flow-node` | Updated | Modified FN-002, FN-003, FN-006; added CT-001–CT-013 |

Main spec updated at: `openspec/specs/flow-node/spec.md`

---

## Archive Contents

-   `proposal.md` ✅
-   `specs/flow-node/spec.md` (delta) ✅
-   `design.md` ✅
-   `tasks.md` ✅ (15/15 tasks complete)
-   `exploration.md` ✅
-   `verify-report.md` ✅

---

## SDD Cycle Complete

The change has been fully planned, implemented, verified, and archived.
Ready for the next change.
