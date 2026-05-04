/**
 * categories.test.ts — Category Schema Tests
 *
 * Phase 1 (T1-T4): Test Suite
 * Tests T1: Enum Category, T3: getCategorySchema, T4: validateCategory
 */

import { describe, it, expect } from 'vitest'
import { Category, getCategorySchema, validateCategory } from './categories.js'

describe('Category Enum (T1)', () => {
    it('CT-001: should have all 5 category values', () => {
        expect(Object.keys(Category)).toHaveLength(5)
    })

    it('CT-001: should map to correct string values', () => {
        expect(Category.CHAT_MODELS).toBe('Chat Models')
        expect(Category.MEMORY).toBe('Memory')
        expect(Category.VECTOR_STORES).toBe('Vector Stores')
        expect(Category.EMBEDDINGS).toBe('Embeddings')
        expect(Category.TOOLS).toBe('Tools')
    })
})

describe('getCategorySchema (T3)', () => {
    it('CT-004: should return schema for Chat Models', () => {
        const schema = getCategorySchema('Chat Models')
        expect(schema).not.toBeNull()
        expect(schema?.category).toBe(Category.CHAT_MODELS)
    })

    it('CT-004: should return schema for all categories', () => {
        expect(getCategorySchema('Chat Models')?.category).toBe(Category.CHAT_MODELS)
        expect(getCategorySchema('Memory')?.category).toBe(Category.MEMORY)
        expect(getCategorySchema('Vector Stores')?.category).toBe(Category.VECTOR_STORES)
        expect(getCategorySchema('Embeddings')?.category).toBe(Category.EMBEDDINGS)
        expect(getCategorySchema('Tools')?.category).toBe(Category.TOOLS)
    })

    it('CT-002: should return null for unknown category', () => {
        expect(getCategorySchema('Unknown')).toBeNull()
    })

    it('CT-003: should return null for empty/undefined', () => {
        expect(getCategorySchema('')).toBeNull()
        expect(getCategorySchema(undefined as unknown as string)).toBeNull()
        expect(getCategorySchema(null as unknown as string)).toBeNull()
    })
})

