import { DownloadTool } from '../core'

// ---------------------------------------------------------------------------
// Mock @supabase/supabase-js
// ---------------------------------------------------------------------------

class MockStorageBucket {
    async download(path: string) {
        if (path === 'missing.txt' || path.endsWith('/missing.txt')) {
            return { data: null, error: { message: 'Object not found' } }
        }
        if (path === 'docs/report.txt' || path.endsWith('/docs/report.txt')) {
            return { data: new Blob(['Hello from report']), error: null }
        }
        return { data: new Blob(['Default content']), error: null }
    }

    getPublicUrl(path: string) {
        return { data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/test-bucket/${path}` } }
    }
}

class MockSupabaseStorage {
    from(_bucket: string) {
        return new MockStorageBucket()
    }
}

class MockSupabaseClient {
    storage = new MockSupabaseStorage()
}

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => new MockSupabaseClient())
}))

// ---------------------------------------------------------------------------
// DownloadTool tests
// ---------------------------------------------------------------------------

describe('DownloadTool', () => {
    const defaultArgs = {
        url: 'https://test.supabase.co',
        apiKey: 'test-key',
        bucket: 'test-bucket'
    }

    it('should download a text file and return content + publicUrl', async () => {
        const tool = new DownloadTool(defaultArgs)
        const result = await tool._call({ sourcePath: 'docs/report.txt' })
        const parsed = JSON.parse(result)

        expect(parsed.content).toBe('Hello from report')
        expect(parsed.publicUrl).toBe('https://test.supabase.co/storage/v1/object/public/test-bucket/docs/report.txt')
    })

    it('should throw when file is not found', async () => {
        const tool = new DownloadTool(defaultArgs)
        await expect(tool._call({ sourcePath: 'missing.txt' })).rejects.toThrow('Supabase Storage error: Object not found')
    })

    it('should prepend basePath to sourcePath when provided', async () => {
        const tool = new DownloadTool({ ...defaultArgs, basePath: 'v1' })
        const result = await tool._call({ sourcePath: 'docs/report.txt' })
        const parsed = JSON.parse(result)

        expect(parsed.content).toBe('Hello from report')
    })

    it('should throw when credentials are missing', () => {
        expect(() => new DownloadTool({ ...defaultArgs, apiKey: '' })).toThrow('Missing Supabase API credential')
    })

    it('should throw when project URL is invalid', () => {
        expect(() => new DownloadTool({ ...defaultArgs, url: 'bad-url' })).toThrow('Invalid Supabase project URL')
    })
})
