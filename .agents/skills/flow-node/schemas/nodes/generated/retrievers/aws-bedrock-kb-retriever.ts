/**
 * aws-bedrock-kb-retriever.ts — Schema for AWS Bedrock KB Retriever
 *
 * Auto-generated from node catalogue.
 * Category: Retrievers
 * Provider: Recupera de Knowledge Base de AWS Bedrock
 * Notes:
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'
import { validateCredential, validateCredentialProvider } from '../../../credentials.js'

export const AWSBedrockKBRetrieverSchema = z.object({
    credential: z.string().uuid().optional()
})

export function validateAWSBedrockKBRetriever(node: unknown): FlowNodeIssue[] {
    const result = AWSBedrockKBRetrieverSchema.safeParse(node)
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
        issues.push(...validateCredentialProvider('AWSBedrockKBRetriever', 'Recupera de Knowledge Base de AWS Bedrock'))
    }
    return issues
}
