// Mock createAdapter from A2AStorageFactory
jest.mock('../../A2AStorage/A2AStorageFactory', () => ({
    createAdapter: jest.fn()
}))

// Mock getBaseClasses from utils
jest.mock('../../../../src/utils', () => ({
    getBaseClasses: jest.fn(() => ['Tool', 'StructuredTool'])
}))

import { createAdapter } from '../../A2AStorage/A2AStorageFactory'

// Helper: create a mock adapter with all registry methods
const createMockAdapter = (overrides: Record<string, jest.Mock> = {}) =>
    ({
        backend: 'localjson' as const,
        initialize: jest.fn().mockResolvedValue(undefined),
        registerAgent: jest.fn(),
        getAgent: jest.fn(),
        findAgents: jest.fn(),
        updateAgentStatus: jest.fn(),
        ...overrides
    } as any)

describe('A2ARegistry', () => {
    let A2ARegistry_Tools: any

    // Helper to create a node instance
    const createNode = () => new A2ARegistry_Tools()

    // Helper to create nodeData
    const createNodeData = (overrides: Record<string, unknown> = {}) => ({
        inputs: {
            storageBackend: 'localjson',
            operation: 'find',
            ...overrides
        }
    })

    beforeEach(async () => {
        jest.clearAllMocks()
        ;(createAdapter as jest.Mock).mockResolvedValue(createMockAdapter())

        // Dynamic import to get fresh module instance
        const module = (await import('../A2ARegistry')) as any
        A2ARegistry_Tools = module.nodeClass
    })

    // -----------------------------------------------------------------------
    // Node Structure Tests
    // -----------------------------------------------------------------------

    describe('Node structure', () => {
        it('should have correct label and name', () => {
            const node = createNode()
            expect(node.label).toBe('A2A Registry')
            expect(node.name).toBe('a2aRegistry')
        })

        it('should have correct version, type, category, and icon', () => {
            const node = createNode()
            expect(node.version).toBe(1.0)
            expect(node.type).toBe('A2ARegistry')
            expect(node.icon).toBe('a2aregistry.svg')
            expect(node.category).toBe('Tools')
        })

        it('should have correct description', () => {
            const node = createNode()
            expect(node.description).toContain('Register')
        })

        it('should have correct baseClasses', () => {
            const node = createNode()
            expect(node.baseClasses).toContain('A2ARegistry')
            expect(node.baseClasses).toContain('Tool')
            expect(node.baseClasses).toContain('StructuredTool')
        })

        it('should have storageBackend input with correct options', () => {
            const node = createNode()
            const input = node.inputs.find((i: any) => i.name === 'storageBackend')
            expect(input).toBeDefined()
            expect(input.type).toBe('options')
            expect(input.default).toBe('localjson')
            const optionNames = input.options.map((o: any) => o.name)
            expect(optionNames).toEqual(['localjson', 'supabase', 'postgres', 'sqlite'])
        })

        it('should have operation input with 4 options', () => {
            const node = createNode()
            const input = node.inputs.find((i: any) => i.name === 'operation')
            expect(input).toBeDefined()
            expect(input.type).toBe('options')
            expect(input.default).toBe('find')
            const optionNames = input.options.map((o: any) => o.name)
            expect(optionNames).toEqual(['register', 'get', 'find', 'updateStatus'])
        })

        it('should have supabaseProjUrl input as optional additionalParams', () => {
            const node = createNode()
            const input = node.inputs.find((i: any) => i.name === 'supabaseProjUrl')
            expect(input).toBeDefined()
            expect(input.optional).toBe(true)
            expect(input.additionalParams).toBe(true)
            expect(input.type).toBe('string')
        })

        it('should not have more than 3 inputs', () => {
            const node = createNode()
            expect(node.inputs).toHaveLength(3)
        })
    })

    // -----------------------------------------------------------------------
    // loadMethods Tests
    // -----------------------------------------------------------------------

    describe('loadMethods', () => {
        it('should expose loadMethods as an object (even if empty)', () => {
            const node = createNode()
            // loadMethods must exist as a property (can be empty object since
            // operations are static options, no dynamic loading needed)
            expect(node.loadMethods).toBeDefined()
            expect(typeof node.loadMethods).toBe('object')
        })
    })

    // -----------------------------------------------------------------------
    // init() Tests — returns correct Tool per operation
    // -----------------------------------------------------------------------

    describe('init()', () => {
        it('should return a tool instance for operation=register', async () => {
            const node = createNode()
            const nodeData = createNodeData({ operation: 'register' })
            const tool = await node.init(nodeData, '', {})
            expect(tool).toBeDefined()
            expect(tool.name).toBe('a2a_registry_register')
        })

        it('should return a tool instance for operation=get', async () => {
            const node = createNode()
            const nodeData = createNodeData({ operation: 'get' })
            const tool = await node.init(nodeData, '', {})
            expect(tool).toBeDefined()
            expect(tool.name).toBe('a2a_registry_get')
        })

        it('should return a tool instance for operation=find', async () => {
            const node = createNode()
            const nodeData = createNodeData({ operation: 'find' })
            const tool = await node.init(nodeData, '', {})
            expect(tool).toBeDefined()
            expect(tool.name).toBe('a2a_registry_find')
        })

        it('should return a tool instance for operation=updateStatus', async () => {
            const node = createNode()
            const nodeData = createNodeData({ operation: 'updateStatus' })
            const tool = await node.init(nodeData, '', {})
            expect(tool).toBeDefined()
            expect(tool.name).toBe('a2a_registry_update')
        })

        it('should pass storageBackend + config to createAdapter', async () => {
            const node = createNode()
            const nodeData = createNodeData({ storageBackend: 'supabase' })
            await node.init(nodeData, '', {})

            expect(createAdapter).toHaveBeenCalledWith('supabase', expect.any(Object))
        })
    })

    // -----------------------------------------------------------------------
    // Tool Execution Tests (using real LocalJsonAdapter)
    // -----------------------------------------------------------------------

    describe('Tool execution (mocked adapter)', () => {
        let adapter: any

        beforeEach(() => {
            adapter = createMockAdapter()
            ;(createAdapter as jest.Mock).mockResolvedValue(adapter)
        })

        // ── RegistryRegisterTool ──

        describe('RegistryRegisterTool', () => {
            it('should accept an AgentCard and call adapter.registerAgent', async () => {
                const mockAgentId = '00000000-0000-0000-0000-000000000001'
                adapter.registerAgent.mockResolvedValue(mockAgentId)

                const node = createNode()
                const nodeData = createNodeData({ operation: 'register' })
                const tool = await node.init(nodeData, '', {})

                const agentCard = {
                    id: mockAgentId,
                    name: 'Test Agent',
                    description: 'A test agent for unit testing',
                    capabilities: ['fact-checking'],
                    mcpEndpoints: [],
                    artifactTypes: [],
                    ownerId: '00000000-0000-0000-0000-000000000002',
                    status: 'active' as const,
                    metadata: {}
                }

                const result = await tool._call(agentCard)

                expect(adapter.registerAgent).toHaveBeenCalledWith(agentCard)
                expect(result).toBe(mockAgentId)
            })
        })

        // ── RegistryGetTool ──

        describe('RegistryGetTool', () => {
            it('should accept agentId and return AgentCard when found', async () => {
                const agentCard = {
                    id: '00000000-0000-0000-0000-000000000001',
                    name: 'Test Agent',
                    description: 'A test agent',
                    capabilities: ['fact-checking'],
                    mcpEndpoints: [],
                    artifactTypes: [],
                    ownerId: '00000000-0000-0000-0000-000000000002',
                    status: 'active' as const,
                    metadata: {}
                }
                adapter.getAgent.mockResolvedValue(agentCard)

                const node = createNode()
                const nodeData = createNodeData({ operation: 'get' })
                const tool = await node.init(nodeData, '', {})

                const result = await tool._call({ agentId: agentCard.id })

                expect(adapter.getAgent).toHaveBeenCalledWith(agentCard.id)
                expect(result).toEqual(agentCard)
            })

            it('should return null when agent not found', async () => {
                adapter.getAgent.mockResolvedValue(null)

                const node = createNode()
                const nodeData = createNodeData({ operation: 'get' })
                const tool = await node.init(nodeData, '', {})

                const result = await tool._call({ agentId: '00000000-0000-0000-0000-000000000099' })

                expect(result).toBeNull()
            })
        })

        // ── RegistryFindTool ──

        describe('RegistryFindTool', () => {
            it('should filter agents by capability', async () => {
                const matchingAgent = {
                    id: '00000000-0000-0000-0000-000000000001',
                    name: 'Fact Checker',
                    description: 'Checks facts',
                    capabilities: ['fact-checking'],
                    mcpEndpoints: [],
                    artifactTypes: [],
                    ownerId: '00000000-0000-0000-0000-000000000002',
                    status: 'active' as const,
                    metadata: {}
                }
                adapter.findAgents.mockResolvedValue([matchingAgent])

                const node = createNode()
                const nodeData = createNodeData({ operation: 'find' })
                const tool = await node.init(nodeData, '', {})

                const result = await tool._call({ capability: 'fact-checking' })

                expect(adapter.findAgents).toHaveBeenCalledWith({ capability: 'fact-checking' })
                expect(result).toHaveLength(1)
                expect(result[0]).toEqual(matchingAgent)
            })

            it('should filter by status', async () => {
                adapter.findAgents.mockResolvedValue([])

                const node = createNode()
                const nodeData = createNodeData({ operation: 'find' })
                const tool = await node.init(nodeData, '', {})

                await tool._call({ status: 'active' })
                expect(adapter.findAgents).toHaveBeenCalledWith({ status: 'active' })
            })

            it('should filter by mcpEndpoint', async () => {
                adapter.findAgents.mockResolvedValue([])

                const node = createNode()
                const nodeData = createNodeData({ operation: 'find' })
                const tool = await node.init(nodeData, '', {})

                await tool._call({ mcpEndpoint: 'https://example.com/mcp' })
                expect(adapter.findAgents).toHaveBeenCalledWith({ mcpEndpoint: 'https://example.com/mcp' })
            })

            it('should filter by artifactType', async () => {
                adapter.findAgents.mockResolvedValue([])

                const node = createNode()
                const nodeData = createNodeData({ operation: 'find' })
                const tool = await node.init(nodeData, '', {})

                await tool._call({ artifactType: 'report' })
                expect(adapter.findAgents).toHaveBeenCalledWith({ artifactType: 'report' })
            })

            it('should return empty array when no match', async () => {
                adapter.findAgents.mockResolvedValue([])

                const node = createNode()
                const nodeData = createNodeData({ operation: 'find' })
                const tool = await node.init(nodeData, '', {})

                const result = await tool._call({ capability: 'nonexistent' })

                expect(result).toEqual([])
            })
        })

        // ── RegistryUpdateTool ──

        describe('RegistryUpdateTool', () => {
            it('should accept agentId + status and call adapter.updateAgentStatus', async () => {
                adapter.updateAgentStatus.mockResolvedValue(undefined)

                const node = createNode()
                const nodeData = createNodeData({ operation: 'updateStatus' })
                const tool = await node.init(nodeData, '', {})

                await tool._call({
                    agentId: '00000000-0000-0000-0000-000000000001',
                    status: 'offline'
                })

                expect(adapter.updateAgentStatus).toHaveBeenCalledWith('00000000-0000-0000-0000-000000000001', 'offline')
            })

            it('should accept all valid AgentStatus values', async () => {
                adapter.updateAgentStatus.mockResolvedValue(undefined)
                const validStatuses = ['active', 'idle', 'offline'] as const

                const node = createNode()
                const nodeData = createNodeData({ operation: 'updateStatus' })
                const tool = await node.init(nodeData, '', {})

                for (const status of validStatuses) {
                    await tool._call({
                        agentId: '00000000-0000-0000-0000-000000000001',
                        status
                    })
                }

                expect(adapter.updateAgentStatus).toHaveBeenCalledTimes(3)
            })

            it('should reject invalid status values via invoke (schema validation)', async () => {
                const node = createNode()
                const nodeData = createNodeData({ operation: 'updateStatus' })
                const tool = await node.init(nodeData, '', {})

                // invoke() validates against Zod schema BEFORE calling _call()
                // Passing an invalid status should throw
                await expect(
                    tool.invoke({
                        agentId: '00000000-0000-0000-0000-000000000001',
                        status: 'invalid_status'
                    })
                ).rejects.toThrow()
            })
        })
    })
})
