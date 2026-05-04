/**
 * common.test.ts — ReactFlowNodeSchema + NodeDataSchema + autoFixNode
 *
 * PR1 (T3 part of PR1): Tests for the common schemas.
 */

import { describe, it, expect } from 'vitest'
import { ReactFlowNodeSchema, NodeDataSchema, autoFixNode, validateNode } from '../common.js'
import { FlowNodeIssue } from '../issues.js'

// ============================================================================
// autoFixNode
// ============================================================================

describe('autoFixNode', () => {
    it('applies defaults for all missing fields', () => {
        const node = {
            id: 'node_0',
            type: 'agentFlow',
            data: { id: 'data_0', name: 'test', label: 'Test', category: 'Test', inputs: {} }
        }
        const { node: fixed, fixes } = autoFixNode(node)

        expect(fixed.position).toEqual({ x: 0, y: 0 })
        expect(fixed.positionAbsolute).toEqual({ x: 0, y: 0 })
        expect(fixed.width).toBe(320)
        expect(fixed.height).toBe(200)
        expect(fixed.selected).toBe(false)
        expect(fixed.dragging).toBe(false)
        expect(fixed.z).toBe(0)
        expect(fixed.handleBounds).toEqual({ source: [], target: [] })
        expect(fixes.length).toBe(8)
    })

    it('leaves node unchanged when all fields present', () => {
        const node = {
            id: 'node_0',
            position: { x: 100, y: 200 },
            positionAbsolute: { x: 100, y: 200 },
            type: 'agentFlow',
            width: 260,
            height: 500,
            selected: true,
            dragging: true,
            z: 5,
            handleBounds: { source: [], target: [] },
            data: {
                id: 'data_0',
                name: 'test',
                label: 'Test',
                category: 'Test',
                inputs: {},
                inputAnchors: [],
                outputAnchors: [],
                inputParams: []
            }
        }
        const { node: fixed, fixes } = autoFixNode(structuredClone(node))

        expect(fixed.position).toEqual({ x: 100, y: 200 })
        expect(fixed.positionAbsolute).toEqual({ x: 100, y: 200 })
        expect(fixed.width).toBe(260)
        expect(fixed.height).toBe(500)
        expect(fixed.selected).toBe(true)
        expect(fixed.dragging).toBe(true)
        expect(fixed.z).toBe(5)
        expect(fixes).toHaveLength(0)
    })

    it('does NOT auto-fix PLACEHOLDER_ID in id', () => {
        const node = {
            id: 'PLACEHOLDER_ID',
            position: { x: 0, y: 0 },
            positionAbsolute: { x: 0, y: 0 },
            type: 'agentFlow',
            width: 260,
            height: 500,
            selected: false,
            dragging: false,
            data: {
                id: 'PLACEHOLDER_ID',
                name: 'test',
                label: 'Test',
                category: 'Test',
                inputs: {},
                inputAnchors: [],
                outputAnchors: [],
                inputParams: []
            }
        }
        const { node: fixed, fixes } = autoFixNode(structuredClone(node))

        // id should NOT be modified by autoFixNode
        expect(fixed.id).toBe('PLACEHOLDER_ID')
        expect(fixes.filter((f: FlowNodeIssue) => f.path === 'id')).toHaveLength(0)
    })
})

// ============================================================================
// ReactFlowNodeSchema
// ============================================================================

describe('ReactFlowNodeSchema', () => {
    it('passes with valid minimal node', () => {
        const node = {
            id: 'node_0',
            position: { x: 0, y: 0 },
            positionAbsolute: { x: 0, y: 0 },
            type: 'agentFlow',
            width: 260,
            height: 500,
            selected: false,
            dragging: false,
            data: {}
        }
        expect(() => ReactFlowNodeSchema.parse(node)).not.toThrow()
    })

    it('fails hard on missing id', () => {
        const node = {
            position: { x: 0, y: 0 },
            positionAbsolute: { x: 0, y: 0 },
            type: 'agentFlow',
            width: 260,
            height: 500,
            selected: false,
            dragging: false,
            data: {}
        }
        expect(() => ReactFlowNodeSchema.parse(node)).toThrow()
    })

    it('fails hard on missing type', () => {
        const node = {
            id: 'node_0',
            position: { x: 0, y: 0 },
            positionAbsolute: { x: 0, y: 0 },
            width: 260,
            height: 500,
            selected: false,
            dragging: false,
            data: {}
        }
        expect(() => ReactFlowNodeSchema.parse(node)).toThrow()
    })

    it('fails hard on missing position', () => {
        const node = {
            id: 'node_0',
            positionAbsolute: { x: 0, y: 0 },
            type: 'agentFlow',
            width: 260,
            height: 500,
            selected: false,
            dragging: false,
            data: {}
        }
        expect(() => ReactFlowNodeSchema.parse(node)).toThrow()
    })
})

// ============================================================================
// NodeDataSchema
// ============================================================================

