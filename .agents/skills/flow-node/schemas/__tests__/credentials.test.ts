/**
 * credentials.test.ts — Credential validation tests
 *
 * T2 (Slice 6 PR 1): UUID validation + provider mapping.
 */
import { describe, it, expect } from 'vitest'
import { validateCredential, validateCredentialProvider, CREDENTIAL_PROVIDER_MAP } from '../credentials.js'
import { ErrorCodes } from '../issues.js'

// ============================================================================
// validateCredential
// ============================================================================

describe('validateCredential', () => {
    it('should return no issues for a valid UUID', () => {
        const issues = validateCredential('550e8400-e29b-41d4-a716-446655440000')
        expect(issues).toHaveLength(0)
    })

    it('should return no issues for another valid UUID', () => {
        const issues = validateCredential('ddeb2757-f8e2-4ed7-9647-5a113332b432')
        expect(issues).toHaveLength(0)
    })

    it('should return CREDENTIAL_NOT_FOUND for empty string', () => {
        const issues = validateCredential('')
        expect(issues).toHaveLength(1)
        expect(issues[0].code).toBe(ErrorCodes.CREDENTIAL_NOT_FOUND)
        expect(issues[0].severity).toBe('error')
        expect(issues[0].path).toBe('credential')
    })

    it('should return CREDENTIAL_NOT_FOUND for invalid format (not a UUID)', () => {
        const issues = validateCredential('not-a-uuid')
        expect(issues).toHaveLength(1)
        expect(issues[0].code).toBe(ErrorCodes.CREDENTIAL_NOT_FOUND)
    })

    it('should return CREDENTIAL_NOT_FOUND for undefined', () => {
        const issues = validateCredential(undefined)
        expect(issues).toHaveLength(1)
        expect(issues[0].code).toBe(ErrorCodes.CREDENTIAL_NOT_FOUND)
    })

    it('should return CREDENTIAL_NOT_FOUND for null', () => {
        const issues = validateCredential(null)
        expect(issues).toHaveLength(1)
        expect(issues[0].code).toBe(ErrorCodes.CREDENTIAL_NOT_FOUND)
    })

    it('should return CREDENTIAL_NOT_FOUND for a number', () => {
        const issues = validateCredential(42)
        expect(issues).toHaveLength(1)
        expect(issues[0].code).toBe(ErrorCodes.CREDENTIAL_NOT_FOUND)
    })

    it('should return CREDENTIAL_NOT_FOUND for a nearly-valid-but-too-short UUID', () => {
        const issues = validateCredential('550e8400-e29b-41d4-a716-44665544')
        expect(issues).toHaveLength(1)
        expect(issues[0].code).toBe(ErrorCodes.CREDENTIAL_NOT_FOUND)
    })
})

// ============================================================================
// CREDENTIAL_PROVIDER_MAP
// ============================================================================

describe('CREDENTIAL_PROVIDER_MAP', () => {
    it('should map chatOpenRouter to openRouterApi', () => {
        expect(CREDENTIAL_PROVIDER_MAP['chatOpenRouter']).toBe('openRouterApi')
    })

    it('should map chatOpenAI to openAIApi', () => {
        expect(CREDENTIAL_PROVIDER_MAP['chatOpenAI']).toBe('openAIApi')
    })

    it('should map chatAnthropic to anthropicApi', () => {
        expect(CREDENTIAL_PROVIDER_MAP['chatAnthropic']).toBe('anthropicApi')
    })

    it('should map huggingFaceInferenceEmbedding to huggingFaceApi', () => {
        expect(CREDENTIAL_PROVIDER_MAP['huggingFaceInferenceEmbedding']).toBe('huggingFaceApi')
    })

    it('should map supabase to supabaseApi', () => {
        expect(CREDENTIAL_PROVIDER_MAP['supabase']).toBe('supabaseApi')
    })

    it('should have exactly 5 entries', () => {
        expect(Object.keys(CREDENTIAL_PROVIDER_MAP)).toHaveLength(5)
    })
})

// ============================================================================
// validateCredentialProvider
// ============================================================================

describe('validateCredentialProvider', () => {
    it('should return no issues when provider matches', () => {
        const issues = validateCredentialProvider('chatOpenRouter', 'openRouterApi')
        expect(issues).toHaveLength(0)
    })

    it('should return no issues when provider matches (chatOpenAI)', () => {
        const issues = validateCredentialProvider('chatOpenAI', 'openAIApi')
        expect(issues).toHaveLength(0)
    })

    it('should return CREDENTIAL_PROVIDER_MISMATCH when provider differs', () => {
        const issues = validateCredentialProvider('chatOpenRouter', 'openAIApi')
        expect(issues).toHaveLength(1)
        expect(issues[0].code).toBe(ErrorCodes.CREDENTIAL_PROVIDER_MISMATCH)
        expect(issues[0].severity).toBe('error')
        expect(issues[0].path).toBe('credential')
    })

    it('should return no issues for unknown nodeType (graceful skip)', () => {
        const issues = validateCredentialProvider('unknownNode', 'someCredential')
        expect(issues).toHaveLength(0)
    })

    it('should return mismatch when expected provider does not match actual', () => {
        // supabase expects supabaseApi
        const issues = validateCredentialProvider(
            'supabase',
            'openRouterApi' // wrong provider
        )
        expect(issues).toHaveLength(1)
        expect(issues[0].code).toBe(ErrorCodes.CREDENTIAL_PROVIDER_MISMATCH)
        expect(issues[0].message).toContain('supabase')
        expect(issues[0].message).toContain('supabaseApi')
    })
})
