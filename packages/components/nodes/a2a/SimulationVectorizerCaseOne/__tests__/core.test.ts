// ---------------------------------------------------------------------------
// Tests for core.ts — sanitizeError, ensureJwt, handle401Once, _call()
// ---------------------------------------------------------------------------

import { sanitizeError, ensureJwt, handle401Once, SimulationVectorizerTool, VectorizerDeps } from '../core'
import type { SupabaseClientLike } from '../core'

// ─── Mocks ─────────────────────────────────────────────────────────────

jest.mock('../narrative', () => ({
    prepareCaseForVectorization: jest.fn(
        (data: any) => `Caso: ${data?.caseName || data?.name || 'Unknown'}\nDescripción: ${data?.descriptionText || 'no desc'}`
    )
}))

jest.mock('../language', () => ({
    detectLanguage: jest.fn(async () => 'es')
}))

jest.mock('../bucket-walker', () => ({
    walkBucket: jest.fn(async () => [{ path: 'reports/one/abc/foo.txt', mime: 'text/plain', sizeBytes: 100 }]),
    inferMime: jest.fn(() => 'text/plain')
}))

jest.mock('../file-parsers', () => ({
    parseByMime: jest.fn(async (_blob: any, _mime: string) => [{ text: 'parsed content', metadata: { mime_type: 'text/plain' } }])
}))

jest.mock('@langchain/textsplitters', () => ({
    RecursiveCharacterTextSplitter: jest.fn().mockImplementation(({ chunkSize, chunkOverlap }: any) => ({
        createDocuments: jest.fn(async (texts: string[]) => texts.map((t: string) => ({ pageContent: t })))
    }))
}))

// ─── sanitizeError ──────────────────────────────────────────────────

describe('sanitizeError', () => {
    it('removes Bearer tokens', () => {
        expect(sanitizeError('Auth: Bearer abc123def')).not.toContain('abc123def')
        expect(sanitizeError('Auth: Bearer abc123def')).toContain('[REDACTED]')
    })

    it('removes multiple Bearer tokens', () => {
        const msg = 'Failed: Bearer token1 then Bearer token2'
        const result = sanitizeError(msg)
        expect(result).not.toContain('token1')
        expect(result).not.toContain('token2')
    })

    it('removes email patterns', () => {
        expect(sanitizeError('user@example.com not found')).not.toContain('@')
    })

    it('replaces credential values when provided', () => {
        expect(sanitizeError('secret: mySecretValue', ['mySecretValue'])).toContain('[CREDENTIAL]')
    })

    it('leaves normal messages untouched', () => {
        expect(sanitizeError('Something failed')).toBe('Something failed')
    })

    it('handles Error objects', () => {
        expect(sanitizeError(new Error('test error'))).toBe('test error')
    })

    it('handles null/undefined', () => {
        expect(sanitizeError(null)).toBe('Unknown error')
        expect(sanitizeError(undefined)).toBe('Unknown error')
    })

    it('handles objects with .message', () => {
        expect(sanitizeError({ message: 'obj error' })).toBe('obj error')
    })
})

// ─── ensureJwt ─────────────────────────────────────────────────────

describe('ensureJwt', () => {
    const makeSupabase = (behavior: 'ok' | 'error' | 'no-session') => ({
        auth: {
            signInWithPassword: jest.fn(async () => {
                if (behavior === 'error') return { data: null, error: { message: 'Invalid credentials' } }
                if (behavior === 'no-session') return { data: { session: null }, error: null }
                return { data: { session: { access_token: 'fresh-jwt', expires_in: 3600 } }, error: null }
            })
        }
    })

    const authEnv = { email: 'u@ex.com', password: 'pw', jwtCacheTtlMinutes: 50 }

    it('signs in and caches token on first call', async () => {
        const supabase = makeSupabase('ok')
        const cache: { current: { token: string; expiresAt: number } | null } = { current: null }
        const token = await ensureJwt(supabase as any, cache, authEnv)
        expect(token).toBe('fresh-jwt')
        expect(cache.current?.token).toBe('fresh-jwt')
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledTimes(1)
    })

    it('returns cached token within TTL without re-authenticating', async () => {
        const supabase = makeSupabase('ok')
        const cache = { current: { token: 'cached-jwt', expiresAt: Date.now() + 60000 } }
        const token = await ensureJwt(supabase as any, cache, authEnv)
        expect(token).toBe('cached-jwt')
        expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled()
    })

    it('re-authenticates after TTL expires', async () => {
        const supabase = makeSupabase('ok')
        const cache = { current: { token: 'old-jwt', expiresAt: Date.now() - 1000 } }
        const token = await ensureJwt(supabase as any, cache, authEnv)
        expect(token).toBe('fresh-jwt')
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledTimes(1)
    })

    it('throws on auth error', async () => {
        const supabase = makeSupabase('error')
        const cache = { current: null }
        await expect(ensureJwt(supabase as any, cache, authEnv)).rejects.toThrow()
    })
})

