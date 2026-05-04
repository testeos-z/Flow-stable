/**
 * index.ts — re-exports + runValidation()
 *
 * PR2 (T6): AgentFlow + ChatFlow Schemas
 * Replaces placeholder stub with full re-exports and top-level runValidation().
 */

// Re-export all schemas and types
export { ErrorCodes } from './issues.js'
export type { FlowNodeIssue } from './issues.js'
export { ReactFlowNodeSchema, NodeDataSchema, PositionSchema, autoFixNode, validateNode } from './common.js'
export type { FlowNodeRequest, FlowNodeResponse } from './common.js'
export { AgentFlowNodeSchema, validateAgentFlowSemantics, validateTemplate, AGENTFLOW_ALLOWLIST } from './agentflow.js'
export type { AgentFlowValidationInput } from './agentflow.js'
export { ChatFlowNodeSchema, validateChatFlowSemantics, validateChatFlowTemplate, CHATFLOW_MVP_ALLOWLIST } from './chatflow.js'
export type { ChatFlowValidationInput } from './chatflow.js'
export { Category, getCategorySchema, validateCategory } from './categories.js'
export type { CategorySchema } from './categories.js'
export { getPerNodeSchema, validatePerNode, NODE_SCHEMA_MAP } from './nodes/index.js'
export { validateCredential, validateCredentialProvider, CREDENTIAL_PROVIDER_MAP } from './credentials.js'

import { validateNode } from './common.js'
import type { FlowNodeRequest, FlowNodeResponse } from './common.js'

/**
 * runValidation — top-level entry point matching SKILL.md R6 contract.
 *
 * @param request       FlowNodeRequest (flowType + raw node)
 * @param template     IReactFlowNode template (used for checksum metadata)
 * @param versionInfo   { templateVersion, checksum } from _version.json
 */
export async function runValidation(
    request: FlowNodeRequest,
    _template: Record<string, unknown>,
    versionInfo: { templateVersion: string; checksum: string }
): Promise<FlowNodeResponse> {
    const result = await validateNode(request)

    // Attach version metadata (even on error)
    result.metadata.templateVersion = versionInfo.templateVersion
    result.metadata.checksum = versionInfo.checksum

    return result
}
