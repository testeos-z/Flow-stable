import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { createSupabaseClient, handleDbError } from '../SupabaseCommon'

const UpsertSchema = z.object({
    data: z.record(z.unknown()).describe('Column:value pairs for the row(s) to insert or update. Pass only the columns you need to set.'),
    onConflict: z.string().default('id').describe('Column(s) that trigger an update on conflict (e.g., "id" or "email").'),
    ignoreDuplicates: z.boolean().default(false).describe('If true, skip rows that conflict instead of updating them.')
})

export class UpsertTool extends DynamicStructuredTool<typeof UpsertSchema> {
    private supabase: ReturnType<typeof createSupabaseClient>
    private tableName: string

    constructor(args: { url: string; apiKey: string; tableName: string }) {
        super({
            name: 'supabase_upsert',
            description: `Insert or update rows in the "${args.tableName}" table. Upserts a row: inserts if the onConflict column doesn't exist, updates if it does. Use this tool when you need to create or modify records in the "${args.tableName}" table without checking existence first.`,
            schema: UpsertSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        })
        this.supabase = createSupabaseClient(args.url, args.apiKey)
        this.tableName = args.tableName
    }

    async _call(arg: z.output<typeof UpsertSchema>, _runManager?: any): Promise<string> {
        // Build query chain: upsert → select
        // supabase-js v2 requires .select() to return affected rows
        const { data, error } = await this.supabase
            .from(this.tableName)
            .upsert(arg.data, {
                onConflict: arg.onConflict ?? 'id',
                ignoreDuplicates: arg.ignoreDuplicates ?? false
            })
            .select()

        return handleDbError({ data, error })
    }
}
