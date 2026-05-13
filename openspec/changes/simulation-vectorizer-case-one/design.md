# Design: Simulation Vectorizer — Case One

## Technical Approach

`INode.init()` returns a `SimulationVectorizerTool` (extends `DynamicStructuredTool`) with `simulationId` closed over at construction and the Supabase client built per-call from `supabaseUserAuth`. The tool exposes an EMPTY Zod schema — the LLM passes no args; everything comes from flow state and node inputs. Side effects live in `core.ts`; pure helpers (`narrative`, `language`, `bucket-walker`, `file-parsers`) compose underneath. Auto-discovery via `NodesPool` (`packages/server/src/NodesPool.ts:36-91`) — no manual registry edits.

## 1. File Structure

```
packages/components/
├── credentials/
│   └── SupabaseUserAuth.credential.ts          (~30 lines)
└── nodes/a2a/SimulationVectorizerCaseOne/
    ├── SimulationVectorizerCaseOne.ts          (~180 — INode + init)
    ├── core.ts                                 (~350 — Tool + persistence)
    ├── narrative.ts                            (~80  — pure formatter)
    ├── language.ts                             (~40  — franc + LLM fallback)
    ├── bucket-walker.ts                        (~70  — recursive list/download)
    ├── file-parsers.ts                         (~100 — pdf/md/txt/json/docx)
    ├── simulation-vectorizer-case-one.svg
    └── __tests__/
        ├── narrative.test.ts
        ├── language.test.ts
        ├── bucket-walker.test.ts
        ├── file-parsers.test.ts
        ├── core.test.ts
        └── SimulationVectorizerCaseOne.test.ts
packages/components/package.json                (+franc)
```

## 2. Module Boundaries (Hexagonal-ish)

```
           ┌──────────────────────────────────┐
           │ SimulationVectorizerCaseOne.ts   │  ← INode (Flowise edge)
           └────────────────┬─────────────────┘
                            │ init() injects deps
                            ▼
           ┌──────────────────────────────────┐
           │ core.ts  — SimulationVectorizerTool│  ← orchestration + I/O
           │  (createSupabaseClient, signIn,    │
           │   functions.invoke, storage,       │
           │   DELETE/INSERT, JWT cache)        │
           └─┬───────┬─────────┬────────┬──────┘
             │       │         │        │
             ▼       ▼         ▼        ▼
        narrative language bucket-walker file-parsers
         (pure)    (pure*) (infra-thin)  (infra-thin)
```

**Rule (enforced by review)**: `narrative.ts`, `language.ts` MUST NOT import `@supabase/supabase-js` or `@langchain/community/document_loaders/*`. `bucket-walker.ts` and `file-parsers.ts` accept clients/blobs as parameters — they never create them. Only `core.ts` instantiates Supabase or invokes the network.

## 3. SupabaseUserAuth Credential

Modeled on `packages/components/credentials/SupabaseApi.credential.ts:1-24`.

```ts
import { INodeParams, INodeCredential } from '../src/Interface'

class SupabaseUserAuth implements INodeCredential {
    label: string
    name: string
    version: number
    inputs: INodeParams[]
    constructor() {
        this.label = 'Supabase User Auth'
        this.name = 'supabaseUserAuth'
        this.version = 1.0
        this.inputs = [
            { label: 'Supabase Project URL', name: 'supabaseProjUrl', type: 'string' },
            { label: 'Supabase Anon Key', name: 'supabaseAnonKey', type: 'password' },
            { label: 'User Email', name: 'supabaseUserEmail', type: 'string' },
            { label: 'User Password', name: 'supabaseUserPassword', type: 'password' }
        ]
    }
}
module.exports = { credClass: SupabaseUserAuth }
```

Existing `SupabaseApi` credential remains untouched (spec requirement).

## 4. Node Class Skeleton (`SimulationVectorizerCaseOne.ts`)

