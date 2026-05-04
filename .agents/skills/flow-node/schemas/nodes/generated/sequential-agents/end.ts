/**
 * end.ts — Schema for End
 *
 * Auto-generated from node catalogue.
 * Category: Sequential Agents
 * Provider: Termina la ejecución
 * Notes: Siempre al final del grafo
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const EndSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateEnd(node: unknown): FlowNodeIssue[] {
    const result = EndSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('End', 'Termina la ejecución'))
    }
    return issues
}
