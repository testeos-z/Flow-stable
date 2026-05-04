/**
 * tools.ts — Per-node Zod schemas for Tools nodes.
 *
 * Slice 6 PR 2 (T7): 1 schema for:
 * - retrieverTool (sin credencial)
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
// retrieverTool Schema
// ============================================================

/**
 * Schema for retrieverTool node validation.
 * No credential required.
 */
export const retrieverToolSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    returnSourceDocuments: z.boolean().optional(),
    retrieverToolMetadataFilter: z.unknown().optional()
})

/**
 * Validates retrieverTool node.
 * No credential validation needed.
 */
export function validateRetrieverTool(node: unknown): FlowNodeIssue[] {
    const result = retrieverToolSchema.safeParse(node)
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

    // Name is required
    const name = getField<string>(data, 'name', '')
    if (!name || name.trim() === '') {
        issues.push({
            path: 'name',
            code: ErrorCodes.INVALID_FIELD,
            message: 'name is required for retrieverTool',
            severity: 'error'
        })
    }

    // Description is required
    const description = getField<string>(data, 'description', '')
    if (!description || description.trim() === '') {
        issues.push({
            path: 'description',
            code: ErrorCodes.INVALID_FIELD,
            message: 'description is required for retrieverTool',
            severity: 'error'
        })
    }

    return issues
}
