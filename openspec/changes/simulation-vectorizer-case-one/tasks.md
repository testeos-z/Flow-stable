# Tasks: Simulation Vectorizer — Case One

## Review Workload Forecast

| Field                   | Value                                 |
| ----------------------- | ------------------------------------- |
| Estimated changed lines | ~950 source + ~700 tests ≈ 1650       |
| 400-line budget risk    | High                                  |
| Chained PRs recommended | No (user opted out)                   |
| Suggested split         | Single PR with `size:exception` label |
| Delivery strategy       | single-pr (user explicit)             |
| Chain strategy          | size-exception                        |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

> User explicitly opted out of chained PRs and accepts the large diff. Tasks below are ordered so every commit can compile + test green before moving on — strict TDD (RED → GREEN → REFACTOR) per `openspec/config.yaml#strict_tdd`.

Test command (default for every test task unless overridden):
`pnpm --filter flowise-components test -- <pattern>`

---

## Slice 0 — Setup (no code, no tests)

-   [x] **T-01** Confirm change folder exists at `openspec/changes/simulation-vectorizer-case-one/` (proposal.md, design.md, specs/, tasks.md). _DoD_: `ls` shows all four. _Files_: none touched.
-   [x] **T-02** Add `franc` (^6.x) to `dependencies` of `packages/components/package.json`. _DoD_: diff shows single new line; no version range conflict with React 18 / TS 4.x. _Files_: `packages/components/package.json`. _Satisfies_: REQ-7 (language detection).
-   [x] **T-03** Run `pnpm install --filter flowise-components` and commit `pnpm-lock.yaml` delta. _DoD_: lockfile updated, no peer-dep warnings on `franc`. _Files_: `pnpm-lock.yaml`. _Cmd_: `pnpm install --filter flowise-components`.
-   [x] **T-04** Decide on `iso-639-1`: confirm inline `ISO_639_3_TO_1` table (design §10) covers `spa/eng/por/fra/deu/ita`. _No new dep_. _DoD_: comment in tasks.md + design unchanged. _Satisfies_: REQ-7.

---

## Slice 1 — Credential (SupabaseUserAuth)

-   [x] **T-05** Create `packages/components/credentials/SupabaseUserAuth.credential.ts` exporting `credClass` with the 4-field schema from design §3 (projUrl, anonKey password-typed, email, password password-typed). _DoD_: file compiles with `tsc --noEmit`; existing `SupabaseApi.credential.ts` untouched (`git diff` proves it). _Files_: `packages/components/credentials/SupabaseUserAuth.credential.ts`. _Satisfies_: REQ-2.
-   [x] **T-06** Manual verification: ~~start dev server (`pnpm dev`), open Credentials UI, confirm "Supabase User Auth" appears with 4 fields and password fields render as `type=password`~~ — **per apply-block-1 orchestrator decision, dev-server smoke is deferred to T-58; this task closed on `tsc --noEmit` PASS (exit 0). UI smoke verification will be performed in T-58 manual smoke phase.** _DoD_: typecheck pass. _Satisfies_: REQ-2 Scenario 1 (deferred to T-58).

---

## Slice 2 — Pure modules (RED → GREEN → REFACTOR)

### narrative.ts

-   [ ] **T-07** RED: Write `__tests__/narrative.test.ts` with cases (a) full CaseOneData snapshot, (b) nullable fields produce no section, (c) empty actors/timeline/questions arrays skipped, (d) unknown keys ignored. Test MUST fail (module does not exist). _DoD_: `jest` shows red. _Files_: `packages/components/nodes/a2a/SimulationVectorizerCaseOne/__tests__/narrative.test.ts`. _Satisfies_: REQ-7 (narrative half).
-   [ ] **T-08** GREEN: Implement `packages/components/nodes/a2a/SimulationVectorizerCaseOne/narrative.ts` with `CaseOneData` interface + `prepareCaseForVectorization` per design §9. NO imports beyond TS types. _DoD_: T-07 tests pass. _Satisfies_: REQ-7.
-   [ ] **T-09** REFACTOR: extract `safe()` helper if duplication; ensure 0 ESLint warnings; ≥85% statements. _DoD_: `pnpm lint` clean; `pnpm --filter flowise-components test -- narrative --coverage` ≥85%.

### language.ts

