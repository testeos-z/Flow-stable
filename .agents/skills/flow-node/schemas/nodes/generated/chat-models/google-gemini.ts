/**
 * google-gemini.ts — Schema for Google Gemini
 *
 * Auto-generated from node catalogue.
 * Category: Chat Models
 * Provider: Google
 * Notes: Gemini 2.5 Pro/Flash. Gratuito vía API key. Multimodal
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const GoogleGeminiSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateGoogleGemini(node: unknown): FlowNodeIssue[] {
    const result = GoogleGeminiSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('GoogleGemini', 'Google'))
    }
    return issues
}
