/**
 * validateNodeImpl.ts — validateNode implementation.
 *
 * Static imports at TOP of file. The common.ts → validateNodeImpl.ts →
 * agentflow.ts → common.ts circular dependency is broken by:
 * 1. common.ts re-exporting from validateNodeImpl.ts (not the other way)
 * 2. Type-only imports of FlowNodeRequest/Response (stripped at compile time)
 * 3. AgentFlowNodeSchema/ChatFlowNodeSchema loaded via dynamic import
 *    inside the function (not at module level), avoiding the cycle entirely.
 */

import { ErrorCodes } from './issues.js'
import type { FlowNodeIssue } from './issues.js'
import type { FlowNodeRequest, FlowNodeResponse } from './common.js'

export type { FlowNodeRequest, FlowNodeResponse }

// Lazy cache for the dynamically-loaded flow-type schemas
let _cache: {
    ReactFlowNodeSchema: import('zod').ZodObject<any>
    NodeDataSchema: import('zod').ZodObject<any>
    autoFixNode: (node: Record<string, unknown>) => { node: Record<string, unknown>; fixes: FlowNodeIssue[] }
    AgentFlowNodeSchema: import('zod').ZodObject<any>
    ChatFlowNodeSchema: import('zod').ZodObject<any>
    validateCategory: (node: Record<string, unknown>, category: string) => FlowNodeIssue[]
    validatePerNode: (nodeType: string, nodeData: unknown) => FlowNodeIssue[]
    validateCredential: (credentialId: unknown) => FlowNodeIssue[]
} | null = null

async function _ensureCache() {
    if (_cache) return _cache

    const [
        { ReactFlowNodeSchema, NodeDataSchema, autoFixNode },
        { AgentFlowNodeSchema },
        { ChatFlowNodeSchema },
        { validateCategory },
        { validatePerNode },
        { validateCredential }
    ] = await Promise.all([
        import('./common.js'),
        import('./agentflow.js'),
        import('./chatflow.js'),
        import('./categories.js'),
        import('./nodes/index.js'),
        import('./credentials.js')
    ])

    _cache = {
        ReactFlowNodeSchema,
        NodeDataSchema,
        autoFixNode,
        AgentFlowNodeSchema,
        ChatFlowNodeSchema,
        validateCategory,
        validatePerNode,
        validateCredential
    }
    return _cache
}

/**
 * Two-phase validateNode():
 *   Phase 1 (auto-fix): inject defaults for known-safe missing fields.
 *   Phase 2 (validate):  ReactFlowNodeSchema → NodeDataSchema →
 *                        AgentFlowNodeSchema | ChatFlowNodeSchema.
 *
 * Hard rule: errors.length > 0 → node: null.
 */
