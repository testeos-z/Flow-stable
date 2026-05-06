import { runContractTests } from './contract.test'
import { LocalJsonAdapter } from '../adapters/LocalJsonAdapter'

// ---------------------------------------------------------------------------
// Contract tests — validates LocalJsonAdapter against the shared contract
// ---------------------------------------------------------------------------

runContractTests('LocalJsonAdapter', async () => {
    const adapter = new LocalJsonAdapter({})
    await adapter.initialize({})
    return adapter
})

// ---------------------------------------------------------------------------
// Adapter-specific tests
// ---------------------------------------------------------------------------

describe('LocalJsonAdapter — specific behavior', () => {
    let adapter: LocalJsonAdapter

    const AGENT_A_ID = '550e8400-e29b-41d4-a716-446655440000'
    const AGENT_B_ID = '123e4567-e89b-12d3-a456-426614174000'

    beforeEach(async () => {
        adapter = new LocalJsonAdapter({})
        await adapter.initialize({})
    })

    describe('In-memory storage', () => {
        it('should not persist data between adapter instances', async () => {
            // Register agent in first instance
            await adapter.registerAgent({
                id: AGENT_A_ID,
                name: 'Agent One',
                description: 'Test',
                capabilities: ['test'],
                mcpEndpoints: [],
                artifactTypes: [],
                ownerId: AGENT_B_ID,
                status: 'active',
                metadata: {}
            })

            // Second instance should have no agents
            const adapter2 = new LocalJsonAdapter({})
            await adapter2.initialize({})
            const results = await adapter2.findAgents({ capability: 'test', limit: 20, offset: 0 })
            expect(results).toEqual([])
        })
    })

    describe('Filter edge cases', () => {
        it('should apply multiple filter criteria', async () => {
            await adapter.registerAgent({
                id: AGENT_A_ID,
                name: 'Agent Alpha',
                description: 'Test',
                capabilities: ['fact-checking', 'summarization'],
                mcpEndpoints: [],
                artifactTypes: ['report'],
                ownerId: AGENT_B_ID,
                status: 'active',
                metadata: {}
            })

            await adapter.registerAgent({
                id: AGENT_B_ID,
                name: 'Agent Beta',
                description: 'Test',
                capabilities: ['fact-checking'],
                mcpEndpoints: [],
                artifactTypes: [],
                ownerId: AGENT_A_ID,
                status: 'idle',
                metadata: {}
            })

            // Match capability + status
            const results = await adapter.findAgents({
                capability: 'fact-checking',
                status: 'active',
                limit: 20,
                offset: 0
            })
            expect(results).toHaveLength(1)
            expect(results[0].name).toBe('Agent Alpha')
        })
    })

    describe('UpdateAgentStatus edge cases', () => {
        it('should silently succeed for non-existent agent', async () => {
            await expect(adapter.updateAgentStatus('00000000-0000-0000-0000-000000000000', 'offline')).resolves.not.toThrow()
        })
    })
})
