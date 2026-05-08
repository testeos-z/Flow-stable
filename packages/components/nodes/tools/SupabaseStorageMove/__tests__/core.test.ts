import { MoveTool } from '../core'

// ---------------------------------------------------------------------------
// Mock @supabase/supabase-js
// ---------------------------------------------------------------------------

class MockStorageBucket {
    async move(fromPath: string, _toPath: string) {
        if (fromPath === 'missing.txt' || fromPath.endsWith('/missing.txt')) {
            return { data: null, error: { message: 'Object not found' } }
        }
        return { data: { message: 'Moved' }, error: null }
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
// MoveTool tests
// ---------------------------------------------------------------------------

describe('MoveTool', () => {
    const defaultArgs = {
        url: 'https://test.supabase.co',
        apiKey: 'test-key',
        bucket: 'test-bucket'
    }

    it('should move a file between folders and return new path + publicUrl', async () => {
        const tool = new MoveTool(defaultArgs)
        const result = await tool._call({ sourcePath: 'drafts/a.txt', destinationPath: 'published/a.txt' })
        const parsed = JSON.parse(result)

        expect(parsed.path).toBe('published/a.txt')
        expect(parsed.publicUrl).toBe('https://test.supabase.co/storage/v1/object/public/test-bucket/published/a.txt')
    })

    it('should throw when source file is not found', async () => {
        const tool = new MoveTool(defaultArgs)
        await expect(tool._call({ sourcePath: 'missing.txt', destinationPath: 'published/missing.txt' })).rejects.toThrow(
            'Supabase Storage error: Object not found'
        )
    })

    it('should prepend basePath to both paths when provided', async () => {
        const tool = new MoveTool({ ...defaultArgs, basePath: 'v1' })
        const result = await tool._call({ sourcePath: 'drafts/a.txt', destinationPath: 'published/a.txt' })
        const parsed = JSON.parse(result)

        expect(parsed.path).toBe('v1/published/a.txt')
        expect(parsed.publicUrl).toBe('https://test.supabase.co/storage/v1/object/public/test-bucket/v1/published/a.txt')
    })

    it('should throw when credentials are missing', () => {
        expect(() => new MoveTool({ ...defaultArgs, apiKey: '' })).toThrow('Missing Supabase API credential')
    })

    it('should throw when project URL is invalid', () => {
        expect(() => new MoveTool({ ...defaultArgs, url: 'bad-url' })).toThrow('Invalid Supabase project URL')
    })
})
