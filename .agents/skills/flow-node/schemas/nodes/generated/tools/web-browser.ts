/**
 * web-browser.ts — Schema for Web Browser
 *
 * Auto-generated from node catalogue.
 * Category: Tools
 * Provider: Navegación web scrape
 * Notes: ❌
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const WebBrowserSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateWebBrowser(node: unknown): FlowNodeIssue[] {
    const result = WebBrowserSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('WebBrowser', 'Navegación web scrape'))
    }
    return issues
}
