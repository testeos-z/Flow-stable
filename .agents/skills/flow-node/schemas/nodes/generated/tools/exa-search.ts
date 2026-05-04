/**
 * exa-search.ts — Schema for Exa Search
 *
 * Auto-generated from node catalogue.
 * Category: Tools
 * Provider: Search engine para LLMs
 * Notes: ✅ exaSearchApi
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const ExaSearchSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateExaSearch(node: unknown): FlowNodeIssue[] {
    const result = ExaSearchSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('ExaSearch', 'Search engine para LLMs'))
    }
    return issues
}
