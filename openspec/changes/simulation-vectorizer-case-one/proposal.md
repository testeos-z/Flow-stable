# Proposal: Simulation Vectorizer — Case One

## Intent

Flowise agents need an idempotent way to vectorize Case One simulation data (form + reference docs) from Supabase Storage into pgvector tables. Today it's ad-hoc: no chunking, no language detection, no idempotency. First of five vectorizer nodes — Case One is the template Cases Two–Five will copy.

## Scope

### In Scope

-   Tool node `SimulationVectorizerCaseOne` (DynamicStructuredTool subclass) at `packages/components/nodes/a2a/SimulationVectorizerCaseOne/`
-   New palette category `A2A Knowledge`
-   New credential `supabaseUserAuth` (projUrl, anonKey, email, password)
-   DI: `Embeddings` required; `TextSplitter` optional (default RecursiveCharacter 1500/200); `languageDetectionModel` optional BaseChatModel
-   `simulationId` from flow state via `acceptVariable: true` — LLM never sees it
-   Runtime: signIn → fetch form via edge function → recursive bucket walk → parse `.pdf/.md/.txt/.json/.docx` → narrative format → language detect (`franc`) → chunk → embed → DELETE+INSERT into `knowledge.simulations` and `knowledge.document_simulation`
-   JWT cached ~50min, single 401-retry
-   Hardcoded `case='one'`, `flow="simulation_vectorizer"`
-   Add `franc` to `packages/components/package.json`

### Out of Scope

-   Cases Two–Five (separate proposals)
-   OCR for bucket images
-   Re-vectorization triggers (cron/webhook)
-   Vector retrieval / semantic search (consumer concern)
-   Migrations for `knowledge.*` (assumed to exist)
-   Changes to `SupabaseApi` credential
-   `a2alabgateway` changes

## Capabilities

### New Capabilities

-   `simulation-vectorizer-case-one`: Tool node vectorizing Case One simulation data into pgvector

### Modified Capabilities

-   None

## Approach

`INode.init()` returns a `DynamicStructuredTool` with `simulationId` closed over at construction. Auth internal via `signInWithPassword` + cached JWT. Idempotency via DELETE-then-INSERT keyed on `(simulation_id, case='one')` — PK-upsert breaks because chunk counts vary between runs. No flow-architect/flow-ing boundary impact.

## Affected Areas

| Area                                                             | Impact   | Description                       |
| ---------------------------------------------------------------- | -------- | --------------------------------- |
| `packages/components/nodes/a2a/SimulationVectorizerCaseOne/`     | New      | Node, icon, tests                 |
| `packages/components/credentials/SupabaseUserAuth.credential.ts` | New      | Credential type                   |
| `packages/components/package.json`                               | Modified | Add `franc`                       |
| `knowledge.simulations`, `knowledge.document_simulation`         | External | Must exist; RLS must allow INSERT |

## Risks

| Risk                                      | Likelihood | Mitigation                       |
| ----------------------------------------- | ---------- | -------------------------------- |
| `storage.list()` returns first level only | High       | Recursive walk                   |
| JWT expires mid-flow                      | Med        | 50min cache; 401 → re-login once |
| Large PDFs (>50MB) OOM                    | Med        | Caveat; streaming later          |
| `franc` ~95% accuracy                     | Low        | Optional LLM override            |
| RLS denies INSERT on `knowledge.*`        | Med        | Operational; flagged             |
| Password in-memory during use             | Low        | Encrypted at rest; never log     |

## Rollback Plan

Remove node directory, credential file, `franc` dep; rebuild components package. No migrations to revert. No existing flows affected.

## Dependencies

-   `franc` (new npm dep)
-   `knowledge.simulations` and `knowledge.document_simulation` exist in Supabase
-   Edge function `form_case_one/get/{simulationId}` available

## Success Criteria

-   [ ] Node appears under `A2A Knowledge` in palette
-   [ ] Valid `simulationId` populates both tables with chunked, embedded rows
-   [ ] Re-invocation yields same row count (idempotent)
-   [ ] Unsupported file types skipped without aborting
-   [ ] Returns `{ simulationId, rowsInserted, language, durationMs }`
-   [ ] Unit tests pass with `@supabase/supabase-js` mocked
