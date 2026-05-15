// ---------------------------------------------------------------------------
// core.ts — SimulationVectorizerTool (DynamicStructuredTool)
//
// Orchestrates the 12-step vectorization pipeline. The only side-effectful
// module. Pure helpers (narrative, language, bucket-walker, file-parsers) are
// imported as sibling modules.
// ---------------------------------------------------------------------------

import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { prepareCaseForVectorization, CaseOneData } from './narrative'
import { detectLanguage, LanguageDetectionLLM } from './language'
import { walkBucket, BucketFile, StorageItem } from './bucket-walker'
import { parseByMime } from './file-parsers'

// ─── Interfaces ────────────────────────────────────────────────────

interface SupabaseFunctions {
    invoke: (
        name: string,
        opts?: { method?: string; headers?: Record<string, string> }
    ) => Promise<{ data?: unknown; error?: { message: string; status?: number } | null }>
}

interface SupabaseStorage {
    from(bucket: string): {
        download(path: string): Promise<{ data: Blob | null; error?: { message: string } | null }>
        list(
            prefix: string,
            options?: { limit?: number }
        ): Promise<{
            data: StorageItem[] | null
            error: { message: string; status?: number } | null
        }>
    }
}

interface SupabaseDB {
    schema(name: string): {
        from(table: string): {
            delete(): {
                eq(field: string, value: string): { eq(field: string, value: string): Promise<{ error: { message: string } | null }> }
            }
            insert(rows: Record<string, unknown>[]): Promise<{ error: { message: string } | null }>
        }
    }
}

export interface SupabaseClientLike {
    functions: SupabaseFunctions
    storage: SupabaseStorage
    schema: SupabaseDB['schema']
}

interface EmbeddingsLike {
    embedDocuments(texts: string[]): Promise<number[][]>
}

interface TextSplitterLike {
    createDocuments(texts: string[]): Promise<Array<{ pageContent: string }>>
}

export interface VectorizerDeps {
    simulationId: string
    supabaseClient: SupabaseClientLike
    embeddings: EmbeddingsLike
    textSplitter?: TextSplitterLike
    languageDetectionModel?: LanguageDetectionLLM
    bucketName?: string
    bucketBasePath?: string
    schemaName?: string
    tableSimulations?: string
    tableDocumentSimulation?: string
    chunkSize?: number
    chunkOverlap?: number
    sourceFlow?: string
    jwtCacheTtlMinutes?: number
}

interface JwtCacheEntry {
    token: string
    expiresAt: number
}

export interface VectorizerSuccess {
    ok: true
    simulationId: string
    rowsInserted: { simulations: number; documents: number }
    language: string
    durationMs: number
    warnings: string[]
}

export interface VectorizerError {
    ok: false
    error: string
    simulationId: string
    durationMs: number
    stage: 'auth' | 'fetch-form' | 'walk-bucket' | 'parse' | 'chunk' | 'embed' | 'delete' | 'insert' | 'unknown'
}

export type VectorizerResult = VectorizerSuccess | VectorizerError

// ─── Sanitization ──────────────────────────────────────────────────

const BEARER_RE = /Bearer\s+[A-Za-z0-9\-._]+/gi
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

