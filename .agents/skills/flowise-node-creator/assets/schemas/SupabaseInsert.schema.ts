/**
 * SupabaseInsert.schema.ts — Zod validation for SupabaseInsert node.
 *
 * Validates:
 * - Tool arguments (LLM-facing, from core.ts InsertSchema)
 * - Golden template structure (label, name, type, category, version, baseClasses, credential)
 * - Design-time inputs (supabaseProjUrl, tableName)
 */

import { z } from 'zod'

// ─── Tool argument schema (LLM-facing, matches core.ts InsertSchema) ───
export const SupabaseInsertArgsSchema = z.object({
    data: z.record(z.unknown()).describe('Column:value pairs for the new row(s). Pass only the columns you need to set.'),
    returning: z
        .string()
        .default('representation')
        .describe('Return mode: "representation" returns the inserted row, "minimal" returns no data.')
})

export type SupabaseInsertArgs = z.infer<typeof SupabaseInsertArgsSchema>

// ─── Design-time input params schema ───
export const SupabaseInsertInputsSchema = z.object({
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
export const SupabaseInsertTemplateSchema = z.object({
    label: z.literal('Supabase Insert'),
    name: z.literal('supabaseInsert'),
    type: z.literal('SupabaseInsert'),
    version: z.literal(1.0),
    category: z.literal('Tools'),
    icon: z.literal('supabase-storage.svg'),
    description: z.string().min(1),
    baseClasses: z
        .array(z.string())
        .refine(
            (arr) =>
                arr.includes('SupabaseInsert') &&
                arr.includes('DynamicStructuredTool') &&
                arr.includes('StructuredTool') &&
                arr.includes('Tool'),
            { message: 'baseClasses must include [SupabaseInsert, DynamicStructuredTool, StructuredTool, Tool]' }
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
 * Validates a SupabaseInsert node against the golden template.
 * Returns structured error messages for any field mismatch.
 */
export function validateSupabaseInsert(node: unknown): string[] {
    const errors: string[] = []

    const result = SupabaseInsertTemplateSchema.safeParse(node)
    if (!result.success) {
        for (const issue of result.error.issues) {
            errors.push(`[${issue.path.join('.')}] ${issue.message}`)
        }
    }

    return errors
}

/**
 * Validates LLM-supplied tool arguments for supabase_insert.
 * Checks data is a non-empty record, returning is valid.
 */
export function validateSupabaseInsertArgs(args: unknown): string[] {
    const errors: string[] = []

    const result = SupabaseInsertArgsSchema.safeParse(args)
    if (!result.success) {
        for (const issue of result.error.issues) {
            errors.push(`[args.${issue.path.join('.')}] ${issue.message}`)
        }
    }

    // Additional: data must not be empty
    if (result.success && result.data) {
        const { data } = result.data
        if (!data || Object.keys(data).length === 0) {
            errors.push('[args.data] data must not be empty — at least one column:value pair is required')
        }
    }

    return errors
}
