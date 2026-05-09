import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { createSupabaseClient } from '../SupabaseCommon'

const HttpMethod = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])

const InvokeEdgeFunctionSchema = z.object({
    functionName: z.string().describe('Name of the Supabase Edge Function to invoke'),
    method: HttpMethod.default('POST').describe('HTTP method: GET, POST, PUT, PATCH, or DELETE'),
    headers: z
        .record(z.string())
        .default({})
        .describe('Optional HTTP headers as key:value pairs (e.g., {"Authorization": "Bearer token", "X-Custom": "value"})'),
    requestBody: z
        .string()
        .optional()
        .describe('JSON string to send as the request body. Required for POST, PUT, PATCH. Ignored for GET and DELETE.')
})

export class InvokeEdgeFunctionTool extends DynamicStructuredTool {
    private supabase: ReturnType<typeof createSupabaseClient>

    constructor(args: { url: string; apiKey: string }) {
        super({
            name: 'supabase_invoke_edge_function',
            description:
                'Invoke a Supabase Edge Function with full HTTP control — choose method (GET/POST/PUT/PATCH/DELETE), set custom headers, and pass an optional JSON body.',
            schema: InvokeEdgeFunctionSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        })
        this.supabase = createSupabaseClient(args.url, args.apiKey)
    }

    async _call(arg: z.output<typeof InvokeEdgeFunctionSchema>): Promise<string> {
        const { functionName, method, headers, requestBody } = arg

        // Build invoke options
        const invokeOptions: {
            method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
            headers?: Record<string, string>
            body?: Record<string, unknown>
        } = {
            method: method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
        }

        // Headers — only pass if non-empty
        if (headers && Object.keys(headers).length > 0) {
            invokeOptions.headers = headers
        }

        // Body — only for methods that support it
        const bodyMethods = ['POST', 'PUT', 'PATCH']
        if (bodyMethods.includes(method) && requestBody) {
            let parsedBody: unknown
            try {
                parsedBody = JSON.parse(requestBody)
            } catch (e) {
                throw new Error(`requestBody is not valid JSON: ${(e as Error).message}`)
            }

            if (typeof parsedBody !== 'object' || parsedBody === null || Array.isArray(parsedBody)) {
                let gotType: string
                if (parsedBody === null) gotType = 'null'
                else if (Array.isArray(parsedBody)) gotType = 'array'
                else gotType = typeof parsedBody
                throw new Error(`requestBody must be a JSON object, got ${gotType}`)
            }

            invokeOptions.body = parsedBody as Record<string, unknown>
        }

        const { data, error } = await this.supabase.functions.invoke(functionName, invokeOptions)

        if (error) {
            throw new Error(`Supabase Edge Function error: ${error.message}`)
        }

        if (data == null) {
            throw new Error(`Supabase Edge Function ${functionName} returned no data`)
        }

        if (typeof data === 'object') {
            return JSON.stringify(data)
        }

        if (typeof data === 'string') {
            return data
        }

        return JSON.stringify({ result: data })
    }
}
