import { describe, it, expect } from 'vitest'
import {
    ZodNodeData,
    validateFlowDataSchema,
    validateAgentFlowData,
    validateAgentFlowSemantics,
    fixFlowData,
    fullValidation
} from './flow-validation.js'

// ===========================================
// ZodNodeData Schema Tests
// ===========================================

describe('ZodNodeData', () => {
    const completeNodeData = {
        label: 'Test Node',
        name: 'testNode',
        type: 'ChatOpenRouter',
        inputs: { modelName: 'gpt-4', temperature: 0.7 },
        inputAnchors: [{ label: 'Cache', name: 'cache', type: 'BaseCache' }],
        outputAnchors: [{ label: 'Output', name: 'output', type: 'ChatOpenRouter' }],
        inputParams: [{ label: 'Model Name', name: 'modelName', type: 'string' }],
        baseClasses: ['ChatOpenRouter', 'BaseChatModel', 'Runnable'],
        filePath: '/path/to/component.js',
        outputs: {},
        category: 'Chat Models',
        description: 'Test description',
        icon: '/path/to/icon.svg',
        version: 1,
        credential: 'cred-123'
    }

    it('accepts complete node data with all required fields', () => {
        const result = ZodNodeData.safeParse(completeNodeData)
        expect(result.success).toBe(true)
    })

    it('allows extra fields via passthrough', () => {
        const result = ZodNodeData.safeParse({
            ...completeNodeData,
            customField: 'extra',
            mcpServerId: 'abc-123'
        })
        expect(result.success).toBe(true)
    })

    it('rejects missing label', () => {
        const { label: _, ...rest } = completeNodeData
        const result = ZodNodeData.safeParse(rest)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues.some((i) => i.path.includes('label'))).toBe(true)
        }
    })

    it('rejects missing name', () => {
        const { name: _, ...rest } = completeNodeData
        const result = ZodNodeData.safeParse(rest)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues.some((i) => i.path.includes('name'))).toBe(true)
        }
    })

    it('rejects missing inputs', () => {
        const { inputs: _, ...rest } = completeNodeData
        const result = ZodNodeData.safeParse(rest)
        expect(result.success).toBe(false)
    })

    it('rejects missing inputAnchors', () => {
        const { inputAnchors: _, ...rest } = completeNodeData
        const result = ZodNodeData.safeParse(rest)
        expect(result.success).toBe(false)
    })

    it('rejects missing outputAnchors', () => {
        const { outputAnchors: _, ...rest } = completeNodeData
        const result = ZodNodeData.safeParse(rest)
        expect(result.success).toBe(false)
    })

    it('rejects missing inputParams', () => {
        const { inputParams: _, ...rest } = completeNodeData
        const result = ZodNodeData.safeParse(rest)
        expect(result.success).toBe(false)
    })

    it('rejects missing baseClasses', () => {
        const { baseClasses: _, ...rest } = completeNodeData
        const result = ZodNodeData.safeParse(rest)
        expect(result.success).toBe(false)
    })

    it('rejects missing filePath', () => {
        const { filePath: _, ...rest } = completeNodeData
        const result = ZodNodeData.safeParse(rest)
        expect(result.success).toBe(false)
    })

    it('accepts empty arrays for anchors and params', () => {
        const result = ZodNodeData.safeParse({
            label: 'Test',
            name: 'test',
            type: 'TestNode',
            inputs: {},
            inputAnchors: [],
            outputAnchors: [],
            inputParams: [],
            baseClasses: [],
            filePath: '/test.js',
            outputs: {}
        })
        expect(result.success).toBe(true)
    })
})

// ===========================================
// Full flowData Validation Tests
// ===========================================

