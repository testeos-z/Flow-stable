/**
 * loop.ts — Schema for Loop
 *
 * Auto-generated from node catalogue.
 * Category: Sequential Agents
 * Provider: Loop hacia atrás a un nodo específico
 * Notes: Para iterar hasta cumplir condición
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const LoopSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateLoop(node: unknown): FlowNodeIssue[] {
    const result = LoopSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('Loop', 'Loop hacia atrás a un nodo específico'))
    }
    return issues
}