```ts
class SimulationVectorizerCaseOne_Node implements INode {
    label = 'Simulation Vectorizer (Case One)'
    name = 'simulationVectorizerCaseOne'
    version = 1.0
    type = 'SimulationVectorizerCaseOne'
    icon = 'simulation-vectorizer-case-one.svg'
    category = 'A2A Knowledge'
    author = 'GobernAI'
    description =
        'Vectorize Case One simulation (form + bucket docs) into knowledge.simulations / knowledge.document_simulation. Idempotent.'
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.baseClasses = [this.type, 'Tool', 'DynamicStructuredTool', ...getBaseClasses(SimulationVectorizerTool)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['supabaseUserAuth']
        }
        this.inputs = [
            { label: 'Embeddings', name: 'embeddings', type: 'Embeddings' },
            { label: 'Text Splitter', name: 'textSplitter', type: 'TextSplitter', optional: true },
            {
                label: 'Language Detection Model',
                name: 'languageDetectionModel',
                type: 'BaseChatModel',
                optional: true,
                description: 'Optional. Overrides franc when connected.'
            },
            {
                label: 'Simulation ID',
                name: 'simulationId',
                type: 'string',
                acceptVariable: true,
                placeholder: '{{$flow.state.simulationId}}',
                description: 'MUST come from flow state. The LLM never sets this.'
            },
            { label: 'Bucket Name', name: 'bucketName', type: 'string', default: 'a2a', additionalParams: true },
            {
                label: 'Bucket Base Path',
                name: 'bucketBasePath',
                type: 'string',
                default: 'reports/one/{{simulationId}}',
                description: '{{simulationId}} is replaced at runtime.',
                additionalParams: true
            },
            { label: 'Schema', name: 'schemaName', type: 'string', default: 'knowledge', additionalParams: true },
            { label: 'Simulations Table', name: 'tableSimulations', type: 'string', default: 'simulations', additionalParams: true },
            {
                label: 'Documents Table',
                name: 'tableDocumentSimulation',
                type: 'string',
                default: 'document_simulation',
                additionalParams: true
            },
            {
                label: 'Chunk Size',
                name: 'chunkSize',
                type: 'number',
                default: 1500,
                description: 'Used only when no Text Splitter is connected.',
                additionalParams: true
            },
            { label: 'Chunk Overlap', name: 'chunkOverlap', type: 'number', default: 200, additionalParams: true },
            { label: 'JWT Cache TTL (minutes)', name: 'jwtCacheTtlMinutes', type: 'number', default: 50, additionalParams: true }
        ]
    }

    async init(nodeData: INodeData, _input: string, options: ICommonObject): Promise<any> {
        const simulationId = ((nodeData.inputs?.simulationId as string) ?? '').trim()
        // UUID format check — fail before any I/O (Edge case §14)
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(simulationId))
            throw new Error('simulationId must be a UUID resolved from flow state')

        const embeddings = nodeData.inputs?.embeddings as Embeddings
        if (!embeddings) throw new Error('Embeddings input is required')

        const textSplitter =
            (nodeData.inputs?.textSplitter as TextSplitter) ??
            new RecursiveCharacterTextSplitter({
                chunkSize: Number(nodeData.inputs?.chunkSize ?? 1500),
                chunkOverlap: Number(nodeData.inputs?.chunkOverlap ?? 200)
            })

        const creds = await getCredentialData(nodeData.credential ?? '', options)
        return new SimulationVectorizerTool({
            simulationId,
            embeddings,
            textSplitter,
            languageDetectionModel: nodeData.inputs?.languageDetectionModel as BaseChatModel | undefined,
            schemaName: String(nodeData.inputs?.schemaName ?? 'knowledge'),
            tableSimulations: String(nodeData.inputs?.tableSimulations ?? 'simulations'),
            tableDocumentSimulation: String(nodeData.inputs?.tableDocumentSimulation ?? 'document_simulation'),
            bucketName: String(nodeData.inputs?.bucketName ?? 'a2a'),
            bucketBasePath: String(nodeData.inputs?.bucketBasePath ?? 'reports/one/{{simulationId}}').replace(
                '{{simulationId}}',
                simulationId
            ),
            jwtCacheTtlMinutes: Number(nodeData.inputs?.jwtCacheTtlMinutes ?? 50),
            sourceFlow: 'simulation_vectorizer',
            credentials: {
                projUrl: String(creds.supabaseProjUrl),
                anonKey: String(creds.supabaseAnonKey),
                email: String(creds.supabaseUserEmail),
                password: String(creds.supabaseUserPassword)
            }
        })
    }
}
module.exports = { nodeClass: SimulationVectorizerCaseOne_Node }
```

## 5. SimulationVectorizerTool (`core.ts`)

