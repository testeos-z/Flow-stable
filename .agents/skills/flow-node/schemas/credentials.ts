/**
 * credentials.ts — Credential UUID + provider validation
 *
 * Slice 6 PR 1 (T2): Per-node credential validation.
 * - UUID check via z.string().uuid()
 * - Static provider mapping for known node types
 * - Graceful skip for unknown node types
 */
import z from 'zod'
import { ErrorCodes } from './issues.js'
import type { FlowNodeIssue } from './issues.js'

/**
 * Maps flow-node names to their expected credential provider type.
 * E.g. chatOpenRouter nodes should use openRouterApi credentials.
 */
export const CREDENTIAL_PROVIDER_MAP: Record<string, string> = {
    chatOpenRouter: 'openRouterApi',
    chatOpenAI: 'openAIApi',
    chatAnthropic: 'anthropicApi',
    huggingFaceInferenceEmbedding: 'huggingFaceApi',
    supabase: 'supabaseApi'
}

/**
 * Validates that a credential ID is a well-formed UUID.
 * Returns issues if the credential fails UUID validation.
 */
export function validateCredential(credentialId: unknown): FlowNodeIssue[] {
    const result = z.string().uuid().safeParse(credentialId)
    if (!result.success) {
        return [
            {
                path: 'credential',
                code: ErrorCodes.CREDENTIAL_NOT_FOUND,
                message: 'Credential is not a valid UUID',
                severity: 'error'
            }
        ]
    }
    return []
}

/**
 * Validates that a node's credential provider type matches the expected
 * provider from CREDENTIAL_PROVIDER_MAP.
 *
 * Gracefully skips unknown node types (returns no issues).
 */
export function validateCredentialProvider(nodeType: string, credentialType: string): FlowNodeIssue[] {
    const expected = CREDENTIAL_PROVIDER_MAP[nodeType]

    // Unknown node type → skip (graceful degradation)
    if (!expected) return []

    if (expected !== credentialType) {
        return [
            {
                path: 'credential',
                code: ErrorCodes.CREDENTIAL_PROVIDER_MISMATCH,
                message: `Node type "${nodeType}" expects credential provider "${expected}" but got "${credentialType}"`,
                severity: 'error'
            }
        ]
    }

    return []
}
