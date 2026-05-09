import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { createSupabaseClient, handleDbError } from '../SupabaseCommon'

const InsertSchema = z.object({
    data: z.record(z.unknown()).describe('Column:value pairs for the new row(s). Pass only the columns you need to set.'),
    returning: z
        .string()
        .default('representation')
        .describe('Return mode: "representation" returns the inserted row, "minimal" returns no data.')
})

export class InsertTool extends DynamicStructuredTool<typeof InsertSchema> {
    private supabase: ReturnType<typeof createSupabaseClient>
    private tableName: string

    constructor(args: { url: string; apiKey: string; tableName: string }) {
        super({
            name: 'supabase_insert',
            description: `Insert one or more rows into the "${args.tableName}" table. Pass column:value pairs as the data argument. Use this tool when you need to create new records in the "${args.tableName}" table.`,
            schema: InsertSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        })
        this.supabase = createSupabaseClient(args.url, args.apiKey)
        this.tableName = args.tableName
    }

    async _call(arg: z.output<typeof InsertSchema>, _runManager?: any): Promise<string> {
        // Build query chain: insert → optionally select
        let query: any = this.supabase.from(this.tableName).insert(arg.data)

        // Only add .select() when returning is 'representation' (or default)
        const returning = arg.returning ?? 'representation'
        if (returning === 'representation') {
            query = query.select()
        }

        const { data, error } = await query
        return handleDbError({ data, error })
    }
}
