import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { createSupabaseClient, handleDbError, applyFilters, FilterSchema } from '../SupabaseCommon'
import type { Filter } from '../SupabaseCommon'

const SelectSchema = z.object({
    columns: z.array(z.string()).default(['*']).describe('Columns to return. Use ["*"] for all columns.'),
    filters: z.array(FilterSchema).default([]).describe('Array of {column, operator, value} filter objects.'),
    orderBy: z.string().nullable().default(null).describe('Column to sort results by. Omit for no ordering.'),
    orderDirection: z.enum(['asc', 'desc']).default('asc').describe('Sort direction: asc (ascending) or desc (descending).'),
    limit: z.number().int().min(1).default(100).describe('Maximum number of rows to return (capped at 1000).')
})

export class SelectTool extends DynamicStructuredTool<typeof SelectSchema> {
    private supabase: ReturnType<typeof createSupabaseClient>
    private tableName: string

    constructor(args: { url: string; apiKey: string; tableName: string }) {
        super({
            name: 'supabase_select',
            description: `Query rows from the "${args.tableName}" table with optional column selection, filters, ordering, and limit. Use this tool whenever you need to read or search data from the "${args.tableName}" table.`,
            schema: SelectSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        })
        this.supabase = createSupabaseClient(args.url, args.apiKey)
        this.tableName = args.tableName
    }

    async _call(arg: z.output<typeof SelectSchema>, _runManager?: any): Promise<string> {
        // --- Security: clamp limit ---
        const safeLimit = Math.min(arg.limit, 1000)

        // --- Columns: join array to comma-separated string ---
        const columns = arg.columns.length > 0 ? arg.columns.join(',') : '*'

        // --- Build query chain ---
        let query: any = this.supabase.from(this.tableName).select(columns)

        // Apply filters (reuses validated FilterSchema + applyFilters from SupabaseCommon)
        if (arg.filters.length > 0) {
            query = applyFilters(query, arg.filters as Filter[])
        }

        // Apply ordering
        if (arg.orderBy) {
            query = query.order(arg.orderBy, { ascending: arg.orderDirection === 'asc' })
        }

        // Execute with capped limit
        const { data, error } = await query.limit(safeLimit)
        return handleDbError({ data, error })
    }
}
