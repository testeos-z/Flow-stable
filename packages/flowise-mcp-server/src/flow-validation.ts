/**
 * Flow Data Validation Schema and Tools
 *
 * Provides Zod schemas and validation functions for Flowise flowData JSON.
 * Used by MCP tools to ensure flowData is always valid before saving/rendering.
 */

import z from 'zod'

// ===========================================
// Zod Schemas
// ===========================================

export const ZodPosition = z.object({
    x: z.number(),
    y: z.number()
})

export const ZodHandleBounds = z.object({
    source: z.any().optional(),
    target: z.any().optional()
})

export const ZodNodeData = z
    .object({
        label: z.string(),
        name: z.string(),
        type: z.string(),
        inputs: z.record(z.string(), z.any()),
        inputAnchors: z.array(z.any()),
        outputAnchors: z.array(z.any()),
        inputParams: z.array(z.any()),
        baseClasses: z.array(z.string()),
        filePath: z.string(),
        outputs: z.object({}).passthrough()
    })
    .passthrough()

export const ZodReactFlowNode = z.object({
    id: z.string(),
    position: ZodPosition,
    positionAbsolute: ZodPosition.optional(),
    type: z.string(),
    data: ZodNodeData,
    z: z.number().optional(),
    handleBounds: ZodHandleBounds.optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    selected: z.boolean().optional(),
    dragging: z.boolean().optional(),
    parentNode: z.string().optional(),
    extent: z.string().optional()
})

export const ZodReactFlowEdgeData = z.record(z.string(), z.any())

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

export const ZodChatFlowType = z.enum(['CHATFLOW', 'MULTIAGENT', 'ASSISTANT', 'AGENTFLOW'])

// ===========================================
// AgentFlow Schemas
// ===========================================

export const AgentFlowNodeType = z.enum([
    'Start',
    'Agent',
    'LLM',
    'ToolNode',
    'Condition',
    'ConditionAgent',
    'CustomFunction',
    'ExecuteFlow',
    'Loop',
    'End',
    'State',
    'HumanInput',
    'DirectReply'
])

export const ZodAgentFlowNode = ZodReactFlowNode.extend({
    type: z.literal('agentFlow'),
    data: ZodNodeData.extend({
        type: AgentFlowNodeType,
        category: z.literal('Agent Flows')
    })
})

export const ZodAgentFlowObject = z.object({
    nodes: z.array(ZodAgentFlowNode),
    edges: z.array(ZodReactFlowEdge),
    viewport: ZodViewport
})

// ===========================================
// Inferred Types
// ===========================================

export type ReactFlowNode = z.infer<typeof ZodReactFlowNode>
export type ReactFlowEdge = z.infer<typeof ZodReactFlowEdge>
export type ReactFlowObject = z.infer<typeof ZodReactFlowObject>
export type ReactFlowPosition = z.infer<typeof ZodPosition>
export type Viewport = z.infer<typeof ZodViewport>
export type ChatflowType = z.infer<typeof ZodChatFlowType>
export type AgentFlowNode = z.infer<typeof ZodAgentFlowNode>
export type AgentFlowObject = z.infer<typeof ZodAgentFlowObject>

// ===========================================
// Validation Result Types
// ===========================================

export interface ValidationError {
    path: string
    message: string
    severity: 'error' | 'warning'
}

export interface FlowValidationResult {
    valid: boolean
    errors: ValidationError[]
    warnings: ValidationError[]
    fixed?: boolean
    data?: ReactFlowObject
    graph?: GraphValidationResult
}

export interface GraphValidationResult {
    valid: boolean
    orphanNodes: string[]
    disconnectedNodes: string[]
    cycles: string[][]
    unreachableNodes: string[]
}

// ===========================================
// Default Values
// ===========================================

export function createDefaultViewport(): Viewport {
    return { x: 0, y: 0, zoom: 1 }
}

export function createDefaultNode(id: string): Partial<ReactFlowNode> {
    return {
        id,
        position: { x: 0, y: 0 },
        positionAbsolute: { x: 0, y: 0 },
        type: 'customNode',
        data: {} as ReactFlowNode['data'],
        z: 0,
        handleBounds: { source: null, target: null },
        width: 320,
        height: 200,
        selected: false,
        dragging: false
    }
}

