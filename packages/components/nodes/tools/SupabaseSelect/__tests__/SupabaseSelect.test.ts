const { nodeClass: SupabaseSelect } = require('../SupabaseSelect')
import { SelectTool } from '../core'

jest.mock('../../../src/utils', () => ({
    getCredentialData: jest.fn(() =>
        Promise.resolve({
            supabaseApiKey: 'test-key'
        })
    ),
    getCredentialParam: jest.fn((_param: string, credentialData: any) => credentialData.supabaseApiKey),
    getBaseClasses: jest.fn(() => ['Tool'])
}))

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({}))
}))

describe('SupabaseSelect node', () => {
    it('should return a SelectTool instance from init()', async () => {
        const node = new SupabaseSelect()
        const nodeData = {
            credential: 'test-cred-id',
            inputs: {
                supabaseProjUrl: 'https://test.supabase.co',
                tableName: 'users'
            }
        } as any

        const result = await node.init(nodeData, '', {})
        expect(result).toBeInstanceOf(SelectTool)
    })

    it('should bake tableName into tool config (not exposed in Zod schema)', async () => {
        const node = new SupabaseSelect()
        const nodeData = {
            credential: 'test-cred-id',
            inputs: {
                supabaseProjUrl: 'https://test.supabase.co',
                tableName: 'orders'
            }
        } as any

        const result = await node.init(nodeData, '', {})
        // The SelectTool Zod schema must NOT include tableName or table
        const schemaShape = (result as any).schema?.shape
        expect(schemaShape?.tableName).toBeUndefined()
        expect(schemaShape?.table).toBeUndefined()
    })

    it('should set correct label, name, type, and category', () => {
        const node = new SupabaseSelect()
        expect(node.label).toBe('Supabase Select')
        expect(node.name).toBe('supabaseSelect')
        expect(node.type).toBe('SupabaseSelect')
        expect(node.category).toBe('Tools')
    })

    it('should have supabaseApi credential configured', () => {
        const node = new SupabaseSelect()
        expect(node.credential).toBeDefined()
        expect(node.credential.credentialNames).toContain('supabaseApi')
    })

    it('should have required inputs: supabaseProjUrl and tableName', () => {
        const node = new SupabaseSelect()
        const inputNames = node.inputs.map((i: any) => i.name)
        expect(inputNames).toContain('supabaseProjUrl')
        expect(inputNames).toContain('tableName')
    })
})
