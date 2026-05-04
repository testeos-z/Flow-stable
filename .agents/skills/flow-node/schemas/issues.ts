/**
 * issues.ts — FlowNodeIssue type + error codes
 *
 * All error codes are exported as constants so agents and test assertions
 * can reference them without string literals.
 */

export const ErrorCodes = {
    // Hard failures
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    PLACEHOLDER_ID_REMAINING: 'PLACEHOLDER_ID_REMAINING',
    INVALID_CREDENTIAL_FORMAT: 'INVALID_CREDENTIAL_FORMAT',
    UNSUPPORTED_NODE_TYPE: 'UNSUPPORTED_NODE_TYPE',
    WRONG_FLOW_TYPE: 'WRONG_FLOW_TYPE',
    EMPTY_REQUIRED_PARAM: 'EMPTY_REQUIRED_PARAM',
    MISSING_MODEL_NAME: 'MISSING_MODEL_NAME',
    INVALID_ANCHOR_SHAPE: 'INVALID_ANCHOR_SHAPE',
    UNKNOWN_NODE_NAME: 'UNKNOWN_NODE_NAME',
    // Warnings
    STALE_CHECKSUM: 'STALE_CHECKSUM',
    MISSING_OPTIONAL_CREDENTIAL: 'MISSING_OPTIONAL_CREDENTIAL',
    EXTRA_UNKNOWN_FIELD: 'EXTRA_UNKNOWN_FIELD',
    DEPRECATED_VERSION: 'DEPRECATED_VERSION',
    // Per-node + credential validation (Slice 6)
    CREDENTIAL_NOT_FOUND: 'CREDENTIAL_NOT_FOUND',
    CREDENTIAL_PROVIDER_MISMATCH: 'CREDENTIAL_PROVIDER_MISMATCH',
    INVALID_PER_NODE_PARAM: 'INVALID_PER_NODE_PARAM',
    // New for per-node schemas
    INVALID_FIELD: 'INVALID_FIELD',
    UNKNOWN_NODE_TYPE: 'UNKNOWN_NODE_TYPE',
    WARN: 'WARN'
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

export interface FlowNodeIssue {
    /** Dot-notation path, e.g. "data.inputParams[0].name" or "position" */
    path: string
    /** Error code constant */
    code: string
    /** Human-readable message */
    message: string
    /** Error stops validation; warning does not */
    severity: 'error' | 'warning'
}
