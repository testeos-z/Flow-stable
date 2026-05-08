const { nodeClass: SupabaseStorageDownload } = require('../SupabaseStorageDownload')
import { DownloadTool } from '../core'

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
                download: jest.fn(() => Promise.resolve({ data: new Blob(['test']), error: null })),
                getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/test.txt' } }))
            }))
        }
    }))
}))

describe('SupabaseStorageDownload node', () => {
    it('should return a DownloadTool instance from init()', async () => {
        const node = new SupabaseStorageDownload()
        const nodeData = {
            credential: 'test-cred-id',
            inputs: {
                supabaseProjUrl: 'https://test.supabase.co',
                supabaseBucketName: 'test-bucket',
                supabaseBasePath: 'v1'
            }
        } as any

        const result = await node.init(nodeData, '', {})
        expect(result).toBeInstanceOf(DownloadTool)
    })
})
