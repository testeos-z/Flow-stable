/**
 * buffer-memory.ts — Schema for Buffer Memory
 *
 * Auto-generated from node catalogue.
 * Category: Memory
 * Provider: Flowise DB
 * Notes: Default. Conversación simple sin expiración
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const BufferMemorySchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateBufferMemory(node: unknown): FlowNodeIssue[] {
    const result = BufferMemorySchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('BufferMemory', 'Flowise DB'))
    }
    return issues
}
