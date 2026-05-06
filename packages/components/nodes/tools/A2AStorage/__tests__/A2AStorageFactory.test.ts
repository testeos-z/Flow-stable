import { createAdapter } from '../A2AStorageFactory'

// Mock the adapter modules BEFORE they are imported by the factory
jest.mock('../adapters/LocalJsonAdapter', () => ({
    LocalJsonAdapter: jest.fn().mockImplementation(() => ({
        backend: 'localjson',
        initialize: jest.fn().mockResolvedValue(undefined),
        registerAgent: jest.fn(),
        getAgent: jest.fn(),
        findAgents: jest.fn(),
        updateAgentStatus: jest.fn(),
        createTask: jest.fn(),
        getTask: jest.fn(),
        updateTaskStatus: jest.fn(),
        listTasks: jest.fn(),
        sendMessage: jest.fn(),
        getMessages: jest.fn(),
        registerArtifact: jest.fn(),
        getArtifact: jest.fn(),
        listArtifacts: jest.fn(),
        grantAccess: jest.fn(),
        revokeAccess: jest.fn(),
        checkAccess: jest.fn(),
        createSession: jest.fn(),
        getSession: jest.fn(),
        addClaim: jest.fn(),
        getClaims: jest.fn(),
        addObservation: jest.fn(),
        addDecision: jest.fn(),
        getDecisions: jest.fn(),
        saveContext: jest.fn(),
        loadContext: jest.fn()
    }))
}))

jest.mock('../adapters/SQLiteAdapter', () => ({
    SQLiteAdapter: jest.fn().mockImplementation(() => ({
        backend: 'sqlite',
        initialize: jest.fn().mockResolvedValue(undefined),
        registerAgent: jest.fn(),
        getAgent: jest.fn(),
        findAgents: jest.fn(),
        updateAgentStatus: jest.fn(),
        createTask: jest.fn(),
        getTask: jest.fn(),
        updateTaskStatus: jest.fn(),
        listTasks: jest.fn(),
        sendMessage: jest.fn(),
        getMessages: jest.fn(),
        registerArtifact: jest.fn(),
        getArtifact: jest.fn(),
        listArtifacts: jest.fn(),
        grantAccess: jest.fn(),
        revokeAccess: jest.fn(),
        checkAccess: jest.fn(),
        createSession: jest.fn(),
        getSession: jest.fn(),
        addClaim: jest.fn(),
        getClaims: jest.fn(),
        addObservation: jest.fn(),
        addDecision: jest.fn(),
        getDecisions: jest.fn(),
        saveContext: jest.fn(),
        loadContext: jest.fn()
    }))
}))

jest.mock('../adapters/PostgresAdapter', () => ({
    PostgresAdapter: jest.fn().mockImplementation(() => ({
        backend: 'postgres',
        initialize: jest.fn().mockResolvedValue(undefined),
        registerAgent: jest.fn(),
        getAgent: jest.fn(),
        findAgents: jest.fn(),
        updateAgentStatus: jest.fn(),
        createTask: jest.fn(),
        getTask: jest.fn(),
        updateTaskStatus: jest.fn(),
        listTasks: jest.fn(),
        sendMessage: jest.fn(),
        getMessages: jest.fn(),
        registerArtifact: jest.fn(),
        getArtifact: jest.fn(),
        listArtifacts: jest.fn(),
        grantAccess: jest.fn(),
        revokeAccess: jest.fn(),
        checkAccess: jest.fn(),
        createSession: jest.fn(),
        getSession: jest.fn(),
        addClaim: jest.fn(),
        getClaims: jest.fn(),
        addObservation: jest.fn(),
        addDecision: jest.fn(),
        getDecisions: jest.fn(),
        saveContext: jest.fn(),
        loadContext: jest.fn()
    }))
}))

jest.mock('../adapters/SupabaseAdapter', () => ({
    SupabaseAdapter: jest.fn().mockImplementation(() => ({
        backend: 'supabase',
        initialize: jest.fn().mockResolvedValue(undefined),
        registerAgent: jest.fn(),
        getAgent: jest.fn(),
        findAgents: jest.fn(),
        updateAgentStatus: jest.fn(),
        createTask: jest.fn(),
        getTask: jest.fn(),
        updateTaskStatus: jest.fn(),
        listTasks: jest.fn(),
        sendMessage: jest.fn(),
        getMessages: jest.fn(),
        registerArtifact: jest.fn(),
        getArtifact: jest.fn(),
        listArtifacts: jest.fn(),
        grantAccess: jest.fn(),
        revokeAccess: jest.fn(),
        checkAccess: jest.fn(),
        createSession: jest.fn(),
        getSession: jest.fn(),
        addClaim: jest.fn(),
        getClaims: jest.fn(),
        addObservation: jest.fn(),
        addDecision: jest.fn(),
        getDecisions: jest.fn(),
        saveContext: jest.fn(),
        loadContext: jest.fn()
    }))
}))

describe('A2AStorageFactory', () => {
    describe('createAdapter', () => {
        it('throws for unknown backend', async () => {
            try {
                await createAdapter('mongodb' as any, {})
                fail('Expected createAdapter to throw')
            } catch (error: any) {
                expect(error.message).toMatch(/unsupported.*backend/i)
                expect(error.message).toContain('mongodb')
            }
        })

        it('throws for empty backend string', async () => {
            try {
                await createAdapter('' as any, {})
                fail('Expected createAdapter to throw')
            } catch (error: any) {
                expect(error.message).toBeTruthy()
            }
        })

        it('creates localjson adapter', async () => {
            const adapter = await createAdapter('localjson', {})
            expect(adapter).toBeDefined()
            expect(adapter.backend).toBe('localjson')
        })

        it('creates sqlite adapter', async () => {
            const adapter = await createAdapter('sqlite', { filePath: ':memory:' })
            expect(adapter).toBeDefined()
            expect(adapter.backend).toBe('sqlite')
        })

        it('creates postgres adapter', async () => {
            const adapter = await createAdapter('postgres', { host: 'localhost' })
            expect(adapter).toBeDefined()
            expect(adapter.backend).toBe('postgres')
        })

        it('creates supabase adapter', async () => {
            const adapter = await createAdapter('supabase', {
                supabaseProjUrl: 'https://test.supabase.co',
                supabaseApiKey: 'test-key'
            })
            expect(adapter).toBeDefined()
            expect(adapter.backend).toBe('supabase')
        })

        it('passes config to the adapter constructor', async () => {
            const { LocalJsonAdapter } = require('../adapters/LocalJsonAdapter')
            LocalJsonAdapter.mockClear()

            const config = { workspace: '/tmp/a2a' }
            await createAdapter('localjson', config)

            expect(LocalJsonAdapter).toHaveBeenCalledWith(config)
        })

        it('supports case-insensitive backend name', async () => {
            const adapter = await createAdapter('LOCALJSON' as any, {})
            expect(adapter).toBeDefined()
            expect(adapter.backend).toBe('localjson')
        })
    })
})
