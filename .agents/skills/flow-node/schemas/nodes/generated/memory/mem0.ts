/**
 * mem0.ts — Schema for Mem0
 *
 * Auto-generated from node catalogue.
 * Category: Memory
 * Provider: Mem0 Cloud
 * Notes: Memoria con perfil de usuario. Personalización cross-session
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const Mem0Schema = z.object({
    credential: z.string().uuid().optional()
})

export function validateMem0(node: unknown): FlowNodeIssue[] {
    const result = Mem0Schema.safeParse(node)
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
        issues.push(...validateCredentialProvider('Mem0', 'Mem0 Cloud'))
    }
    return issues
}
