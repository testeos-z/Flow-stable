/**
 * agentflow.test.ts — AgentFlowNodeSchema + validateAgentFlowSemantics
 *
 * PR2 (T8 part of PR2): Tests for AgentFlow schema.
 */

import { describe, it, expect } from 'vitest'
import { AgentFlowNodeSchema, validateAgentFlowSemantics, AGENTFLOW_ALLOWLIST } from '../agentflow.js'

// ============================================================================
// Helpers
// ============================================================================

function buildMinimalAgentNode(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
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
            label: 'Agent',
            name: 'agentAgentflow',
            type: 'Agent',
            category: 'Agent Flows',
            inputs: {},
            inputParams: [],
            inputAnchors: [],
            outputAnchors: [{ id: 'out_0', name: 'agentAgentflow', label: 'Agent', type: 'Agent', baseClasses: ['Agent'] }],
            outputs: {},
            ...overrides
        },
        ...overrides
    }
}

// ============================================================================
// AgentFlowNodeSchema
// ============================================================================

describe('AgentFlowNodeSchema', () => {
    it('passes with valid agentAgentflow node', () => {
        const node = buildMinimalAgentNode({ name: 'agentAgentflow', category: 'Agent Flows' })
        const result = AgentFlowNodeSchema.safeParse(node)
        expect(result.success).toBe(true)
    })

    it('passes with startAgentflow node', () => {
        const node = buildMinimalAgentNode({ name: 'startAgentflow', category: 'Agent Flows' })
        const result = AgentFlowNodeSchema.safeParse(node)
        expect(result.success).toBe(true)
    })

    it('passes with stickyNoteAgentflow (category = Utilities, type = stickyNote)', () => {
        const node = buildMinimalAgentNode({ type: 'stickyNote', name: 'stickyNoteAgentflow', category: 'Utilities' })
        const result = AgentFlowNodeSchema.safeParse(node)
        expect(result.success).toBe(true)
    })

    it('fails hard on wrong type (customNode for AgentFlow)', () => {
        const node = buildMinimalAgentNode({ type: 'customNode' })
        const result = AgentFlowNodeSchema.safeParse(node)
        expect(result.success).toBe(false)
        if (!result.success) {
            const wrongTypeIssue = result.error.issues.find((i) => i.path.join('.') === 'type')
            expect(wrongTypeIssue).toBeDefined()
        }
    })

    it('fails hard on wrong category (non-Agent Flows, non-Utilities)', () => {
        const node = buildMinimalAgentNode({ name: 'agentAgentflow', category: 'Chat Models' })
        const result = AgentFlowNodeSchema.safeParse(node)
        expect(result.success).toBe(false)
        if (!result.success) {
            const catIssue = result.error.issues.find((i) => i.path.join('.').includes('category'))
            expect(catIssue).toBeDefined()
        }
    })

    it('fails hard on stickyNoteAgentflow with category Agent Flows (not Utilities)', () => {
        // The schema refine rejects stickyNote with category !== 'Utilities'
        const node = buildMinimalAgentNode({ type: 'stickyNote', name: 'stickyNoteAgentflow', category: 'Agent Flows' })
        const result = AgentFlowNodeSchema.safeParse(node)
        expect(result.success).toBe(false)
        if (!result.success) {
            const catIssue = result.error.issues.find((i) => i.path.join('.').includes('category'))
            expect(catIssue).toBeDefined()
        }
    })

    it('fails hard when type is stickyNote but node is not stickyNoteAgentflow', () => {
        const node = buildMinimalAgentNode({ type: 'stickyNote', name: 'agentAgentflow', category: 'Agent Flows' })
        const result = AgentFlowNodeSchema.safeParse(node)
        expect(result.success).toBe(false)
        if (!result.success) {
            const typeIssue = result.error.issues.find((i) => i.path.join('.').includes('type'))
            expect(typeIssue).toBeDefined()
        }
    })

    it('fails hard on unknown node name', () => {
        const node = buildMinimalAgentNode({ name: 'fakeAgentflowNode', category: 'Agent Flows' })
        const result = AgentFlowNodeSchema.safeParse(node)
        expect(result.success).toBe(false)
        if (!result.success) {
            const nameIssue = result.error.issues.find((i) => i.path.join('.').includes('name'))
            expect(nameIssue).toBeDefined()
        }
    })

    it('fails hard when PLACEHOLDER_ID remains in data.id', () => {
        const node = buildMinimalAgentNode({
            data: {
                id: 'PLACEHOLDER_ID',
                label: 'Agent',
                name: 'agentAgentflow',
                type: 'Agent',
                category: 'Agent Flows',
                inputs: {},
                inputParams: [],
                inputAnchors: [],
                outputAnchors: [{ id: 'out_0', name: 'agentAgentflow', label: 'Agent', type: 'Agent', baseClasses: ['Agent'] }],
                outputs: {}
            }
        })
        const result = AgentFlowNodeSchema.safeParse(node)
        expect(result.success).toBe(false)
    })

    it('fails hard when PLACEHOLDER_ID remains in data.name', () => {
        const node = buildMinimalAgentNode({
            data: {
                id: 'data_0',
                label: 'Agent',
                name: 'PLACEHOLDER_ID_agent',
                type: 'Agent',
                category: 'Agent Flows',
                inputs: {},
                inputParams: [],
                inputAnchors: [],
                outputAnchors: [{ id: 'out_0', name: 'agentAgentflow', label: 'Agent', type: 'Agent', baseClasses: ['Agent'] }],
                outputs: {}
            }
        })
        const result = AgentFlowNodeSchema.safeParse(node)
        expect(result.success).toBe(false)
    })
})