describe('ZodReactFlowObject', () => {
    function makeCompleteNode(overrides = {}) {
        return {
            id: 'node_0',
            position: { x: 0, y: 0 },
            positionAbsolute: { x: 0, y: 0 },
            type: 'customNode',
            data: {
                label: 'Test',
                name: 'test',
                type: 'ChatOpenRouter',
                inputs: {},
                inputAnchors: [],
                outputAnchors: [],
                inputParams: [],
                baseClasses: [],
                filePath: '/test.js',
                outputs: {},
                ...overrides
            },
            width: 300,
            height: 200,
            selected: false,
            dragging: false,
            z: 0,
            ...overrides
        }
    }

    it('validates flow with complete node metadata', () => {
        const flowData = JSON.stringify({
            nodes: [makeCompleteNode()],
            edges: [],
            viewport: { x: 0, y: 0, zoom: 1 }
        })
        const result = validateFlowDataSchema(flowData)
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
    })

    it('rejects flow with incomplete node data (missing inputAnchors)', () => {
        const flowData = JSON.stringify({
            nodes: [
                {
                    id: 'node_0',
                    position: { x: 0, y: 0 },
                    type: 'customNode',
                    data: {
                        label: 'Test',
                        name: 'test',
                        type: 'ChatOpenRouter',
                        inputs: {}
                    }
                }
            ],
            edges: [],
            viewport: { x: 0, y: 0, zoom: 1 }
        })
        const result = validateFlowDataSchema(flowData)
        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
    })

    it('rejects flow with missing viewport', () => {
        const flowData = JSON.stringify({
            nodes: [makeCompleteNode()],
            edges: []
        })
        const result = validateFlowDataSchema(flowData)
        expect(result.valid).toBe(false)
        expect(result.errors.some((e) => e.path === 'viewport')).toBe(true)
    })

    it('rejects flow with null nodes', () => {
        const flowData = JSON.stringify({
            nodes: null,
            edges: [],
            viewport: { x: 0, y: 0, zoom: 1 }
        })
        const result = validateFlowDataSchema(flowData)
        expect(result.valid).toBe(false)
    })
})

// ===========================================
// fixFlowData Tests
// ===========================================