export function sanitizeError(error: unknown, credentialValues?: string[]): string {
    let msg = ''
    if (error instanceof Error) {
        msg = error.message
    } else if (typeof error === 'string') {
        msg = error
    } else if (error && typeof error === 'object') {
        msg = String((error as Record<string, unknown>).message ?? JSON.stringify(error))
    } else {
        msg = String(error ?? 'Unknown error')
    }

    msg = msg.replace(BEARER_RE, 'Bearer [REDACTED]')
    msg = msg.replace(EMAIL_RE, '[EMAIL]')

    if (credentialValues) {
        for (const val of credentialValues) {
            if (val && val.length > 3) {
                msg = msg.replace(new RegExp(val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '[CREDENTIAL]')
            }
        }
    }

    return msg
}

// ─── Ensure JWT ─────────────────────────────────────────────────────

interface AuthEnv {
    email: string
    password: string
    jwtCacheTtlMinutes: number
}

interface AuthSupabaseClient {
    auth: {
        signInWithPassword: (creds: { email: string; password: string }) => Promise<{
            data: { session?: { access_token?: string; expires_in?: number } | null } | null
            error?: { message: string } | null
        }>
    }
}

export async function ensureJwt(supabase: AuthSupabaseClient, cache: { current: JwtCacheEntry | null }, env: AuthEnv): Promise<string> {
    const now = Date.now()
    if (cache.current && cache.current.expiresAt > now) {
        return cache.current.token
    }

    const { data, error } = await supabase.auth.signInWithPassword({
        email: env.email,
        password: env.password
    })

    if (error || !data?.session?.access_token) {
        throw new Error(sanitizeError(error?.message || 'Auth failed – no session returned', [env.email, env.password]))
    }

    const ttlMs = env.jwtCacheTtlMinutes * 60_000
    const expiresInMs = (data.session.expires_in ?? 3600) * 1000
    const effectiveTtl = Math.min(ttlMs, expiresInMs - 300_000) // 5 min safety margin

    cache.current = {
        token: data.session.access_token,
        expiresAt: now + effectiveTtl
    }

    return cache.current.token
}

// ─── 401 retry wrapper ──────────────────────────────────────────────

export async function handle401Once<T>(fn: () => Promise<T>, reLogin: () => Promise<void>): Promise<T> {
    try {
        return await fn()
    } catch (err: unknown) {
        const status = (err as { status?: number } | null)?.status ?? (err as { response?: { status?: number } } | null)?.response?.status
        if (status === 401) {
            await reLogin()
            return await fn()
        }
        throw err
    }
}

// ─── Chunk helpers ──────────────────────────────────────────────────

async function chunkText(
    text: string,
    providedSplitter: TextSplitterLike | undefined,
    chunkSize: number,
    chunkOverlap: number
): Promise<string[]> {
    if (providedSplitter) {
        const docs = await providedSplitter.createDocuments([text])
        return docs.map((d) => d.pageContent)
    }
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize, chunkOverlap })
    const docs = await splitter.createDocuments([text])
    return docs.map((d) => d.pageContent)
}

function batchOf<T>(arr: T[], size: number): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < arr.length; i += size) {
        batches.push(arr.slice(i, i + size))
    }
    return batches
}

// ─── Main tool ───────────────────────────────────────────────────────

export class SimulationVectorizerTool extends DynamicStructuredTool {
    name = 'simulation_vectorizer_case_one'
    description =
        'Vectorize the current simulation (Case One). Call this tool to ingest and embed all simulation data into the pgvector knowledge base. No arguments are needed — the simulation ID is resolved from the flow configuration.'

    schema = z.object({}).optional()

    private deps: VectorizerDeps
    private jwtCache: { current: JwtCacheEntry | null } = { current: null }
    private authEnv: AuthEnv

    constructor(deps: VectorizerDeps, authEnv: AuthEnv) {
        super({
            name: 'simulation_vectorizer_case_one',
            description:
                'Vectorize the current simulation (Case One). Call this tool to ingest and embed all simulation data into the pgvector knowledge base. No arguments are needed — the simulation ID is resolved from the flow configuration.',
            schema: z.object({}).optional(),
            func: async () => this._call()
        })
        this.deps = {
            bucketName: 'a2a',
            bucketBasePath: 'reports/one',
            schemaName: 'knowledge',
            tableSimulations: 'simulations',
            tableDocumentSimulation: 'document_simulation',
            chunkSize: 1500,
            chunkOverlap: 200,
            sourceFlow: 'simulation_vectorizer',
            jwtCacheTtlMinutes: 50,
            ...deps
        }
        this.authEnv = { ...authEnv, jwtCacheTtlMinutes: this.deps.jwtCacheTtlMinutes! }
    }

