/**
 * chatflow.ts — ChatFlowNodeSchema + CHATFLOW_MVP_ALLOWLIST + validateChatFlowSemantics()
 *
 * PR2: AgentFlow + ChatFlow Schemas
 * Implements T5 from the tasks slice.
 */

import z from 'zod'
import { ReactFlowNodeSchema, autoFixNode, NodeDataSchema } from './common.js'
import type { FlowNodeRequest, FlowNodeResponse } from './common.js'
import { FlowNodeIssue, ErrorCodes } from './issues.js'

// ============================================================================
// Allowlist of MVP ChatFlow node names
// ============================================================================

export const CHATFLOW_MVP_ALLOWLIST = [
    'chatOpenRouter',
    'chatOpenAI',
    'chatAnthropic',
    'bufferMemory',
    'huggingFaceInferenceEmbedding',
    'supabase',
    'retrieverTool',
    'toolAgent',
    'a2aRegistry',
    'a2aTask',
    'a2aArtifact',
    'a2aSharedContext',
    'a2aMemoryAdapter'
] as const

// ============================================================================
// ChatFlowNodeSchema
// ============================================================================

/**
 * Recursively checks all string fields for PLACEHOLDER_ID.
 */
function containsPlaceholder(value: unknown): boolean {
    if (typeof value === 'string') return value.includes('PLACEHOLDER_ID')
    if (Array.isArray(value)) return value.some(containsPlaceholder)
    if (value && typeof value === 'object') {
        return Object.values(value as Record<string, unknown>).some(containsPlaceholder)
    }
    return false
}

/**
 * ChatFlow extends ReactFlowNode + NodeData with:
 * - type must be 'customNode'
 * - category must NOT be 'Agent Flows'
 * - data.name must be in MVP allowlist OR pass UNSUPPORTED_NODE_TYPE
 *
 * Validation is done via .refine() on the schema itself (not just semantic fn).
 */
export const ChatFlowNodeSchema = ReactFlowNodeSchema.extend({
    type: z.literal('customNode'),
    data: z
        .object({
            id: z.string().min(1),
            name: z.string().min(1),
            type: z.string().min(1),
            label: z.string().min(1),
            category: z.string().min(1),
            version: z.string().optional(),
            description: z.string().optional(),
            color: z.string().optional(),
            icon: z.string().optional(),
            baseClasses: z.array(z.string()).optional(),
            filePath: z.string().optional(),
            hideInput: z.boolean().optional(),
            loadMethods: z.record(z.string(), z.any()).optional(),
            inputs: z.record(z.string(), z.any()).default({}),
            inputParams: z.array(z.any()).default([]),
            inputAnchors: z.array(z.any()).default([]),
            outputAnchors: z.array(z.any()).default([]),
            outputs: z.record(z.string(), z.any()).default({})
        })
        .passthrough()
        .refine((data) => data.category !== 'Agent Flows', {
            message: 'ChatFlow node cannot have category "Agent Flows"',
            path: ['category']
        })
        .refine((data) => CHATFLOW_MVP_ALLOWLIST.includes(data.name as (typeof CHATFLOW_MVP_ALLOWLIST)[number]), {
            message: `ChatFlow node name must be in MVP allowlist: ${CHATFLOW_MVP_ALLOWLIST.join(', ')}`,
            path: ['name']
        })
        .refine((data) => !containsPlaceholder(data), {
            message: 'Node data contains PLACEHOLDER_ID in one or more fields',
            path: ['id']
        })
}).passthrough()

export type ChatFlowNodeType = z.infer<typeof ChatFlowNodeSchema>

// ============================================================================
// Semantic validation (post-schema)
// ============================================================================

export interface ChatFlowValidationInput {
    nodes: Record<string, unknown>[]
    edges: Record<string, unknown>[]
}

/**
 * validateChatFlowSemantics — semantic checks for ChatFlow.
 *
 * Validates:
 * 1. No 'agentFlow' type nodes mixed into ChatFlow design
 * 2. data.name is in MVP allowlist → UNSUPPORTED_NODE_TYPE error if not
 * 3. inputAnchors and outputAnchors are arrays
 * 4. inputParams is an array
 * 5. No PLACEHOLDER_ID remaining anywhere in any node
 *
 * NOTE: For PR2, condition (1) is enforced at the schema layer (WRONG_FLOW_TYPE).
 * This function focuses on semantic constraints that Zod cannot express.
 */