describe('fixFlowData', () => {
    it('repairs incomplete node by injecting missing metadata defaults', () => {
        const flowData = JSON.stringify({
            nodes: [
                {
                    id: 'node_0',
                    position: { x: 0, y: 0 },
                    type: 'customNode',
                    data: {
                        label: 'Test',
                        name: 'test',
                        type: 'ChatOpenRouter',
                        inputs: { modelName: 'gpt-4' }
                    }
                }
            ],
            edges: [],
            viewport: { x: 0, y: 0, zoom: 1 }
        })

        const result = fixFlowData(flowData)
        expect(result.valid).toBe(true)
        expect(result.fixed).toBe(true)

        if (result.data) {
            const node = result.data.nodes[0] as any
            expect(node.data.inputAnchors).toEqual([])
            expect(node.data.outputAnchors).toEqual([])
            expect(node.data.inputParams).toEqual([])
            expect(node.data.baseClasses).toEqual([])
            expect(node.data.filePath).toBe('')
            expect(node.data.outputs).toEqual({})
            expect(node.data.category).toBe('')
            expect(node.data.description).toBe('')
            expect(node.data.icon).toBe('')
        }
    })

    it('injects viewport when missing', () => {
        const flowData = JSON.stringify({
            nodes: [
                {
                    id: 'node_0',
                    position: { x: 0, y: 0 },
                    type: 'customNode',
                    data: {
                        label: 'Test',
                        name: 'test',
                        type: 'ChatOpenRouter',
                        inputs: {},
                        inputAnchors: [],
                        outputAnchors: [],
                        inputParams: [],
                        baseClasses: [],
                        filePath: '/test.js',
                        outputs: {}
                    }
                }
            ],
            edges: []
        })

        const result = fixFlowData(flowData)
        expect(result.valid).toBe(true)
        expect(result.data?.viewport).toEqual({ x: 0, y: 0, zoom: 1 })
    })

    it('leaves complete node unchanged (no unnecessary fixes)', () => {
        const flowData = JSON.stringify({
            nodes: [
                {
                    id: 'toolAgent_0',
                    position: { x: 1040, y: 466 },
                    positionAbsolute: { x: 1040, y: 466 },
                    type: 'customNode',
                    data: {
                        label: 'Tool Agent',
                        name: 'toolAgent',
                        type: 'AgentExecutor',
                        version: 2,
                        inputs: { model: '{{chatOpenRouter_0.data.instance}}' },
                        inputAnchors: [{ label: 'Tools', name: 'tools', type: 'Tool' }],
                        outputAnchors: [{ label: 'Output', name: 'toolAgent' }],
                        inputParams: [{ label: 'System Message', name: 'systemMessage' }],
                        baseClasses: ['AgentExecutor', 'BaseChain', 'Runnable'],
                        filePath: '/usr/src/flowise/ToolAgent.js',
                        outputs: {},
                        category: 'Agents',
                        icon: '/path/to/icon.png'
                    },
                    width: 300,
                    height: 493,
                    selected: false,
                    dragging: false,
                    z: 0
                }
            ],
            edges: [],
            viewport: { x: 0, y: 0, zoom: 1 }
        })

        const result = fixFlowData(flowData)
        expect(result.valid).toBe(true)
        expect(result.warnings).toHaveLength(0)
        if (result.data) {
            const node = result.data.nodes[0] as any
            expect(node.data.category).toBe('Agents')
            expect(node.data.inputAnchors.length).toBe(1)
        }
    })

    it('handles multiple incomplete nodes', () => {
        const flowData = JSON.stringify({
            nodes: [
                {
                    id: 'n1',
                    position: { x: 0, y: 0 },
                    type: 'customNode',
                    data: { label: 'A', name: 'a', type: 'Test', inputs: {} }
                },
                {
                    id: 'n2',
                    position: { x: 300, y: 0 },
                    type: 'customNode',
                    data: { label: 'B', name: 'b', type: 'Test', inputs: {} }
                }
            ],
            edges: [],
            viewport: { x: 0, y: 0, zoom: 1 }
        })

        const result = fixFlowData(flowData)
        expect(result.valid).toBe(true)
        expect(result.fixed).toBe(true)
        if (result.data) {
            expect(result.data.nodes).toHaveLength(2)
            for (const node of result.data.nodes) {
                const n = node as any
                expect(Array.isArray(n.data.inputAnchors)).toBe(true)
                expect(typeof n.data.filePath).toBe('string')
            }
        }
    })
})

// ===========================================
// fullValidation Integration Tests
// ===========================================

describe('fullValidation', () => {
    it('auto-fixes and validates in one call', () => {
        const flowData = JSON.stringify({
            nodes: [
                {
                    id: 'node_0',
                    position: { x: 0, y: 0 },
                    type: 'customNode',
                    data: {
                        label: 'Test',
                        name: 'test',
                        type: 'Test',
                        inputs: {}
                    }
                }
            ],
            edges: []
        })

        const result = fullValidation(flowData, { fix: true, checkGraph: true })
        expect(result.valid).toBe(true)
        expect(result.fixed).toBe(true)
        expect(result.graph?.valid).toBe(true)
    })

    it('validates working flow (409dc550 structure) without warnings', () => {
        // Simplified version of the working "prueba economico" flow
        const flowData = JSON.stringify({
            nodes: [
                {
                    id: 'toolAgent_0',
                    position: { x: 1040, y: 466 },
                    type: 'customNode',
                    data: {
                        label: 'Tool Agent',
                        name: 'toolAgent',
                        type: 'AgentExecutor',
                        version: 2,
                        inputs: { tools: ['{{calculator_0.data.instance}}'], memory: '{{bufferMemory_0.data.instance}}' },
                        inputAnchors: [
                            { label: 'Tools', name: 'tools', type: 'Tool', list: true },
                            { label: 'Memory', name: 'memory', type: 'BaseChatMemory' }
                        ],
                        outputAnchors: [{ label: 'AgentExecutor', name: 'toolAgent' }],
                        inputParams: [{ label: 'System Message', name: 'systemMessage', type: 'string' }],
                        baseClasses: ['AgentExecutor', 'BaseChain', 'Runnable'],
                        filePath: '/usr/src/flowise/ToolAgent.js',
                        outputs: {},
                        category: 'Agents'
                    },
                    width: 300,
                    height: 493,
                    selected: false,
                    dragging: false,
                    z: 0
                }
            ],
            edges: [],
            viewport: { x: 412, y: 51, zoom: 1.02 }
        })

        const result = fullValidation(flowData, { fix: false, checkGraph: true })
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
    })
})