// ===========================================
// Core Validation Functions
// ===========================================

/**
 * Validates flowData JSON string against Zod schema
 */
export function validateFlowDataSchema(flowData: string): FlowValidationResult {
    const result: FlowValidationResult = {
        valid: false,
        errors: [],
        warnings: []
    }

    // Try to parse JSON
    let parsed: unknown
    try {
        parsed = JSON.parse(flowData)
    } catch (e) {
        result.errors.push({
            path: 'flowData',
            message: `Invalid JSON: ${e instanceof Error ? e.message : 'Unknown parse error'}`,
            severity: 'error'
        })
        return result
    }

    // Validate against schema
    const schemaResult = ZodReactFlowObject.safeParse(parsed)

    if (!schemaResult.success) {
        for (const issue of schemaResult.error.issues) {
            result.errors.push({
                path: issue.path.join('.'),
                message: issue.message,
                severity: 'error'
            })
        }
        return result
    }

    result.valid = true
    result.data = schemaResult.data
    return result
}

/**
 * Validates AGENTFLOW flowData JSON string against Zod schema
 */
export function validateAgentFlowData(flowData: string): FlowValidationResult {
    const result: FlowValidationResult = {
        valid: false,
        errors: [],
        warnings: []
    }

    let parsed: unknown
    try {
        parsed = JSON.parse(flowData)
    } catch (e) {
        result.errors.push({
            path: 'flowData',
            message: `Invalid JSON: ${e instanceof Error ? e.message : 'Unknown parse error'}`,
            severity: 'error'
        })
        return result
    }

    const schemaResult = ZodAgentFlowObject.safeParse(parsed)
    if (!schemaResult.success) {
        for (const issue of schemaResult.error.issues) {
            result.errors.push({
                path: issue.path.join('.'),
                message: issue.message,
                severity: 'error'
            })
        }
        return result
    }

    result.valid = true
    result.data = schemaResult.data as ReactFlowObject
    return result
}

/**
 * Validates AGENTFLOW-specific semantic rules.
 * Returns an array of validation errors (empty if valid).
 */
