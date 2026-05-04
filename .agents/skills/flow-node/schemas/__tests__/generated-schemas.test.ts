/**
 * generated-schemas.test.ts — Integration tests for generated schemas
 *
 * T3.1: Tests for all 179 generated schemas
 * T3.2: Tests for credential validation
 *
 * Tests verify:
 * 1. Generated validators are accessible and loadable (178+ schemas)
 * 2. Hand-crafted schemas have full business logic vs generated credential-only
 * 3. validatePerNode returns warning for unknown node types
 * 4. Credential validation works correctly
 */

import { describe, it, expect } from 'vitest'
import { validateNode } from '../index.js'
import type { FlowNodeRequest } from '../index.js'
import { ErrorCodes } from '../issues.js'

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'

// ============================================================================
// Test 1: Generated schema validators are accessible
// ============================================================================

describe('1. Generated validators are accessible', () => {
    it('getSchemaCount returns 178+ total schemas', async () => {
        const mod = await import('../nodes/index.js')
        const { getSchemaCount, getSchemaStats } = mod

        const count = await getSchemaCount()
        expect(count).toBeGreaterThanOrEqual(178)

        const stats = await getSchemaStats()
        expect(stats.handCrafted).toBe(8)
        expect(stats.generated).toBeGreaterThan(0)
    })

    it('hand-crafted chatOpenRouter validator has full business logic', async () => {
        const mod = await import('../nodes/index.js')
        const { getPerNodeSchema } = mod

        // chatOpenRouter is hand-crafted (full fidelity)
        const validator = await getPerNodeSchema('chatOpenRouter')
        expect(validator).toBeDefined()

        // Temperature 5 exceeds the 0-2 range that hand-crafted chatOpenRouter validates
        const issues = validator({ modelName: 'test', temperature: 5 })
        expect(issues.some((i) => i.path === 'temperature')).toBe(true)
    })

    it('validatePerNode returns warning for unknown node type', async () => {
        const mod = await import('../nodes/index.js')
        const { validatePerNode } = mod

        const issues = await validatePerNode('definitelyUnknownNode', {})
        expect(issues).toHaveLength(1)
        expect(issues[0].code).toBe(ErrorCodes.UNKNOWN_NODE_TYPE)
        expect(issues[0].severity).toBe('warning')
    })
})

// ============================================================================
// Test 2: validateNode works for Chat Models MVP node
// ============================================================================

describe('2. validateNode works for MVP nodes', () => {
    it('chatOpenRouter (hand-crafted MVP) passes full pipeline', async () => {
        const request: FlowNodeRequest = {
            flowType: 'CHATFLOW',
            nodeType: 'chatOpenRouter',
            nodeId: 'chatOpenRouter_0',
            node: {
                id: 'chatOpenRouter_0',
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
                    inputs: { credential: VALID_UUID, modelName: 'gpt-4' },
                    inputParams: [
                        { label: 'Credential', name: 'credential', type: 'credential', optional: true },
                        { label: 'Model Name', name: 'modelName', type: 'string', optional: false }
                    ],
                    inputAnchors: [],
                    outputAnchors: [{ id: 'out_0', name: 'chatOpenRouter', label: 'Chat', type: 'ChatOpenRouter' }],
                    outputs: {}
                }
            }
        }

        const result = await validateNode(request)
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
    })

    it('bufferMemory (hand-crafted MVP) passes full pipeline', async () => {
        const request: FlowNodeRequest = {
            flowType: 'CHATFLOW',
            nodeType: 'bufferMemory',
            nodeId: 'bufferMemory_0',
            node: {
                id: 'bufferMemory_0',
                position: { x: 0, y: 0 },
                positionAbsolute: { x: 0, y: 0 },
                type: 'customNode',
                width: 320,
                height: 200,
                selected: false,
                dragging: false,
                data: {
                    id: 'data_0',
                    label: 'Buffer Memory',
                    name: 'bufferMemory',
                    type: 'BufferMemory',
                    category: 'Memory',
                    inputs: { sessionId: 'test-session' },
                    inputParams: [{ label: 'Session ID', name: 'sessionId', type: 'string', optional: true }],
                    inputAnchors: [],
                    outputAnchors: [{ id: 'out_0', name: 'bufferMemory', label: 'Memory', type: 'Memory' }],
                    outputs: {}
                }
            }
        }

        const result = await validateNode(request)
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
    })
})

// ============================================================================
// Test 3: AgentFlow allowlist enforcement (no graceful degradation for
// unknown AgentFlow types — all 15 types are predefined)
// ============================================================================

