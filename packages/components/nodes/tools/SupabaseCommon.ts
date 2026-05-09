import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod/v3'

// ---------------------------------------------------------------------------
// Existing exports (ported from SupabaseStorageCommon.ts — keep unchanged)
// ---------------------------------------------------------------------------

export function createSupabaseClient(url: string, apiKey: string): SupabaseClient {
    if (!url || !apiKey) {
        throw new Error('Missing Supabase API credential')
    }
    try {
        new URL(url)
    } catch {
        throw new Error('Invalid Supabase project URL')
    }
    return createClient(url, apiKey)
}

export function handleStorageError(error: { message: string } | null): void {
    if (error) {
        throw new Error(`Supabase Storage error: ${error.message}`)
    }
}

// ---------------------------------------------------------------------------
// New exports for Supabase CRUD nodes
// ---------------------------------------------------------------------------

/**
 * Zod schema for a single supabase-js filter.
 * Rejects operators outside the allowed enum at Zod validation time.
 */
export const FilterSchema = z.object({
    column: z.string().min(1).describe('Column name to filter on'),
    operator: z.enum(['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'in', 'is', 'like', 'ilike']).describe('Comparison operator'),
    value: z.any().describe('Value to compare against')
})
export type Filter = z.infer<typeof FilterSchema>

/**
 * Wraps a supabase-js { data, error } tuple into an LLM-friendly string.
 * - On success (error is null): returns JSON.stringify(data)
 * - On error: returns JSON.stringify({ error: error.message })
 *
 * Never throws — the LLM reads the output string.
 */
export function handleDbError(result: { data: any; error: { message: string } | null }): string {
    if (result.error) {
        return JSON.stringify({ error: result.error.message })
    }
    return JSON.stringify(result.data)
}

/**
 * Applies an array of Filters to a supabase-js query builder chain.
 * Iterates filters in order — supabase-js chains are cumulative.
 * Returns the modified query for further chaining (.order(), .limit(), await).
 *
 * Operators are validated by FilterSchema at call-time before this function runs,
 * so the switch covers all possible enum values (no default branch needed).
 */
export function applyFilters(query: any, filters: Filter[]): any {
    for (const f of filters) {
        switch (f.operator) {
            case 'eq':
                query = query.eq(f.column, f.value)
                break
            case 'neq':
                query = query.neq(f.column, f.value)
                break
            case 'gt':
                query = query.gt(f.column, f.value)
                break
            case 'lt':
                query = query.lt(f.column, f.value)
                break
            case 'gte':
                query = query.gte(f.column, f.value)
                break
            case 'lte':
                query = query.lte(f.column, f.value)
                break
            case 'in':
                query = query.in(f.column, f.value)
                break
            case 'is':
                query = query.is(f.column, f.value)
                break
            case 'like':
                query = query.like(f.column, f.value)
                break
            case 'ilike':
                query = query.ilike(f.column, f.value)
                break
        }
    }
    return query
}
