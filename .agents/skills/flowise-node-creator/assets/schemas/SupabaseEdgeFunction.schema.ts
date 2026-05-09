/**
 * SupabaseEdgeFunction.schema.ts — Zod validation for SupabaseEdgeFunction node.
 *
 * Validates:
 * - Tool arguments (LLM-facing, from core.ts InvokeEdgeFunctionSchema)
 * - Golden template structure (label, name, type, category, version, baseClasses, credential)
 * - Design-time inputs (supabaseProjUrl, functionName, defaultMethod, defaultHeaders, requestBody)
 */

import { z } from 'zod'

// ─── HTTP Method enum ───
export const HttpMethod = z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])

// ─── Tool argument schema (LLM-facing, matches core.ts InvokeEdgeFunctionSchema) ───
export const SupabaseEdgeFunctionArgsSchema = z.object({
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

export type SupabaseEdgeFunctionArgs = z.infer<typeof SupabaseEdgeFunctionArgsSchema>

// ─── Design-time input params schema ───
export const SupabaseEdgeFunctionInputsSchema = z.object({
    supabaseProjUrl: z.string().url('Must be a valid Supabase project URL'),
    functionName: z.string().optional().describe('Name of the Edge Function (LLM-overridable)'),
    defaultMethod: HttpMethod.optional().describe('Default HTTP method (LLM-overridable)'),
    defaultHeaders: z.string().optional().describe('Default HTTP headers as JSON (LLM-overridable)'),
    requestBody: z.string().optional().describe('Default JSON body (LLM-overridable)')
})

// ─── Credential param schema ───
const CredentialParamSchema = z.object({
    label: z.literal('Connect Credential'),
    name: z.literal('credential'),
    type: z.literal('credential'),
    credentialNames: z
        .array(z.string())
        .refine((arr) => arr.includes('supabaseApi'), { message: 'credentialNames must include "supabaseApi"' })
})

// ─── Full golden template validation ───
export const SupabaseEdgeFunctionTemplateSchema = z.object({
    label: z.literal('Supabase Edge Function'),
    name: z.literal('supabaseEdgeFunction'),
    type: z.literal('SupabaseEdgeFunction'),
    version: z.number(),
    category: z.literal('Tools'),
    icon: z.string().optional(),
    description: z.string().min(1),
    baseClasses: z
        .array(z.string())
        .refine(
            (arr) =>
                arr.includes('SupabaseEdgeFunction') &&
                arr.includes('DynamicStructuredTool') &&
                arr.includes('StructuredTool') &&
                arr.includes('Tool'),
            { message: 'baseClasses must include [SupabaseEdgeFunction, DynamicStructuredTool, StructuredTool, Tool]' }
        ),
    credential: CredentialParamSchema.optional(),
    inputs: z
        .array(
            z.object({
                label: z.string(),
                name: z.string(),
                type: z.string(),
                description: z.string().optional(),
                additionalParams: z.boolean().optional(),
                optional: z.boolean().optional(),
                default: z.string().optional(),
                options: z
                    .array(
                        z.object({
                            label: z.string(),
                            name: z.string()
                        })
                    )
                    .optional()
            })
        )
        .min(1, 'Must have at least one design-time input (supabaseProjUrl)')
})

/**
 * Validates a SupabaseEdgeFunction node against the golden template.
 * Returns structured error messages for any field mismatch.
 */
export function validateSupabaseEdgeFunction(node: unknown): string[] {
    const errors: string[] = []

    const result = SupabaseEdgeFunctionTemplateSchema.safeParse(node)
    if (!result.success) {
        for (const issue of result.error.issues) {
            errors.push(`[${issue.path.join('.')}] ${issue.message}`)
        }
    }

    return errors
}

/**
 * Validates LLM-supplied tool arguments for supabase_invoke_edge_function.
 * Checks functionName, method, headers, requestBody against the Zod schema.
 */
export function validateSupabaseEdgeFunctionArgs(args: unknown): string[] {
    const errors: string[] = []

    const result = SupabaseEdgeFunctionArgsSchema.safeParse(args)
    if (!result.success) {
        for (const issue of result.error.issues) {
            errors.push(`[args.${issue.path.join('.')}] ${issue.message}`)
        }
    }

    // Additional: for GET/DELETE, body should not be required
    if (result.success && result.data) {
        const { method, requestBody } = result.data
        const bodyMethods = ['POST', 'PUT', 'PATCH']

        if (requestBody && requestBody.trim() !== '') {
            try {
                const parsed = JSON.parse(requestBody)
                if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                    errors.push('[args.requestBody] must be a valid JSON object, not an array or primitive')
                }
            } catch {
                errors.push('[args.requestBody] is not valid JSON')
            }
        }

        if (!bodyMethods.includes(method) && requestBody && requestBody.trim() !== '') {
            errors.push(`[args.requestBody] body is ignored for ${method} requests (only POST, PUT, PATCH accept a body)`)
        }
    }

    return errors
}