export function validateAgentFlowSemantics(nodes: ReactFlowNode[], edges: ReactFlowEdge[]): ValidationError[] {
    const errors: ValidationError[] = []

    // 1. Exactly one Start node
    const starts = nodes.filter((n) => n.data.type === 'Start')
    if (starts.length !== 1) {
        errors.push({
            path: 'nodes',
            message: `AGENTFLOW must have exactly 1 Start node, found ${starts.length}`,
            severity: 'error'
        })
    }

    // 2. At least one valid ending node
    const endingTypes = ['DirectReply', 'ExecuteFlow', 'HumanInput', 'End']
    const hasEnding = nodes.some((n) => endingTypes.includes(n.data.type))
    if (!hasEnding) {
        errors.push({
            path: 'nodes',
            message: 'AGENTFLOW must have at least one ending node (DirectReply, ExecuteFlow, HumanInput, End)',
            severity: 'error'
        })
    }

    // 3. Condition / ConditionAgent must have >= 2 outgoing edges
    const conditions = nodes.filter((n) => n.data.type === 'Condition' || n.data.type === 'ConditionAgent')
    for (const cond of conditions) {
        const outgoing = edges.filter((e) => e.source === cond.id)
        if (outgoing.length < 2) {
            errors.push({
                path: `node.${cond.id}`,
                message: 'Condition must have at least 2 outgoing edges',
                severity: 'error'
            })
        }
    }

    // 4. Loop must point to an earlier node in the array order
    // (We use node array index as a proxy for execution order)
    const nodeIndexMap = new Map(nodes.map((n, i) => [n.id, i]))
    const loops = nodes.filter((n) => n.data.type === 'Loop')
    for (const loop of loops) {
        const outgoing = edges.filter((e) => e.source === loop.id)
        for (const edge of outgoing) {
            const targetIndex = nodeIndexMap.get(edge.target)
            const sourceIndex = nodeIndexMap.get(loop.id)
            if (targetIndex === undefined || sourceIndex === undefined) {
                errors.push({
                    path: `edge.${edge.id}`,
                    message: `Loop points to unknown node "${edge.target}"`,
                    severity: 'error'
                })
            } else if (targetIndex >= sourceIndex) {
                errors.push({
                    path: `edge.${edge.id}`,
                    message: 'Loop must point to an earlier node',
                    severity: 'error'
                })
            }
        }
    }

    // 5. Agent nodes must have agentModelConfig.modelName
    const agents = nodes.filter((n) => n.data.type === 'Agent')
    for (const agent of agents) {
        const config = agent.data.inputs?.agentModelConfig
        if (!config?.modelName) {
            errors.push({
                path: `node.${agent.id}`,
                message: 'Agent must have agentModelConfig with modelName',
                severity: 'error'
            })
        }
    }

    // 6. Condition node edges must use standard sourceHandle naming
    //    Format: {nodeId}-output-conditionAgentflow-condition-{index}
    //    and {nodeId}-output-conditionAgentflow-condition-else
    //    Custom names (e.g., "goEvidence") break canvas rendering
    const conditionNodes = nodes.filter((n) => n.data.type === 'Condition' || n.data.type === 'ConditionAgent')
    for (const cond of conditionNodes) {
        const condEdges = edges.filter((e) => e.source === cond.id)
        const condName = cond.data.name || 'conditionAgentflow'
        const standardPrefix = `${cond.id}-output-${condName}-condition-`

        for (const edge of condEdges) {
            const handle = edge.sourceHandle || ''
            if (!handle) continue // skip edges without sourceHandle

            // Must match: {prefix}{number} or {prefix}else
            const isStandardHandle =
                handle === `${condName}-output-${condName}-condition-0` ||
                handle.startsWith(standardPrefix) ||
                handle === `${condName}-output-${condName}-condition-else` ||
                handle === `${cond.id}-output-${condName}-condition-else` ||
                handle === `${standardPrefix}0` ||
                handle === `${standardPrefix}1` ||
                handle === `${standardPrefix}2` ||
                handle === `${standardPrefix}else`

            if (!isStandardHandle) {
                // Check if it's a custom (non-standard) handle name
                const expectedTrue = `${cond.id}-output-${condName}-condition-0`
                const expectedElse = `${cond.id}-output-${condName}-condition-else`
                errors.push({
                    path: `edge.${edge.id}`,
                    message: `Condition node "${
                        cond.data.label || cond.id
                    }" has non-standard sourceHandle "${handle}". Use "${expectedTrue}" for true branch and "${expectedElse}" for else branch. Custom handles break canvas rendering.`,
                    severity: 'warning'
                })
            }
        }
    }

    // 7. DirectReply nodes must use directReplyMessage (not replyMessage)
    //    Using replyMessage silently fails — the message is never sent
    const directReplies = nodes.filter((n) => n.data.type === 'DirectReply')
    for (const dr of directReplies) {
        const inputs = dr.data.inputs as Record<string, unknown> | undefined
        if (inputs && 'replyMessage' in inputs && !('directReplyMessage' in inputs)) {
            errors.push({
                path: `node.${dr.id}`,
                message: `DirectReply "${
                    dr.data.label || dr.id
                }" uses "replyMessage" which silently fails. Use "directReplyMessage" instead (per node definition inputs[0].name).`,
                severity: 'error'
            })
        }
    }

    return errors
}

/**
 * Validates graph connectivity (node references, cycles, orphans)
 */