// ─── handle401Once ─────────────────────────────────────────────────

describe('handle401Once', () => {
    it('retries on first 401 and succeeds', async () => {
        let calls = 0
        const fn = jest.fn(async () => {
            calls++
            if (calls === 1) throw { status: 401, message: 'Unauthorized' }
            return 'ok'
        })
        const reLogin = jest.fn(async () => {})
        const result = await handle401Once(fn, reLogin)
        expect(result).toBe('ok')
        expect(fn).toHaveBeenCalledTimes(2)
        expect(reLogin).toHaveBeenCalledTimes(1)
    })

    it('bubbles error on second 401', async () => {
        const fn = jest.fn(async () => {
            throw { status: 401 }
        })
        const reLogin = jest.fn(async () => {})
        await expect(handle401Once(fn, reLogin)).rejects.toEqual({ status: 401 })
        expect(fn).toHaveBeenCalledTimes(2)
    })

    it('bubbles non-401 errors without retry', async () => {
        const fn = jest.fn(async () => {
            throw new Error('network error')
        })
        const reLogin = jest.fn(async () => {})
        await expect(handle401Once(fn, reLogin)).rejects.toThrow('network error')
        expect(fn).toHaveBeenCalledTimes(1)
        expect(reLogin).not.toHaveBeenCalled()
    })
})

// ─── SimulationVectorizerTool ─────────────────────────────────────

