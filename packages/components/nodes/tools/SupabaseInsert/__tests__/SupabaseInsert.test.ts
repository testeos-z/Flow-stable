const { nodeClass: SupabaseInsert } = require('../SupabaseInsert')
import { InsertTool } from '../core'

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

describe('SupabaseInsert node', () => {
    it('should return an InsertTool instance from init()', async () => {
        const node = new SupabaseInsert()
        const nodeData = {
            credential: 'test-cred-id',
            inputs: {
                supabaseProjUrl: 'https://test.supabase.co',
                tableName: 'users'
            }
        } as any

        const result = await node.init(nodeData, '', {})
        expect(result).toBeInstanceOf(InsertTool)
    })

    it('should bake tableName into tool config (not exposed in Zod schema)', async () => {
        const node = new SupabaseInsert()
        const nodeData = {
            credential: 'test-cred-id',
            inputs: {
                supabaseProjUrl: 'https://test.supabase.co',
                tableName: 'orders'
            }
        } as any

        const result = await node.init(nodeData, '', {})
        const schemaShape = (result as any).schema?.shape
        expect(schemaShape?.tableName).toBeUndefined()
        expect(schemaShape?.table).toBeUndefined()
    })

    it('should set correct label, name, type, and category', () => {
        const node = new SupabaseInsert()
        expect(node.label).toBe('Supabase Insert')
        expect(node.name).toBe('supabaseInsert')
        expect(node.type).toBe('SupabaseInsert')
        expect(node.category).toBe('Tools')
    })

    it('should have supabaseApi credential configured', () => {
        const node = new SupabaseInsert()
        expect(node.credential).toBeDefined()
        expect(node.credential.credentialNames).toContain('supabaseApi')
    })

    it('should have required inputs: supabaseProjUrl and tableName', () => {
        const node = new SupabaseInsert()
        const inputNames = node.inputs.map((i: any) => i.name)
        expect(inputNames).toContain('supabaseProjUrl')
        expect(inputNames).toContain('tableName')
    })
})