```ts
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface ToolDeps {
    simulationId: string
    embeddings: Embeddings
    textSplitter: TextSplitter
    languageDetectionModel?: BaseChatModel
    schemaName: string
    tableSimulations: string
    tableDocumentSimulation: string
    bucketName: string
    bucketBasePath: string
    jwtCacheTtlMinutes: number
    sourceFlow: 'simulation_vectorizer'
    credentials: { projUrl: string; anonKey: string; email: string; password: string }
}

export class SimulationVectorizerTool extends DynamicStructuredTool {
    name = 'simulation_vectorizer_case_one'
    description = 'Vectorize the current simulation (Case One). Call with no arguments.'
    schema = z.object({}).optional()

    private cachedJwt: { token: string; expiresAt: number } | null = null
    private client: SupabaseClient

    constructor(private readonly deps: ToolDeps) {
        super({
            /* name/description/schema via class fields */
        } as any)
        this.client = createClient(deps.credentials.projUrl, deps.credentials.anonKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        })
    }

    protected async _call(): Promise<string> {
        const startedAt = Date.now()
        const warnings: string[] = []
        let stage: Stage = 'auth'
        try {
            await this.ensureJwt() // 1
            stage = 'fetch-form'
            const form = await this.handle401Once(() => this.fetchForm()) // 2
            stage = 'walk-bucket'
            const files = await this.handle401Once(() => walkBucket(this.client, this.deps.bucketName, this.deps.bucketBasePath)).catch(
                (e) => {
                    warnings.push(`bucket: ${sanitizeError(e)}`)
                    return []
                }
            ) // 3
            stage = 'parse'
            const docs = await parseFiles(this.client, this.deps.bucketName, files, warnings) // 4
            const narrative = prepareCaseForVectorization(form) // 5
            const language = await detectLanguage(narrative, this.deps.languageDetectionModel) // 6
            stage = 'chunk'
            const simChunks = await this.deps.textSplitter.createDocuments([narrative])
            const docChunks = await this.deps.textSplitter.splitDocuments(docs) // 7
            stage = 'embed'
            const simVectors = await this.deps.embeddings.embedDocuments(simChunks.map((c) => c.pageContent))
            const docVectors = await this.deps.embeddings.embedDocuments(docChunks.map((c) => c.pageContent)) // 8
            const simRows = buildSimulationRows(simChunks, simVectors, form, language, this.deps)
            const docRows = buildDocumentRows(docChunks, docVectors, language, this.deps) // 9
            validateRows([...simRows, ...docRows]) // 10 (no null embeddings)
            stage = 'delete'
            await this.deleteForSimulation() // 11
            stage = 'insert'
            await this.insertBatched(simRows, docRows) // 12
            return JSON.stringify(<VectorizerSuccess>{
                ok: true,
                simulationId: this.deps.simulationId,
                rowsInserted: { simulations: simRows.length, documents: docRows.length },
                language,
                durationMs: Date.now() - startedAt,
                warnings
            })
        } catch (err) {
            return JSON.stringify(<VectorizerError>{
                ok: false,
                error: sanitizeError(err),
                simulationId: this.deps.simulationId,
                durationMs: Date.now() - startedAt,
                stage
            })
        }
    }

    private async ensureJwt(): Promise<string> {
        /* §6 */
    }
    private async handle401Once<T>(fn: () => Promise<T>): Promise<T> {
        /* §6 */
    }
    private async fetchForm(): Promise<CaseOneData> {
        /* functions.invoke */
    }
    private async deleteForSimulation(): Promise<void> {
        /* §11 */
    }
    private async insertBatched(s: Row[], d: Row[]): Promise<void> {
        /* §11 */
    }
}
```

## 6. JWT Cache Strategy

-   **Storage**: `cachedJwt: { token: string; expiresAt: number } | null` in tool instance (per-flow, per-construction).
-   **TTL**: `Math.min(jwtCacheTtlMinutes * 60_000, response.expires_in * 1000 - 300_000)` — never exceed Supabase's own expiry minus a 5-min safety margin.
-   **Invalidation**: any 401 → clear cache → `signInWithPassword` again → retry once → on second 401, abort with `stage='auth'`.
-   **Concurrency**: not thread-safe by design. Node.js is single-threaded; one tool instance per Flowise model lifecycle; multiple `_call` invocations of the same flow share the same instance and the cache amortizes.

