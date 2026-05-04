/**
 * similarity-score-threshold.ts — Schema for Similarity Score Threshold
 *
 * Auto-generated from node catalogue.
 * Category: Retrievers
 * Provider: Solo resultados por encima de un threshold
 * Notes:
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const SimilarityScoreThresholdSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateSimilarityScoreThreshold(node: unknown): FlowNodeIssue[] {
    const result = SimilarityScoreThresholdSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('SimilarityScoreThreshold', 'Solo resultados por encima de un threshold'))
    }
    return issues
}