// ===========================================
// AgentFlow Schema Tests
// ===========================================

function makeAgentFlowNode(overrides: any = {}) {
    return {
        id: overrides.id || 'agent_0',
        position: { x: 0, y: 0 },
        positionAbsolute: { x: 0, y: 0 },
        type: 'agentFlow',
        data: {
            label: 'Test',
            name: 'test',
            type: overrides.dataType || 'Agent',
            category: 'Agent Flows',
            inputs: overrides.inputs || { agentModelConfig: { modelName: 'gpt-4' } },
            inputAnchors: [],
            outputAnchors: [],
            inputParams: [],
            baseClasses: [],
            filePath: '/test.js',
            outputs: {},
            ...overrides.data
        },
        width: 260,
        height: 72,
        selected: false,
        dragging: false,
        z: 0
    }
}

describe('ZodAgentFlowObject', () => {
    it('validates a well-formed AGENTFLOW', () => {
        const flowData = JSON.stringify({
            nodes: [
                makeAgentFlowNode({ id: 'start_0', dataType: 'Start', data: { inputs: {} } }),
                makeAgentFlowNode({ id: 'agent_0', dataType: 'Agent' }),
                makeAgentFlowNode({ id: 'end_0', dataType: 'DirectReply', data: { inputs: {} } })
            ],
            edges: [
                { id: 'e1', source: 'start_0', target: 'agent_0', type: 'agentFlow' },
                { id: 'e2', source: 'agent_0', target: 'end_0', type: 'agentFlow' }
            ],
            viewport: { x: 0, y: 0, zoom: 1 }
        })
        const result = validateAgentFlowData(flowData)
        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
    })

    it('rejects AGENTFLOW with CHATFLOW node category', () => {
        const flowData = JSON.stringify({
            nodes: [
                {
                    id: 'node_0',
                    position: { x: 0, y: 0 },
                    type: 'agentFlow',
                    data: {
                        label: 'Tool Agent',
                        name: 'toolAgent',
                        type: 'Agent',
                        category: 'Agents', // Invalid for AGENTFLOW
                        inputs: {},
                        inputAnchors: [],
                        outputAnchors: [],
                        inputParams: [],
                        baseClasses: [],
                        filePath: '/test.js',
                        outputs: {}
                    }
                }
            ],
            edges: [],
            viewport: { x: 0, y: 0, zoom: 1 }
        })
        const result = validateAgentFlowData(flowData)
        expect(result.valid).toBe(false)
    })

    it('rejects AGENTFLOW with invalid node type', () => {
        const flowData = JSON.stringify({
            nodes: [
                {
                    id: 'node_0',
                    position: { x: 0, y: 0 },
                    type: 'agentFlow',
                    data: {
                        label: 'Chain',
                        name: 'chain',
                        type: 'LLMChain', // Invalid for AGENTFLOW
                        category: 'Agent Flows',
                        inputs: {},
                        inputAnchors: [],
                        outputAnchors: [],
                        inputParams: [],
                        baseClasses: [],
                        filePath: '/test.js',
                        outputs: {}
                    }
                }
            ],
            edges: [],
            viewport: { x: 0, y: 0, zoom: 1 }
        })
        const result = validateAgentFlowData(flowData)
        expect(result.valid).toBe(false)
    })

    it('rejects AGENTFLOW with missing viewport', () => {
        const flowData = JSON.stringify({
            nodes: [
                makeAgentFlowNode({ id: 'start_0', dataType: 'Start', data: { inputs: {} } }),
                makeAgentFlowNode({ id: 'end_0', dataType: 'DirectReply', data: { inputs: {} } })
            ],
            edges: []
            // viewport missing
        })
        const result = validateAgentFlowData(flowData)
        expect(result.valid).toBe(false)
        expect(result.errors.some((e) => e.path === 'viewport')).toBe(true)
    })
})