export function validateFlowGraph(nodes: ReactFlowNode[], edges: ReactFlowEdge[]): GraphValidationResult {
    const result: GraphValidationResult = {
        valid: true,
        orphanNodes: [],
        disconnectedNodes: [],
        cycles: [],
        unreachableNodes: []
    }

    const nodeIds = new Set(nodes.map((n) => n.id))
    const edgeSources = new Set(edges.map((e) => e.source))
    const edgeTargets = new Set(edges.map((e) => e.target))

    // Check for orphan nodes (no incoming AND no outgoing edges)
    for (const node of nodes) {
        const hasIncoming = edges.some((e) => e.target === node.id)
        const hasOutgoing = edges.some((e) => e.source === node.id)

        if (!hasIncoming && !hasOutgoing && nodes.length > 1) {
            result.orphanNodes.push(node.id)
            result.valid = false
        }
    }

    // Check for invalid edge references
    for (const edge of edges) {
        if (!nodeIds.has(edge.source)) {
            result.disconnectedNodes.push(`Edge ${edge.id}: source "${edge.source}" not found`)
            result.valid = false
        }
        if (!nodeIds.has(edge.target)) {
            result.disconnectedNodes.push(`Edge ${edge.id}: target "${edge.target}" not found`)
            result.valid = false
        }
    }

    // Check for cycles using DFS
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    function detectCycle(nodeId: string, path: string[]): string[] | null {
        if (recursionStack.has(nodeId)) {
            return [...path, nodeId]
        }
        if (visited.has(nodeId)) {
            return null
        }

        visited.add(nodeId)
        recursionStack.add(nodeId)

        const outgoingEdges = edges.filter((e) => e.source === nodeId)
        for (const edge of outgoingEdges) {
            const cycle = detectCycle(edge.target, [...path, nodeId])
            if (cycle) return cycle
        }

        recursionStack.delete(nodeId)
        return null
    }

    for (const node of nodes) {
        visited.clear()
        recursionStack.clear()
        const cycle = detectCycle(node.id, [])
        if (cycle) {
            result.cycles.push(cycle)
            result.valid = false
        }
    }

    // Check for unreachable nodes (not reachable from any source)
    const sources = new Set(edges.map((e) => e.source).filter((s) => !edges.some((ee) => ee.target === s)))
    const reachable = new Set<string>()

    function traverse(nodeId: string) {
        if (reachable.has(nodeId)) return
        reachable.add(nodeId)

        const outgoing = edges.filter((e) => e.source === nodeId)
        for (const edge of outgoing) {
            traverse(edge.target)
        }
    }

    for (const source of sources) {
        traverse(source)
    }

    for (const node of nodes) {
        if (!reachable.has(node.id) && sources.size > 0) {
            result.unreachableNodes.push(node.id)
        }
    }

    return result
}

// ===========================================
// Fix Functions
// ===========================================

/**
 * Fixes common issues in flowData:
 * - Missing viewport
 * - Missing node defaults (positionAbsolute, width, height, etc.)
 * - Invalid JSON strings
 */
