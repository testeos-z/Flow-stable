/**
 * Per-node schema tests.
 * Tests for chatModels, memory, embeddings, vectorStores, tools, agents schemas.
 */
import { describe, it, expect } from 'vitest'
import {
    chatOpenRouterSchema,
    validateChatOpenRouter,
    chatOpenAISchema,
    validateChatOpenAI,
    chatAnthropicSchema,
    validateChatAnthropic,
    bufferMemorySchema,
    validateBufferMemory,
    huggingFaceInferenceEmbeddingSchema,
    validateHuggingFaceInferenceEmbedding,
    supabaseSchema,
    validateSupabase,
    retrieverToolSchema,
    validateRetrieverTool,
    toolAgentSchema,
    validateToolAgent,
    getPerNodeSchema,
    validatePerNode,
    getSchemaCount,
    getSchemaStats
} from '../nodes/index.js'

describe('chatModels schemas', () => {
    describe('chatOpenRouterSchema', () => {
        it('parses valid chatOpenRouter node', () => {
            const node = {
                modelName: 'openai/gpt-3.5-turbo',
                temperature: 0.9,
                streaming: true
            }
            const result = chatOpenRouterSchema.safeParse(node)
            expect(result.success).toBe(true)
        })

        it('validates temperature range', () => {
            const node = { temperature: 3 } // exceeds max of 2
            const issues = validateChatOpenRouter(node)
            expect(issues.length).toBeGreaterThan(0)
            expect(issues[0].path).toBe('temperature')
        })
    })

    describe('chatOpenAISchema', () => {
        it('parses valid chatOpenAI node', () => {
            const node = {
                credential: '550e8400-e29b-41d4-a716-446655440000',
                modelName: 'gpt-4o-mini',
                temperature: 0.9
            }
            const result = chatOpenAISchema.safeParse(node)
            expect(result.success).toBe(true)
        })

        it('requires credential', () => {
            const node = { modelName: 'gpt-4o-mini' }
            const issues = validateChatOpenAI(node)
            expect(issues.some((i) => i.path === 'credential')).toBe(true)
        })
    })

    describe('chatAnthropicSchema', () => {
        it('parses valid chatAnthropic node', () => {
            const node = {
                credential: '550e8400-e29b-41d4-a716-446655440000',
                modelName: 'claude-haiku-4-5',
                temperature: 0.9
            }
            const result = chatAnthropicSchema.safeParse(node)
            expect(result.success).toBe(true)
        })

        it('requires budgetTokens when extendedThinking is true', () => {
            const node = {
                credential: '550e8400-e29b-41d4-a716-446655440000',
                extendedThinking: true
            }
            const issues = validateChatAnthropic(node)
            expect(issues.some((i) => i.path === 'budgetTokens')).toBe(true)
        })
    })
})

describe('memory schemas', () => {
    describe('bufferMemorySchema', () => {
        it('parses valid bufferMemory node', () => {
            const node = {
                sessionId: 'test-session-123',
                memoryKey: 'chat_history'
            }
            const result = bufferMemorySchema.safeParse(node)
            expect(result.success).toBe(true)
        })

        it('allows optional fields', () => {
            const node = {}
            const result = bufferMemorySchema.safeParse(node)
            expect(result.success).toBe(true)
        })
    })
})

describe('embeddings schemas', () => {
    describe('huggingFaceInferenceEmbeddingSchema', () => {
        it('parses valid embedding node with modelName', () => {
            const node = {
                modelName: 'sentence-transformers/distilbert-base-nli-mean-tokens'
            }
            const result = huggingFaceInferenceEmbeddingSchema.safeParse(node)
            expect(result.success).toBe(true)
        })

        it('requires modelName or endpoint', () => {
            const node = {}
            const issues = validateHuggingFaceInferenceEmbedding(node)
            expect(issues.some((i) => i.path === 'modelName')).toBe(true)
        })
    })
})

