/**
 * queryengine-tool.ts — Schema for QueryEngine Tool
 *
 * Auto-generated from node catalogue.
 * Category: Tools
 * Provider: Motor de consultas (LlamaIndex)
 * Notes: ❌
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const QueryEngineToolSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateQueryEngineTool(node: unknown): FlowNodeIssue[] {
    const result = QueryEngineToolSchema.safeParse(node)
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
    if (data.credential) {
        issues.push(...validateCredential(data.credential))
        issues.push(...validateCredentialProvider('QueryEngineTool', 'Motor de consultas (LlamaIndex)'))
    }
    return issues
}
