/**
 * perplexity.ts — Schema for Perplexity
 *
 * Auto-generated from node catalogue.
 * Category: Chat Models
 * Provider: Perplexity
 * Notes: Modelos de Perplexity con búsqueda integrada
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const PerplexitySchema = z.object({
    credential: z.string().uuid().optional()
})

export function validatePerplexity(node: unknown): FlowNodeIssue[] {
    const result = PerplexitySchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('Perplexity', 'Perplexity'))
    }
    return issues
}
