/**
 * markdown-text-splitter.ts — Schema for Markdown Text Splitter
 *
 * Auto-generated from node catalogue.
 * Category: Text Splitters
 * Provider: Respeta estructura Markdown. Para docs formateados
 * Notes:
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const MarkdownTextSplitterSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateMarkdownTextSplitter(node: unknown): FlowNodeIssue[] {
    const result = MarkdownTextSplitterSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('MarkdownTextSplitter', 'Respeta estructura Markdown. Para docs formateados'))
    }
    return issues
}
