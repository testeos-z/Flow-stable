/**
 * google-custom-search.ts — Schema for Google Custom Search
 *
 * Auto-generated from node catalogue.
 * Category: Tools
 * Provider: Búsqueda Google
 * Notes: ✅ googleCustomSearchApi
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const GoogleCustomSearchSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateGoogleCustomSearch(node: unknown): FlowNodeIssue[] {
    const result = GoogleCustomSearchSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('GoogleCustomSearch', 'Búsqueda Google'))
    }
    return issues
}
