/**
 * searxng.ts — Schema for SearXNG
 *
 * Auto-generated from node catalogue.
 * Category: Tools
 * Provider: Búsqueda auto-hosteada
 * Notes: ❌
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const SearXNGSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateSearXNG(node: unknown): FlowNodeIssue[] {
    const result = SearXNGSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('SearXNG', 'Búsqueda auto-hosteada'))
    }
    return issues
}
