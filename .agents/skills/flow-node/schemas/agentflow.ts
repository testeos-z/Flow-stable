/**
 * agentflow.ts — AgentFlowNodeSchema + AGENTFLOW_ALLOWLIST + validateAgentFlowSemantics()
 *
 * PR2: AgentFlow + ChatFlow Schemas
 * Implements T4 from the tasks slice.
 */

import z from 'zod'
import { ReactFlowNodeSchema, autoFixNode, NodeDataSchema } from './common.js'
import type { FlowNodeRequest, FlowNodeResponse } from './common.js'
import { FlowNodeIssue, ErrorCodes } from './issues.js'

// ============================================================================
// Allowlist of 15 known AgentFlow node names
// ============================================================================

export const AGENTFLOW_ALLOWLIST = [
    'agentAgentflow',
    'llmAgentflow',
    'startAgentflow',
    'conditionAgentflow',
    'conditionAgentAgentflow',
    'customFunctionAgentflow',
    'directReplyAgentflow',
    'executeFlowAgentflow',
    'humanInputAgentflow',
    'httpAgentflow',
    'iterationAgentflow',
    'loopAgentflow',
    'retrieverAgentflow',
    'stickyNoteAgentflow',
    'toolAgentflow'
] as const

// ============================================================================
// AgentFlowNodeSchema
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
 * AgentFlow extends ReactFlowNode + NodeData with strict type constraints:
 * - type must be 'agentFlow'
 * - category must be 'Agent Flows' (exception: stickyNote → 'Utilities')
 * - data.name must be in the 15-node allowlist
 * - No PLACEHOLDER_ID anywhere in the node
 *
 * Validation is done via .refine() on the schema itself (not just semantic fn).
 */
export const AgentFlowNodeSchema = ReactFlowNodeSchema.extend({
    type: z.enum(['agentFlow', 'stickyNote']),
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
        .refine((data) => AGENTFLOW_ALLOWLIST.includes(data.name as (typeof AGENTFLOW_ALLOWLIST)[number]), {
            message: `AgentFlow node name must be one of: ${AGENTFLOW_ALLOWLIST.join(', ')}`,
            path: ['name']
        })
        .refine(
            (data) => {
                if (data.name === 'stickyNoteAgentflow') return data.category === 'Utilities'
                return data.category === 'Agent Flows'
            },
            {
                message: 'AgentFlow node must have category "Agent Flows" (stickyNote must be "Utilities")',
                path: ['category']
            }
        )
        .refine((data) => !containsPlaceholder(data), {
            message: 'Node data contains PLACEHOLDER_ID in one or more fields',
            path: ['id']
        })
})
    .passthrough()
    .refine(
        (node) => {
            if (node.type === 'stickyNote') {
                return node.data.name === 'stickyNoteAgentflow'
            }
            return true
        },
        {
            message: 'type "stickyNote" is only valid for stickyNoteAgentflow nodes',
            path: ['type']
        }
    )

export type AgentFlowNodeType = z.infer<typeof AgentFlowNodeSchema>

// ============================================================================
// Semantic validation (post-schema)
// Called by flow-ing during graph validation, NOT from validateNode()
// ============================================================================

export interface AgentFlowValidationInput {
    nodes: Record<string, unknown>[]
    edges: Record<string, unknown>[]
    templateName?: string
}

/**
 * validateAgentFlowSemantics — graph-level semantic checks for AgentFlow.
 *
 * Validates:
 * 1. Exactly one startAgentflow node exists
 * 2. No PLACEHOLDER_ID anywhere in any node
 * 3. All referenced handles in edges actually exist on source/target nodes
 * 4. No orphan execution nodes (nodes with no connections except StickyNote)
 *
 * NOTE: For PR2, this function is defined but NOT called from validateNode().
 * It is called by flow-ing during full graph validation.
 */
export function validateAgentFlowSemantics(input: AgentFlowValidationInput): FlowNodeIssue[] {
    const issues: FlowNodeIssue[] = []
    const { nodes, edges } = input

    // --------------------------------------------------
    // 1. Exactly one startAgentflow node
    // --------------------------------------------------
    const startNodes = nodes.filter((n) => (n.data as Record<string, unknown>)?.name === 'startAgentflow')
    if (startNodes.length === 0) {
        issues.push({
            path: 'nodes',
            code: 'MISSING_REQUIRED_FIELD',
            message: 'AgentFlow must have exactly one startAgentflow node',
            severity: 'error'
        })
    } else if (startNodes.length > 1) {
        issues.push({
            path: 'nodes',
            code: 'MISSING_REQUIRED_FIELD',
            message: 'AgentFlow must have exactly one startAgentflow node',
            severity: 'error'
        })
    }

    // --------------------------------------------------
    // 2. No PLACEHOLDER_ID anywhere in any node
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
    // 3. Handle references in edges must exist
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

    // --------------------------------------------------
    // 4. No orphan execution nodes
    // (nodes with no connections except StickyNote)
    // --------------------------------------------------
    const connectedNodeIds = new Set<string>()
    for (const edge of edges) {
        if (edge.source) connectedNodeIds.add(edge.source as string)
        if (edge.target) connectedNodeIds.add(edge.target as string)
    }

    for (const node of nodes) {
        const data = node.data as Record<string, unknown>
        const name = data?.name as string | undefined
        if (name && name !== 'stickyNoteAgentflow' && !connectedNodeIds.has(node.id as string)) {
            issues.push({
                path: `node[${node.id}]`,
                code: 'MISSING_REQUIRED_FIELD',
                message: `Node "${node.id}" (${name}) has no connections and is not a StickyNote`,
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
 * validateTemplate — validates a raw AgentFlow TEMPLATE node.
 *
 * Unlike validateNode(), this function downgrades PLACEHOLDER_ID to a WARNING
 * (templates are expected to contain PLACEHOLDER_ID). All other schema rules
 * (ReactFlowNode structure, NodeData shape, name in ALLOWLIST, correct category)
 * are enforced as hard errors.
 *
 * For production node validation, use validateNode() from common.ts instead.
 */
export function validateTemplate(request: FlowNodeRequest, template: Record<string, unknown>): FlowNodeResponse {
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

    // Layer 3: AgentFlowNodeSchema — filter PLACEHOLDER_ID errors to warnings
    const afResult = AgentFlowNodeSchema.safeParse(node)
    if (!afResult.success) {
        for (const issue of afResult.error.issues) {
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
