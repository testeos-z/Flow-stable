/**
 * SupabaseDelete.schema.ts — Zod validation for SupabaseDelete node.
 *
 * Validates:
 * - Tool arguments (LLM-facing, from core.ts DeleteSchema)
 * - Golden template structure (label, name, type, category, version, baseClasses, credential)
 * - Design-time inputs (supabaseProjUrl, tableName)
 *
 * Security: filters array requires .min(1) — prevents accidental table truncation.
 */

import { z } from 'zod'

// ─── Filter schema (shared across Select, Update, Delete) ───
const FilterSchema = z.object({
    column: z.string().min(1).describe('Column name to filter on'),
    operator: z.enum(['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'in', 'is', 'like', 'ilike']).describe('Comparison operator'),
    value: z.any().describe('Value to compare against')
})

// ─── Tool argument schema (LLM-facing, matches core.ts DeleteSchema) ───
export const SupabaseDeleteArgsSchema = z.object({
    filters: z
        .array(FilterSchema)
        .min(1, 'filters must not be empty — refusing to delete all rows')
        .describe(
            'Array of {column, operator, value} filter objects identifying which rows to delete. REQUIRED — prevents accidental table truncation.'
        ),
    returning: z
        .string()
        .default('representation')
        .describe('Return mode: "representation" returns the deleted rows, "minimal" returns no data.')
})

export type SupabaseDeleteArgs = z.infer<typeof SupabaseDeleteArgsSchema>

// ─── Design-time input params schema ───
export const SupabaseDeleteInputsSchema = z.object({
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
export const SupabaseDeleteTemplateSchema = z.object({
    label: z.literal('Supabase Delete'),
    name: z.literal('supabaseDelete'),
    type: z.literal('SupabaseDelete'),
    version: z.literal(1.0),
    category: z.literal('Tools'),
    icon: z.literal('supabase-storage.svg'),
    description: z.string().min(1),
    baseClasses: z
        .array(z.string())
        .refine(
            (arr) =>
                arr.includes('SupabaseDelete') &&
                arr.includes('DynamicStructuredTool') &&
                arr.includes('StructuredTool') &&
                arr.includes('Tool'),
            { message: 'baseClasses must include [SupabaseDelete, DynamicStructuredTool, StructuredTool, Tool]' }
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
 * Validates a SupabaseDelete node against the golden template.
 * Returns structured error messages for any field mismatch.
 */
export function validateSupabaseDelete(node: unknown): string[] {
    const errors: string[] = []

    const result = SupabaseDeleteTemplateSchema.safeParse(node)
    if (!result.success) {
        for (const issue of result.error.issues) {
            errors.push(`[${issue.path.join('.')}] ${issue.message}`)
        }
    }

    return errors
}

/**
 * Validates LLM-supplied tool arguments for supabase_delete.
 * Checks filters are non-empty, returning is valid.
 */
export function validateSupabaseDeleteArgs(args: unknown): string[] {
    const errors: string[] = []

    const result = SupabaseDeleteArgsSchema.safeParse(args)
    if (!result.success) {
        for (const issue of result.error.issues) {
            errors.push(`[args.${issue.path.join('.')}] ${issue.message}`)
        }
    }

    // Additional safety: belt-and-suspenders guard
    if (result.success && result.data) {
        const { filters } = result.data
        if (!filters || filters.length === 0) {
            errors.push('[args.filters] filters must not be empty — refusing to delete all rows')
        }
    }

    return errors
}