// ============================================================================
// validateAgentFlowSemantics
// ============================================================================

describe('validateAgentFlowSemantics', () => {
    it('passes with exactly one startAgentflow node and a connected agent', () => {
        const nodes = [
            buildMinimalAgentNode({
                id: 'start_0',
                name: 'startAgentflow',
                category: 'Agent Flows',
                data: {
                    id: 'start_0',
                    label: 'Start',
                    name: 'startAgentflow',
                    type: 'Start',
                    category: 'Agent Flows',
                    inputs: {},
                    inputParams: [],
                    inputAnchors: [],
                    outputAnchors: [{ id: 'out_0', name: 'start', label: 'Start', type: 'Start', baseClasses: ['Start'] }],
                    outputs: {}
                }
            }),
            buildMinimalAgentNode({
                id: 'agent_0',
                name: 'agentAgentflow',
                category: 'Agent Flows',
                data: {
                    id: 'agent_0',
                    label: 'Agent',
                    name: 'agentAgentflow',
                    type: 'Agent',
                    category: 'Agent Flows',
                    inputs: {},
                    inputParams: [],
                    inputAnchors: [{ id: 'in_0', name: 'agent', label: 'Agent', type: 'Agent', baseClasses: ['Agent'] }],
                    outputAnchors: [],
                    outputs: {}
                }
            })
        ]
        const edges: Record<string, unknown>[] = [
            { id: 'e0', source: 'start_0', target: 'agent_0', sourceHandle: 'start', targetHandle: 'agent' }
        ]
        const issues = validateAgentFlowSemantics({ nodes, edges })
        expect(issues).toHaveLength(0)
    })

    it('fails when no startAgentflow node exists', () => {
        const nodes = [buildMinimalAgentNode({ id: 'agent_0', name: 'agentAgentflow', category: 'Agent Flows' })]
        const edges: Record<string, unknown>[] = []
        const issues = validateAgentFlowSemantics({ nodes, edges })
        expect(issues.some((i) => i.code === 'MISSING_REQUIRED_FIELD' && i.message.includes('startAgentflow'))).toBe(true)
    })

    it('fails when multiple startAgentflow nodes exist', () => {
        const nodes = [
            buildMinimalAgentNode({ id: 'start_0', name: 'startAgentflow', category: 'Agent Flows' }),
            buildMinimalAgentNode({ id: 'start_1', name: 'startAgentflow', category: 'Agent Flows' })
        ]
        const edges: Record<string, unknown>[] = []
        const issues = validateAgentFlowSemantics({ nodes, edges })
        expect(issues.some((i) => i.code === 'MISSING_REQUIRED_FIELD' && i.message.includes('startAgentflow'))).toBe(true)
    })

    it('finds orphan execution node (agentAgentflow with no connections)', () => {
        const nodes = [
            buildMinimalAgentNode({ id: 'start_0', name: 'startAgentflow', category: 'Agent Flows' }),
            buildMinimalAgentNode({ id: 'agent_0', name: 'agentAgentflow', category: 'Agent Flows' }) // orphan
        ]
        const edges: Record<string, unknown>[] = [] // no edges = orphan
        const issues = validateAgentFlowSemantics({ nodes, edges })
        expect(issues.some((i) => i.code === 'MISSING_REQUIRED_FIELD' && i.message.includes('has no connections'))).toBe(true)
    })

    it('allows stickyNoteAgentflow to be an orphan (special case — sticky notes need no connections)', () => {
        // Build nodes: start_0 connected to dummy, agent_0 and sticky_0 orphaned
        // agent_0 should be flagged, sticky_0 should NOT
        const nodes = [
            buildMinimalAgentNode({
                id: 'start_0',
                name: 'startAgentflow',
                category: 'Agent Flows',
                data: {
                    id: 'start_0',
                    label: 'Start',
                    name: 'startAgentflow',
                    type: 'Start',
                    category: 'Agent Flows',
                    inputs: {},
                    inputParams: [],
                    inputAnchors: [],
                    outputAnchors: [{ id: 'out_0', name: 'start', label: 'Start', type: 'Start', baseClasses: ['Start'] }],
                    outputs: {}
                }
            }),
            buildMinimalAgentNode({
                id: 'dummy_0',
                name: 'llmAgentflow',
                category: 'Agent Flows',
                data: {
                    id: 'dummy_0',
                    label: 'LLM',
                    name: 'llmAgentflow',
                    type: 'LLM',
                    category: 'Agent Flows',
                    inputs: {},
                    inputParams: [],
                    inputAnchors: [{ id: 'in_0', name: 'llm', label: 'LLM', type: 'LLM', baseClasses: ['LLM'] }],
                    outputAnchors: [],
                    outputs: {}
                }
            }),
            buildMinimalAgentNode({
                id: 'agent_0',
                name: 'agentAgentflow',
                category: 'Agent Flows',
                data: {
                    id: 'agent_0',
                    label: 'Agent',
                    name: 'agentAgentflow',
                    type: 'Agent',
                    category: 'Agent Flows',
                    inputs: {},
                    inputParams: [],
                    inputAnchors: [{ id: 'in_0', name: 'agent', label: 'Agent', type: 'Agent', baseClasses: ['Agent'] }],
                    outputAnchors: [],
                    outputs: {}
                }
            }),
            buildMinimalAgentNode({
                id: 'sticky_0',
                name: 'stickyNoteAgentflow',
                category: 'Utilities',
                type: 'StickyNote',
                data: {
                    id: 'sticky_0',
                    label: 'Note',
                    name: 'stickyNoteAgentflow',
                    type: 'StickyNote',
                    category: 'Utilities',
                    inputs: {},
                    inputParams: [],
                    inputAnchors: [],
                    outputAnchors: [],
                    outputs: {}
                }
            })
        ]
        // start_0 connected to dummy_0; agent_0 and sticky_0 are orphans
        const edges: Record<string, unknown>[] = [
            { id: 'e0', source: 'start_0', target: 'dummy_0', sourceHandle: 'start', targetHandle: 'llm' }
        ]
        const issues = validateAgentFlowSemantics({ nodes, edges })
        const orphanIssues = issues.filter((i) => i.code === 'MISSING_REQUIRED_FIELD' && i.message.includes('has no connections'))
        // Only agent_0 should be flagged as orphan (stickyNote is exempt)
        expect(orphanIssues).toHaveLength(1)
        expect(orphanIssues[0].message).toContain('agent_0')
    })

    it('fails when edge references unknown sourceHandle', () => {
        const nodes = [
            buildMinimalAgentNode({ id: 'start_0', name: 'startAgentflow', category: 'Agent Flows' }),
            buildMinimalAgentNode({ id: 'agent_0', name: 'agentAgentflow', category: 'Agent Flows' })
        ]
        const edges: Record<string, unknown>[] = [
            { id: 'e0', source: 'start_0', target: 'agent_0', sourceHandle: 'unknownHandle', targetHandle: 'agentAgentflow' }
        ]
        const issues = validateAgentFlowSemantics({ nodes, edges })
        expect(issues.some((i) => i.code === 'INVALID_ANCHOR_SHAPE' && i.message.includes('unknownHandle'))).toBe(true)
    })

    it('fails when node contains PLACEHOLDER_ID in nested field (inputParams)', () => {
        const nodes = [
            buildMinimalAgentNode({
                id: 'start_0',
                name: 'startAgentflow',
                category: 'Agent Flows',
                data: {
                    id: 'data_0',
                    label: 'Start',
                    name: 'startAgentflow',
                    type: 'Start',
                    category: 'Agent Flows',
                    inputs: {},
                    inputParams: [{ label: 'Test', id: 'PLACEHOLDER_ID_param' }],
                    inputAnchors: [],
                    outputAnchors: [{ id: 'out_0', name: 'startAgentflow', label: 'Start', type: 'Start' }],
                    outputs: {}
                }
            })
        ]
        const edges: Record<string, unknown>[] = []
        const issues = validateAgentFlowSemantics({ nodes, edges })
        expect(issues.some((i) => i.code === 'PLACEHOLDER_ID_REMAINING')).toBe(true)
    })
})
