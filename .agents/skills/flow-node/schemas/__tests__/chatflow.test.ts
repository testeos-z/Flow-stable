/**
 * chatflow.test.ts — ChatFlowNodeSchema + validateChatFlowSemantics
 *
 * PR2 (T9 part of PR2): Tests for ChatFlow schema.
 */

import { describe, it, expect } from 'vitest'
import { ChatFlowNodeSchema, validateChatFlowSemantics, CHATFLOW_MVP_ALLOWLIST } from '../chatflow.js'

// ============================================================================
// Helpers
// ============================================================================

function buildMinimalChatNode(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        id: 'node_0',
        position: { x: 0, y: 0 },
        positionAbsolute: { x: 0, y: 0 },
        type: 'customNode',
        width: 320,
        height: 200,
        selected: false,
        dragging: false,
        data: {
            id: 'data_0',
            label: 'ChatOpenRouter',
            name: 'chatOpenRouter',
            type: 'ChatOpenRouter',
            category: 'Chat Models',
            inputs: {},
            inputParams: [],
            inputAnchors: [{ id: 'in_0', name: 'chatOpenRouter', label: 'Chat', type: 'ChatOpenRouter' }],
            outputAnchors: [{ id: 'out_0', name: 'chatOpenRouter', label: 'Chat', type: 'ChatOpenRouter' }],
            outputs: {},
            ...overrides
        },
        ...overrides
    }
}

// ============================================================================
// ChatFlowNodeSchema
// ============================================================================

describe('ChatFlowNodeSchema', () => {
    it('passes with valid chatOpenRouter node', () => {
        const node = buildMinimalChatNode({ name: 'chatOpenRouter', category: 'Chat Models' })
        const result = ChatFlowNodeSchema.safeParse(node)
        expect(result.success).toBe(true)
    })

    it('passes with chatOpenAI node', () => {
        const node = buildMinimalChatNode({ name: 'chatOpenAI', category: 'Chat Models' })
        const result = ChatFlowNodeSchema.safeParse(node)
        expect(result.success).toBe(true)
    })

    it('passes with bufferMemory node', () => {
        const node = buildMinimalChatNode({ name: 'bufferMemory', category: 'Memory' })
        const result = ChatFlowNodeSchema.safeParse(node)
        expect(result.success).toBe(true)
    })

    it('passes with retrieverTool node', () => {
        const node = buildMinimalChatNode({ name: 'retrieverTool', category: 'Tools' })
        const result = ChatFlowNodeSchema.safeParse(node)
        expect(result.success).toBe(true)
    })

    it('fails hard on wrong type (agentFlow for ChatFlow)', () => {
        const node = buildMinimalChatNode({ type: 'agentFlow' })
        const result = ChatFlowNodeSchema.safeParse(node)
        expect(result.success).toBe(false)
        if (!result.success) {
            const wrongTypeIssue = result.error.issues.find((i) => i.path.join('.') === 'type')
            expect(wrongTypeIssue).toBeDefined()
        }
    })

    it('fails hard when category is Agent Flows', () => {
        const node = buildMinimalChatNode({ name: 'chatOpenRouter', category: 'Agent Flows' })
        const result = ChatFlowNodeSchema.safeParse(node)
        expect(result.success).toBe(false)
        if (!result.success) {
            const catIssue = result.error.issues.find((i) => i.path.join('.').includes('category'))
            expect(catIssue).toBeDefined()
        }
    })

    it('fails hard when name is not in MVP allowlist', () => {
        const node = buildMinimalChatNode({ name: 'futureChatNode', category: 'Future' })
        const result = ChatFlowNodeSchema.safeParse(node)
        expect(result.success).toBe(false)
        if (!result.success) {
            const nameIssue = result.error.issues.find((i) => i.path.join('.').includes('name'))
            expect(nameIssue).toBeDefined()
        }
    })

    it('fails hard when PLACEHOLDER_ID remains in data.id', () => {
        const node = buildMinimalChatNode({
            data: {
                id: 'PLACEHOLDER_ID',
                label: 'ChatOpenRouter',
                name: 'chatOpenRouter',
                type: 'ChatOpenRouter',
                category: 'Chat Models',
                inputs: {},
                inputParams: [],
                inputAnchors: [{ id: 'in_0', name: 'chatOpenRouter', label: 'Chat', type: 'ChatOpenRouter' }],
                outputAnchors: [{ id: 'out_0', name: 'chatOpenRouter', label: 'Chat', type: 'ChatOpenRouter' }],
                outputs: {}
            }
        })
        const result = ChatFlowNodeSchema.safeParse(node)
        expect(result.success).toBe(false)
    })
})

// ============================================================================
// validateChatFlowSemantics
// ============================================================================

