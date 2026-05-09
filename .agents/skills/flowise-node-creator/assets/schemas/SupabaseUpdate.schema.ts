/**
 * SupabaseUpdate.schema.ts — Zod validation for SupabaseUpdate node.
 *
 * Validates:
 * - Tool arguments (LLM-facing, from core.ts UpdateSchema)
 * - Golden template structure (label, name, type, category, version, baseClasses, credential)
 * - Design-time inputs (supabaseProjUrl, tableName)
 *
 * Security: filters array requires .min(1) — prevents accidental mass updates.
 */

import { z } from 'zod'

// ─── Filter schema (shared across Select, Update, Delete) ───
const FilterSchema = z.object({
    column: z.string().min(1).describe('Column name to filter on'),
    operator: z.enum(['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'in', 'is', 'like', 'ilike']).describe('Comparison operator'),
    value: z.any().describe('Value to compare against')
})

// ─── Tool argument schema (LLM-facing, matches core.ts UpdateSchema) ───
export const SupabaseUpdateArgsSchema = z.object({
    filters: z
        .array(FilterSchema)
        .min(1, 'filters must not be empty — refusing to update all rows')
        .describe('Array of {column, operator, value} filter objects identifying which rows to update. REQUIRED.'),
    data: z.record(z.unknown()).describe('Column:value pairs to set on matching rows. Pass only the columns you need to update.'),
    returning: z
        .string()
        .default('representation')
        .describe('Return mode: "representation" returns the updated rows, "minimal" returns no data.')
})

export type SupabaseUpdateArgs = z.infer<typeof SupabaseUpdateArgsSchema>

// ─── Design-time input params schema ───
export const SupabaseUpdateInputsSchema = z.object({
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
export const SupabaseUpdateTemplateSchema = z.object({
    label: z.literal('Supabase Update'),
    name: z.literal('supabaseUpdate'),
    type: z.literal('SupabaseUpdate'),
    version: z.literal(1.0),
    category: z.literal('Tools'),
    icon: z.literal('supabase-storage.svg'),
    description: z.string().min(1),
    baseClasses: z
        .array(z.string())
        .refine(
            (arr) =>
                arr.includes('SupabaseUpdate') &&
                arr.includes('DynamicStructuredTool') &&
                arr.includes('StructuredTool') &&
                arr.includes('Tool'),
            { message: 'baseClasses must include [SupabaseUpdate, DynamicStructuredTool, StructuredTool, Tool]' }
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
 * Validates a SupabaseUpdate node against the golden template.
 * Returns structured error messages for any field mismatch.
 */
export function validateSupabaseUpdate(node: unknown): string[] {
    const errors: string[] = []

    const result = SupabaseUpdateTemplateSchema.safeParse(node)
    if (!result.success) {
        for (const issue of result.error.issues) {
            errors.push(`[${issue.path.join('.')}] ${issue.message}`)
        }
    }

    return errors
}

/**
 * Validates LLM-supplied tool arguments for supabase_update.
 * Checks filters are non-empty, data is non-empty, returning is valid.
 */
export function validateSupabaseUpdateArgs(args: unknown): string[] {
    const errors: string[] = []

    const result = SupabaseUpdateArgsSchema.safeParse(args)
    if (!result.success) {
        for (const issue of result.error.issues) {
            errors.push(`[args.${issue.path.join('.')}] ${issue.message}`)
        }
    }

    // Additional safety checks
    if (result.success && result.data) {
        const { filters, data } = result.data
        if (!filters || filters.length === 0) {
            errors.push('[args.filters] filters must not be empty — refusing to update all rows')
        }
        if (!data || Object.keys(data).length === 0) {
            errors.push('[args.data] data must not be empty — at least one column:value pair is required')
        }
    }

    return errors
}
