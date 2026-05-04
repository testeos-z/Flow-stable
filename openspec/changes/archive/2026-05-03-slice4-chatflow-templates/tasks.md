# Tasks: Slice 4 — ChatFlow MVP Templates

## Review Workload Forecast

| Field                   | Value                                             |
| ----------------------- | ------------------------------------------------- |
| Estimated changed lines | ~900 (8 templates + validator + tests + manifest) |
| 400-line budget risk    | High                                              |
| Chained PRs recommended | Yes                                               |
| Suggested split         | PR 1 → PR 2 → PR 3                                |
| Delivery strategy       | auto-chain                                        |
| Chain strategy          | feature-branch-chain                              |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal                                                                | Likely PR | Notes                          |
| ---- | ------------------------------------------------------------------- | --------- | ------------------------------ |
| 1    | validateChatFlowTemplate() + 4 simple templates + allowlist cleanup | PR 1      | ~380 lines; no tests yet       |
| 2    | 3 chat model templates + \_version.json entries                     | PR 2      | ~320 lines; branches from PR 1 |
| 3    | toolAgent template + integrity tests + \_version.json final update  | PR 3      | ~200 lines; branches from PR 2 |

## Phase 1: Foundation

-   [x] 1.1 Prune `CHATFLOW_MVP_ALLOWLIST` in `.agents/skills/flow-node/schemas/chatflow.ts` — remove `openaiEmbedding` and `chat Ollama` (~5 lines, no deps, test: allowlist length === 8).
-   [x] 1.2 Add `validateChatFlowTemplate()` export to `chatflow.ts` — structuredClone → autoFixNode → ReactFlowNodeSchema → NodeDataSchema → ChatFlowNodeSchema with PLACEHOLDER_ID downgraded to warnings (~60 lines, no deps, test: CT-011-S1, CT-011-S2).

## Phase 2: Templates PR1 — Simple Nodes

-   [x] 2.1 Create `.agents/skills/flow-node/templates/chatflow/bufferMemory.json` from golden template — Memory category, no inputAnchors (~40 lines, no deps, test: CT-004-S1).
-   [x] 2.2 Create `.agents/skills/flow-node/templates/chatflow/huggingFaceInferenceEmbedding.json` — Embeddings category, model + credential (~55 lines, no deps, test: CT-005-S1).
-   [x] 2.3 Create `.agents/skills/flow-node/templates/chatflow/supabase.json` — Vector Stores category, dual outputAnchors (retriever + vectorStore), tableName + queryName + topK + credential (~60 lines, no deps, test: CT-006-S1).
-   [x] 2.4 Create `.agents/skills/flow-node/templates/chatflow/retrieverTool.json` — Tools category, name + description + retriever inputAnchor (~55 lines, no deps, test: CT-007-S1).

## Phase 3: Templates PR2 — Chat Models

-   [x] 3.1 Create `.agents/skills/flow-node/templates/chatflow/chatOpenRouter.json` — Chat Models category, optional credential, temperature, maxTokens (~130 lines, no deps, test: CT-001-S1).
-   [x] 3.2 Create `.agents/skills/flow-node/templates/chatflow/chatOpenAI.json` — Chat Models category, required credential, temperature, maxTokens, topP (~170 lines, no deps, test: CT-002-S1).
-   [x] 3.3 Create `.agents/skills/flow-node/templates/chatflow/chatAnthropic.json` — Chat Models category, required credential, temperature, maxTokens (~150 lines, no deps, test: CT-003-S1).
-   [x] 3.4 Update `.agents/skills/flow-node/templates/_version.json` — add SHA256 checksum entries for all 7 templates completed so far (~35 lines, deps: 2.1–3.3, test: CT-012-S1).

## Phase 4: Templates PR3 — Agent + Tests + Manifest

-   [x] 4.1 Create `.agents/skills/flow-node/templates/chatflow/toolAgent.json` — Agents category, model + tools array inputAnchors, systemMessage, maxIterations (~70 lines, no deps, test: CT-008-S1).
-   [x] 4.2 Update `.agents/skills/flow-node/templates/_version.json` — add SHA256 entry for toolAgent.json (~5 lines, deps: 4.1, test: CT-012-S2 checksum mismatch detection).
-   [x] 4.3 Create `.agents/skills/flow-node/schemas/__tests__/chatflow-templates.test.ts` — glob 8 templates, run `validateChatFlowTemplate()`, assert `valid: true` + warnings + count === 8, missing-field failure case (~80 lines, deps: 1.2 + 2.1–4.1, test: CT-009-S1, CT-010-S1, CT-013-S1, CT-013-S2).

## Phase 5: Export Wiring

-   [x] 5.1 Re-export `validateChatFlowTemplate` from `.agents/skills/flow-node/schemas/index.ts` if not already present (~2 lines, deps: 1.2, test: import resolves).
