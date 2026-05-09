import { InvokeEdgeFunctionTool } from '../core'

// ---------------------------------------------------------------------------
// Mock @supabase/supabase-js
// ---------------------------------------------------------------------------

let mockInvokeBehavior: 'success-object' | 'success-string' | 'error' | 'null-data' | 'zero' | 'false' | 'empty-string' = 'success-object'
let lastInvokeFunction: string = ''
let lastInvokeOptions: any = null

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        functions: {
            invoke: jest.fn().mockImplementation(async (fn: string, opts: any) => {
                lastInvokeFunction = fn
                lastInvokeOptions = opts
                switch (mockInvokeBehavior) {
                    case 'success-object':
                        return { data: { message: 'hello' }, error: null }
                    case 'success-string':
                        return { data: 'plain text response', error: null }
                    case 'error':
                        return { data: null, error: { message: 'Function not found' } }
                    case 'null-data':
                        return { data: null, error: null }
                    case 'zero':
                        return { data: 0, error: null }
                    case 'false':
                        return { data: false, error: null }
                    case 'empty-string':
                        return { data: '', error: null }
                    default:
                        return { data: null, error: null }
                }
            })
        }
    }))
}))

// ---------------------------------------------------------------------------
// InvokeEdgeFunctionTool tests
// ---------------------------------------------------------------------------