describe('validateChatFlowSemantics', () => {
    it('passes with a valid chatOpenRouter node', () => {
        const nodes = [buildMinimalChatNode({ name: 'chatOpenRouter', category: 'Chat Models' })]
        const edges: Record<string, unknown>[] = []
        const issues = validateChatFlowSemantics({ nodes, edges })
        expect(issues).toHaveLength(0)
    })

    it('passes with bufferMemory node (no edges needed)', () => {
        const nodes = [buildMinimalChatNode({ name: 'bufferMemory', category: 'Memory' })]
        const edges: Record<string, unknown>[] = []
        const issues = validateChatFlowSemantics({ nodes, edges })
        expect(issues).toHaveLength(0)
    })

    it('fails with UNSUPPORTED_NODE_TYPE for unknown node name', () => {
        const nodes = [buildMinimalChatNode({ name: 'futureChatNode', category: 'Future' })]
        const edges: Record<string, unknown>[] = []
        const issues = validateChatFlowSemantics({ nodes, edges })
        const unsupported = issues.filter((i) => i.code === 'UNSUPPORTED_NODE_TYPE')
        expect(unsupported.length).toBeGreaterThan(0)
        expect(unsupported[0].message).toContain('futureChatNode')
        expect(unsupported[0].message).toContain('MVP allowlist')
    })

    it('fails with WRONG_FLOW_TYPE when category is Agent Flows', () => {
        const nodes = [buildMinimalChatNode({ name: 'chatOpenRouter', category: 'Agent Flows' })]
        const edges: Record<string, unknown>[] = []
        const issues = validateChatFlowSemantics({ nodes, edges })
        expect(issues.some((i) => i.code === 'WRONG_FLOW_TYPE')).toBe(true)
    })

    it('fails when inputAnchors is missing (not an array)', () => {
        const nodes = [
            buildMinimalChatNode({
                name: 'chatOpenRouter',
                category: 'Chat Models',
                data: {
                    id: 'data_0',
                    label: 'ChatOpenRouter',
                    name: 'chatOpenRouter',
                    type: 'ChatOpenRouter',
                    category: 'Chat Models',
                    inputs: {},
                    inputParams: [],
                    inputAnchors: 'not-an-array',
                    outputAnchors: [],
                    outputs: {}
                }
            })
        ]
        const edges: Record<string, unknown>[] = []
        const issues = validateChatFlowSemantics({ nodes, edges })
        const missingAnchors = issues.filter((i) => i.code === 'MISSING_REQUIRED_FIELD' && i.message.includes('inputAnchors'))
        expect(missingAnchors.length).toBeGreaterThan(0)
    })

    it('fails when inputParams is missing (not an array)', () => {
        const nodes = [
            buildMinimalChatNode({
                name: 'chatOpenRouter',
                category: 'Chat Models',
                data: {
                    id: 'data_0',
                    label: 'ChatOpenRouter',
                    name: 'chatOpenRouter',
                    type: 'ChatOpenRouter',
                    category: 'Chat Models',
                    inputs: {},
                    inputParams: 'not-an-array',
                    inputAnchors: [],
                    outputAnchors: [],
                    outputs: {}
                }
            })
        ]
        const edges: Record<string, unknown>[] = []
        const issues = validateChatFlowSemantics({ nodes, edges })
        const missingParams = issues.filter((i) => i.code === 'MISSING_REQUIRED_FIELD' && i.message.includes('inputParams'))
        expect(missingParams.length).toBeGreaterThan(0)
    })

    it('fails when edge references unknown sourceHandle', () => {
        const nodes = [
            buildMinimalChatNode({ id: 'chat_0', name: 'chatOpenRouter', category: 'Chat Models' }),
            buildMinimalChatNode({ id: 'mem_0', name: 'bufferMemory', category: 'Memory' })
        ]
        const edges: Record<string, unknown>[] = [
            { id: 'e0', source: 'chat_0', target: 'mem_0', sourceHandle: 'unknownHandle', targetHandle: 'bufferMemory' }
        ]
        const issues = validateChatFlowSemantics({ nodes, edges })
        expect(issues.some((i) => i.code === 'INVALID_ANCHOR_SHAPE' && i.message.includes('unknownHandle'))).toBe(true)
    })

    it('fails when node contains PLACEHOLDER_ID in nested inputParams field', () => {
        const nodes = [
            buildMinimalChatNode({
                name: 'chatOpenRouter',
                category: 'Chat Models',
                data: {
                    id: 'data_0',
                    label: 'ChatOpenRouter',
                    name: 'chatOpenRouter',
                    type: 'ChatOpenRouter',
                    category: 'Chat Models',
                    inputs: {},
                    inputParams: [{ label: 'Model', id: 'PLACEHOLDER_ID' }],
                    inputAnchors: [],
                    outputAnchors: [],
                    outputs: {}
                }
            })
        ]
        const edges: Record<string, unknown>[] = []
        const issues = validateChatFlowSemantics({ nodes, edges })
        expect(issues.some((i) => i.code === 'PLACEHOLDER_ID_REMAINING')).toBe(true)
    })
})