-   [ ] **T-10** RED: Write `__tests__/language.test.ts`: (a) LLM returns "es" → returns "es"; (b) LLM returns garbage → falls back to `franc`; (c) `franc` returns "spa" → returns "es" via mapping; (d) `franc` returns "und" + no LLM → returns ""; (e) LLM throws → fallback to franc. Mock both `franc` and the LLM. _DoD_: red. _Files_: `__tests__/language.test.ts`. _Satisfies_: REQ-7.
-   [ ] **T-11** GREEN: Implement `language.ts` per design §10. Import `franc` and ISO map. NO supabase / langchain imports. _DoD_: T-10 passes. _Satisfies_: REQ-7 Scenarios 1-3.
-   [ ] **T-12** REFACTOR: tighten regex, extract `ISO_639_3_TO_1` to top-level const. Coverage ≥85%. _DoD_: lint clean.

---

## Slice 3 — Infrastructure modules (test-first with mocks)

### bucket-walker.ts

-   [ ] **T-13** RED: Write `__tests__/bucket-walker.test.ts` mocking `client.storage.from().list()`: (a) flat dir; (b) nested 3 levels (folder marker `id===null`); (c) empty bucket → `[]`; (d) `maxDepth=2` exceeded → throws; (e) infers mime from extension lowercase. _DoD_: red. _Satisfies_: REQ-6.
-   [ ] **T-14** GREEN: Implement `bucket-walker.ts` per design §7. Pure-ish: receives `(client, bucket, prefix, opts?)`; returns `Array<{path, mime, sizeBytes}>`. Recurse when `item.id === null`. _DoD_: T-13 passes. _Satisfies_: REQ-6 Scenarios 1-2.
-   [ ] **T-15** REFACTOR: Extract `inferMime()`; document depth-cap rationale; coverage ≥85%.

### file-parsers.ts

-   [ ] **T-16** RED: Write `__tests__/file-parsers.test.ts` mocking `@langchain/community/document_loaders`: (a) `parsePdf` returns one entry per page with `page_number`; (b) `parseMarkdown` returns one entry from `blob.text()`; (c) `parsePlainText` same; (d) `parseJson` invalid JSON throws; (e) `parseDocx` returns one entry; (f) `parseByMime` unknown mime throws `UnsupportedMimeError`; (g) corrupted PDF propagates loader error. _DoD_: red. _Satisfies_: REQ-7.
-   [ ] **T-17** GREEN: Implement `file-parsers.ts` per design §8. Export `parsePdf, parseMarkdown, parsePlainText, parseJson, parseDocx, parseByMime, UnsupportedMimeError`. Never instantiate a Supabase client. _DoD_: T-16 passes. _Satisfies_: REQ-7 Scenarios 1-3.
-   [ ] **T-18** REFACTOR: consolidate MIME → fn dispatch into a typed `Record`; coverage ≥85%.

---

## Slice 4 — Tool class (`core.ts`) — strict TDD per behavior

> Each red test below is followed immediately by the minimum implementation slice that makes it pass. Sanitization helper is built first because every error path calls it.

-   [ ] **T-19** RED: `__tests__/core.test.ts` — `sanitizeError()` redacts `Bearer <token>`, email addresses, and any supplied secret >4 chars. _DoD_: red. _Satisfies_: REQ-13, REQ-14.
-   [ ] **T-20** GREEN: Implement `sanitizeError()` in `core.ts` per design §13. _DoD_: T-19 passes. _Satisfies_: REQ-13.

-   [ ] **T-21** RED: Test `SimulationVectorizerTool` constructor closes `simulationId` and exposes empty Zod schema `z.object({}).optional()`. _DoD_: red. _Satisfies_: REQ-3.
-   [ ] **T-22** GREEN: Implement constructor + `ToolDeps` type + super call with empty schema. _DoD_: T-21 passes. _Satisfies_: REQ-3.

-   [ ] **T-23** RED: Test `ensureJwt()` (a) calls `signInWithPassword` on first call, (b) returns cached token within TTL, (c) recomputes after TTL expiry, (d) TTL = `min(jwtCacheTtlMinutes*60s, expires_in - 5min)`. Mock `client.auth`. _DoD_: red. _Satisfies_: REQ-4.
-   [ ] **T-24** GREEN: Implement `ensureJwt()` per design §6. _DoD_: T-23 passes. _Satisfies_: REQ-4 Scenarios 1-2.