describe('InvokeEdgeFunctionTool', () => {
    beforeEach(() => {
        mockInvokeBehavior = 'success-object'
        lastInvokeFunction = ''
        lastInvokeOptions = null
    })

    const defaultArgs = {
        url: 'https://test.supabase.co',
        apiKey: 'test-key'
    }

    // --- Basic invocation (backward compat) ---

    it('should invoke edge function and return JSON string for object data', async () => {
        const tool = new InvokeEdgeFunctionTool(defaultArgs)
        const result = await tool._call({ functionName: 'hello-world', requestBody: '{}' })

        expect(result).toBe('{"message":"hello"}')
    })

    it('should return string data as-is', async () => {
        mockInvokeBehavior = 'success-string'
        const tool = new InvokeEdgeFunctionTool(defaultArgs)
        const result = await tool._call({ functionName: 'hello-world', requestBody: '{}' })

        expect(result).toBe('plain text response')
    })

    it('should throw when Supabase returns an error', async () => {
        mockInvokeBehavior = 'error'
        const tool = new InvokeEdgeFunctionTool(defaultArgs)

        await expect(tool._call({ functionName: 'hello-world', requestBody: '{}' })).rejects.toThrow(
            'Supabase Edge Function error: Function not found'
        )
    })

    it('should throw when requestBody is not valid JSON', async () => {
        const tool = new InvokeEdgeFunctionTool(defaultArgs)

        await expect(tool._call({ functionName: 'hello-world', requestBody: 'not-json', method: 'POST' } as any)).rejects.toThrow(
            'requestBody is not valid JSON'
        )
    })

    it('should throw when data is null/undefined', async () => {
        mockInvokeBehavior = 'null-data'
        const tool = new InvokeEdgeFunctionTool(defaultArgs)

        await expect(tool._call({ functionName: 'hello-world', requestBody: '{}' })).rejects.toThrow(
            'Supabase Edge Function hello-world returned no data'
        )
    })

    it('should return JSON string for zero data', async () => {
        mockInvokeBehavior = 'zero'
        const tool = new InvokeEdgeFunctionTool(defaultArgs)
        const result = await tool._call({ functionName: 'hello-world', requestBody: '{}' })

        expect(result).toBe('{"result":0}')
    })

    it('should return JSON string for false data', async () => {
        mockInvokeBehavior = 'false'
        const tool = new InvokeEdgeFunctionTool(defaultArgs)
        const result = await tool._call({ functionName: 'hello-world', requestBody: '{}' })

        expect(result).toBe('{"result":false}')
    })

    it('should return empty string data as-is', async () => {
        mockInvokeBehavior = 'empty-string'
        const tool = new InvokeEdgeFunctionTool(defaultArgs)
        const result = await tool._call({ functionName: 'hello-world', requestBody: '{}' })

        expect(result).toBe('')
    })

    it('should throw when credentials are missing', () => {
        expect(() => new InvokeEdgeFunctionTool({ ...defaultArgs, apiKey: '' })).toThrow('Missing Supabase API credential')
    })

    it('should throw when project URL is invalid', () => {
        expect(() => new InvokeEdgeFunctionTool({ ...defaultArgs, url: 'bad-url' })).toThrow('Invalid Supabase project URL')
    })

    // --- HTTP method control ---

    it('should default method to POST', async () => {
        const tool = new InvokeEdgeFunctionTool(defaultArgs)
        await tool._call({ functionName: 'hello-world', requestBody: '{}' } as any)

        expect(lastInvokeOptions.method).toBe('POST')
    })

    it('should use GET method when specified', async () => {
        const tool = new InvokeEdgeFunctionTool(defaultArgs)
        await tool._call({ functionName: 'hello-world', method: 'GET' } as any)

        expect(lastInvokeFunction).toBe('hello-world')
        expect(lastInvokeOptions.method).toBe('GET')
    })

    it('should use PUT method with body', async () => {
        const tool = new InvokeEdgeFunctionTool(defaultArgs)
        await tool._call({
            functionName: 'update-user',
            method: 'PUT',
            requestBody: '{"name": "Ada"}'
        } as any)

        expect(lastInvokeOptions.method).toBe('PUT')
        expect(lastInvokeOptions.body).toEqual({ name: 'Ada' })
    })

    it('should use PATCH method with body', async () => {
        const tool = new InvokeEdgeFunctionTool(defaultArgs)
        await tool._call({
            functionName: 'patch-user',
            method: 'PATCH',
            requestBody: '{"name": "Ada"}'
        } as any)

        expect(lastInvokeOptions.method).toBe('PATCH')
        expect(lastInvokeOptions.body).toEqual({ name: 'Ada' })
    })

    it('should use DELETE method without body', async () => {
        const tool = new InvokeEdgeFunctionTool(defaultArgs)
        await tool._call({ functionName: 'delete-user', method: 'DELETE' } as any)

        expect(lastInvokeOptions.method).toBe('DELETE')
        expect(lastInvokeOptions.body).toBeUndefined()
    })

    // --- Headers ---

    it('should pass custom headers', async () => {
        const tool = new InvokeEdgeFunctionTool(defaultArgs)
        await tool._call({
            functionName: 'hello-world',
            requestBody: '{}',
            headers: { Authorization: 'Bearer abc123', 'X-Custom': 'test' }
        } as any)

        expect(lastInvokeOptions.headers).toEqual({
            Authorization: 'Bearer abc123',
            'X-Custom': 'test'
        })
    })

    it('should not pass headers when empty', async () => {
        const tool = new InvokeEdgeFunctionTool(defaultArgs)
        await tool._call({
            functionName: 'hello-world',
            requestBody: '{}',
            headers: {}
        } as any)

        expect(lastInvokeOptions.headers).toBeUndefined()
    })

    // --- GET without body ---

    it('should invoke GET without requiring body', async () => {
        const tool = new InvokeEdgeFunctionTool(defaultArgs)
        const result = await tool._call({ functionName: 'hello-world', method: 'GET' } as any)

        expect(lastInvokeOptions.method).toBe('GET')
        expect(lastInvokeOptions.body).toBeUndefined()
        expect(result).toBe('{"message":"hello"}')
    })

    it('should ignore body for GET requests', async () => {
        const tool = new InvokeEdgeFunctionTool(defaultArgs)
        await tool._call({
            functionName: 'hello-world',
            method: 'GET',
            requestBody: '{"ignore": "me"}'
        } as any)

        expect(lastInvokeOptions.body).toBeUndefined()
    })

    // --- requestBody optional ---

    it('should work without requestBody for POST (no body sent)', async () => {
        const tool = new InvokeEdgeFunctionTool(defaultArgs)
        await tool._call({ functionName: 'hello-world' } as any)

        expect(lastInvokeOptions.method).toBe('POST')
        expect(lastInvokeOptions.body).toBeUndefined()
    })
})
