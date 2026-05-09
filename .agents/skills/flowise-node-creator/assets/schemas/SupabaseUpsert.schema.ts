/**
 * SupabaseUpsert.schema.ts — Zod validation for SupabaseUpsert node.
 *
 * Validates:
 * - Tool arguments (LLM-facing, from core.ts UpsertSchema)
 * - Golden template structure (label, name, type, category, version, baseClasses, credential)
 * - Design-time inputs (supabaseProjUrl, tableName)
 */

import { z } from 'zod'

// ─── Tool argument schema (LLM-facing, matches core.ts UpsertSchema) ───
export const SupabaseUpsertArgsSchema = z.object({
    data: z.record(z.unknown()).describe('Column:value pairs for the row(s) to insert or update. Pass only the columns you need to set.'),
    onConflict: z.string().default('id').describe('Column(s) that trigger an update on conflict (e.g., "id" or "email").'),
    ignoreDuplicates: z.boolean().default(false).describe('If true, skip rows that conflict instead of updating them.')
})

export type SupabaseUpsertArgs = z.infer<typeof SupabaseUpsertArgsSchema>

// ─── Design-time input params schema ───
export const SupabaseUpsertInputsSchema = z.object({
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
export const SupabaseUpsertTemplateSchema = z.object({
    label: z.literal('Supabase Upsert'),
    name: z.literal('supabaseUpsert'),
    type: z.literal('SupabaseUpsert'),
    version: z.literal(1.0),
    category: z.literal('Tools'),
    icon: z.literal('supabase-storage.svg'),
    description: z.string().min(1),
    baseClasses: z
        .array(z.string())
        .refine(
            (arr) =>
                arr.includes('SupabaseUpsert') &&
                arr.includes('DynamicStructuredTool') &&
                arr.includes('StructuredTool') &&
                arr.includes('Tool'),
            { message: 'baseClasses must include [SupabaseUpsert, DynamicStructuredTool, StructuredTool, Tool]' }
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
 * Validates a SupabaseUpsert node against the golden template.
 * Returns structured error messages for any field mismatch.
 */
export function validateSupabaseUpsert(node: unknown): string[] {
    const errors: string[] = []

    const result = SupabaseUpsertTemplateSchema.safeParse(node)
    if (!result.success) {
        for (const issue of result.error.issues) {
            errors.push(`[${issue.path.join('.')}] ${issue.message}`)
        }
    }

    return errors
}

/**
 * Validates LLM-supplied tool arguments for supabase_upsert.
 * Checks data is non-empty, onConflict is non-empty, ignoreDuplicates is boolean.
 */
export function validateSupabaseUpsertArgs(args: unknown): string[] {
    const errors: string[] = []

    const result = SupabaseUpsertArgsSchema.safeParse(args)
    if (!result.success) {
        for (const issue of result.error.issues) {
            errors.push(`[args.${issue.path.join('.')}] ${issue.message}`)
        }
    }

    // Additional safety checks
    if (result.success && result.data) {
        const { data, onConflict } = result.data
        if (!data || Object.keys(data).length === 0) {
            errors.push('[args.data] data must not be empty — at least one column:value pair is required')
        }
        if (!onConflict || onConflict.trim() === '') {
            errors.push('[args.onConflict] onConflict column must not be empty')
        }
    }

    return errors
}