-   [ ] **T-25** RED: Test `handle401Once<T>(fn)`: (a) success first try → calls once; (b) 401 then success → calls `signInWithPassword` exactly once + retries once; (c) 401 then 401 → propagates error after one retry. _DoD_: red. _Satisfies_: REQ-4.
-   [ ] **T-26** GREEN: Implement `handle401Once()` per design §6. _DoD_: T-25 passes. _Satisfies_: REQ-4 Scenario 3.

-   [ ] **T-27** RED: Test `fetchForm()` via mocked `functions.invoke`: (a) 2xx returns parsed data; (b) `success: false` aborts with stage `fetch-form`; (c) non-2xx surfaces status + message; (d) malformed JSON aborts. _DoD_: red. _Satisfies_: REQ-5.
-   [ ] **T-28** GREEN: Implement `fetchForm()` wrapped in `handle401Once`. _DoD_: T-27 passes. _Satisfies_: REQ-5 Scenarios 1-3.

-   [ ] **T-29** RED: Test `deleteForSimulation()` runs DELETE on both tables filtered by `simulation_id` AND `case='one'`; either failure throws with the failing table named. _DoD_: red. _Satisfies_: REQ-10.
-   [ ] **T-30** GREEN: Implement `deleteForSimulation()` per design §11. _DoD_: T-29 passes. _Satisfies_: REQ-10 Scenario 3.

-   [ ] **T-31** RED: Test `insertBatched(simRows, docRows)`: (a) batches of 500; (b) mid-batch error throws with batch index; (c) null-embedding row rejected before insert. _DoD_: red. _Satisfies_: REQ-10, REQ-11.
-   [ ] **T-32** GREEN: Implement `insertBatched()` + `batchOf()` per design §11 + pre-insert null-embedding validation. _DoD_: T-31 passes. _Satisfies_: REQ-10 Scenario 4, REQ-11 Scenario 3.

-   [ ] **T-33** RED: Test `_call()` HAPPY PATH end-to-end with every collaborator mocked: auth → fetch-form → walk → parse → narrative → language → chunk → embed → delete → insert. Asserts returned JSON envelope per design §12 with `ok: true, rowsInserted: { simulations: N, documents: M }, language, durationMs, warnings: []`. _DoD_: red. _Satisfies_: REQ-12.
-   [ ] **T-34** GREEN: Implement `_call()` orchestrator (12-step pipeline) tracking `stage`. _DoD_: T-33 passes. _Satisfies_: REQ-5, REQ-6, REQ-7, REQ-8, REQ-9, REQ-10, REQ-12.

-   [ ] **T-35** RED: Test `_call()` ERROR ENVELOPES per stage: (a) auth fail → `{ ok:false, stage:'auth' }`; (b) fetch-form fail → stage `fetch-form`; (c) parse fail on supported file → warning + continues; (d) splitter throws → stage `chunk`; (e) embed throws → stage `embed`; (f) DELETE fails → stage `delete`, NO insert attempted; (g) INSERT mid-batch fails → stage `insert`. EVERY error returns JSON (never throws). _DoD_: red. _Satisfies_: REQ-12, REQ-13.
-   [ ] **T-36** GREEN: Wrap the pipeline in try/catch that records `stage` and returns `JSON.stringify({ ok:false, error: sanitizeError(e, [anonKey, password, jwt]), simulationId, durationMs, stage })`. _DoD_: T-35 passes. _Satisfies_: REQ-12, REQ-13, REQ-14.

-   [ ] **T-37** RED: Test `_call()` RLS bucket denial (403) → warning recorded, run continues with form-only narrative. _DoD_: red. _Satisfies_: REQ-6 Scenario 3.
-   [ ] **T-38** GREEN: Catch bucket-walker error inside `_call`, push warning, set `files=[]`. _DoD_: T-37 passes. _Satisfies_: REQ-6 Scenario 3.

-   [ ] **T-39** RED: Test unsupported / corrupted file → skipped with warning, run completes. _DoD_: red. _Satisfies_: REQ-7 Scenarios 2-3.
-   [ ] **T-40** GREEN: `parseFiles()` in `core.ts` wraps `parseByMime` in try/catch → warning. _DoD_: T-39 passes. _Satisfies_: REQ-7.

