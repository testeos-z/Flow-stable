import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { createSupabaseClient } from '../SupabaseCommon'

const InvokeEdgeFunctionSchema = z.object({
    functionName: z.string().describe('Name of the Supabase Edge Function to invoke'),
    requestBody: z.string().describe('JSON string to send as the request body to the Edge Function')
})

export class InvokeEdgeFunctionTool extends DynamicStructuredTool {
    private supabase: ReturnType<typeof createSupabaseClient>

    constructor(args: { url: string; apiKey: string }) {
        super({
            name: 'supabase_invoke_edge_function',
            description: 'Invoke a Supabase Edge Function by name with a JSON payload',
            schema: InvokeEdgeFunctionSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        })
        this.supabase = createSupabaseClient(args.url, args.apiKey)
    }

    async _call(arg: z.output<typeof InvokeEdgeFunctionSchema>): Promise<string> {
        let parsedBody: unknown
        try {
            parsedBody = JSON.parse(arg.requestBody)
        } catch (e) {
            throw new Error(`requestBody is not valid JSON: ${(e as Error).message}`)
        }

        if (typeof parsedBody !== 'object' || parsedBody === null || Array.isArray(parsedBody)) {
            let gotType: string
            if (parsedBody === null) {
                gotType = 'null'
            } else if (Array.isArray(parsedBody)) {
                gotType = 'array'
            } else {
                gotType = typeof parsedBody
            }
            throw new Error(`requestBody must be a JSON object, got ${gotType}`)
        }

        const { data, error } = await this.supabase.functions.invoke(arg.functionName, {
            body: parsedBody as Record<string, unknown>
        })

        if (error) {
            throw new Error(`Supabase Edge Function error: ${error.message}`)
        }

        if (data == null) {
            throw new Error(`Supabase Edge Function ${arg.functionName} returned no data`)
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
