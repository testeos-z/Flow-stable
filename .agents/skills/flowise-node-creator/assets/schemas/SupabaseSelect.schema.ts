/**
 * SupabaseSelect.schema.ts — Zod validation for SupabaseSelect node.
 *
 * Validates:
 * - Tool arguments (LLM-facing, from core.ts SelectSchema)
 * - Golden template structure (label, name, type, category, version, baseClasses, credential)
 * - Design-time inputs (supabaseProjUrl, tableName)
 */

import { z } from 'zod'

// ─── Filter schema (shared across Select, Update, Delete) ───
const FilterSchema = z.object({
    column: z.string().min(1).describe('Column name to filter on'),
    operator: z.enum(['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'in', 'is', 'like', 'ilike']).describe('Comparison operator'),
    value: z.any().describe('Value to compare against')
})

// ─── Tool argument schema (LLM-facing, matches core.ts SelectSchema) ───
export const SupabaseSelectArgsSchema = z.object({
    columns: z.array(z.string()).default(['*']).describe('Columns to return. Use ["*"] for all columns.'),
    filters: z.array(FilterSchema).default([]).describe('Array of {column, operator, value} filter objects.'),
    orderBy: z.string().nullable().default(null).describe('Column to sort results by. Omit for no ordering.'),
    orderDirection: z.enum(['asc', 'desc']).default('asc').describe('Sort direction: asc (ascending) or desc (descending).'),
    limit: z.number().int().min(1).default(100).describe('Maximum number of rows to return (capped at 1000).')
})

export type SupabaseSelectArgs = z.infer<typeof SupabaseSelectArgsSchema>

// ─── Design-time input params schema ───
export const SupabaseSelectInputsSchema = z.object({
    supabaseProjUrl: z.string().url('Must be a valid Supabase project URL'),
    tableName: z.string().min(1, 'Table name is required')
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
export const SupabaseSelectTemplateSchema = z.object({
    label: z.literal('Supabase Select'),
    name: z.literal('supabaseSelect'),
    type: z.literal('SupabaseSelect'),
    version: z.literal(1.0),
    category: z.literal('Tools'),
    icon: z.literal('supabase-storage.svg'),
    description: z.string().min(1),
    baseClasses: z
        .array(z.string())
        .refine(
            (arr) =>
                arr.includes('SupabaseSelect') &&
                arr.includes('DynamicStructuredTool') &&
                arr.includes('StructuredTool') &&
                arr.includes('Tool'),
            { message: 'baseClasses must include [SupabaseSelect, DynamicStructuredTool, StructuredTool, Tool]' }
        ),
    credential: CredentialParamSchema,
    inputs: z
        .array(
            z.object({
                label: z.string(),
                name: z.string(),
                type: z.string(),
                description: z.string().optional()
            })
        )
        .length(2, 'Must have exactly 2 design-time inputs (supabaseProjUrl, tableName)')
})

/**
 * Validates a SupabaseSelect node against the golden template.
 * Returns structured error messages for any field mismatch.
 */
export function validateSupabaseSelect(node: unknown): string[] {
    const errors: string[] = []

    const result = SupabaseSelectTemplateSchema.safeParse(node)
    if (!result.success) {
        for (const issue of result.error.issues) {
            errors.push(`[${issue.path.join('.')}] ${issue.message}`)
        }
    }

    return errors
}

/**
 * Validates LLM-supplied tool arguments for supabase_select.
 * Checks filters, columns, orderBy, limit against the Zod schema.
 */
export function validateSupabaseSelectArgs(args: unknown): string[] {
    const errors: string[] = []

    const result = SupabaseSelectArgsSchema.safeParse(args)
    if (!result.success) {
        for (const issue of result.error.issues) {
            errors.push(`[args.${issue.path.join('.')}] ${issue.message}`)
        }
    }

    // Additional: limit must be an integer
    if (result.success && result.data) {
        const { limit } = result.data
        if (!Number.isInteger(limit)) {
            errors.push('[args.limit] limit must be an integer')
        }
    }

    return errors
}
