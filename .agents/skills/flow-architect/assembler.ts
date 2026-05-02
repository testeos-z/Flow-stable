/**
 * Flow Assembler Module
 *
 * Assembles complete flowData from validated node JSONs.
 * Generates edges, validates graph, injects viewport.
 */

import { IReactFlowObject, IReactFlowNode, IReactFlowEdge } from '../schemas/flow-data'

interface ConnectionSpec {
    source: string // Source node ID
    target: string // Target node ID
    sourceType?: string // Output anchor type
    targetType?: string // Input anchor type
}

interface AssemblyResult {
    valid: boolean
    flowData?: IReactFlowObject
    errors: string[]
    warnings: string[]
}

/**
 * Assembles a complete flowData object from nodes and connection specs
 */
export function assembleFlowData(
    nodes: IReactFlowNode[],
    connections: ConnectionSpec[],
    options: { name?: string; description?: string } = {}
): AssemblyResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate nodes array
    if (!nodes || nodes.length === 0) {
        return { valid: false, errors: ['No nodes provided'], warnings: [] }
    }

    const nodeIds = new Set(nodes.map((n) => n.id))

    // Validate all connection references exist
    for (const conn of connections) {
        if (!nodeIds.has(conn.source)) {
            errors.push(`Connection references non-existent source node: ${conn.source}`)
        }
        if (!nodeIds.has(conn.target)) {
            errors.push(`Connection references non-existent target node: ${conn.target}`)
        }
    }

    // Generate edges from connections
    const edges: IReactFlowEdge[] = connections.map((conn, index) => ({
        id: `e-${conn.source}-${conn.target}-${index}`,
        source: conn.source,
        sourceHandle: conn.source, // Will be refined by anchor matching
        target: conn.target,
        targetHandle: conn.target, // Will be refined by anchor matching
        type: 'buttonedge',
        data: { isHumanInput: false }
    }))

    // Match anchor handles based on node data
    for (const edge of edges) {
        const sourceNode = nodes.find((n) => n.id === edge.source)
        const targetNode = nodes.find((n) => n.id === edge.target)

        if (sourceNode && targetNode) {
            const sourceAnchors = sourceNode.data?.outputAnchors || []
            const targetAnchors = targetNode.data?.inputAnchors || []

            // Find matching anchors by type
            for (const ta of targetAnchors) {
                const matchingSa = sourceAnchors.find((sa: any) => sa.type === ta.type || isCompatibleType(sa.type, ta.type))

                if (matchingSa) {
                    edge.sourceHandle = matchingSa.id
                    edge.targetHandle = ta.id
                    break
                }
            }

            if (edge.sourceHandle === edge.source || edge.targetHandle === edge.target) {
                warnings.push(`Could not find matching anchor types between ${edge.source} and ${edge.target}`)
            }
        }
    }

    // Build final flowData
    const flowData: IReactFlowObject = {
        nodes,
        edges,
        viewport: { x: 0, y: 0, zoom: 1 }
    }

    // Validate graph
    const graphErrors = validateGraph(nodes, edges)
    errors.push(...graphErrors)

    return {
        valid: errors.length === 0,
        flowData: errors.length === 0 ? flowData : undefined,
        errors,
        warnings
    }
}

/**
 * Validates graph connectivity and structure
 */
export function validateGraph(nodes: IReactFlowNode[], edges: IReactFlowEdge[]): string[] {
    const errors: string[] = []
    const nodeIds = new Set(nodes.map((n) => n.id))

    // Check for orphan nodes
    const connectedNodes = new Set<string>()
    for (const edge of edges) {
        connectedNodes.add(edge.source)
        connectedNodes.add(edge.target)
    }

    for (const node of nodes) {
        if (!connectedNodes.has(node.id)) {
            // Some nodes like Chat Model might be the start — check if it's a source
            const hasOutgoing = edges.some((e) => e.source === node.id)
            const hasIncoming = edges.some((e) => e.target === node.id)

            if (!hasOutgoing && !hasIncoming) {
                errors.push(`Orphan node: ${node.id} (${node.data?.label || node.data?.name}) — no connections`)
            }
        }
    }

    // Check for invalid edge references
    for (const edge of edges) {
        if (!nodeIds.has(edge.source)) {
            errors.push(`Invalid edge: source ${edge.source} does not exist`)
        }
        if (!nodeIds.has(edge.target)) {
            errors.push(`Invalid edge: target ${edge.target} does not exist`)
        }
    }

    // Check for cycles (simplified)
    const adjacency = new Map<string, string[]>()
    for (const edge of edges) {
        if (!adjacency.has(edge.source)) {
            adjacency.set(edge.source, [])
        }
        adjacency.get(edge.source)!.push(edge.target)
    }

    const visited = new Set<string>()
    const recStack = new Set<string>()

    function hasCycle(nodeId: string): boolean {
        visited.add(nodeId)
        recStack.add(nodeId)

        const neighbors = adjacency.get(nodeId) || []
        for (const neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                if (hasCycle(neighbor)) return true
            } else if (recStack.has(neighbor)) {
                return true
            }
        }

        recStack.delete(nodeId)
        return false
    }

    for (const nodeId of nodeIds) {
        if (!visited.has(nodeId)) {
            if (hasCycle(nodeId)) {
                errors.push('Graph contains a cycle — flows must be DAGs')
                break
            }
        }
    }

    return errors
}

/**
 * Check if two node types are compatible for connection
 */
function isCompatibleType(sourceType: string, targetType: string): boolean {
    // Direct match
    if (sourceType === targetType) return true

    // Known compatible mappings
    const compatibilityMap: Record<string, string[]> = {
        ChatOpenAI: ['BaseChatModel', 'BaseLanguageModel'],
        Embeddings: ['Embeddings'],
        VectorStore: ['VectorStore', 'BaseRetriever'],
        Tool: ['Tool']
    }

    const compatible = compatibilityMap[sourceType] || []
    return compatible.includes(targetType)
}