describe('3. AgentFlow allowlist enforcement', () => {
    it('unknown AgentFlow node type fails with WRONG_FLOW_TYPE (not UNKNOWN_NODE_TYPE)', async () => {
        // Note: AgentFlow has a fixed allowlist of 15 types. Unknown AgentFlow
        // node names fail at the AgentFlowNodeSchema layer (WRONG_FLOW_TYPE),
        // not at the per-node validation layer (UNKNOWN_NODE_TYPE).
        const request: FlowNodeRequest = {
            flowType: 'AGENTFLOW',
            nodeType: 'customFutureAgent',
            nodeId: 'customFutureAgent_0',
            node: {
                id: 'customFutureAgent_0',
                position: { x: 0, y: 0 },
                positionAbsolute: { x: 0, y: 0 },
                type: 'agentFlow',
                width: 260,
                height: 500,
                selected: false,
                dragging: false,
                data: {
                    id: 'data_0',
                    label: 'Custom Future Agent',
                    name: 'customFutureAgent',
                    type: 'Agent',
                    category: 'Agent Flows',
                    inputs: {},
                    inputParams: [],
                    inputAnchors: [],
                    outputAnchors: [],
                    outputs: {}
                }
            }
        }

        const result = await validateNode(request)
        // AgentFlow unknown type fails with WRONG_FLOW_TYPE (allowlist enforcement)
        expect(result.valid).toBe(false)
        expect(result.errors.some((e) => e.code === 'WRONG_FLOW_TYPE')).toBe(true)
    })

    it('known AgentFlow type (llmAgentflow) passes validation', async () => {
        const request: FlowNodeRequest = {
            flowType: 'AGENTFLOW',
            nodeType: 'llmAgentflow',
            nodeId: 'llmAgentflow_0',
            node: {
                id: 'llmAgentflow_0',
                position: { x: 0, y: 0 },
                positionAbsolute: { x: 0, y: 0 },
                type: 'agentFlow',
                width: 260,
                height: 500,
                selected: false,
                dragging: false,
                data: {
                    id: 'data_0',
                    label: 'LLM',
                    name: 'llmAgentflow',
                    type: 'LLM',
                    category: 'Agent Flows',
                    inputs: {},
                    inputParams: [],
                    inputAnchors: [],
                    outputAnchors: [],
                    outputs: {}
                }
            }
        }

        const result = await validateNode(request)
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
    })
})

// ============================================================================
// Test 4: Credential validation
// ============================================================================

describe('4. Credential validation', () => {
    it('hand-crafted chatOpenRouter rejects invalid credential', async () => {
        const request: FlowNodeRequest = {
            flowType: 'CHATFLOW',
            nodeType: 'chatOpenRouter',
            nodeId: 'chatOpenRouter_0',
            node: {
                id: 'chatOpenRouter_0',
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
                    inputs: { credential: 'not-a-valid-uuid', modelName: 'gpt-4' },
                    inputParams: [
                        { label: 'Credential', name: 'credential', type: 'credential', optional: true },
                        { label: 'Model Name', name: 'modelName', type: 'string', optional: false }
                    ],
                    inputAnchors: [],
                    outputAnchors: [{ id: 'out_0', name: 'chatOpenRouter', label: 'Chat', type: 'ChatOpenRouter' }],
                    outputs: {}
                }
            }
        }

        const result = await validateNode(request)
        expect(result.valid).toBe(false)
        expect(result.errors.some((e) => e.code === ErrorCodes.CREDENTIAL_NOT_FOUND || e.code === ErrorCodes.INVALID_FIELD)).toBe(true)
    })

    it('hand-crafted chatOpenRouter requires modelName', async () => {
        const request: FlowNodeRequest = {
            flowType: 'CHATFLOW',
            nodeType: 'chatOpenRouter',
            nodeId: 'chatOpenRouter_0',
            node: {
                id: 'chatOpenRouter_0',
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
                    inputs: { credential: VALID_UUID },
                    inputParams: [
                        { label: 'Credential', name: 'credential', type: 'credential', optional: true },
                        { label: 'Model Name', name: 'modelName', type: 'string', optional: false }
                    ],
                    inputAnchors: [],
                    outputAnchors: [{ id: 'out_0', name: 'chatOpenRouter', label: 'Chat', type: 'ChatOpenRouter' }],
                    outputs: {}
                }
            }
        }

        const result = await validateNode(request)
        expect(result.valid).toBe(false)
        expect(result.errors.some((e) => e.code === ErrorCodes.EMPTY_REQUIRED_PARAM || e.code === ErrorCodes.MISSING_REQUIRED_FIELD)).toBe(
            true
        )
    })
})

// ============================================================================
// Test 5: AgentFlow node types
// ============================================================================

describe('5. AgentFlow nodes', () => {
    it('llmAgentflow (valid AgentFlow type) passes validation', async () => {
        const request: FlowNodeRequest = {
            flowType: 'AGENTFLOW',
            nodeType: 'llmAgentflow',
            nodeId: 'llmAgentflow_0',
            node: {
                id: 'llmAgentflow_0',
                position: { x: 0, y: 0 },
                positionAbsolute: { x: 0, y: 0 },
                type: 'agentFlow',
                width: 260,
                height: 500,
                selected: false,
                dragging: false,
                data: {
                    id: 'data_0',
                    label: 'LLM',
                    name: 'llmAgentflow',
                    type: 'LLM',
                    category: 'Agent Flows',
                    inputs: {},
                    inputParams: [],
                    inputAnchors: [],
                    outputAnchors: [],
                    outputs: {}
                }
            }
        }

        const result = await validateNode(request)
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
    })
})
