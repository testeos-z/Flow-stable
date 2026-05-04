/**
 * vectorStores.ts — Per-node Zod schemas for Vector Store nodes.
 *
 * Slice 6 PR 2 (T6): 1 schema for:
 * - supabase (credentialNames: ['supabaseApi'])
 */
import z from 'zod'
import { ErrorCodes } from '../issues.js'
import type { FlowNodeIssue } from '../issues.js'
import { validateCredentialProvider, validateCredential } from '../credentials.js'

// Helper to extract typed field from unknown
function getField<T>(data: unknown, key: string, defaultVal: T): T {
    if (typeof data !== 'object' || data === null) return defaultVal
    const obj = data as Record<string, unknown>
    const val = obj[key]
    return val !== undefined ? (val as T) : defaultVal
}

// ============================================================
// supabase Schema
// ============================================================

/**
 * Schema for supabase vector store node validation.
 * credentialNames: ['supabaseApi']
 */
export const supabaseSchema = z.object({
    credential: z.string().uuid().optional(),
    supabaseProjUrl: z.string().optional(),
    tableName: z.string().optional(),
    queryName: z.string().optional(),
    supabaseMetadataFilter: z.unknown().optional(),
    supabaseRPCFilter: z.string().optional(),
    topK: z.number().optional(),
    searchType: z.string().optional(),
    fetchK: z.number().optional(),
    lambda: z.number().optional()
})

/**
 * Validates supabase vector store node.
 * Checks credential provider matches supabaseApi.
 */
export function validateSupabase(node: unknown): FlowNodeIssue[] {
    const result = supabaseSchema.safeParse(node)
    if (!result.success) {
        return result.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            code: ErrorCodes.INVALID_FIELD,
            message: issue.message,
            severity: 'error' as const
        }))
    }

    const data = result.data as unknown as Record<string, unknown>
    const issues: FlowNodeIssue[] = []

    // Validate credential if present
    if (data.credential) {
        issues.push(...validateCredential(data.credential))
        issues.push(...validateCredentialProvider('supabase', 'supabaseApi'))
    }

    // Validate topK if provided
    const topK = getField<number>(data, 'topK', 4)
    if (typeof topK === 'number' && topK < 1) {
        issues.push({
            path: 'topK',
            code: ErrorCodes.INVALID_FIELD,
            message: 'topK must be at least 1',
            severity: 'error'
        })
    }

    // Validate fetchK for MMR search
    const searchType = getField<string>(data, 'searchType', 'similarity')
    const fetchK = getField<number>(data, 'fetchK', 20)
    if (searchType === 'mmr' && typeof fetchK === 'number' && fetchK < 1) {
        issues.push({
            path: 'fetchK',
            code: ErrorCodes.INVALID_FIELD,
            message: 'fetchK must be at least 1 for MMR search',
            severity: 'error'
        })
    }

    // Validate lambda for MMR search (0-1 range)
    const lambda = getField<number>(data, 'lambda', 0.5)
    if (typeof lambda === 'number' && (lambda < 0 || lambda > 1)) {
        issues.push({
            path: 'lambda',
            code: ErrorCodes.INVALID_FIELD,
            message: 'lambda must be between 0 and 1',
            severity: 'error'
        })
    }

    // Validate tableName is provided (required for functioning)
    const tableName = getField<string>(data, 'tableName', '')
    if (!tableName) {
        issues.push({
            path: 'tableName',
            code: ErrorCodes.INVALID_FIELD,
            message: 'tableName is required',
            severity: 'error'
        })
    }

    // Validate queryName is provided
    const queryName = getField<string>(data, 'queryName', '')
    if (!queryName) {
        issues.push({
            path: 'queryName',
            code: ErrorCodes.INVALID_FIELD,
            message: 'queryName is required',
            severity: 'error'
        })
    }

    return issues
}
