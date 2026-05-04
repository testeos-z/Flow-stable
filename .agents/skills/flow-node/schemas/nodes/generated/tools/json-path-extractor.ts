/**
 * json-path-extractor.ts — Schema for JSON Path Extractor
 *
 * Auto-generated from node catalogue.
 * Category: Tools
 * Provider: Extrae campos de JSON
 * Notes: ❌
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const JSONPathExtractorSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateJSONPathExtractor(node: unknown): FlowNodeIssue[] {
    const result = JSONPathExtractorSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('JSONPathExtractor', 'Extrae campos de JSON'))
    }
    return issues
}