export function validateChatFlowSemantics(input: ChatFlowValidationInput): FlowNodeIssue[] {
    const issues: FlowNodeIssue[] = []
    const { nodes, edges } = input

    // --------------------------------------------------
    // 1. No agentFlow type nodes in ChatFlow
    // (Schema layer enforces type === 'customNode', but double-check data.category)
    // --------------------------------------------------
    for (const node of nodes) {
        const data = node.data as Record<string, unknown>
        if (data?.category === 'Agent Flows') {
            issues.push({
                path: `node[${node.id ?? 'unknown'}].data.category`,
                code: 'WRONG_FLOW_TYPE',
                message: `ChatFlow node cannot have category "Agent Flows"`,
                severity: 'error'
            })
        }
    }

    // --------------------------------------------------
    // 2. data.name must be in MVP allowlist
    // --------------------------------------------------
    for (const node of nodes) {
        const data = node.data as Record<string, unknown>
        const name = data?.name as string | undefined
        if (name && !CHATFLOW_MVP_ALLOWLIST.includes(name as (typeof CHATFLOW_MVP_ALLOWLIST)[number])) {
            issues.push({
                path: `node[${node.id ?? 'unknown'}].data.name`,
                code: 'UNSUPPORTED_NODE_TYPE',
                message: `ChatFlow node '${name}' not in MVP allowlist. Supported: ${CHATFLOW_MVP_ALLOWLIST.join(', ')}`,
                severity: 'error'
            })
        }
    }

    // --------------------------------------------------
    // 3. Anchors and inputParams must be arrays
    // --------------------------------------------------
    for (const node of nodes) {
        const data = node.data as Record<string, unknown>

        if (!Array.isArray(data?.inputAnchors)) {
            issues.push({
                path: `node[${node.id ?? 'unknown'}].data.inputAnchors`,
                code: 'MISSING_REQUIRED_FIELD',
                message: 'data.inputAnchors is required (must be an array)',
                severity: 'error'
            })
        }
        if (!Array.isArray(data?.outputAnchors)) {
            issues.push({
                path: `node[${node.id ?? 'unknown'}].data.outputAnchors`,
                code: 'MISSING_REQUIRED_FIELD',
                message: 'data.outputAnchors is required (must be an array)',
                severity: 'error'
            })
        }
        if (!Array.isArray(data?.inputParams)) {
            issues.push({
                path: `node[${node.id ?? 'unknown'}].data.inputParams`,
                code: 'MISSING_REQUIRED_FIELD',
                message: 'data.inputParams is required (must be an array)',
                severity: 'error'
            })
        }
    }

    // --------------------------------------------------
    // 4. No PLACEHOLDER_ID anywhere in any node
    // --------------------------------------------------
    for (const node of nodes) {
        if (containsPlaceholder(node)) {
            const nodeId = typeof node.id === 'string' ? node.id : 'unknown'
            issues.push({
                path: `node[${nodeId}]`,
                code: 'PLACEHOLDER_ID_REMAINING',
                message: `Node "${nodeId}" contains PLACEHOLDER_ID in one or more fields`,
                severity: 'error'
            })
        }
    }

    // --------------------------------------------------
    // 5. Handle references in edges must exist
    // --------------------------------------------------
    const knownHandles = new Set<string>()
    for (const node of nodes) {
        const data = node.data as Record<string, unknown>
        const inputAnchors = (data?.inputAnchors as Array<Record<string, unknown>>) ?? []
        const outputAnchors = (data?.outputAnchors as Array<Record<string, unknown>>) ?? []
        for (const anchor of inputAnchors) {
            if (anchor?.name) knownHandles.add(String(anchor.name))
        }
        for (const anchor of outputAnchors) {
            if (anchor?.name) knownHandles.add(String(anchor.name))
        }
    }

    for (const edge of edges) {
        const sourceHandle = edge.sourceHandle as string | null | undefined
        const targetHandle = edge.targetHandle as string | null | undefined
        if (sourceHandle && !knownHandles.has(sourceHandle)) {
            issues.push({
                path: `edge[${edge.id ?? 'unknown'}]`,
                code: 'INVALID_ANCHOR_SHAPE',
                message: `Edge "${edge.id}" references unknown sourceHandle "${sourceHandle}"`,
                severity: 'error'
            })
        }
        if (targetHandle && !knownHandles.has(targetHandle)) {
            issues.push({
                path: `edge[${edge.id ?? 'unknown'}]`,
                code: 'INVALID_ANCHOR_SHAPE',
                message: `Edge "${edge.id}" references unknown targetHandle "${targetHandle}"`,
                severity: 'error'
            })
        }
    }

    return issues
}

