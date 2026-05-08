const { nodeClass: SupabaseStorageRename } = require('../SupabaseStorageRename')
import { RenameTool } from '../core'

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
        storage: {
            from: jest.fn(() => ({
                move: jest.fn(() => Promise.resolve({ data: { message: 'Moved' }, error: null })),
                getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/test.txt' } }))
            }))
        }
    }))
}))

describe('SupabaseStorageRename node', () => {
    it('should return a RenameTool instance from init()', async () => {
        const node = new SupabaseStorageRename()
        const nodeData = {
            credential: 'test-cred-id',
            inputs: {
                supabaseProjUrl: 'https://test.supabase.co',
                supabaseBucketName: 'test-bucket',
                supabaseBasePath: 'v1'
            }
        } as any

        const result = await node.init(nodeData, '', {})
        expect(result).toBeInstanceOf(RenameTool)
    })
})
