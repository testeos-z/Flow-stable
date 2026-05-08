const { nodeClass: SupabaseStorageUpload } = require('../SupabaseStorageUpload')
import { UploadTool } from '../core'

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
                upload: jest.fn(() => Promise.resolve({ data: { path: 'test.txt' }, error: null })),
                getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/test.txt' } }))
            }))
        }
    }))
}))

describe('SupabaseStorageUpload node', () => {
    it('should return an UploadTool instance from init()', async () => {
        const node = new SupabaseStorageUpload()
        const nodeData = {
            credential: 'test-cred-id',
            inputs: {
                supabaseProjUrl: 'https://test.supabase.co',
                supabaseBucketName: 'test-bucket',
                supabaseBasePath: 'v1',
                contentType: 'text/plain'
            }
        } as any

        const result = await node.init(nodeData, '', {})
        expect(result).toBeInstanceOf(UploadTool)
    })
})
