const { nodeClass: SupabaseEdgeFunction } = require('../SupabaseEdgeFunction')
import { InvokeEdgeFunctionTool } from '../core'

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
    createClient: jest.fn(() => ({
        functions: {
            invoke: jest.fn(() =>
                Promise.resolve({
                    data: { message: 'Hello from edge function' },
                    error: null
                })
            )
        }
    }))
}))

describe('SupabaseEdgeFunction node', () => {
    it('should return an InvokeEdgeFunctionTool instance from init()', async () => {
        const node = new SupabaseEdgeFunction()
        const nodeData = {
            credential: 'test-cred-id',
            inputs: {
                supabaseProjUrl: 'https://test.supabase.co',
                functionName: 'hello-world',
                requestBody: '{"name":"test"}'
            }
        } as any

        const result = await node.init(nodeData, '', {})
        expect(result).toBeInstanceOf(InvokeEdgeFunctionTool)
    })

    it('should have version 2.0', () => {
        const node = new SupabaseEdgeFunction()
        expect(node.version).toBe(2.0)
    })

    it('should expose method options input', () => {
        const node = new SupabaseEdgeFunction()
        const methodInput = node.inputs.find((i: any) => i.name === 'defaultMethod')
        expect(methodInput).toBeDefined()
        expect(methodInput.type).toBe('options')
        expect(methodInput.options).toHaveLength(5) // GET, POST, PUT, PATCH, DELETE
        expect(methodInput.default).toBe('POST')
    })

    it('should expose defaultHeaders input', () => {
        const node = new SupabaseEdgeFunction()
        const headersInput = node.inputs.find((i: any) => i.name === 'defaultHeaders')
        expect(headersInput).toBeDefined()
        expect(headersInput.type).toBe('string')
        expect(headersInput.optional).toBe(true)
    })

    it('should have supabaseApi credential', () => {
        const node = new SupabaseEdgeFunction()
        expect(node.credential.credentialNames).toContain('supabaseApi')
    })

    it('should be in Tools category', () => {
        const node = new SupabaseEdgeFunction()
        expect(node.category).toBe('Tools')
    })
})