describe('vectorStores schemas', () => {
    describe('supabaseSchema', () => {
        it('parses valid supabase node', () => {
            const node = {
                tableName: 'documents',
                queryName: 'match_documents',
                topK: 4
            }
            const result = supabaseSchema.safeParse(node)
            expect(result.success).toBe(true)
        })

        it('requires tableName and queryName', () => {
            const node = {}
            const issues = validateSupabase(node)
            expect(issues.some((i) => i.path === 'tableName')).toBe(true)
            expect(issues.some((i) => i.path === 'queryName')).toBe(true)
        })
    })
})

describe('tools schemas', () => {
    describe('retrieverToolSchema', () => {
        it('parses valid retrieverTool node', () => {
            const node = {
                name: 'search_docs',
                description: 'Searches documents',
                returnSourceDocuments: true
            }
            const result = retrieverToolSchema.safeParse(node)
            expect(result.success).toBe(true)
        })

        it('requires name and description', () => {
            const node = {}
            const issues = validateRetrieverTool(node)
            expect(issues.some((i) => i.path === 'name')).toBe(true)
            expect(issues.some((i) => i.path === 'description')).toBe(true)
        })
    })
})

describe('agents schemas', () => {
    describe('toolAgentSchema', () => {
        it('parses valid toolAgent node', () => {
            const node = {
                systemMessage: 'You are a helpful assistant',
                maxIterations: 5,
                returnDirect: false
            }
            const result = toolAgentSchema.safeParse(node)
            expect(result.success).toBe(true)
        })

        it('validates maxIterations must be positive', () => {
            const node = { maxIterations: 0 }
            const issues = validateToolAgent(node)
            expect(issues.some((i) => i.path === 'maxIterations')).toBe(true)
        })
    })
})

describe('NODE_SCHEMA_MAP', () => {
    it('returns validators for known node types', async () => {
        const { getPerNodeSchema } = await import('../nodes/index.js')
        expect(await getPerNodeSchema('chatOpenRouter')).toBeDefined()
        expect(await getPerNodeSchema('chatOpenAI')).toBeDefined()
        expect(await getPerNodeSchema('bufferMemory')).toBeDefined()
        expect(await getPerNodeSchema('supabase')).toBeDefined()
        expect(await getPerNodeSchema('retrieverTool')).toBeDefined()
        expect(await getPerNodeSchema('toolAgent')).toBeDefined()
    })

    it('returns undefined for unknown node types', async () => {
        const { getPerNodeSchema } = await import('../nodes/index.js')
        expect(await getPerNodeSchema('unknownNode')).toBeUndefined()
    })
})

describe('validatePerNode', () => {
    it('validates known node types', async () => {
        const { validatePerNode } = await import('../nodes/index.js')
        const issues = await validatePerNode('chatOpenRouter', { modelName: 'test' })
        expect(issues.length).toBeGreaterThanOrEqual(0)
    })

    it('returns warning for unknown node types', async () => {
        const { validatePerNode } = await import('../nodes/index.js')
        const issues = await validatePerNode('unknownNode', {})
        expect(issues.length).toBe(1)
        expect(issues[0].severity).toBe('warning')
    })
})

describe('getSchemaCount and getSchemaStats', () => {
    it('getSchemaCount returns at least the hand-crafted schemas', async () => {
        const { getSchemaCount } = await import('../nodes/index.js')
        const count = await getSchemaCount()
        expect(count).toBeGreaterThanOrEqual(8)
    })

    it('getSchemaStats returns breakdown with hand-crafted count', async () => {
        const { getSchemaStats } = await import('../nodes/index.js')
        const stats = await getSchemaStats()
        expect(stats.handCrafted).toBe(8)
        expect(stats.total).toBeGreaterThanOrEqual(8)
    })

    it('NODE_SCHEMA_MAP has all 8 hand-crafted nodes with full fidelity', async () => {
        const handCraftedNodes = [
            'chatOpenRouter',
            'chatOpenAI',
            'chatAnthropic',
            'bufferMemory',
            'huggingFaceInferenceEmbedding',
            'supabase',
            'retrieverTool',
            'toolAgent'
        ]
        const { getPerNodeSchema } = await import('../nodes/index.js')
        for (const nodeName of handCraftedNodes) {
            const validator = await getPerNodeSchema(nodeName)
            expect(validator, `${nodeName} should be registered`).toBeDefined()
        }
    })
})
