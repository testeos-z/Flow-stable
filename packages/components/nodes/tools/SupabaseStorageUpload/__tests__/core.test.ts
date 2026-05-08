import { UploadTool } from '../core'

// ---------------------------------------------------------------------------
// Mock @supabase/supabase-js
// ---------------------------------------------------------------------------

let lastMockBucket: MockStorageBucket | null = null

class MockStorageBucket {
    bucketName: string = ''
    lastBody: any = null
    lastOpts: any = null

    async upload(path: string, body: any, opts?: any) {
        this.lastBody = body
        this.lastOpts = opts
        lastMockBucket = this
        if (this.bucketName === 'missing-bucket') {
            return { data: null, error: { message: 'Bucket not found' } }
        }
        return { data: { path }, error: null }
    }

    getPublicUrl(path: string) {
        return { data: { publicUrl: `https://test.supabase.co/storage/v1/object/public/${this.bucketName}/${path}` } }
    }
}

class MockSupabaseStorage {
    from(bucket: string) {
        const b = new MockStorageBucket()
        b.bucketName = bucket
        return b
    }
}

class MockSupabaseClient {
    storage = new MockSupabaseStorage()
}

jest.mock('../../../src/utils', () => ({
    executeJavaScriptCode: jest.fn(),
    createCodeExecutionSandbox: jest.fn(),
    parseWithTypeConversion: jest.fn((_schema: any, arg: any) => arg)
}))

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => new MockSupabaseClient())
}))

// ---------------------------------------------------------------------------
// UploadTool tests
// ---------------------------------------------------------------------------

describe('UploadTool', () => {
    beforeEach(() => {
        lastMockBucket = null
    })

    const defaultArgs = {
        url: 'https://test.supabase.co',
        apiKey: 'test-key',
        bucket: 'test-bucket'
    }

    it('should upload a text file and return path + publicUrl', async () => {
        const tool = new UploadTool(defaultArgs)
        const result = await tool._call({ destinationPath: 'hello.txt', fileContent: 'Hello World' })
        const parsed = JSON.parse(result)

        expect(parsed.path).toBe('hello.txt')
        expect(parsed.publicUrl).toBe('https://test.supabase.co/storage/v1/object/public/test-bucket/hello.txt')
    })

    it('should decode base64 and upload as binary when contentType indicates binary', async () => {
        const tool = new UploadTool({ ...defaultArgs, contentType: 'image/png' })
        const base64 = Buffer.from('binary-data').toString('base64')
        const result = await tool._call({ destinationPath: 'image.png', fileContent: base64 })
        const parsed = JSON.parse(result)

        expect(parsed.path).toBe('image.png')
        expect(lastMockBucket).not.toBeNull()
        expect(lastMockBucket!.lastBody).toBeInstanceOf(Buffer)
        expect(lastMockBucket!.lastOpts).toMatchObject({ contentType: 'image/png', upsert: true })
    })

    it('should prepend basePath to destinationPath when provided', async () => {
        const tool = new UploadTool({ ...defaultArgs, basePath: 'v1' })
        const result = await tool._call({ destinationPath: 'hello.txt', fileContent: 'Hello' })
        const parsed = JSON.parse(result)

        expect(parsed.path).toBe('v1/hello.txt')
    })

    it('should throw when bucket is not found', async () => {
        const tool = new UploadTool({ ...defaultArgs, bucket: 'missing-bucket' })
        await expect(tool._call({ destinationPath: 'test.txt', fileContent: 'test' })).rejects.toThrow(
            'Supabase Storage error: Bucket not found'
        )
    })

    it('should throw when credentials are missing', () => {
        expect(() => new UploadTool({ ...defaultArgs, apiKey: '' })).toThrow('Missing Supabase API credential')
    })

    it('should throw when project URL is invalid', () => {
        expect(() => new UploadTool({ ...defaultArgs, url: 'bad-url' })).toThrow('Invalid Supabase project URL')
    })
})
