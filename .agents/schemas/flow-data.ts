/**
 * FlowData-level Zod schemas
 * Validates the complete IReactFlowObject structure
 */

import { z } from 'zod'
import { PositionSchema, HandleBoundsSchema } from './shared-node-fields'

// ============================================================================
// React Flow Node
// ============================================================================

export const IReactFlowNodeSchema = z.object({
    id: z.string(),
    position: PositionSchema,
    positionAbsolute: PositionSchema,
    type: z.literal('customNode'),
    data: z.any(), // Validated by node-specific specialist schema
    z: z.number().default(0),
    handleBounds: HandleBoundsSchema,
    width: z.number().default(300),
    height: z.number().default(500),
    selected: z.boolean().default(false),
    dragging: z.boolean().default(false)
})

export type IReactFlowNode = z.infer<typeof IReactFlowNodeSchema>

// ============================================================================
// React Flow Edge
// ============================================================================

export const IReactFlowEdgeSchema = z.object({
    id: z.string(),
    source: z.string(),
    sourceHandle: z.string(),
    target: z.string(),
    targetHandle: z.string(),
    type: z.literal('buttonedge'),
    data: z.object({
        isHumanInput: z.boolean().default(false),
        sourceColor: z.string().optional(),
        targetColor: z.string().optional()
    })
})

export type IReactFlowEdge = z.infer<typeof IReactFlowEdgeSchema>

// ============================================================================
// Viewport
// ============================================================================

export const ViewportSchema = z.object({
    x: z.number(),
    y: z.number(),
    zoom: z.number()
})

export type Viewport = z.infer<typeof ViewportSchema>

// ============================================================================
// Complete FlowData
// ============================================================================

export const IReactFlowObjectSchema = z.object({
    nodes: z.array(IReactFlowNodeSchema),
    edges: z.array(IReactFlowEdgeSchema),
    viewport: ViewportSchema
})

export type IReactFlowObject = z.infer<typeof IReactFlowObjectSchema>

// ============================================================================
// Node-specific data wrapper
// ============================================================================

/**
 * Generic node data structure that all node-specific schemas extend
 */
export const NodeDataSchema = z.object({
    id: z.string(),
    label: z.string(),
    name: z.string(), // Node type identifier (e.g., "chatOpenRouter")
    version: z.number().optional(),
    type: z.string(), // Human-readable type (e.g., "ChatOpenRouter")
    baseClasses: z.array(z.string()).optional(),
    category: z.string(),
    description: z.string(),
    filePath: z.string(),
    icon: z.string(),
    credential: z.string().uuid().or(z.literal('')),
    inputs: z.record(z.any()),
    inputParams: z.array(z.any()),
    inputAnchors: z.array(z.any()),
    outputAnchors: z.array(z.any()),
    outputs: z.record(z.any()).optional()
})

export type NodeData = z.infer<typeof NodeDataSchema>
