/**
 * issues.test.ts — ErrorCodes existence tests
 *
 * T1 (Slice 6 PR 1): Verify new credential/per-node error codes are present.
 */
import { describe, it, expect } from 'vitest'
import { ErrorCodes } from '../issues.js'

describe('ErrorCodes — credential + per-node codes (T1)', () => {
    it('should define CREDENTIAL_NOT_FOUND', () => {
        expect(ErrorCodes.CREDENTIAL_NOT_FOUND).toBe('CREDENTIAL_NOT_FOUND')
    })

    it('should define CREDENTIAL_PROVIDER_MISMATCH', () => {
        expect(ErrorCodes.CREDENTIAL_PROVIDER_MISMATCH).toBe('CREDENTIAL_PROVIDER_MISMATCH')
    })

    it('should define INVALID_PER_NODE_PARAM', () => {
        expect(ErrorCodes.INVALID_PER_NODE_PARAM).toBe('INVALID_PER_NODE_PARAM')
    })
})