```ts
private async ensureJwt(): Promise<string> {
    if (this.cachedJwt && Date.now() < this.cachedJwt.expiresAt) return this.cachedJwt.token
    const { data, error } = await this.client.auth.signInWithPassword({
        email: this.deps.credentials.email, password: this.deps.credentials.password
    })
    if (error || !data.session) throw new Error('Authentication failed') // redacted (§13)
    const ttlMs = Math.min(this.deps.jwtCacheTtlMinutes * 60_000,
                           data.session.expires_in * 1000 - 300_000)
    this.cachedJwt = { token: data.session.access_token, expiresAt: Date.now() + ttlMs }
    return this.cachedJwt.token
}

private async handle401Once<T>(fn: () => Promise<T>): Promise<T> {
    try { return await fn() }
    catch (e: any) {
        if (e?.status !== 401 && e?.statusCode !== 401) throw e
        this.cachedJwt = null
        await this.ensureJwt()
        return await fn()  // bubble second 401
    }
}
```

## 7. Recursive Bucket Walker (`bucket-walker.ts`)

```ts
export interface BucketFile {
    path: string
    mime: string
    sizeBytes: number
}

export async function walkBucket(
    client: SupabaseClient,
    bucket: string,
    prefix: string,
    opts: { maxDepth?: number; depth?: number } = {}
): Promise<BucketFile[]> {
    const depth = opts.depth ?? 0
    const maxDepth = opts.maxDepth ?? 5
    if (depth > maxDepth) throw new Error(`Bucket walk exceeded depth ${maxDepth}`)
    const { data, error } = await client.storage.from(bucket).list(prefix, { limit: 1000 })
    if (error) throw error
    const results: BucketFile[] = []
    for (const item of data ?? []) {
        if (item.id === null) {
            // folder (Supabase Storage convention)
            results.push(...(await walkBucket(client, bucket, `${prefix}/${item.name}`, { maxDepth, depth: depth + 1 })))
        } else {
            results.push({
                path: `${prefix}/${item.name}`,
                mime: inferMime(item.name),
                sizeBytes: (item.metadata as any)?.size ?? 0
            })
        }
    }
    return results
}
```

`inferMime` maps lowercased extension → MIME (`.pdf`→`application/pdf`, etc.). Unknown → `application/octet-stream`.

## 8. File Parsers (`file-parsers.ts`)

| Function               | Loader                                                                           | Output                                     | Notes                                                 |
| ---------------------- | -------------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------- |
| `parsePdf(blob)`       | `PDFLoader` (`@langchain/community/document_loaders/fs/pdf`), `splitPages: true` | one entry per page, `metadata.page_number` | corrupted → throw → caught upstream, warning recorded |
| `parseMarkdown(blob)`  | `await blob.text()`                                                              | one entry                                  |                                                       |
| `parsePlainText(blob)` | `await blob.text()`                                                              | one entry                                  |                                                       |
| `parseJson(blob)`      | `JSON.parse(await blob.text())` then stringify                                   | one entry                                  | invalid JSON → throw                                  |
| `parseDocx(blob)`      | `DocxLoader` (`@langchain/community/document_loaders/fs/docx`)                   | one entry per doc                          |                                                       |

Dispatcher:

```ts
export async function parseByMime(
    blob: Blob,
    mime: string,
    file: BucketFile
): Promise<{ text: string; metadata: Record<string, unknown> }[]> {
    switch (mime) {
        case 'application/pdf':
            return parsePdf(blob, file)
        case 'text/markdown':
            return parseMarkdown(blob, file)
        case 'text/plain':
            return parsePlainText(blob, file)
        case 'application/json':
            return parseJson(blob, file)
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            return parseDocx(blob, file)
        default:
            throw new UnsupportedMimeError(mime)
    }
}
```

`parseFiles()` in core wraps this — unsupported/corrupted files get a warning pushed and are skipped, the run continues (spec Requirement: File Type Parsing).

## 9. Narrative Formatter (`narrative.ts`)

```ts
export interface CaseOneData {
    title?: string | null
    description?: string | null
    objective?: string | null
    context?: string | null
    actors?: { name: string; role: string; notes?: string }[] | null
    timeline?: { date: string; event: string }[] | null
    questions?: string[] | null
    // ...extend as form evolves; unknown keys ignored
}

export function prepareCaseForVectorization(data: CaseOneData): string {
    const safe = (v?: string | null) => (v ?? '').trim()
    const sections: string[] = []
    if (safe(data.title)) sections.push(`Title: ${safe(data.title)}`)
    if (safe(data.objective)) sections.push(`Objective: ${safe(data.objective)}`)
    if (safe(data.context)) sections.push(`Context: ${safe(data.context)}`)
    if (safe(data.description)) sections.push(safe(data.description))
    if (data.actors?.length)
        sections.push('Actors: ' + data.actors.map((a) => `${a.name} (${a.role})${a.notes ? ' — ' + a.notes : ''}`).join('; '))
    if (data.timeline?.length) sections.push('Timeline: ' + data.timeline.map((t) => `${t.date}: ${t.event}`).join('; '))
    if (data.questions?.length) sections.push('Questions: ' + data.questions.join(' '))
    return sections.join('\n\n')
}
```

