/**
 * agents.ts — Per-node Zod schemas for Agent nodes.
 *
 * Slice 6 PR 2 (T8): 1 schema for:
 * - toolAgent (sin credencial)
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
// toolAgent Schema
// ============================================================

/**
 * Schema for toolAgent node validation.
 * No credential required.
 */
export const toolAgentSchema = z.object({
    systemMessage: z.string().optional(),
    maxIterations: z.number().optional(),
    returnDirect: z.boolean().optional()
})

/**
 * Validates toolAgent node.
 * No credential validation needed.
 */
export function validateToolAgent(node: unknown): FlowNodeIssue[] {
    const result = toolAgentSchema.safeParse(node)
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

    // Validate maxIterations range
    const maxIterations = getField<number>(data, 'maxIterations', 5)
    if (typeof maxIterations === 'number' && maxIterations < 1) {
        issues.push({
            path: 'maxIterations',
            code: ErrorCodes.INVALID_FIELD,
            message: 'maxIterations must be at least 1',
            severity: 'error'
        })
    }

    // Warn if maxIterations is too high (> 10)
    if (typeof maxIterations === 'number' && maxIterations > 10) {
        issues.push({
            path: 'maxIterations',
            code: ErrorCodes.WARN,
            message: 'maxIterations > 10 may cause performance issues',
            severity: 'warning'
        })
    }

    return issues
}
