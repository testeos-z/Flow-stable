import { A2AStorageAdapter } from '../../../src/A2AStorageAdapter'
import { LocalJsonAdapter } from './adapters/LocalJsonAdapter'
import { SQLiteAdapter } from './adapters/SQLiteAdapter'
import { PostgresAdapter } from './adapters/PostgresAdapter'
import { SupabaseAdapter } from './adapters/SupabaseAdapter'

const SUPPORTED_BACKENDS = ['supabase', 'localjson', 'postgres', 'sqlite'] as const

/**
 * Create an A2AStorageAdapter for the given backend.
 * Valid backends: 'supabase', 'localjson', 'postgres', 'sqlite'.
 *
 * @param backend - the storage backend to use (case-insensitive)
 * @param config - backend-specific configuration (credentials, URLs, file paths, etc.)
 * @returns a new A2AStorageAdapter instance
 * @throws if the backend is not supported
 */
export async function createAdapter(backend: string, config: Record<string, unknown>): Promise<A2AStorageAdapter> {
    const normalized = backend.toLowerCase().trim()

    switch (normalized) {
        case 'localjson':
            return new LocalJsonAdapter(config)
        case 'sqlite':
            return new SQLiteAdapter(config)
        case 'postgres':
            return new PostgresAdapter(config)
        case 'supabase':
            return new SupabaseAdapter(config)
        default:
            throw new Error(`Unsupported A2A storage backend: "${backend}". ` + `Supported backends: ${SUPPORTED_BACKENDS.join(', ')}.`)
    }
}
