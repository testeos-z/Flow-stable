/**
 * memory.ts — Per-node Zod schemas for Memory nodes.
 *
 * Slice 6 PR 2 (T4): 1 schema for:
 * - bufferMemory (sin credencial)
 */
import z from 'zod'
import { ErrorCodes } from '../issues.js'
import type { FlowNodeIssue } from '../issues.js'

// Helper to extract typed field from unknown
function getField<T>(data: unknown, key: string, defaultVal: T): T {
    if (typeof data !== 'object' || data === null) return defaultVal
    const obj = data as Record<string, unknown>
    const val = obj[key]
    return val !== undefined ? (val as T) : defaultVal
}

// ============================================================
// bufferMemory Schema
// ============================================================

/**
 * Schema for bufferMemory node validation.
 * No credential required.
 */
export const bufferMemorySchema = z.object({
    sessionId: z.string().optional(),
    memoryKey: z.string().optional()
})

/**
 * Validates bufferMemory node.
 * No credential validation needed.
 */
export function validateBufferMemory(node: unknown): FlowNodeIssue[] {
    const result = bufferMemorySchema.safeParse(node)
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

    // Validate sessionId format if provided (alphanumeric, dashes, underscores allowed)
    const sessionId = getField<string>(data, 'sessionId', '')
    if (sessionId && typeof sessionId === 'string') {
        const sessionIdPattern = /^[a-zA-Z0-9_-]*$/
        if (!sessionIdPattern.test(sessionId)) {
            issues.push({
                path: 'sessionId',
                code: ErrorCodes.INVALID_FIELD,
                message: 'sessionId must contain only alphanumeric characters, dashes, and underscores',
                severity: 'error'
            })
        }
    }

    // Validate memoryKey is not empty if provided
    const memoryKey = getField<string>(data, 'memoryKey', '')
    if (memoryKey && typeof memoryKey === 'string' && memoryKey.trim() === '') {
        issues.push({
            path: 'memoryKey',
            code: ErrorCodes.INVALID_FIELD,
            message: 'memoryKey cannot be empty',
            severity: 'error'
        })
    }

    return issues
}
