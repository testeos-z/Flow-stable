import { createClient, SupabaseClient } from '@supabase/supabase-js'

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