    public getClosedSimulationId(): string {
        return this.deps.simulationId
    }

    protected async _call(): Promise<string> {
        const startedAt = Date.now()
        const warnings: string[] = []
        const deps = this.deps

        const makeError = (error: unknown, stage: VectorizerError['stage']): VectorizerError => ({
            ok: false,
            error: sanitizeError(error, [this.authEnv.email, this.authEnv.password]),
            simulationId: deps.simulationId,
            durationMs: Date.now() - startedAt,
            stage
        })

        try {
            // Step 1 — Auth
            let jwt: string
            try {
                jwt = await ensureJwt(deps.supabaseClient as unknown as AuthSupabaseClient, this.jwtCache, this.authEnv)
            } catch (authErr) {
                return JSON.stringify(makeError(authErr, 'auth'))
            }

            // Step 2 — Fetch form data
            const fetchForm = () =>
                deps.supabaseClient.functions.invoke(`form_case_one/get/${deps.simulationId}`, {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${jwt}` }
                })

            let formResponse: Awaited<ReturnType<typeof fetchForm>>
            try {
                formResponse = await fetchForm()
            } catch (catchErr) {
                // 401 retry once
                await this.jwtCache401ReLogin()
                formResponse = await fetchForm()
            }

            if (formResponse.error) {
                return JSON.stringify(
                    makeError(`form_case_one error: ${formResponse.error.message} (${formResponse.error.status})`, 'fetch-form')
                )
            }

            const payload = formResponse.data as { success?: boolean; data?: CaseOneData } | undefined
            if (!payload || !payload.success || !payload.data) {
                return JSON.stringify(makeError('form_case_one returned unsuccessful response', 'fetch-form'))
            }

            const formData = payload.data

            // Step 3 — Build narrative
            const narrative = prepareCaseForVectorization(formData)

            // Step 4 — Walk bucket
            const bucketPath = `${deps.bucketBasePath}/${deps.simulationId}`
            let bucketFiles: BucketFile[] = []
            try {
                bucketFiles = await walkBucket(deps.supabaseClient.storage, deps.bucketName!, bucketPath, { limit: 1000 })
            } catch (err) {
                warnings.push(`Bucket walk failed: ${sanitizeError(err)} — continuing with form data only`)
            }

            // Step 4b — Download and parse documents
            const documentChunks: string[] = []
            const documentMetaBatch: Record<string, unknown>[] = []

            for (const file of bucketFiles) {
                try {
                    const { data: blob, error: dlErr } = await deps.supabaseClient.storage.from(deps.bucketName!).download(file.path)

                    if (dlErr || !blob) {
                        warnings.push(`Download failed: ${file.path} — ${dlErr?.message || 'no data'}`)
                        continue
                    }

                    try {
                        const entries = await parseByMime(blob as unknown as Blob, file.mime)
                        for (const entry of entries) {
                            documentChunks.push(entry.text)
                            documentMetaBatch.push({
                                ...entry.metadata,
                                file_path: file.path,
                                file_name: file.path.split('/').pop(),
                                mime_type: file.mime
                            })
                        }
                    } catch {
                        warnings.push(`Parse failed: ${file.path} (${file.mime}) — skipped`)
                    }
                } catch {
                    warnings.push(`Download error: ${file.path} — skipped`)
                }
            }

            // Step 5 — Detect language
            let language = ''
            try {
                language = await detectLanguage(
                    narrative,
                    deps.languageDetectionModel,
                    undefined // use default dynamic import('franc') in production
                )
            } catch {
                warnings.push('Language detection failed — defaulting to empty')
            }

            // Step 6 — Chunk narrative + documents
            const narrativeChunks = await chunkText(narrative, deps.textSplitter, deps.chunkSize!, deps.chunkOverlap!)

            let docChunks: string[]
            if (deps.textSplitter) {
                const docs = await deps.textSplitter.createDocuments(documentChunks)
                docChunks = docs.map((d) => d.pageContent)
            } else {
                const splitter = new RecursiveCharacterTextSplitter({
                    chunkSize: deps.chunkSize!,
                    chunkOverlap: deps.chunkOverlap!
                })
                const docs = await splitter.createDocuments(documentChunks)
                docChunks = docs.map((d) => d.pageContent)
            }

            // Step 7 — Embed (batched to avoid HuggingFace entity-too-large)
            const allChunks = [...narrativeChunks, ...docChunks]
            let allEmbeddings: number[][] = []
            const EMBED_BATCH_SIZE = 20
            try {
                const batches = batchOf(allChunks, EMBED_BATCH_SIZE)
                for (const batch of batches) {
                    const batchEmbeddings = await deps.embeddings.embedDocuments(batch)
                    allEmbeddings.push(...batchEmbeddings)
                }
            } catch (err) {
                return JSON.stringify(makeError(err, 'embed'))
            }

            const narrativeEmbeddings = allEmbeddings.slice(0, narrativeChunks.length)
            const docEmbeddings = allEmbeddings.slice(narrativeChunks.length)

            // Step 8 — DELETE existing rows (idempotency)
            const db = deps.supabaseClient.schema(deps.schemaName!)
            try {
                const { error: delSimErr } = await db
                    .from(deps.tableSimulations!)
                    .delete()
                    .eq('simulation_id', deps.simulationId)
                    .eq('case', 'one')
                if (delSimErr) throw delSimErr
            } catch (err) {
                return JSON.stringify(makeError(err, 'delete'))
            }

            try {
                const { error: delDocErr } = await db
                    .from(deps.tableDocumentSimulation!)
                    .delete()
                    .eq('simulation_id', deps.simulationId)
                    .eq('case', 'one')
                if (delDocErr) throw delDocErr
            } catch (err) {
                return JSON.stringify(makeError(err, 'delete'))
            }

            // Step 9 — INSERT simulations (narrative chunks)
            const simRows = narrativeChunks.map((content, i) => ({
                simulation_id: deps.simulationId,
                source_flow: deps.sourceFlow!,
                content,
                metadata: {
                    ...formData,
                    chunk_index: i,
                    total_chunks: narrativeChunks.length
                },
                embedding: narrativeEmbeddings[i],
                case: 'one',
                language
            }))

            for (const batch of batchOf(simRows, 500)) {
                try {
                    const { error: insErr } = await db.from(deps.tableSimulations!).insert(batch)
                    if (insErr) throw insErr
                } catch (err) {
                    return JSON.stringify(makeError(err, 'insert'))
                }
            }

            // Step 10 — INSERT document_simulation (document chunks)
            const docRows = docChunks.map((content, i) => ({
                simulation_id: deps.simulationId,
                content,
                embedding: docEmbeddings[i],
                metadata: {
                    ...(documentMetaBatch[i] || {}),
                    chunk_index: i,
                    total_chunks: docChunks.length
                },
                case: 'one',
                language
            }))

            for (const batch of batchOf(docRows, 500)) {
                try {
                    const { error: insErr } = await db.from(deps.tableDocumentSimulation!).insert(batch)
                    if (insErr) throw insErr
                } catch (err) {
                    return JSON.stringify(makeError(err, 'insert'))
                }
            }

            const success: VectorizerSuccess = {
                ok: true,
                simulationId: deps.simulationId,
                rowsInserted: {
                    simulations: simRows.length,
                    documents: docRows.length
                },
                language,
                durationMs: Date.now() - startedAt,
                warnings
            }

            return JSON.stringify(success)
        } catch (err) {
            const result = makeError(err, 'unknown')
            return JSON.stringify(result)
        }
    }

    private async jwtCache401ReLogin(): Promise<void> {
        this.jwtCache.current = null
        await ensureJwt(this.deps.supabaseClient as unknown as AuthSupabaseClient, this.jwtCache, this.authEnv)
    }
}
