# Delta for simulation-vectorizer-case-one

## ADDED Requirements

### Requirement: Node Registration and Discovery

The node SHALL be registered in the Flowise palette under category `A2A Knowledge` and auto-discovered by NodesPool with no manual index edits.

#### Scenario: Node appears in palette after build

-   GIVEN the node file exports `module.exports = { nodeClass: ... }`
-   WHEN the server builds and NodesPool scans `packages/components/nodes/`
-   THEN the node appears in the palette under `A2A Knowledge`

#### Scenario: Missing nodeClass export fails build

-   GIVEN a node file without `module.exports.nodeClass`
-   WHEN NodesPool initializes
-   THEN the node MUST be rejected with an error identifying the missing export

### Requirement: Credential Schema supabaseUserAuth

A new credential `supabaseUserAuth` SHALL exist with exactly four fields: `supabaseProjUrl` (string), `supabaseAnonKey` (string), `supabaseUserEmail` (string), `supabaseUserPassword` (password, encrypted). The existing `supabaseApi` credential MUST remain unchanged.

#### Scenario: Credential creatable with all four fields

-   GIVEN the credential type registered
-   WHEN a user creates one in the Flowise UI
-   THEN all four fields render and the password field uses `type=password`

#### Scenario: Empty required field is rejected

-   GIVEN a credential with any field blank
-   WHEN the node consumes it at runtime
-   THEN the node aborts with a message naming the missing field

### Requirement: simulationId Resolution from Flow State

The node SHALL expose a `simulationId` input with `acceptVariable: true`. The value MUST be resolved by Flowise BEFORE tool instantiation. The DynamicStructuredTool's Zod schema MUST NOT include `simulationId` as an LLM-settable argument.

#### Scenario: Flow state variable resolves before construction

-   GIVEN input `{{$flow.state.simulationId}}` equals a valid UUID
-   WHEN `init()` runs
-   THEN the resolved UUID is captured in closure and the tool's `_call` reads it from closure, not from `args`

#### Scenario: Empty or non-UUID simulationId aborts early

-   GIVEN `simulationId` is empty or not a UUID at runtime
-   WHEN `_call` executes
-   THEN the tool aborts with a descriptive error BEFORE any Supabase call

### Requirement: Supabase User Authentication

The node SHALL authenticate via `supabase.auth.signInWithPassword` and cache the JWT for at most 50 minutes. On a 401 from any subsequent call, the node MUST re-login exactly once before failing.

#### Scenario: First invocation authenticates and caches

-   GIVEN no cached JWT
-   WHEN the node runs
-   THEN it calls `signInWithPassword` and stores the JWT with TTL ≤ 50min

#### Scenario: Subsequent call within TTL reuses JWT

-   GIVEN a cached JWT under 50min old
-   WHEN the node runs again
-   THEN it MUST NOT call `signInWithPassword` again

#### Scenario: 401 triggers single re-login

-   GIVEN an edge function call returns 401
-   WHEN the node handles the response
-   THEN it re-authenticates once and retries the call exactly once

#### Scenario: Invalid credentials abort with redacted message

-   GIVEN `signInWithPassword` returns an auth error
-   WHEN the node propagates it
-   THEN the message MUST NOT contain the password, JWT, or anonKey

### Requirement: Edge Function Invocation

The node SHALL invoke `form_case_one/get/{simulationId}` via `supabase.functions.invoke` with `Authorization: Bearer <jwt>` and parse `response.data` as the simulation JSON.

#### Scenario: Valid simulationId returns parsed JSON

-   GIVEN a valid simulationId and authenticated client
-   WHEN the edge function returns 2xx with `{ success: true, data: {...} }`
-   THEN the node proceeds with the parsed CaseOneData

#### Scenario: Non-2xx response aborts with context

-   GIVEN the edge function returns 404 or any non-2xx
-   WHEN the node handles the response
-   THEN it aborts with an error containing status and message

#### Scenario: Malformed response aborts

-   GIVEN response is not JSON or lacks `success: true`
-   WHEN the node parses it
-   THEN it aborts with a descriptive error

### Requirement: Recursive Bucket Walk

The node SHALL list and download all files under `a2a/reports/one/{simulationId}/**` from Supabase Storage, recursing into subdirectories (since `.list()` returns only the first level).

#### Scenario: Nested subdirectories are walked fully

-   GIVEN a bucket path with nested subdirs containing files
-   WHEN the node walks it
-   THEN every file at every depth is collected

#### Scenario: Empty path still vectorizes narrative

-   GIVEN the bucket path has zero files
-   WHEN the node runs
-   THEN the narrative is still chunked, embedded, and inserted

#### Scenario: RLS denial logs warning and continues

-   GIVEN bucket access returns 403
-   WHEN the node handles it
-   THEN it logs a warning, sets a warning entry, and continues with form data only

### Requirement: File Type Parsing

The node SHALL parse files with extensions `.pdf`, `.md`, `.txt`, `.json`, `.docx`. Other extensions MUST be skipped with a warning in result metadata, never aborting the run.

#### Scenario: Mixed supported types parsed

-   GIVEN a bucket with `.pdf`, `.md`, `.txt`, `.json`, `.docx` files
-   WHEN the node parses them
-   THEN every supported file produces extracted text

#### Scenario: Unsupported extension skipped

-   GIVEN a bucket containing `.png`
-   WHEN the node encounters it
-   THEN the file is skipped, a warning is recorded, and the run continues

#### Scenario: Corrupted PDF skipped

-   GIVEN a `.pdf` that throws in PDFLoader
-   WHEN the node parses it
-   THEN the file is logged, skipped, and the run continues