// ===========================================
// AgentFlow Semantic Tests
// ===========================================

describe('validateAgentFlowSemantics', () => {
    it('returns error for zero Start nodes', () => {
        const nodes = [
            makeAgentFlowNode({ id: 'agent_0', dataType: 'Agent' }),
            makeAgentFlowNode({ id: 'end_0', dataType: 'DirectReply', data: { inputs: {} } })
        ]
        const edges = [{ id: 'e1', source: 'agent_0', target: 'end_0', type: 'agentFlow' }]
        const errors = validateAgentFlowSemantics(nodes as any, edges as any)
        expect(errors.some((e) => e.message.includes('exactly 1 Start node'))).toBe(true)
    })

    it('returns error for multiple Start nodes', () => {
        const nodes = [
            makeAgentFlowNode({ id: 'start_0', dataType: 'Start', data: { inputs: {} } }),
            makeAgentFlowNode({ id: 'start_1', dataType: 'Start', data: { inputs: {} } }),
            makeAgentFlowNode({ id: 'end_0', dataType: 'DirectReply', data: { inputs: {} } })
        ]
        const edges: any[] = []
        const errors = validateAgentFlowSemantics(nodes as any, edges)
        expect(errors.some((e) => e.message.includes('exactly 1 Start node'))).toBe(true)
    })

    it('returns error for missing ending node', () => {
        const nodes = [
            makeAgentFlowNode({ id: 'start_0', dataType: 'Start', data: { inputs: {} } }),
            makeAgentFlowNode({ id: 'agent_0', dataType: 'Agent' })
        ]
        const edges = [{ id: 'e1', source: 'start_0', target: 'agent_0', type: 'agentFlow' }]
        const errors = validateAgentFlowSemantics(nodes as any, edges as any)
        expect(errors.some((e) => e.message.includes('ending node'))).toBe(true)
    })

    it('returns error for Condition with one outgoing edge', () => {
        const nodes = [
            makeAgentFlowNode({ id: 'start_0', dataType: 'Start', data: { inputs: {} } }),
            makeAgentFlowNode({ id: 'cond_0', dataType: 'Condition', data: { inputs: {} } }),
            makeAgentFlowNode({ id: 'end_0', dataType: 'DirectReply', data: { inputs: {} } })
        ]
        const edges = [
            { id: 'e1', source: 'start_0', target: 'cond_0', type: 'agentFlow' },
            { id: 'e2', source: 'cond_0', target: 'end_0', type: 'agentFlow' }
        ]
        const errors = validateAgentFlowSemantics(nodes as any, edges as any)
        expect(errors.some((e) => e.message.includes('at least 2 outgoing edges'))).toBe(true)
    })

    it('accepts Loop pointing backward', () => {
        const nodes = [
            makeAgentFlowNode({ id: 'start_0', dataType: 'Start', data: { inputs: {} } }),
            makeAgentFlowNode({ id: 'agent_0', dataType: 'Agent' }),
            makeAgentFlowNode({ id: 'loop_0', dataType: 'Loop', data: { inputs: {} } }),
            makeAgentFlowNode({ id: 'end_0', dataType: 'DirectReply', data: { inputs: {} } })
        ]
        const edges = [
            { id: 'e1', source: 'start_0', target: 'agent_0', type: 'agentFlow' },
            { id: 'e2', source: 'agent_0', target: 'end_0', type: 'agentFlow' },
            { id: 'e3', source: 'loop_0', target: 'agent_0', type: 'agentFlow' } // Backward — valid
        ]
        const errors = validateAgentFlowSemantics(nodes as any, edges as any)
        expect(errors.some((e) => e.message.includes('earlier node'))).toBe(false)
    })

    it('returns error for Loop pointing forward', () => {
        const nodes = [
            makeAgentFlowNode({ id: 'start_0', dataType: 'Start', data: { inputs: {} } }),
            makeAgentFlowNode({ id: 'agent_0', dataType: 'Agent' }),
            makeAgentFlowNode({ id: 'loop_0', dataType: 'Loop', data: { inputs: {} } }),
            makeAgentFlowNode({ id: 'end_0', dataType: 'DirectReply', data: { inputs: {} } })
        ]
        const edges = [
            { id: 'e1', source: 'start_0', target: 'agent_0', type: 'agentFlow' },
            { id: 'e2', source: 'agent_0', target: 'loop_0', type: 'agentFlow' },
            { id: 'e3', source: 'loop_0', target: 'end_0', type: 'agentFlow' } // Forward — invalid
        ]
        const errors = validateAgentFlowSemantics(nodes as any, edges as any)
        expect(errors.some((e) => e.message.includes('earlier node'))).toBe(true)
    })

    it('returns error for Agent without modelName', () => {
        const nodes = [
            makeAgentFlowNode({ id: 'start_0', dataType: 'Start', data: { inputs: {} } }),
            makeAgentFlowNode({ id: 'agent_0', dataType: 'Agent', data: { inputs: { agentModelConfig: {} } } }),
            makeAgentFlowNode({ id: 'end_0', dataType: 'DirectReply', data: { inputs: {} } })
        ]
        const edges = [
            { id: 'e1', source: 'start_0', target: 'agent_0', type: 'agentFlow' },
            { id: 'e2', source: 'agent_0', target: 'end_0', type: 'agentFlow' }
        ]
        const errors = validateAgentFlowSemantics(nodes as any, edges as any)
        expect(errors.some((e) => e.message.includes('agentModelConfig with modelName'))).toBe(true)
    })
})