-   [ ] **T-41** RED: Test column mapping per insert: `simulations` row has the 7 required columns + `case='one'` + no `id/created_at/updated_at`; `document_simulation` row likewise + optional `page_number` only for PDFs. _DoD_: red. _Satisfies_: REQ-11.
-   [ ] **T-42** GREEN: Implement row builders inside `_call()` mapping chunks + metadata exactly per design §11 / spec REQ-11. _DoD_: T-41 passes. _Satisfies_: REQ-11 Scenarios 1-2.

-   [ ] **T-43** REFACTOR: Extract row builders to private methods; split `_call()` into private stage methods if it exceeds ~120 LOC; coverage of `core.ts` ≥85%; sanitization applied to EVERY thrown error before bubbling. _DoD_: `pnpm --filter flowise-components test -- core --coverage` ≥85%, lint clean.

---

## Slice 5 — INode wrapper (`SimulationVectorizerCaseOne.ts`)

-   [ ] **T-44** RED: `__tests__/SimulationVectorizerCaseOne.test.ts` — INode contract: `label`, `name='simulationVectorizerCaseOne'`, `type='SimulationVectorizerCaseOne'`, `category='A2A Knowledge'`, `author='GobernAI'`, `credential.credentialNames=['supabaseUserAuth']`, `inputs[]` matches design §4 in order/types/defaults including `acceptVariable: true` on `simulationId`. _DoD_: red. _Satisfies_: REQ-1, REQ-3.
-   [ ] **T-45** GREEN: Implement class shell (constructor + properties) per design §4. _DoD_: T-44 passes. _Satisfies_: REQ-1, REQ-3.

-   [ ] **T-46** RED: Test `init()` returns a `SimulationVectorizerTool` with `simulationId` closed over (NOT in Zod schema). Mock `getCredentialData`. _DoD_: red. _Satisfies_: REQ-3.
-   [ ] **T-47** GREEN: Implement happy-path `init()` body wiring deps. _DoD_: T-46 passes. _Satisfies_: REQ-3 Scenario 1.

-   [ ] **T-48** RED: Test `init()` throws "Embeddings input is required" when `nodeData.inputs.embeddings` is undefined. _DoD_: red. _Satisfies_: REQ-9.
-   [ ] **T-49** GREEN: Add the early embeddings guard. _DoD_: T-48 passes. _Satisfies_: REQ-9 Scenario 2.

-   [ ] **T-50** RED: Test `init()` throws on (a) empty `simulationId`, (b) non-UUID `simulationId`, BEFORE any Supabase activity. _DoD_: red. _Satisfies_: REQ-3.
-   [ ] **T-51** GREEN: Add UUID regex guard before `createClient`. _DoD_: T-50 passes. _Satisfies_: REQ-3 Scenario 2.

-   [ ] **T-52** RED: Test default `textSplitter` is `RecursiveCharacterTextSplitter(1500/200)` when input absent; respects user `chunkSize/chunkOverlap`. _DoD_: red. _Satisfies_: REQ-8.
-   [ ] **T-53** GREEN: Implement splitter default fallback. _DoD_: T-52 passes. _Satisfies_: REQ-8.

-   [ ] **T-54** REFACTOR: Extract `assertUuid()` helper; ensure `baseClasses` includes `getBaseClasses(SimulationVectorizerTool)`; lint clean; coverage ≥85%.

---

## Slice 6 — Icon + integration build

-   [ ] **T-55** Add placeholder `simulation-vectorizer-case-one.svg` (24x24, neutral icon) in the node dir. _DoD_: file exists, valid SVG. _Files_: `packages/components/nodes/a2a/SimulationVectorizerCaseOne/simulation-vectorizer-case-one.svg`. _Satisfies_: REQ-1.
-   [ ] **T-56** Run `pnpm --filter flowise-components build`. _DoD_: zero TS errors, build artifacts in `dist/`. _Cmd_: `pnpm --filter flowise-components build`.
-   [ ] **T-57** Run full scoped test suite. _DoD_: all green, coverage ≥85% per file. _Cmd_: `pnpm --filter flowise-components test -- SimulationVectorizerCaseOne --coverage`.
-   [ ] **T-58** Manual smoke: `pnpm dev`, open canvas, search "Simulation Vectorizer", confirm node appears under `A2A Knowledge`, drop on canvas, configure credential, verify `simulationId` input shows `acceptVariable` hint. _DoD_: screenshot in PR. _Satisfies_: REQ-1 Scenario 1.

---

## Slice 7 — Pre-PR cleanup