export async function validateNode(request: FlowNodeRequest, _templateName?: string): Promise<FlowNodeResponse> {
    // Ensure cache is populated (dynamic imports run once)
    if (!_cache) {
        await _ensureCache()
    }

    const {
        ReactFlowNodeSchema,
        NodeDataSchema,
        autoFixNode,
        AgentFlowNodeSchema,
        ChatFlowNodeSchema,
        validateCategory,
        validatePerNode,
        validateCredential
    } = _cache!

    const errors: FlowNodeIssue[] = []
    const warnings: FlowNodeIssue[] = []
    let autoFixed = false

    // Clone to avoid mutating caller's object
    let node = structuredClone(request.node) as Record<string, unknown>

    // Phase 1: Auto-fix
    const { node: fixedNode, fixes } = autoFixNode(node)
    node = fixedNode
    if (fixes.length > 0) {
        autoFixed = true
        warnings.push(...fixes)
    }

    // Check for PLACEHOLDER_ID remaining (hard failure)
    const idStr = JSON.stringify(node.id)
    if (idStr.includes('PLACEHOLDER_ID')) {
        errors.push({
            path: 'id',
            code: ErrorCodes.PLACEHOLDER_ID_REMAINING,
            message: 'node.id still contains PLACEHOLDER_ID after auto-fix',
            severity: 'error'
        })
    }
    const dataIdStr = JSON.stringify((node.data as Record<string, unknown>)?.id ?? '')
    if (dataIdStr.includes('PLACEHOLDER_ID')) {
        errors.push({
            path: 'data.id',
            code: ErrorCodes.PLACEHOLDER_ID_REMAINING,
            message: 'node.data.id still contains PLACEHOLDER_ID',
            severity: 'error'
        })
    }
    if (errors.length > 0) {
        return { valid: false, node: null, errors, warnings, metadata: { flowType: request.flowType, schemaVersion: '1.0', autoFixed } }
    }

    // Phase 2: Schema validation

    // Layer 1: ReactFlowNodeSchema
    const rfResult = ReactFlowNodeSchema.safeParse(node)
    if (!rfResult.success) {
        for (const issue of rfResult.error.issues) {
            errors.push({ path: issue.path.join('.'), code: ErrorCodes.MISSING_REQUIRED_FIELD, message: issue.message, severity: 'error' })
        }
    }
    if (errors.length > 0) {
        return { valid: false, node: null, errors, warnings, metadata: { flowType: request.flowType, schemaVersion: '1.0', autoFixed } }
    }

    // Layer 2: NodeDataSchema
    const data = node.data as Record<string, unknown>
    const ndResult = NodeDataSchema.safeParse(data)
    if (!ndResult.success) {
        for (const issue of ndResult.error.issues) {
            errors.push({
                path: `data.${issue.path.join('.')}`,
                code: ErrorCodes.MISSING_REQUIRED_FIELD,
                message: issue.message,
                severity: 'error'
            })
        }
    }
    if (errors.length > 0) {
        return { valid: false, node: null, errors, warnings, metadata: { flowType: request.flowType, schemaVersion: '1.0', autoFixed } }
    }

    // Layer 3: Flow-type schema
    if (request.flowType === 'AGENTFLOW') {
        const afResult = AgentFlowNodeSchema.safeParse(node)
        if (!afResult.success) {
            for (const issue of afResult.error.issues) {
                errors.push({ path: issue.path.join('.'), code: ErrorCodes.WRONG_FLOW_TYPE, message: issue.message, severity: 'error' })
            }
        }
        if (errors.length > 0) {
            return { valid: false, node: null, errors, warnings, metadata: { flowType: request.flowType, schemaVersion: '1.0', autoFixed } }
        }
    } else {
        const cfResult = ChatFlowNodeSchema.safeParse(node)
        if (!cfResult.success) {
            for (const issue of cfResult.error.issues) {
                errors.push({ path: issue.path.join('.'), code: ErrorCodes.WRONG_FLOW_TYPE, message: issue.message, severity: 'error' })
            }
        }
        if (errors.length > 0) {
            return { valid: false, node: null, errors, warnings, metadata: { flowType: request.flowType, schemaVersion: '1.0', autoFixed } }
        }
    }

    // Layer 4: Category schema validation
    const category = (node.data as Record<string, unknown>).category as string | undefined
    if (category) {
        const categoryErrors = validateCategory(node, category)
        errors.push(...categoryErrors)
        if (errors.length > 0) {
            return { valid: false, node: null, errors, warnings, metadata: { flowType: request.flowType, schemaVersion: '1.0', autoFixed } }
        }
    }

    // Layer 5: Per-node schema validation + credential check
    const nodeType = (node.data as Record<string, unknown>).name as string | undefined
    if (nodeType) {
        // Per-node schema validation (graceful skip if node type unknown)
        const perNodeErrors = await validatePerNode(nodeType, node.data)
        // Separate errors from warnings
        const layer5Errors = perNodeErrors.filter((e) => e.severity === 'error')
        const layer5Warnings = perNodeErrors.filter((e) => e.severity === 'warning')
        errors.push(...layer5Errors)
        warnings.push(...layer5Warnings)
        if (errors.length > 0) {
            return { valid: false, node: null, errors, warnings, metadata: { flowType: request.flowType, schemaVersion: '1.0', autoFixed } }
        }

        // Credential validation: check data.inputs.credential for required credential nodes
        // The per-node schema validates credential format; we check presence here
        const nodeData = node.data as Record<string, unknown>
        const inputs = nodeData.inputs as Record<string, unknown> | undefined
        const inputParams = nodeData.inputParams as Array<Record<string, unknown>> | undefined
        const hasCredentialParam = inputParams?.some((p) => p.type === 'credential')
        if (hasCredentialParam) {
            // Check if credential param is optional or required
            const credParam = inputParams?.find((p) => p.type === 'credential') as Record<string, unknown> | undefined
            const isOptional = credParam?.optional === true
            const credentialId = inputs?.credential as string | undefined

            if (!credentialId && !isOptional) {
                // Required credential missing → error
                errors.push({
                    path: 'credential',
                    code: ErrorCodes.CREDENTIAL_NOT_FOUND,
                    message: 'Credential is required but not provided',
                    severity: 'error'
                })
                return {
                    valid: false,
                    node: null,
                    errors,
                    warnings,
                    metadata: { flowType: request.flowType, schemaVersion: '1.0', autoFixed }
                }
            }

            if (credentialId) {
                // Validate UUID format
                const credErrors = validateCredential(credentialId)
                errors.push(...credErrors)
                if (errors.length > 0) {
                    return {
                        valid: false,
                        node: null,
                        errors,
                        warnings,
                        metadata: { flowType: request.flowType, schemaVersion: '1.0', autoFixed }
                    }
                }
            }
        }
    }

    return { valid: true, node, errors: [], warnings, metadata: { flowType: request.flowType, schemaVersion: '1.0', autoFixed } }
}
