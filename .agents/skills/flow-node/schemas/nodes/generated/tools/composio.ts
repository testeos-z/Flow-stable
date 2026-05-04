/**
 * composio.ts — Schema for Composio
 *
 * Auto-generated from node catalogue.
 * Category: Tools
 * Provider: 250+ apps integradas
 * Notes: ✅ composioApi
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const ComposioSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateComposio(node: unknown): FlowNodeIssue[] {
    const result = ComposioSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('Composio', '250+ apps integradas'))
    }
    return issues
}