describe('NodeDataSchema', () => {
    const validData = {
        id: 'data_0',
        name: 'agentAgentflow',
        type: 'Agent',
        label: 'Agent',
        category: 'Agent Flows',
        inputs: {},
        inputParams: [],
        inputAnchors: [],
        outputAnchors: [],
        outputs: {}
    }

    it('passes with valid minimal data', () => {
        expect(() => NodeDataSchema.parse(validData)).not.toThrow()
    })

    it('fails hard on missing name', () => {
        const { name: _, ...rest } = validData
        expect(() => NodeDataSchema.parse(rest)).toThrow()
    })

    it('fails hard on missing type', () => {
        const { type: _, ...rest } = validData
        expect(() => NodeDataSchema.parse(rest)).toThrow()
    })

    it('fails hard on missing label', () => {
        const { label: _, ...rest } = validData
        expect(() => NodeDataSchema.parse(rest)).toThrow()
    })

    it('fails hard on missing category', () => {
        const { category: _, ...rest } = validData
        expect(() => NodeDataSchema.parse(rest)).toThrow()
    })

    it('fails hard on missing id', () => {
        const { id: _, ...rest } = validData
        expect(() => NodeDataSchema.parse(rest)).toThrow()
    })

    it('fails hard on non-array inputParams', () => {
        const result = NodeDataSchema.safeParse({ ...validData, inputParams: 'not-an-array' })
        expect(result.success).toBe(false)
    })

    it('allows extra fields via passthrough', () => {
        const result = NodeDataSchema.safeParse({
            ...validData,
            customField: 'extra',
            mcpServerId: 'abc-123'
        })
        expect(result.success).toBe(true)
    })

    it('defaults inputParams to []', () => {
        const { inputParams: _, ...rest } = validData
        const result = NodeDataSchema.safeParse(rest)
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.inputParams).toEqual([])
        }
    })
})

// ============================================================================
// validateNode (full pipeline — no flow-type schema for PR1)
// ============================================================================

describe('validateNode (PR1 — common layers only)', () => {
    it('returns valid:true for a fully-specified node', async () => {
        const node = {
            id: 'node_0',
            position: { x: 0, y: 0 },
            positionAbsolute: { x: 0, y: 0 },
            type: 'agentFlow',
            width: 260,
            height: 500,
            selected: false,
            dragging: false,
            data: {
                id: 'data_0',
                name: 'agentAgentflow',
                type: 'Agent',
                label: 'Agent',
                category: 'Agent Flows',
                inputs: {},
                inputParams: [],
                inputAnchors: [],
                outputAnchors: [],
                outputs: {}
            }
        }
        const result = await validateNode({ flowType: 'AGENTFLOW', node })
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
        expect(result.node).not.toBeNull()
    })

    it('returns valid:true with warnings when fields were auto-fixed', async () => {
        // Node is missing position, width, height, selected, dragging — all auto-fixed
        // Use unrecognized category to skip Layer 4 validation
        const node = {
            id: 'node_0',
            type: 'customNode',
            data: {
                id: 'data_0',
                name: 'chatOpenRouter',
                type: 'ChatOpenRouter',
                label: 'Chat',
                category: 'Misc', // Not in CATEGORY_MAP → Layer 4 skips validation
                inputs: {},
                inputParams: [],
                inputAnchors: [],
                outputAnchors: [],
                outputs: {}
            }
        }
        const result = await validateNode({ flowType: 'CHATFLOW', node })
        expect(result.valid).toBe(true)
        expect(result.warnings.length).toBeGreaterThan(0)
        expect(result.metadata.autoFixed).toBe(true)
        expect(result.node).not.toBeNull()
    })

    it('returns valid:false with PLACEHOLDER_ID_REMAINING when id contains placeholder', async () => {
        const node = {
            id: 'PLACEHOLDER_ID',
            position: { x: 0, y: 0 },
            positionAbsolute: { x: 0, y: 0 },
            type: 'agentFlow',
            width: 260,
            height: 500,
            selected: false,
            dragging: false,
            data: {
                id: 'data_0',
                name: 'agentAgentflow',
                type: 'Agent',
                label: 'Agent',
                category: 'Agent Flows',
                inputs: {},
                inputParams: [],
                inputAnchors: [],
                outputAnchors: [],
                outputs: {}
            }
        }
        const result = await validateNode({ flowType: 'AGENTFLOW', node })
        expect(result.valid).toBe(false)
        expect(result.errors.some((e) => e.code === 'PLACEHOLDER_ID_REMAINING')).toBe(true)
        expect(result.node).toBeNull()
    })

    it('returns valid:false with PLACEHOLDER_ID_REMAINING when data.id contains placeholder', async () => {
        const node = {
            id: 'node_0',
            position: { x: 0, y: 0 },
            positionAbsolute: { x: 0, y: 0 },
            type: 'agentFlow',
            width: 260,
            height: 500,
            selected: false,
            dragging: false,
            data: {
                id: 'PLACEHOLDER_ID',
                name: 'agentAgentflow',
                type: 'Agent',
                label: 'Agent',
                category: 'Agent Flows',
                inputs: {},
                inputParams: [],
                inputAnchors: [],
                outputAnchors: [],
                outputs: {}
            }
        }
        const result = await validateNode({ flowType: 'AGENTFLOW', node })
        expect(result.valid).toBe(false)
        expect(result.errors.some((e) => e.code === 'PLACEHOLDER_ID_REMAINING')).toBe(true)
        expect(result.node).toBeNull()
    })

    it('returns valid:false when required field missing in data', async () => {
        const node = {
            id: 'node_0',
            position: { x: 0, y: 0 },
            positionAbsolute: { x: 0, y: 0 },
            type: 'agentFlow',
            width: 260,
            height: 500,
            selected: false,
            dragging: false,
            data: {
                id: 'data_0',
                // name missing
                type: 'Agent',
                label: 'Agent',
                category: 'Agent Flows',
                inputs: {},
                inputParams: [],
                inputAnchors: [],
                outputAnchors: [],
                outputs: {}
            }
        }
        const result = await validateNode({ flowType: 'AGENTFLOW', node })
        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
        expect(result.node).toBeNull()
    })
})