export function fixFlowData(flowData: string): FlowValidationResult {
    const result: FlowValidationResult = {
        valid: false,
        errors: [],
        warnings: [],
        fixed: false
    }

    // Parse JSON
    let parsed: unknown
    try {
        parsed = JSON.parse(flowData)
    } catch (e) {
        result.errors.push({
            path: 'flowData',
            message: `Cannot fix: Invalid JSON - ${e instanceof Error ? e.message : 'Unknown error'}`,
            severity: 'error'
        })
        return result
    }

    // Ensure it's an object
    if (typeof parsed !== 'object' || parsed === null) {
        result.errors.push({
            path: 'flowData',
            message: 'Cannot fix: Root must be an object',
            severity: 'error'
        })
        return result
    }

    const data = parsed as Record<string, unknown>

    // Fix: Ensure nodes array
    if (!Array.isArray(data.nodes)) {
        result.errors.push({
            path: 'nodes',
            message: 'Missing or invalid nodes array, creating empty array',
            severity: 'error'
        })
        data.nodes = []
    } else {
        // Fix: node defaults
        let nodeIndex = 0
        for (const node of data.nodes as Record<string, unknown>[]) {
            if (!node.id) {
                ;(node as Record<string, unknown>).id = `node-${nodeIndex}`
            }
            if (!node.position) {
                ;(node as Record<string, unknown>).position = { x: nodeIndex * 300, y: 200 }
            }
            if (!node.positionAbsolute) {
                ;(node as Record<string, unknown>).positionAbsolute = node.position
            }
            if (!node.type) {
                // Only inject customNode if type is completely missing.
                // If node.type already exists (e.g., 'agentFlow'), preserve it.
                ;(node as Record<string, unknown>).type = 'customNode'
            }
            if (!node.data) {
                ;(node as Record<string, unknown>).data = {}
            }

            // Fix: node.data metadata defaults (required for canvas rendering)
            const nd = node.data as Record<string, unknown>
            if (!nd.name) (nd as Record<string, unknown>).name = ''
            if (!nd.type) (nd as Record<string, unknown>).type = ''
            if (!nd.inputs) (nd as Record<string, unknown>).inputs = {}
            if (!nd.inputAnchors) (nd as Record<string, unknown>).inputAnchors = []
            if (!nd.outputAnchors) (nd as Record<string, unknown>).outputAnchors = []
            if (!nd.inputParams) (nd as Record<string, unknown>).inputParams = []
            if (!nd.baseClasses) (nd as Record<string, unknown>).baseClasses = []
            if (!nd.filePath) (nd as Record<string, unknown>).filePath = ''
            if (!nd.outputs) (nd as Record<string, unknown>).outputs = {}
            if (!nd.label && nd.name) (nd as Record<string, unknown>).label = nd.name
            if (!nd.label) (nd as Record<string, unknown>).label = ''
            if (!nd.category) (nd as Record<string, unknown>).category = ''
            if (!nd.description) (nd as Record<string, unknown>).description = ''
            if (!nd.icon) (nd as Record<string, unknown>).icon = ''

            if (node.width === undefined) {
                ;(node as Record<string, unknown>).width = 320
            }
            if (node.height === undefined) {
                ;(node as Record<string, unknown>).height = 200
            }
            if (node.selected === undefined) {
                ;(node as Record<string, unknown>).selected = false
            }
            if (node.dragging === undefined) {
                ;(node as Record<string, unknown>).dragging = false
            }
            if (node.z === undefined) {
                ;(node as Record<string, unknown>).z = 0
            }
            nodeIndex++
        }
    }

    // Fix: Ensure edges array
    if (!Array.isArray(data.edges)) {
        result.warnings.push({
            path: 'edges',
            message: 'Missing or invalid edges array, creating empty array',
            severity: 'warning'
        })
        data.edges = []
    }

    // Fix: Ensure viewport
    if (!data.viewport) {
        result.warnings.push({
            path: 'viewport',
            message: 'Missing viewport, injecting default',
            severity: 'warning'
        })
        data.viewport = createDefaultViewport()
    } else {
        const vp = data.viewport as Record<string, unknown>
        if (vp.x === undefined) (vp as Record<string, unknown>).x = 0
        if (vp.y === undefined) (vp as Record<string, unknown>).y = 0
        if (vp.zoom === undefined) (vp as Record<string, unknown>).zoom = 1
    }

    result.fixed = true
    result.data = data as ReactFlowObject

    // Re-validate the fixed data
    const schemaResult = ZodReactFlowObject.safeParse(data)
    if (!schemaResult.success) {
        for (const issue of schemaResult.error.issues) {
            result.errors.push({
                path: issue.path.join('.'),
                message: `After fix: ${issue.message}`,
                severity: 'error'
            })
        }
        result.valid = false
    } else {
        result.valid = true
    }

    return result
}

// ===========================================
// High-level Validation
// ===========================================

/**
 * Full validation: schema + graph + optional fix
 */
export function fullValidation(
    flowData: string,
    options?: {
        fix?: boolean
        checkGraph?: boolean
    }
): FlowValidationResult {
    const opts = { fix: false, checkGraph: true, ...options }
    const result = opts.fix ? fixFlowData(flowData) : validateFlowDataSchema(flowData)

    if (opts.checkGraph && result.data) {
        const graphResult = validateFlowGraph(result.data.nodes, result.data.edges)
        result.graph = graphResult
        if (!graphResult.valid) {
            result.valid = false
            for (const orphan of graphResult.orphanNodes) {
                result.errors.push({
                    path: `node.${orphan}`,
                    message: 'Orphan node (no connections)',
                    severity: 'error'
                })
            }
            for (const disc of graphResult.disconnectedNodes) {
                result.errors.push({
                    path: 'edges',
                    message: disc,
                    severity: 'error'
                })
            }
            for (const cycle of graphResult.cycles) {
                result.errors.push({
                    path: 'edges',
                    message: `Cycle detected: ${cycle.join(' -> ')}`,
                    severity: 'error'
                })
            }
        }
    }

    return result
}
