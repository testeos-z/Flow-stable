import { z } from 'zod'

export const ZodPosition = z.object({
    x: z.number(),
    y: z.number()
})

export const ZodHandleBounds = z.object({
    source: z.any().optional(),
    target: z.any().optional()
})

export const ZodReactFlowNode = z.object({
    id: z.string(),
    position: ZodPosition,
    positionAbsolute: ZodPosition,
    type: z.string(),
    data: z.record(z.any()),
    z: z.number(),
    handleBounds: ZodHandleBounds,
    width: z.number(),
    height: z.number(),
    selected: z.boolean(),
    dragging: z.boolean(),
    parentNode: z.string().optional(),
    extent: z.string().optional()
})

export const ZodReactFlowEdgeData = z.record(z.any())

export const ZodReactFlowEdge = z.object({
    id: z.string(),
    source: z.string(),
    sourceHandle: z.string().nullable().optional(),
    target: z.string(),
    targetHandle: z.string().nullable().optional(),
    type: z.string(),
    data: ZodReactFlowEdgeData.optional()
})

export const ZodViewport = z.object({
    x: z.number(),
    y: z.number(),
    zoom: z.number()
})

export const ZodReactFlowObject = z.object({
    nodes: z.array(ZodReactFlowNode),
    edges: z.array(ZodReactFlowEdge),
    viewport: ZodViewport
})

export const ZodChatFlow = z.object({
    name: z.string(),
    flowData: z.string(),
    type: z.enum(['CHATFLOW', 'MULTIAGENT', 'ASSISTANT', 'AGENTFLOW']).default('CHATFLOW'),
    category: z.string().optional(),
    deployed: z.boolean().optional(),
    isPublic: z.boolean().optional()
})

export type ReactFlowNode = z.infer<typeof ZodReactFlowNode>
export type ReactFlowEdge = z.infer<typeof ZodReactFlowEdge>
export type ReactFlowObject = z.infer<typeof ZodReactFlowObject>
export type ChatFlow = z.infer<typeof ZodChatFlow>

export function validateFlowData(flowData: string): {
    valid: boolean
    errors?: string[]
    parsed?: ReactFlowObject
} {
    try {
        const parsed = JSON.parse(flowData)
        const result = ZodReactFlowObject.safeParse(parsed)

        if (result.success) {
            return { valid: true, parsed: result.data }
        }

        const errors = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        return { valid: false, errors }
    } catch (e) {
        return { valid: false, errors: [`Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`] }
    }
}

export function createNodeDefaults() {
    return {
        positionAbsolute: { x: 0, y: 0 },
        z: 0,
        handleBounds: { source: null, target: null },
        width: 320,
        height: 200,
        selected: false,
        dragging: false
    }
}

export function createDefaultViewport() {
    return { x: 0, y: 0, zoom: 1 }
}

export interface FlowNodeInput {
    id: string
    label: string
    name: string
    type: string
    category: string
    inputs: Record<string, any>
    icon?: string
    filePath?: string
    description?: string
    credential?: string
}

export function buildFlowData(
    nodes: FlowNodeInput[],
    edges: Array<{
        source: string
        target: string
        sourceColor?: string
        targetColor?: string
    }>
): ReactFlowObject {
    const viewport = createDefaultViewport()

    const reactNodes = nodes.map((node, index) => ({
        id: node.id,
        position: { x: index * 300, y: 200 },
        positionAbsolute: { x: index * 300, y: 200 },
        type: 'customNode' as const,
        data: {
            label: node.label,
            name: node.name,
            version: 1,
            type: node.type,
            category: node.category,
            description: node.description || '',
            filePath: node.filePath || '',
            icon: node.icon || '',
            inputs: node.inputs,
            ...(node.credential && { credential: node.credential })
        },
        z: 0,
        handleBounds: {},
        width: 320,
        height: 200,
        selected: false,
        dragging: false
    }))

    const reactEdges = edges.map((edge, index) => ({
        id: `e${index + 1}`,
        source: edge.source,
        sourceHandle: null,
        target: edge.target,
        targetHandle: null,
        type: 'buttonedge',
        data: {
            isHumanInput: false,
            sourceColor: edge.sourceColor || '#10b981',
            targetColor: edge.targetColor || '#6366f1'
        }
    }))

    return { nodes: reactNodes, edges: reactEdges, viewport }
}
