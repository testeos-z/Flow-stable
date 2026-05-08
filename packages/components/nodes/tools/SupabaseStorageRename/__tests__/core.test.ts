import { RenameTool } from '../core'

// ---------------------------------------------------------------------------
// Mock @supabase/supabase-js
// ---------------------------------------------------------------------------

class MockStorageBucket {
    async move(fromPath: string, _toPath: string) {
        if (fromPath === 'docs/exists.txt' || fromPath.endsWith('/docs/exists.txt')) {
            return { data: null, error: { message: 'The resource already exists' } }
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
// RenameTool tests
// ---------------------------------------------------------------------------

describe('RenameTool', () => {
    const defaultArgs = {
        url: 'https://test.supabase.co',
        apiKey: 'test-key',
        bucket: 'test-bucket'
    }

    it('should rename a file and return new path + publicUrl', async () => {
        const tool = new RenameTool(defaultArgs)
        const result = await tool._call({ sourcePath: 'docs/old.txt', newName: 'new.txt' })
        const parsed = JSON.parse(result)

        expect(parsed.path).toBe('docs/new.txt')
        expect(parsed.publicUrl).toBe('https://test.supabase.co/storage/v1/object/public/test-bucket/docs/new.txt')
    })

    it('should throw when target already exists', async () => {
        const tool = new RenameTool(defaultArgs)
        await expect(tool._call({ sourcePath: 'docs/exists.txt', newName: 'exists.txt' })).rejects.toThrow(
            'Supabase Storage error: The resource already exists'
        )
    })

    it('should prepend basePath to paths when provided', async () => {
        const tool = new RenameTool({ ...defaultArgs, basePath: 'v1' })
        const result = await tool._call({ sourcePath: 'docs/old.txt', newName: 'new.txt' })
        const parsed = JSON.parse(result)

        expect(parsed.path).toBe('v1/docs/new.txt')
        expect(parsed.publicUrl).toBe('https://test.supabase.co/storage/v1/object/public/test-bucket/v1/docs/new.txt')
    })

    it('should handle sourcePath with no folder prefix', async () => {
        const tool = new RenameTool(defaultArgs)
        const result = await tool._call({ sourcePath: 'old.txt', newName: 'new.txt' })
        const parsed = JSON.parse(result)

        expect(parsed.path).toBe('new.txt')
    })

    it('should throw when credentials are missing', () => {
        expect(() => new RenameTool({ ...defaultArgs, apiKey: '' })).toThrow('Missing Supabase API credential')
    })

    it('should throw when project URL is invalid', () => {
        expect(() => new RenameTool({ ...defaultArgs, url: 'bad-url' })).toThrow('Invalid Supabase project URL')
    })
})