describe('validateCategory (T4)', () => {
    describe('Chat Models', () => {
        it('CT-005: should pass for valid Chat Model', () => {
            const node = {
                data: {
                    inputParams: [{ name: 'credential' }, { name: 'modelName' }],
                    inputs: { credential: 'sk-test', modelName: 'gpt-4' },
                    inputAnchors: [],
                    outputAnchors: [{ id: 'source' }]
                }
            }
            const issues = validateCategory(node, 'Chat Models')
            expect(issues).toHaveLength(0)
        })

        it('CT-006: should fail if missing required param', () => {
            const node = {
                data: {
                    inputParams: [{ name: 'credential' }],
                    inputs: { credential: 'sk-test' },
                    inputAnchors: [],
                    outputAnchors: [{ id: 'source' }]
                }
            }
            const issues = validateCategory(node, 'Chat Models')
            expect(issues.some((i) => i.code === 'MISSING_REQUIRED_FIELD')).toBe(true)
        })

        it('CT-006: should fail if credential is empty', () => {
            const node = {
                data: {
                    inputParams: [{ name: 'credential' }, { name: 'modelName' }],
                    inputs: { credential: '', modelName: 'gpt-4' },
                    inputAnchors: [],
                    outputAnchors: [{ id: 'source' }]
                }
            }
            const issues = validateCategory(node, 'Chat Models')
            expect(issues.some((i) => i.code === 'EMPTY_REQUIRED_PARAM')).toBe(true)
        })

        it('CT-007: should fail if too many inputAnchors', () => {
            const node = {
                data: {
                    inputParams: [{ name: 'credential' }, { name: 'modelName' }],
                    inputs: { credential: 'sk-test', modelName: 'gpt-4' },
                    inputAnchors: [{ id: 'a1' }, { id: 'a2' }],
                    outputAnchors: [{ id: 'source' }]
                }
            }
            const issues = validateCategory(node, 'Chat Models')
            expect(issues.some((i) => i.code === 'INVALID_ANCHOR_SHAPE')).toBe(true)
        })
    })

    describe('Memory', () => {
        it('CT-008: should pass for valid Memory with sessionId', () => {
            const node = {
                data: {
                    inputParams: [{ name: 'sessionId' }],
                    inputs: { sessionId: 'my-session' },
                    inputAnchors: [],
                    outputAnchors: [{ id: 'source' }]
                }
            }
            const issues = validateCategory(node, 'Memory')
            expect(issues).toHaveLength(0)
        })

        it('CT-008: should warn if no sessionId/memoryKey with output anchors', () => {
            const node = {
                data: {
                    inputParams: [],
                    inputs: {},
                    inputAnchors: [],
                    outputAnchors: [{ id: 'source' }]
                }
            }
            const issues = validateCategory(node, 'Memory')
            expect(issues.some((i) => i.severity === 'warning')).toBe(true)
        })
    })

    describe('Vector Stores', () => {
        it('CT-009: should pass for valid Vector Store', () => {
            const node = {
                data: {
                    inputParams: [{ name: 'supabaseProjUrl' }, { name: 'tableName' }],
                    inputs: {
                        supabaseProjUrl: 'https://test.supabase.co',
                        tableName: 'documents'
                    },
                    inputAnchors: [{ id: 'target' }],
                    outputAnchors: [{ id: 'source' }]
                }
            }
            const issues = validateCategory(node, 'Vector Stores')
            expect(issues).toHaveLength(0)
        })

        it('CT-009: should fail if tableName is empty', () => {
            const node = {
                data: {
                    inputParams: [{ name: 'supabaseProjUrl' }, { name: 'tableName' }],
                    inputs: {
                        supabaseProjUrl: 'https://test.supabase.co',
                        tableName: ''
                    },
                    inputAnchors: [{ id: 'target' }],
                    outputAnchors: [{ id: 'source' }]
                }
            }
            const issues = validateCategory(node, 'Vector Stores')
            expect(issues.some((i) => i.code === 'EMPTY_REQUIRED_PARAM')).toBe(true)
        })
    })

    describe('Embeddings', () => {
        it('CT-010: should pass for valid Embeddings', () => {
            const node = {
                data: {
                    inputParams: [{ name: 'credential' }],
                    inputs: { credential: 'hf-test' },
                    inputAnchors: [{ id: 'target' }],
                    outputAnchors: [{ id: 'source' }]
                }
            }
            const issues = validateCategory(node, 'Embeddings')
            expect(issues).toHaveLength(0)
        })
    })

    describe('Tools', () => {
        it('CT-011: should pass for valid Tool', () => {
            const node = {
                data: {
                    inputParams: [{ name: 'name' }],
                    inputs: { name: 'myTool' },
                    inputAnchors: [{ id: 'target' }],
                    outputAnchors: [{ id: 'source' }]
                }
            }
            const issues = validateCategory(node, 'Tools')
            expect(issues).toHaveLength(0)
        })

        it('CT-011: should fail if name is empty', () => {
            const node = {
                data: {
                    inputParams: [{ name: 'name' }],
                    inputs: { name: '' },
                    inputAnchors: [{ id: 'target' }],
                    outputAnchors: [{ id: 'source' }]
                }
            }
            const issues = validateCategory(node, 'Tools')
            expect(issues.some((i) => i.code === 'EMPTY_REQUIRED_PARAM')).toBe(true)
        })
    })

    describe('CT-012: semanticRules', () => {
        it('should apply semantic rules for Chat Models', () => {
            const node = {
                data: {
                    inputParams: [{ name: 'credential' }],
                    inputs: { credential: 'sk-test' },
                    inputAnchors: [],
                    outputAnchors: [{ id: 'source' }]
                }
            }
            const issues = validateCategory(node, 'Chat Models')
            expect(issues.some((i) => i.code === 'MISSING_MODEL_NAME')).toBe(true)
        })
    })
})
