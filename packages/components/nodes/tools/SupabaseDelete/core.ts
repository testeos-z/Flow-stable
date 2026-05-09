import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { createSupabaseClient, handleDbError, applyFilters, FilterSchema } from '../SupabaseCommon'
import type { Filter } from '../SupabaseCommon'

const DeleteSchema = z.object({
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

export class DeleteTool extends DynamicStructuredTool<typeof DeleteSchema> {
    private supabase: ReturnType<typeof createSupabaseClient>
    private tableName: string

    constructor(args: { url: string; apiKey: string; tableName: string }) {
        super({
            name: 'supabase_delete',
            description: `Delete rows from the "${args.tableName}" table that match the provided filters. Requires a non-empty filters array for safety — this prevents accidental table truncation. Use this tool when you need to remove records from the "${args.tableName}" table.`,
            schema: DeleteSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        })
        this.supabase = createSupabaseClient(args.url, args.apiKey)
        this.tableName = args.tableName
    }

    async _call(arg: z.output<typeof DeleteSchema>, _runManager?: any): Promise<string> {
        // --- Safety: belt-and-suspenders guard against empty filters ---
        // Zod .min(1) catches most cases, but runtime check prevents any bypass
        if (!arg.filters || arg.filters.length === 0) {
            return JSON.stringify({
                error: 'filters must not be empty — refusing to delete all rows'
            })
        }

        // Build query chain: delete → applyFilters → optionally select
        let query: any = this.supabase.from(this.tableName).delete()

        // Apply filters (reuses validated FilterSchema + applyFilters from SupabaseCommon)
        query = applyFilters(query, arg.filters as Filter[])

        // Only add .select() when returning is 'representation' (or default)
        const returning = arg.returning ?? 'representation'
        if (returning === 'representation') {
            query = query.select()
        }

        const { data, error } = await query
        return handleDbError({ data, error })
    }
}
