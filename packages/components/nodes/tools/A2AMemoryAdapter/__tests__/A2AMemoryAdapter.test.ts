import { LocalJsonAdapter } from '../../A2AStorage/adapters/LocalJsonAdapter'
import type { A2AStorageAdapter } from '../../../../src/A2AStorageAdapter'
import { A2AStorageMemory } from '../core'

describe('A2AMemoryAdapter', () => {
    let adapter: A2AStorageAdapter

    beforeEach(async () => {
        adapter = new LocalJsonAdapter()
        await adapter.initialize({})
    })

    // We test A2AStorageMemory directly (without node wrapper) since the node
    // requires DataSource/databaseEntities from Flowise runtime.

    describe('A2AStorageMemory — structured context', () => {
        it('should save and load context across sessions', async () => {
            const memory = new A2AStorageMemory({
                sessionId: 'session-1',
                memoryKey: 'a2a_test',
                returnMessages: true,
                appDataSource: null as any,
                databaseEntities: {} as any,
                chatflowid: 'test-flow',
                orgId: 'test-org',
                adapter
            })

            await memory.saveA2AContext('policy_area', { name: 'housing', priority: 'high' })
            const value = await memory.loadA2AContext('policy_area')
            expect(value).toEqual({ name: 'housing', priority: 'high' })
        })

        it('should return null for unknown key', async () => {
            const memory = new A2AStorageMemory({
                sessionId: 'session-2',
                memoryKey: 'a2a_test',
                returnMessages: true,
                appDataSource: null as any,
                databaseEntities: {} as any,
                chatflowid: 'test-flow',
                orgId: 'test-org',
                adapter
            })

            const value = await memory.loadA2AContext('nonexistent_key')
            expect(value).toBeNull()
        })

        it('should isolate context by session', async () => {
            const mem1 = new A2AStorageMemory({
                sessionId: 'session-a',
                memoryKey: 'a2a_test',
                returnMessages: true,
                appDataSource: null as any,
                databaseEntities: {} as any,
                chatflowid: 'test-flow',
                orgId: 'test-org',
                adapter
            })

            const mem2 = new A2AStorageMemory({
                sessionId: 'session-b',
                memoryKey: 'a2a_test',
                returnMessages: true,
                appDataSource: null as any,
                databaseEntities: {} as any,
                chatflowid: 'test-flow',
                orgId: 'test-org',
                adapter
            })

            await mem1.saveA2AContext('key', 'value-a')
            await mem2.saveA2AContext('key', 'value-b')

            expect(await mem1.loadA2AContext('key')).toBe('value-a')
            expect(await mem2.loadA2AContext('key')).toBe('value-b')
        })

        it('should overwrite context on repeated save', async () => {
            const memory = new A2AStorageMemory({
                sessionId: 'session-3',
                memoryKey: 'a2a_test',
                returnMessages: true,
                appDataSource: null as any,
                databaseEntities: {} as any,
                chatflowid: 'test-flow',
                orgId: 'test-org',
                adapter
            })

            await memory.saveA2AContext('counter', 1)
            await memory.saveA2AContext('counter', 2)
            expect(await memory.loadA2AContext('counter')).toBe(2)
        })
    })
})
