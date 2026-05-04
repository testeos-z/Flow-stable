/**
 * custom-js-function.ts — Schema for Custom JS Function
 *
 * Auto-generated from node catalogue.
 * Category: Utilities
 * Provider: Ejecuta JS arbitrario en el flujo
 * Notes:
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const CustomJSFunctionSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateCustomJSFunction(node: unknown): FlowNodeIssue[] {
    const result = CustomJSFunctionSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('CustomJSFunction', 'Ejecuta JS arbitrario en el flujo'))
    }
    return issues
}
