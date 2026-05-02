/**
 * Credential Registry for Flowise MCP Server
 *
 * Exposes credential information via MCP tools.
 * Agents query this to get UUIDs for credential types.
 */

export interface CredentialEntry {
    type: string
    name: string
    env: string
    uuid: string
    description?: string
}

// Credential registry by environment
const CREDENTIAL_REGISTRY: Record<string, CredentialEntry[]> = {
    dev: [
        {
            type: 'openRouterApi',
            name: 'OpenRouter API',
            env: 'dev',
            uuid: 'ddeb2757-f8e2-4ed7-9647-5a113332b432',
            description: 'API key for OpenRouter (free tier available)'
        },
        {
            type: 'supabaseApi',
            name: 'Supabase API',
            env: 'dev',
            uuid: '0df85d26-749b-4fac-9a88-7399663a3099',
            description: 'API key for Supabase pgvector'
        },
        {
            type: 'huggingFaceApi',
            name: 'HuggingFace API',
            env: 'dev',
            uuid: 'aae7223f-da1b-47d5-bb26-1a2f1b2a3d5b',
            description: 'API key for HuggingFace Inference API'
        }
    ],
    qa: [],
    prod: []
}

/**
 * Get credential UUID by type and environment
 */
export function getCredentialUuid(type: string, env: string = 'dev'): string | undefined {
    return CREDENTIAL_REGISTRY[env]?.find((c) => c.type === type)?.uuid
}

/**
 * Get full credential entry
 */
export function getCredentialEntry(type: string, env: string = 'dev'): CredentialEntry | undefined {
    return CREDENTIAL_REGISTRY[env]?.find((c) => c.type === type)
}

/**
 * List all credentials for an environment
 */
export function listCredentials(env: string = 'dev'): CredentialEntry[] {
    return CREDENTIAL_REGISTRY[env] || []
}

/**
 * Validate a credential value
 */
export function validateCredential(value: string, env: string = 'dev'): { valid: boolean; error?: string; type?: string } {
    if (!value) {
        return { valid: true }
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    if (!uuidRegex.test(value)) {
        const entry = getCredentialEntry(value, env)
        if (entry) {
            return {
                valid: false,
                error: `Credential "${value}" is a type name, not a UUID. Use "${entry.uuid}" instead.`,
                type: value
            }
        }
        return {
            valid: false,
            error: `Credential "${value}" is not a valid UUID.`
        }
    }

    const allCreds = listCredentials(env)
    const found = allCreds.find((c) => c.uuid === value)

    if (!found) {
        return {
            valid: true,
            error: `Warning: UUID "${value}" not found in credential registry for env "${env}".`,
            type: undefined
        }
    }

    return { valid: true, type: found.type }
}

/**
 * Resolve credential type to UUID
 * If already a UUID, returns as-is
 * If a type name, looks up in registry
 */
export function resolveCredential(value: string, env: string = 'dev'): { uuid: string; resolved: boolean; error?: string } {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    if (uuidRegex.test(value)) {
        return { uuid: value, resolved: false }
    }

    const entry = getCredentialEntry(value, env)
    if (entry) {
        return { uuid: entry.uuid, resolved: true }
    }

    return { uuid: value, resolved: false, error: `Unknown credential type: ${value}` }
}
