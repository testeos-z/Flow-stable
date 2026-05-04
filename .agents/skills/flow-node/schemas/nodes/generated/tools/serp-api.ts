/**
 * serp-api.ts — Schema for Serp API
 *
 * Auto-generated from node catalogue.
 * Category: Tools
 * Provider: Google Search API
 * Notes: ✅ serpApi
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const SerpAPISchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateSerpAPI(node: unknown): FlowNodeIssue[] {
    const result = SerpAPISchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('SerpAPI', 'Google Search API'))
    }
    return issues
}
