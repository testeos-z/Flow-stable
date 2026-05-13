// ---------------------------------------------------------------------------
// Tests for SimulationVectorizerCaseOne.ts — INode contract
// ---------------------------------------------------------------------------

jest.mock('../../../../src/utils', () => ({
    getCredentialData: jest.fn(async () => ({
        supabaseProjUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'anon-key',
        supabaseUserEmail: 'test@example.com',
        supabaseUserPassword: 'test-password'
    })),
    getCredentialParam: jest.fn((name: string, credData?: any) => {
        if (!credData) return ''
        return credData[name] || ''
    }),
    getBaseClasses: jest.fn(() => ['Tool'])
}))

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        auth: { signInWithPassword: jest.fn() },
        functions: { invoke: jest.fn() },
        storage: { from: jest.fn() },
        schema: jest.fn()
    }))
}))

const nodeClassModule = require('../SimulationVectorizerCaseOne')
const NodeClass = nodeClassModule.nodeClass

describe('SimulationVectorizerCaseOne — INode contract', () => {
    let node: any

    beforeEach(() => {
        node = new NodeClass()
    })

    it('sets correct INodeProperties', () => {
        expect(node.label).toBe('Simulation Vectorizer (Case One)')
        expect(node.name).toBe('simulationVectorizerCaseOne')
        expect(node.version).toBe(1.0)
        expect(node.type).toBe('SimulationVectorizerCaseOne')
        expect(node.category).toBe('A2A Knowledge')
        expect(node.author).toBeUndefined()
        expect(node.baseClasses).toContain('SimulationVectorizerCaseOne')
        expect(node.baseClasses).toContain('Tool')
        expect(node.baseClasses).toContain('DynamicStructuredTool')
    })

    it('credential names supabaseUserAuth', () => {
        expect(node.credential.credentialNames).toContain('supabaseUserAuth')
    })

    it('has required inputs: embeddings and simulationId', () => {
        const names = node.inputs.map((i: any) => i.name)
        expect(names).toContain('embeddings')
        expect(names).toContain('simulationId')
    })

    it('simulationId input accepts variables', () => {
        const simIdInput = node.inputs.find((i: any) => i.name === 'simulationId')
        expect(simIdInput.acceptVariable).toBe(true)
        expect(simIdInput.placeholder).toContain('$flow.state')
    })

    it('has optional text splitter and language detection model inputs', () => {
        const names = node.inputs.map((i: any) => i.name)
        expect(names).toContain('textSplitter')
        expect(names).toContain('languageDetectionModel')
    })

    it('init() returns a SimulationVectorizerTool instance', async () => {
        const nodeData = {
            credential: 'cred-id',
            inputs: {
                simulationId: '00000000-0000-4000-8000-000000000001',
                embeddings: { embedDocuments: jest.fn() }
            }
        }
        const tool = await node.init(nodeData, '', {})
        expect(tool).toBeDefined()
        expect(tool.name).toBe('simulation_vectorizer_case_one')
        expect(tool.getClosedSimulationId()).toBe('00000000-0000-4000-8000-000000000001')
    })

    it('init() throws if simulationId is missing', async () => {
        const nodeData = {
            credential: 'cred-id',
            inputs: {
                embeddings: { embedDocuments: jest.fn() }
            }
        }
        await expect(node.init(nodeData, '', {})).rejects.toThrow('simulationId is required')
    })

    it('init() throws if simulationId is not a valid UUID', async () => {
        const nodeData = {
            credential: 'cred-id',
            inputs: {
                simulationId: 'not-a-uuid',
                embeddings: { embedDocuments: jest.fn() }
            }
        }
        await expect(node.init(nodeData, '', {})).rejects.toThrow('simulationId must be a valid UUID')
    })

    it('init() throws if embeddings missing', async () => {
        const nodeData = {
            credential: 'cred-id',
            inputs: {
                simulationId: '00000000-0000-4000-8000-000000000001'
            }
        }
        await expect(node.init(nodeData, '', {})).rejects.toThrow('Embeddings input is required')
    })

    it('init() passes optional parameters through', async () => {
        const nodeData = {
            credential: 'cred-id',
            inputs: {
                simulationId: '00000000-0000-4000-8000-000000000001',
                embeddings: { embedDocuments: jest.fn() },
                bucketName: 'custom-bucket',
                chunkSize: 500,
                sourceFlow: 'custom-flow'
            }
        }
        const tool = await node.init(nodeData, '', {})
        expect(tool).toBeDefined()
        expect(tool.getClosedSimulationId()).toBe('00000000-0000-4000-8000-000000000001')
    })
})