describe('SimulationVectorizerTool', () => {
    const makeSupabase = () => ({
        auth: {
            signInWithPassword: jest.fn(async () => ({
                data: { session: { access_token: 'jwt-123', expires_in: 3600 } },
                error: null
            }))
        },
        functions: {
            invoke: jest.fn(async () => ({
                data: {
                    success: true,
                    data: {
                        id: 'abc',
                        caseName: 'Test Case',
                        descriptionText: 'A description',
                        time_existence_error: '6 months',
                        communities: [],
                        causes: [],
                        consequences: [],
                        constraints: []
                    }
                },
                error: null
            }))
        },
        storage: {
            from: jest.fn(() => ({
                download: jest.fn(async () => ({ data: new Blob(['test']), error: null }))
            }))
        },
        schema: jest.fn(() => ({
            from: jest.fn(() => ({
                delete: jest.fn(() => ({
                    eq: jest.fn(() => ({
                        eq: jest.fn(async () => ({ error: null }))
                    }))
                })),
                insert: jest.fn(async () => ({ error: null }))
            }))
        }))
    })

    const makeEmbeddings = () => ({
        embedDocuments: jest.fn(async (texts: string[]) => texts.map(() => [0.1, 0.2, 0.3]))
    })

    const makeDeps = (overrides: Partial<VectorizerDeps> = {}): VectorizerDeps => ({
        simulationId: '00000000-0000-4000-8000-000000000001',
        supabaseClient: makeSupabase() as unknown as SupabaseClientLike,
        embeddings: makeEmbeddings(),
        ...overrides
    })

    const makeAuthEnv = () => ({
        email: 'test@example.com',
        password: 'secret',
        jwtCacheTtlMinutes: 50
    })

    it('_call returns success with rowsInserted', async () => {
        const tool = new SimulationVectorizerTool(makeDeps(), makeAuthEnv())
        const result = JSON.parse(await (tool as any)._call())
        expect(result.ok).toBe(true)
        expect(result.simulationId).toBe('00000000-0000-4000-8000-000000000001')
        expect(result.rowsInserted.simulations).toBeGreaterThan(0)
        expect(result.language).toBe('es')
        expect(typeof result.durationMs).toBe('number')
    })

    it('_call handles empty bucket gracefully', async () => {
        jest.mocked(require('../bucket-walker').walkBucket).mockResolvedValueOnce([])
        const deps = makeDeps()
        const tool = new SimulationVectorizerTool(deps, makeAuthEnv())
        const result = JSON.parse(await (tool as any)._call())
        expect(result.ok).toBe(true)
        expect(result.rowsInserted.documents).toBe(0)
        expect(result.rowsInserted.simulations).toBeGreaterThan(0)
    })

    it('_call returns error envelope on fetch failure', async () => {
        const supabase = makeSupabase()
        ;(supabase as any).functions.invoke = jest.fn(async () => ({
            data: { success: false, data: null },
            error: { message: 'Not found', status: 404 }
        }))
        const deps = makeDeps({ supabaseClient: supabase as unknown as SupabaseClientLike })
        const tool = new SimulationVectorizerTool(deps, makeAuthEnv())
        const result = JSON.parse(await (tool as any)._call())
        expect(result.ok).toBe(false)
        expect(result.stage).toBe('fetch-form')
    })

    it('_call returns error on DELETE failure', async () => {
        const supabase = makeSupabase()
        ;(supabase as any).schema = jest.fn(() => ({
            from: jest.fn(() => ({
                delete: jest.fn(() => ({
                    eq: jest.fn(() => ({
                        eq: jest.fn(async () => ({ error: { message: 'RLS denied' } }))
                    }))
                })),
                insert: jest.fn(async () => ({ error: null }))
            }))
        }))
        const deps = makeDeps({ supabaseClient: supabase as unknown as SupabaseClientLike })
        const tool = new SimulationVectorizerTool(deps, makeAuthEnv())
        const result = JSON.parse(await (tool as any)._call())
        expect(result.ok).toBe(false)
        expect(result.stage).toBe('delete')
    })

    it('_call returns error on auth failure (sanitized)', async () => {
        const supabase: any = {
            auth: {
                signInWithPassword: jest.fn(async () => ({
                    data: null,
                    error: { message: 'Invalid login: secret password leaked' }
                }))
            }
        }
        const deps = makeDeps({ supabaseClient: supabase as unknown as SupabaseClientLike })
        const tool = new SimulationVectorizerTool(deps, { email: 'u@ex.com', password: 'secret', jwtCacheTtlMinutes: 50 })
        const result = JSON.parse(await (tool as any)._call())
        expect(result.ok).toBe(false)
        expect(result.stage).toBe('auth')
        expect(result.error).not.toContain('secret')
    })

    it('_call accumulates warnings for unsupported files', async () => {
        jest.mocked(require('../bucket-walker').walkBucket).mockResolvedValueOnce([{ path: 'img.png', mime: 'image/png', sizeBytes: 1000 }])
        jest.mocked(require('../file-parsers').parseByMime).mockRejectedValueOnce(new Error('Unsupported mime: image/png'))
        const tool = new SimulationVectorizerTool(makeDeps(), makeAuthEnv())
        const result = JSON.parse(await (tool as any)._call())
        expect(result.ok).toBe(true)
        expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('getClosedSimulationId returns the closed-over simulationId', () => {
        const tool = new SimulationVectorizerTool(makeDeps(), makeAuthEnv())
        expect(tool.getClosedSimulationId()).toBe('00000000-0000-4000-8000-000000000001')
    })

    it('tool name and description are set correctly', () => {
        const tool = new SimulationVectorizerTool(makeDeps(), makeAuthEnv())
        expect(tool.name).toBe('simulation_vectorizer_case_one')
        expect(tool.description).toContain('Vectorize')
    })
})
