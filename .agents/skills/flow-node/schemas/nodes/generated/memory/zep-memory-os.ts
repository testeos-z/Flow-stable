/**
 * zep-memory-os.ts — Schema for Zep Memory (OS)
 *
 * Auto-generated from node catalogue.
 * Category: Memory
 * Provider: Zep Server
 * Notes: Memoria open-source con perfil de usuario
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const ZepMemoryOSSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateZepMemoryOS(node: unknown): FlowNodeIssue[] {
    const result = ZepMemoryOSSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('ZepMemoryOS', 'Zep Server'))
    }
    return issues
}
