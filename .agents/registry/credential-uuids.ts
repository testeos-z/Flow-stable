/**
 * Credential UUID Registry
 *
 * Maps credential type names to actual Flowise UUIDs.
 * This prevents the error where credential is set to the type name
 * (e.g., "openRouterApi") instead of the UUID.
 */

export interface CredentialEntry {
    type: string // Credential type name (e.g., "openRouterApi")
    name: string // Human-readable name
    env: 'dev' | 'qa' | 'prod'
    uuid: string // Actual UUID in Flowise
}

export const CREDENTIAL_REGISTRY: Record<string, CredentialEntry[]> = {
    dev: [
        {
            type: 'openRouterApi',
            name: 'OpenRouter API',
            env: 'dev',
            uuid: 'ddeb2757-f8e2-4ed7-9647-5a113332b432'
        },
        {
            type: 'supabaseApi',
            name: 'Supabase API',
            env: 'dev',
            uuid: '0df85d26-749b-4fac-9a88-7399663a3099'
        },
        {
            type: 'huggingFaceApi',
            name: 'HuggingFace API',
            env: 'dev',
            uuid: 'aae7223f-da1b-47d5-bb26-1a2f1b2a3d5b'
        }
    ],
    qa: [
        // TODO: Populate with QA environment credentials
    ],
    prod: [
        // TODO: Populate with production credentials
    ]
}

// ============================================================================
// Helper functions
// ============================================================================

export function getCredentialUuid(type: string, env: string = 'dev'): string | undefined {
    return CREDENTIAL_REGISTRY[env]?.find((c) => c.type === type)?.uuid
}

export function getCredentialEntry(type: string, env: string = 'dev'): CredentialEntry | undefined {
    return CREDENTIAL_REGISTRY[env]?.find((c) => c.type === type)
}

export function listCredentials(env: string = 'dev'): CredentialEntry[] {
    return CREDENTIAL_REGISTRY[env] || []
}

export function validateCredential(value: string, env: string = 'dev'): { valid: boolean; error?: string; type?: string } {
    // Check if it's a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    if (!value) {
        return { valid: true } // Empty is allowed (optional credential)
    }

    if (!uuidRegex.test(value)) {
        // Check if it's a type name that should be converted
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

    // Valid UUID — check if it exists in registry
    const allCreds = listCredentials(env)
    const found = allCreds.find((c) => c.uuid === value)

    if (!found) {
        return {
            valid: true, // UUID format is valid even if not in registry
            error: `Warning: UUID "${value}" not found in credential registry for env "${env}".`
        }
    }

    return { valid: true, type: found.type }
}
