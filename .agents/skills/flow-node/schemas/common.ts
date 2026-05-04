/**
 * common.ts — ReactFlowNodeSchema + NodeDataSchema + autoFixNode() + validateNode()
 *
 * PR1: Infrastructure + Common Schemas
 * Implements T3 from the tasks slice.
 */

import z from 'zod'
import { FlowNodeIssue, ErrorCodes } from './issues.js'

// ============================================================================
// Position
// ============================================================================

export const PositionSchema = z.object({
    x: z.number(),
    y: z.number()
})

// ============================================================================
// ReactFlowNodeSchema
// ============================================================================

/**
 * Phase 1: Auto-fix fixable fields in-place.
 * Returns the mutated node and a list of fixes applied.
 *
 * Does NOT touch PLACEHOLDER_ID — that's a hard failure in validateNode().
 */
export function autoFixNode(node: Record<string, unknown>): {
    node: Record<string, unknown>
    fixes: FlowNodeIssue[]
} {
    const fixes: FlowNodeIssue[] = []

    // position — missing is auto-fixed to { x: 0, y: 0 }
    if (!node.position) {
        node.position = { x: 0, y: 0 }
        fixes.push({
            path: 'position',
            code: ErrorCodes.MISSING_REQUIRED_FIELD,
            message: 'Missing position, defaulting to { x: 0, y: 0 }',
            severity: 'warning'
        })
    }

    // positionAbsolute — missing mirrors position
    if (!node.positionAbsolute) {
        node.positionAbsolute = { ...(node.position as { x: number; y: number }) }
        fixes.push({
            path: 'positionAbsolute',
            code: ErrorCodes.MISSING_REQUIRED_FIELD,
            message: 'Missing positionAbsolute, mirroring position',
            severity: 'warning'
        })
    }

    // width — missing defaults to 320
    if (node.width === undefined) {
        node.width = 320
        fixes.push({
            path: 'width',
            code: ErrorCodes.MISSING_REQUIRED_FIELD,
            message: 'Missing width, defaulting to 320',
            severity: 'warning'
        })
    }

    // height — missing defaults to 200
    if (node.height === undefined) {
        node.height = 200
        fixes.push({
            path: 'height',
            code: ErrorCodes.MISSING_REQUIRED_FIELD,
            message: 'Missing height, defaulting to 200',
            severity: 'warning'
        })
    }

    // selected — missing defaults to false
    if (node.selected === undefined) {
        node.selected = false
        fixes.push({
            path: 'selected',
            code: ErrorCodes.MISSING_REQUIRED_FIELD,
            message: 'Missing selected, defaulting to false',
            severity: 'warning'
        })
    }

    // dragging — missing defaults to false
    if (node.dragging === undefined) {
        node.dragging = false
        fixes.push({
            path: 'dragging',
            code: ErrorCodes.MISSING_REQUIRED_FIELD,
            message: 'Missing dragging, defaulting to false',
            severity: 'warning'
        })
    }

    // z — missing defaults to 0
    if (node.z === undefined) {
        node.z = 0
        fixes.push({
            path: 'z',
            code: ErrorCodes.MISSING_REQUIRED_FIELD,
            message: 'Missing z, defaulting to 0',
            severity: 'warning'
        })
    }

    // handleBounds — missing defaults to empty structure
    if (node.handleBounds === undefined) {
        node.handleBounds = { source: [], target: [] }
        fixes.push({
            path: 'handleBounds',
            code: ErrorCodes.MISSING_REQUIRED_FIELD,
            message: 'Missing handleBounds, defaulting to { source: [], target: [] }',
            severity: 'warning'
        })
    }

    return { node, fixes }
}

/**
 * Phase 2: Strict Zod validation after auto-fix.
 *
 * All fields are required unless marked optional.
 * positionAbsolute is required (canvas breaks without it).
 */
export const ReactFlowNodeSchema = z.object({
    id: z.string().min(1, 'id is required'),
    position: PositionSchema,
    positionAbsolute: PositionSchema,
    type: z.string().min(1, 'type is required'),
    data: z.any(), // validated separately by NodeDataSchema
    width: z.number().gt(0, 'width must be > 0'),
    height: z.number().gt(0, 'height must be > 0'),
    selected: z.boolean(),
    dragging: z.boolean(),
    z: z.number().int().optional().default(0),
    handleBounds: z
        .object({
            source: z.array(z.any()).optional().default([]),
            target: z.array(z.any()).optional().default([])
        })
        .optional(),
    parentNode: z.string().optional(),
    extent: z.string().optional()
})

export type ReactFlowNodeType = z.infer<typeof ReactFlowNodeSchema>

// ============================================================================
// NodeDataSchema
// ============================================================================

/**
 * Strict schema for the `data` field of an IReactFlowNode.
 *
 * inputParams must be an array (can be empty for some nodes).
 * All array fields default to [] so templates don't need to be exhaustive.
 */
export const NodeDataSchema = z
    .object({
        id: z.string().min(1, 'data.id is required'),
        name: z.string().min(1, 'data.name is required'),
        type: z.string().min(1, 'data.type is required'),
        label: z.string().min(1, 'data.label is required'),
        category: z.string().min(1, 'data.category is required'),
        version: z.string().optional(),
        description: z.string().optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
        baseClasses: z.array(z.string()).optional().default([]),
        filePath: z.string().optional(),
        hideInput: z.boolean().optional(),
        loadMethods: z.record(z.string(), z.any()).optional(),

        // inputs: Record<string, unknown> — custom configs may inject extra fields
        inputs: z.record(z.string(), z.any()).default({}),

        // Configuration parameters (used to render UI forms)
        inputParams: z.array(z.any()).default([]),

        // Connection anchors
        inputAnchors: z.array(z.any()).default([]),
        outputAnchors: z.array(z.any()).default([]),
        outputs: z.record(z.string(), z.any()).default({})
    })
    .passthrough()
    .refine((data) => Array.isArray(data.inputParams), {
        message: 'inputParams must be an array',
        path: ['inputParams']
    })

export type NodeDataType = z.infer<typeof NodeDataSchema>

/**
 * validateNode — implementation is in validateNodeImpl.ts to avoid circular imports.
 * common.ts re-exports validateNode so the public API lives in common.ts.
 */
export { validateNode } from './validateNodeImpl.js'
export type { FlowNodeRequest, FlowNodeResponse } from './validateNodeImpl.js'