PURE — no I/O, no imports beyond types. No paths, no UUIDs, no technical strings emitted.

## 10. Language Detection (`language.ts`)

```ts
import { franc } from 'franc'
const ISO_639_3_TO_1: Record<string, string> = { spa: 'es', eng: 'en', por: 'pt', fra: 'fr', deu: 'de', ita: 'it' /* extend */ }

export async function detectLanguage(text: string, llm?: BaseChatModel): Promise<string> {
    if (llm) {
        try {
            const res: any = await llm.invoke(`Respond with ONLY ISO 639-1 code (e.g. es, en, pt) for this text:\n${text.slice(0, 500)}`)
            const code = String(res?.content ?? '')
                .trim()
                .toLowerCase()
                .slice(0, 2)
            if (/^[a-z]{2}$/.test(code)) return code
        } catch {
            /* fall through */
        }
    }
    const f = franc(text, { minLength: 10 })
    if (f === 'und') return ''
    return ISO_639_3_TO_1[f] ?? ''
}
```

Decision: inline lookup table over `iso-639-1` npm — 6 lines, no new dep. Extend table as needed; unknown lang falls back to `''` (matches spec scenario).

## 11. Persistence Layer (in `core.ts`)

```ts
private async deleteForSimulation(): Promise<void> {
    const { error: e1 } = await this.client.schema(this.deps.schemaName)
        .from(this.deps.tableSimulations).delete()
        .eq('simulation_id', this.deps.simulationId).eq('case', 'one')
    if (e1) throw new Error(`DELETE ${this.deps.tableSimulations} failed: ${e1.message}`)
    const { error: e2 } = await this.client.schema(this.deps.schemaName)
        .from(this.deps.tableDocumentSimulation).delete()
        .eq('simulation_id', this.deps.simulationId).eq('case', 'one')
    if (e2) throw new Error(`DELETE ${this.deps.tableDocumentSimulation} failed: ${e2.message}`)
}

private async insertBatched(simRows: Row[], docRows: Row[]): Promise<void> {
    for (const batch of batchOf(simRows, 500)) {
        const { error } = await this.client.schema(this.deps.schemaName)
            .from(this.deps.tableSimulations).insert(batch)
        if (error) throw new Error(`INSERT ${this.deps.tableSimulations} failed: ${error.message}`)
    }
    for (const batch of batchOf(docRows, 500)) {
        const { error } = await this.client.schema(this.deps.schemaName)
            .from(this.deps.tableDocumentSimulation).insert(batch)
        if (error) throw new Error(`INSERT ${this.deps.tableDocumentSimulation} failed: ${error.message}`)
    }
}
```

**No transaction**: Supabase JS / PostgREST has no multi-statement `BEGIN/COMMIT`. Trade-off — if INSERT fails mid-batch, partial state remains. Acceptable because the next idempotent invocation re-runs DELETE, restoring a clean state. Documented in node description and spec (Idempotent Persistence).

## 12. Return Envelope

```ts
type Stage = 'auth' | 'fetch-form' | 'walk-bucket' | 'parse' | 'chunk' | 'embed' | 'delete' | 'insert' | 'unknown'

interface VectorizerSuccess {
    ok: true
    simulationId: string
    rowsInserted: { simulations: number; documents: number }
    language: string
    durationMs: number
    warnings: string[]
}

interface VectorizerError {
    ok: false
    error: string // sanitized, never contains secrets
    simulationId: string
    durationMs: number
    stage: Stage
}
```

Returned via `JSON.stringify(...)` per `DynamicStructuredTool` contract — the LLM can read and recover.

## 13. Sanitization Rules