// ============================================================================
// Template Validation (separate from production validateNode)
// ============================================================================

/**
 * validateChatFlowTemplate — validates a raw ChatFlow TEMPLATE node.
 *
 * Unlike validateNode(), this function downgrades PLACEHOLDER_ID to a WARNING
 * (templates are expected to contain PLACEHOLDER_ID). All other schema rules
 * (ReactFlowNode structure, NodeData shape, name in ALLOWLIST, correct category)
 * are enforced as hard errors.
 *
 * For production node validation, use validateNode() from common.ts instead.
 */
export function validateChatFlowTemplate(request: FlowNodeRequest, template: Record<string, unknown>): FlowNodeResponse {
    // Clone to avoid mutating caller's object
    const fixedNode = structuredClone(template) as Record<string, unknown>

    // Phase 1: Auto-fix
    const { node, fixes } = autoFixNode(fixedNode)
    const warnings: FlowNodeIssue[] = [...fixes]
    const errors: FlowNodeIssue[] = []

    // Phase 2: Schema layers

    // Layer 1: ReactFlowNodeSchema
    const rfResult = ReactFlowNodeSchema.safeParse(node)
    if (!rfResult.success) {
        for (const issue of rfResult.error.issues) {
            errors.push({
                path: issue.path.join('.'),
                code: ErrorCodes.MISSING_REQUIRED_FIELD,
                message: issue.message,
                severity: 'error'
            })
        }
    }
    if (errors.length > 0) {
        return {
            valid: false,
            node: null,
            errors,
            warnings,
            metadata: {
                flowType: request.flowType,
                nodeType: request.nodeType,
                source: 'static-template',
                schemaVersion: '1.0'
            }
        }
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
        return {
            valid: false,
            node: null,
            errors,
            warnings,
            metadata: {
                flowType: request.flowType,
                nodeType: request.nodeType,
                source: 'static-template',
                schemaVersion: '1.0'
            }
        }
    }

    // Layer 3: ChatFlowNodeSchema — filter PLACEHOLDER_ID errors to warnings
    const cfResult = ChatFlowNodeSchema.safeParse(node)
    if (!cfResult.success) {
        for (const issue of cfResult.error.issues) {
            if (issue.message.includes('PLACEHOLDER_ID')) {
                warnings.push({
                    path: issue.path.join('.'),
                    code: ErrorCodes.PLACEHOLDER_ID_REMAINING,
                    message: `${issue.message} (expected in templates; must be substituted before production use)`,
                    severity: 'warning'
                })
            } else {
                errors.push({
                    path: issue.path.join('.'),
                    code: ErrorCodes.WRONG_FLOW_TYPE,
                    message: issue.message,
                    severity: 'error'
                })
            }
        }
    }

    // PLACEHOLDER_ID check: emit warnings for node.id and data.id
    if (errors.length === 0) {
        if (String(node.id).includes('PLACEHOLDER_ID')) {
            warnings.push({
                path: 'id',
                code: ErrorCodes.PLACEHOLDER_ID_REMAINING,
                message: 'Template node.id contains PLACEHOLDER_ID — expected for templates, must be substituted before production use',
                severity: 'warning'
            })
        }
        const dataId = (node.data as Record<string, unknown>)?.id
        if (dataId !== undefined && String(dataId).includes('PLACEHOLDER_ID')) {
            warnings.push({
                path: 'data.id',
                code: ErrorCodes.PLACEHOLDER_ID_REMAINING,
                message: 'Template data.id contains PLACEHOLDER_ID — expected for templates, must be substituted before production use',
                severity: 'warning'
            })
        }
    }

    return {
        valid: errors.length === 0,
        node: errors.length === 0 ? node : null,
        errors,
        warnings,
        metadata: {
            flowType: request.flowType,
            nodeType: request.nodeType,
            source: 'static-template',
            schemaVersion: '1.0'
        }
    }
}