-   [ ] **T-59** Run `pnpm lint --filter flowise-components`. Zero warnings. _Cmd_: `pnpm lint --filter flowise-components`.
-   [ ] **T-60** Run `pnpm format` if defined at repo root (Prettier `printWidth: 140, singleQuote, 4-space tabs`). _Cmd_: `pnpm format` or `pnpm prettier --write packages/components/nodes/a2a/SimulationVectorizerCaseOne packages/components/credentials/SupabaseUserAuth.credential.ts`.
-   [ ] **T-61** Grep new files for `TODO|FIXME|XXX|console\.log`. Resolve or justify each in a comment. _Cmd_: `grep -RnE 'TODO|FIXME|XXX|console\.log' packages/components/nodes/a2a/SimulationVectorizerCaseOne packages/components/credentials/SupabaseUserAuth.credential.ts`.
-   [ ] **T-62** Cross-check this file vs spec: every REQ-1..REQ-14 maps to ≥1 test task in the matrix below. No orphans. _DoD_: matrix verified.
-   [ ] **T-63** Open PR with title `feat(a2a): add simulation-vectorizer-case-one node`, label `size:exception`, body links to engram artifacts (#364 proposal, #365 spec, #366 design, #363 architecture). _DoD_: PR open, CI green.

---

## Spec Coverage Matrix

| Requirement                | Title                                     | Test tasks             | Implementation tasks   |
| -------------------------- | ----------------------------------------- | ---------------------- | ---------------------- |
| REQ-1                      | Node Registration and Discovery           | T-44, T-58             | T-45, T-55, T-56       |
| REQ-2                      | Credential Schema supabaseUserAuth        | T-06 (manual)          | T-05                   |
| REQ-3                      | simulationId Resolution from Flow State   | T-21, T-44, T-46, T-50 | T-22, T-45, T-47, T-51 |
| REQ-4                      | Supabase User Authentication              | T-23, T-25             | T-24, T-26             |
| REQ-5                      | Edge Function Invocation                  | T-27, T-33, T-35       | T-28, T-34, T-36       |
| REQ-6                      | Recursive Bucket Walk                     | T-13, T-33, T-37       | T-14, T-34, T-38       |
| REQ-7                      | File Type Parsing                         | T-07, T-10, T-16, T-39 | T-08, T-11, T-17, T-40 |
| REQ-7 (narrative+language) | Narrative Formatting & Language Detection | T-07, T-10, T-33       | T-08, T-11, T-34       |
| REQ-8                      | Chunking Strategy                         | T-33, T-35, T-52       | T-34, T-53             |
| REQ-9                      | Embedding Generation                      | T-33, T-48             | T-34, T-49             |
| REQ-10                     | Idempotent Persistence                    | T-29, T-31, T-33, T-35 | T-30, T-32, T-34, T-36 |
| REQ-11                     | Column Mapping per Insert                 | T-31, T-41             | T-32, T-42             |
| REQ-12                     | Return Contract                           | T-33, T-35             | T-34, T-36             |
| REQ-13                     | Logging and Security (sanitization)       | T-19, T-35             | T-20, T-36, T-43       |
| REQ-14                     | Logging and Security (no secret leak)     | T-19, T-35             | T-20, T-36, T-43       |

Every spec requirement maps to ≥1 RED test and ≥1 GREEN implementation task. No orphans.

---

## Definition of Done (gates before merge)

-   [ ] All 63 tasks checked
-   [ ] `pnpm --filter flowise-components test` → all green
-   [ ] Coverage ≥85% statements **per file** for: `narrative.ts`, `language.ts`, `bucket-walker.ts`, `file-parsers.ts`, `core.ts`, `SimulationVectorizerCaseOne.ts`
-   [ ] `pnpm lint --filter flowise-components` → 0 errors, 0 warnings
-   [ ] `tsc --noEmit` → 0 errors
-   [ ] `pnpm --filter flowise-components build` → success
-   [ ] Manual smoke: node appears under `A2A Knowledge`, credential renders with 4 fields, `simulationId` accepts `{{$flow.state.simulationId}}`
-   [ ] No `TODO|FIXME|XXX|console.log` in new files
-   [ ] PR labelled `size:exception`, body references engram #363/#364/#365/#366
-   [ ] Existing `SupabaseApi.credential.ts` unchanged (`git diff` proves it)
-   [ ] No new `console.log` of password, JWT, anonKey anywhere (grep verified)
