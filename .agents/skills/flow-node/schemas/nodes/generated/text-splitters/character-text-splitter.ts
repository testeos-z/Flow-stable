/**
 * character-text-splitter.ts — Schema for Character Text Splitter
 *
 * Auto-generated from node catalogue.
 * Category: Text Splitters
 * Provider: Simple. Divide por caracteres. Rápido
 * Notes:
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const CharacterTextSplitterSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateCharacterTextSplitter(node: unknown): FlowNodeIssue[] {
    const result = CharacterTextSplitterSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('CharacterTextSplitter', 'Simple. Divide por caracteres. Rápido'))
    }
    return issues
}