### Requirement: Narrative Formatting and Language Detection

The node SHALL transform the form JSON into a clean narrative containing only meaningful semantic content (no path/ID strings). Language SHALL be detected via `franc`, falling back to the optional `languageDetectionModel` chat model when connected.

#### Scenario: Spanish JSON yields Spanish narrative

-   GIVEN form JSON with Spanish content
-   WHEN the node formats and detects
-   THEN narrative text reads as Spanish prose and `franc` returns `"es"`

#### Scenario: LLM fallback used when connected

-   GIVEN `languageDetectionModel` is connected
-   WHEN language detection runs
-   THEN the LLM determines language and its result overrides `franc`

#### Scenario: Undetermined language defaults to empty

-   GIVEN `franc` returns `"und"` and no LLM is connected
-   WHEN the language field is set
-   THEN it defaults to `""` (table default)

### Requirement: Chunking Strategy

The node SHALL split narrative and document texts via the connected TextSplitter (default RecursiveCharacter, chunkSize=1500, chunkOverlap=200). Each chunk produces exactly one destination row.

#### Scenario: Short narrative produces one row

-   GIVEN a narrative under 1500 chars
-   WHEN chunking runs
-   THEN exactly one row is staged for `knowledge.simulations`

#### Scenario: Large PDF produces multiple rows

-   GIVEN a 10k-char PDF text
-   WHEN chunking with default settings
-   THEN 7–8 rows are staged for `knowledge.document_simulation`

#### Scenario: TextSplitter failure aborts

-   GIVEN the splitter throws
-   WHEN the node handles it
-   THEN the run aborts with a descriptive error

### Requirement: Embedding Generation

The node SHALL embed every chunk via the connected Embeddings node's `embedDocuments` method. The Embeddings input is REQUIRED.

#### Scenario: Connected embeddings produce vectors

-   GIVEN an Embeddings node is wired
-   WHEN chunks are embedded
-   THEN every chunk receives a vector

#### Scenario: Missing embeddings aborts at init

-   GIVEN `nodeData.inputs.embeddings` is absent
-   WHEN `init()` runs
-   THEN the node aborts with a clear message naming the missing dependency

### Requirement: Idempotent Persistence

Before inserting, the node SHALL DELETE FROM `knowledge.simulations` and `knowledge.document_simulation` WHERE `simulation_id = <id> AND "case" = 'one'`, then INSERT all new rows. Operations MUST run sequentially in a single Supabase client session (PostgREST has no multi-statement transaction).

#### Scenario: First run inserts N rows

-   GIVEN no prior rows for the simulationId
-   WHEN the node runs end-to-end
-   THEN N rows land in `simulations` and M rows in `document_simulation`

#### Scenario: Re-run replaces prior rows

-   GIVEN prior rows exist for the simulationId with `case='one'`
-   WHEN the node runs again
-   THEN prior rows are deleted before new rows are inserted (idempotent replace)

#### Scenario: DELETE failure aborts before INSERT

-   GIVEN DELETE returns an RLS error
-   WHEN the node handles it
-   THEN no INSERT is attempted and no partial state is left

#### Scenario: INSERT failure does not auto-retry

-   GIVEN an INSERT fails mid-batch
-   WHEN the node handles it
-   THEN it logs the failing row index and aborts without auto-retry

### Requirement: Column Mapping per Insert

INSERTs into `knowledge.simulations` MUST set: `simulation_id`, `source_flow="simulation_vectorizer"`, `content`, `metadata` (original JSON + `chunk_index` + `total_chunks`), `embedding`, `"case"="one"`, `language`. INSERTs into `knowledge.document_simulation` MUST set: `simulation_id`, `content`, `embedding`, `metadata` (`file_path`, `file_name`, `mime_type`, optional `page_number`, `chunk_index`, `total_chunks`), `"case"="one"`, `language`. Neither insert SHALL set `id`, `created_at`, or `updated_at`.

#### Scenario: simulations row has expected columns

-   GIVEN a successful run
-   WHEN inspecting an inserted `simulations` row
-   THEN all 7 required columns are populated and auto-columns are unset

#### Scenario: document_simulation row has expected columns

-   GIVEN a PDF chunk insertion
-   WHEN inspecting the row
-   THEN all 7 required columns are populated and `page_number` is present (PDF only)

#### Scenario: Null embedding aborts before insert

-   GIVEN a chunk with `embedding === null`
-   WHEN the node validates the row
-   THEN it aborts and logs the offending column

### Requirement: Return Contract

The tool's `_call` SHALL return a JSON string of `{ simulationId, rowsInserted: { simulations: N, documents: M }, language, durationMs, warnings: string[] }`. On any aborting error, it SHALL return `{ error, simulationId, durationMs }` instead of throwing, so the LLM can observe and recover.

#### Scenario: Success returns full payload

-   GIVEN a successful run
-   WHEN `_call` returns
-   THEN the payload contains all five success fields

#### Scenario: Error returns error payload, not throw

-   GIVEN any aborting error
-   WHEN `_call` returns
-   THEN the payload contains `error`, `simulationId`, `durationMs` and is JSON-stringified (no throw)

### Requirement: Logging and Security

The node SHALL NEVER log the password, JWT, anonKey, or any credential field value. Auth-related errors MUST surface only redacted messages.

#### Scenario: Failed auth log is redacted

-   GIVEN auth failure
-   WHEN the node logs the event
-   THEN the log contains the email and a generic failure reason but no password or JWT

#### Scenario: Caught exception messages sanitized

-   GIVEN any caught exception whose message could contain a secret
-   WHEN it appears in the tool's return payload
-   THEN the secret has been redacted before inclusion
