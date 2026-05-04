/**
 * nvidia-nim.ts — Schema for Nvidia NIM
 *
 * Auto-generated from node catalogue.
 * Category: Chat Models
 * Provider: Nvidia
 * Notes: Modelos optimizados en GPUs Nvidia
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const NvidiaNIMSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateNvidiaNIM(node: unknown): FlowNodeIssue[] {
    const result = NvidiaNIMSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('NvidiaNIM', 'Nvidia'))
    }
    return issues
}