```ts
const BEARER_RE = /Bearer\s+[A-Za-z0-9\-_.]+/g
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g

export function sanitizeError(err: unknown, secrets: string[] = []): string {
    const raw = err instanceof Error ? err.message : String(err)
    let out = raw.replace(BEARER_RE, 'Bearer [REDACTED]').replace(EMAIL_RE, '[REDACTED_EMAIL]')
    for (const s of secrets) if (s && s.length > 4) out = out.split(s).join('[REDACTED]')
    return out
}
```

In `core.ts`, `sanitizeError` is called with `[anonKey, password, jwt]` as the secrets list. Applied to every error before logging OR returning. No raw exception escapes the tool.

## 14. Edge Cases

| Case                                   | Decision                                                      |
| -------------------------------------- | ------------------------------------------------------------- |
| Empty bucket                           | narrative still vectorized; `documents: 0`; no error          |
| 0-byte file                            | skip, push warning `"empty: <path>"`                          |
| Uppercase extension (`.PDF`)           | normalize via `.toLowerCase()` in `inferMime`                 |
| Duplicate filenames (Storage versions) | take latest (`.list()` already returns latest by default)     |
| Edge function `success: false`         | abort with upstream message (sanitized), `stage='fetch-form'` |
| Non-UUID `simulationId`                | abort in `init()` BEFORE `createClient` (cheap fail)          |
| RLS denies bucket read                 | warning + continue with form-only (spec scenario)             |
| RLS denies DELETE/INSERT               | abort with `stage='delete'` or `'insert'`                     |
| Corrupted PDF                          | catch → warning → skip → continue                             |
| `franc` returns `und` and no LLM       | language `= ''` (table default)                               |

## 15. Test Strategy

| File                                  | Approach                            | Key cases                                                                                                                                                                                  |
| ------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `narrative.test.ts`                   | pure unit, snapshot                 | full data; null fields; empty arrays; unknown keys ignored                                                                                                                                 |
| `language.test.ts`                    | mock `franc` + LLM                  | LLM connected wins; LLM bad output → franc fallback; `und` → `''`; ISO mapping                                                                                                             |
| `bucket-walker.test.ts`               | mock `client.storage.from().list()` | nested folders; flat; empty; `id===null` ⇒ folder; depth-cap throws                                                                                                                        |
| `file-parsers.test.ts`                | mock `PDFLoader`/`DocxLoader`       | dispatch per mime; corrupted PDF throws (caught upstream); unsupported throws `UnsupportedMimeError`                                                                                       |
| `core.test.ts`                        | full integration, all I/O mocked    | happy path; DELETE error aborts pre-INSERT; INSERT mid-batch failure; 401 retry once; second 401 aborts; missing form aborts; warnings accumulate; sanitization removes JWT/password/email |
| `SimulationVectorizerCaseOne.test.ts` | INode contract                      | `init` returns Tool with correct `baseClasses`; missing embeddings throws; non-UUID simulationId throws; `simulationId` is closed over (not in `args`)                                     |

Coverage target: **85% statements per file**. Mock `@supabase/supabase-js` per pattern in engram #363.

## 16. Open Questions / Future Work

-   [ ] Icon SVG is a placeholder — design team to deliver `simulation-vectorizer-case-one.svg`
-   [ ] ISO 639-3→1 table inline vs `iso-639-1` npm — chose inline (6 lang covers expected use), revisit if expansion needed
-   [ ] Cases Two–Five will copy this directory — consider extracting a `simulationVectorizerFactory` later; premature now (sample size = 1)
-   [ ] Streaming download for large PDFs (>50MB) — out of scope per proposal; revisit if OOM observed

## Migration / Rollout

No migration required. Additive only: new credential type, new node directory, new dep (`franc`). Rollback = delete directory + remove `franc` from `package.json` + rebuild.

## Review Workload Forecast

Estimated total ≈ 950 lines of source + ≈ 700 lines of tests. Exceeds the 400-line single-PR review budget.

-   **400-line budget risk**: High
-   **Chained PRs recommended**: Yes
-   **Decision needed before apply**: Yes

Suggested slices (deliverable work units):

1. Credential + node skeleton + INode test (`SupabaseUserAuth`, `SimulationVectorizerCaseOne.ts`, contract test) — ~250 lines
2. Pure helpers (`narrative`, `language` + tests) — ~250 lines
3. Infra helpers (`bucket-walker`, `file-parsers` + tests) — ~350 lines
4. `core.ts` orchestration + integration tests — ~600 lines (may need further split between non-I/O assembly and I/O methods)