// ===========================================
// fixFlowData Type Preservation Tests
// ===========================================

describe('fixFlowData type preservation', () => {
    it('preserves existing agentFlow type', () => {
        const flowData = JSON.stringify({
            nodes: [
                {
                    id: 'start_0',
                    position: { x: 0, y: 0 },
                    type: 'agentFlow',
                    data: {
                        label: 'Start',
                        name: 'start',
                        type: 'Start',
                        inputs: {}
                    }
                }
            ],
            edges: [],
            viewport: { x: 0, y: 0, zoom: 1 }
        })
        const result = fixFlowData(flowData)
        expect(result.valid).toBe(true)
        const node = result.data!.nodes[0] as any
        expect(node.type).toBe('agentFlow')
    })

    it('injects customNode only when type is missing', () => {
        const flowData = JSON.stringify({
            nodes: [
                {
                    id: 'node_0',
                    position: { x: 0, y: 0 },
                    data: {
                        label: 'Test',
                        name: 'test',
                        type: 'ChatOpenRouter',
                        inputs: {}
                    }
                }
            ],
            edges: [],
            viewport: { x: 0, y: 0, zoom: 1 }
        })
        const result = fixFlowData(flowData)
        expect(result.valid).toBe(true)
        const node = result.data!.nodes[0] as any
        expect(node.type).toBe('customNode')
    })
})
