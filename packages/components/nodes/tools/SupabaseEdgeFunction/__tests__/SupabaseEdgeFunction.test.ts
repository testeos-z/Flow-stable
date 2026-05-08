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
})
