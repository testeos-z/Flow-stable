/**
 * Unit tests for handlers.ts - mergeFlowData and guardrail functions
 */

import { describe, it, expect } from 'vitest'
import { mergeFlowData, shouldBlockDestructiveUpdate, type FlowData } from '../handlers.js'

describe('mergeFlowData', () => {
    describe('patch mode', () => {
        it('preserves existing nodes not in incoming', () => {
            const existing: FlowData = {
                nodes: [
                    { id: 'node1', data: { label: 'Node 1' } },
                    { id: 'node2', data: { label: 'Node 2' } },
                    { id: 'node3', data: { label: 'Node 3' } }
                ],
                edges: [{ id: 'edge1', source: 'node1', target: 'node2' }],
                viewport: { x: 0, y: 0, zoom: 1 }
            }

            const incoming: FlowData = {
                nodes: [{ id: 'node1', data: { label: 'Updated Node 1' } }],
                edges: []
            }

            const result = mergeFlowData(existing, incoming, 'patch')

            expect(result.nodes).toHaveLength(3)
            const nodesArray = result.nodes as Array<{ id: string; data?: { label?: string } }>
            expect(nodesArray.find((n) => n.id === 'node1')?.data?.label).toBe('Updated Node 1')
            expect(nodesArray.find((n) => n.id === 'node2')?.data?.label).toBe('Node 2')
            expect(nodesArray.find((n) => n.id === 'node3')?.data?.label).toBe('Node 3')
        })

        it('updates existing nodes with incoming data', () => {
            const existing: FlowData = {
                nodes: [{ id: 'node1', data: { label: 'Old Label', value: 100 } }],
                edges: [],
                viewport: { x: 0, y: 0, zoom: 1 }
            }

            const incoming: FlowData = {
                nodes: [{ id: 'node1', data: { label: 'New Label' } }],
                edges: []
            }

            const result = mergeFlowData(existing, incoming, 'patch')

            expect(result.nodes).toHaveLength(1)
            // Incoming should update, but existing fields not in incoming should be preserved
            const mergedNode = result.nodes[0] as any
            expect(mergedNode.data.label).toBe('New Label')
        })

        it('preserves edges not in incoming', () => {
            const existing: FlowData = {
                nodes: [{ id: 'node1' }, { id: 'node2' }, { id: 'node3' }],
                edges: [
                    { id: 'edge1', source: 'node1', target: 'node2' },
                    { id: 'edge2', source: 'node2', target: 'node3' }
                ]
            }

            const incoming: FlowData = {
                nodes: [{ id: 'node1' }],
                edges: [{ id: 'edge3', source: 'node1', target: 'node3' }]
            }

            const result = mergeFlowData(existing, incoming, 'patch')

            expect(result.edges).toHaveLength(3)
            expect(result.edges.find((e: any) => e.id === 'edge1')).toBeDefined()
            expect(result.edges.find((e: any) => e.id === 'edge2')).toBeDefined()
            expect(result.edges.find((e: any) => e.id === 'edge3')).toBeDefined()
        })

        it('adds new nodes from incoming', () => {
            const existing: FlowData = {
                nodes: [{ id: 'node1' }],
                edges: []
            }

            const incoming: FlowData = {
                nodes: [{ id: 'node1' }, { id: 'node2' }, { id: 'node3' }],
                edges: []
            }

            const result = mergeFlowData(existing, incoming, 'patch')

            expect(result.nodes).toHaveLength(3)
        })

        it('uses incoming viewport when provided', () => {
            const existing: FlowData = {
                nodes: [],
                edges: [],
                viewport: { x: 10, y: 20, zoom: 0.5 }
            }

            const incoming: FlowData = {
                nodes: [],
                edges: [],
                viewport: { x: 100, y: 200, zoom: 1.5 }
            }

            const result = mergeFlowData(existing, incoming, 'patch')

            expect(result.viewport).toEqual({ x: 100, y: 200, zoom: 1.5 })
        })

        it('falls back to existing viewport when incoming has none', () => {
            const existing: FlowData = {
                nodes: [],
                edges: [],
                viewport: { x: 10, y: 20, zoom: 0.5 }
            }

            const incoming: FlowData = {
                nodes: [],
                edges: []
            }

            const result = mergeFlowData(existing, incoming, 'patch')

            expect(result.viewport).toEqual({ x: 10, y: 20, zoom: 0.5 })
        })
    })

    describe('full-replace mode', () => {
        it('replaces all nodes and edges', () => {
            const existing: FlowData = {
                nodes: [{ id: 'node1' }, { id: 'node2' }, { id: 'node3' }],
                edges: [{ id: 'edge1' }]
            }

            const incoming: FlowData = {
                nodes: [{ id: 'newNode1' }],
                edges: [{ id: 'newEdge1' }]
            }

            const result = mergeFlowData(existing, incoming, 'full-replace')

            expect(result.nodes).toHaveLength(1)
            expect((result.nodes[0] as any).id).toBe('newNode1')
            expect(result.edges).toHaveLength(1)
            expect((result.edges[0] as any).id).toBe('newEdge1')
        })

        it('uses incoming viewport when provided', () => {
            const existing: FlowData = {
                nodes: [],
                edges: [],
                viewport: { x: 10, y: 20, zoom: 0.5 }
            }

            const incoming: FlowData = {
                nodes: [],
                edges: [],
                viewport: { x: 100, y: 200, zoom: 1.5 }
            }

            const result = mergeFlowData(existing, incoming, 'full-replace')

            expect(result.viewport).toEqual({ x: 100, y: 200, zoom: 1.5 })
        })

        it('falls back to existing viewport when incoming has none', () => {
            const existing: FlowData = {
                nodes: [],
                edges: [],
                viewport: { x: 10, y: 20, zoom: 0.5 }
            }

            const incoming: FlowData = {
                nodes: [],
                edges: []
            }

            const result = mergeFlowData(existing, incoming, 'full-replace')

            expect(result.viewport).toEqual({ x: 10, y: 20, zoom: 0.5 })
        })

        it('provides default viewport when neither has one', () => {
            const existing: FlowData = {
                nodes: [],
                edges: []
            }

            const incoming: FlowData = {
                nodes: [],
                edges: []
            }

            const result = mergeFlowData(existing, incoming, 'full-replace')

            expect(result.viewport).toEqual({ x: 0, y: 0, zoom: 1 })
        })
    })
})

describe('shouldBlockDestructiveUpdate', () => {
    it('blocks update when removing more than 30% of nodes', () => {
        const existing: FlowData = {
            nodes: [
                { id: 'n1' },
                { id: 'n2' },
                { id: 'n3' },
                { id: 'n4' },
                { id: 'n5' },
                { id: 'n6' },
                { id: 'n7' },
                { id: 'n8' },
                { id: 'n9' },
                { id: 'n10' }
            ],
            edges: []
        }

        // 3 nodes is 30% of 10, so 2 nodes would be 20% which is below threshold
        const incoming: FlowData = {
            nodes: [{ id: 'n1' }, { id: 'n2' }],
            edges: []
        }

        expect(shouldBlockDestructiveUpdate(existing, incoming)).toBe(true)
    })

    it('allows update when removing 30% or less', () => {
        const existing: FlowData = {
            nodes: [
                { id: 'n1' },
                { id: 'n2' },
                { id: 'n3' },
                { id: 'n4' },
                { id: 'n5' },
                { id: 'n6' },
                { id: 'n7' },
                { id: 'n8' },
                { id: 'n9' },
                { id: 'n10' }
            ],
            edges: []
        }

        // 7 nodes is 70% of 10 - exactly at threshold, should be allowed
        const incoming: FlowData = {
            nodes: [{ id: 'n1' }, { id: 'n2' }, { id: 'n3' }, { id: 'n4' }, { id: 'n5' }, { id: 'n6' }, { id: 'n7' }],
            edges: []
        }

        expect(shouldBlockDestructiveUpdate(existing, incoming)).toBe(false)
    })

    it('allows update with same number of nodes', () => {
        const existing: FlowData = {
            nodes: [{ id: 'n1' }, { id: 'n2' }, { id: 'n3' }],
            edges: []
        }

        const incoming: FlowData = {
            nodes: [{ id: 'n1' }, { id: 'n2' }, { id: 'n3' }, { id: 'n4' }],
            edges: []
        }

        expect(shouldBlockDestructiveUpdate(existing, incoming)).toBe(false)
    })

    it('allows update with more nodes', () => {
        const existing: FlowData = {
            nodes: [{ id: 'n1' }, { id: 'n2' }],
            edges: []
        }

        const incoming: FlowData = {
            nodes: [{ id: 'n1' }, { id: 'n2' }, { id: 'n3' }, { id: 'n4' }, { id: 'n5' }],
            edges: []
        }

        expect(shouldBlockDestructiveUpdate(existing, incoming)).toBe(false)
    })

    it('allows any update when existing is empty', () => {
        const existing: FlowData = {
            nodes: [],
            edges: []
        }

        const incoming: FlowData = {
            nodes: [{ id: 'n1' }],
            edges: []
        }

        expect(shouldBlockDestructiveUpdate(existing, incoming)).toBe(false)
    })

    it('blocks when going from 10 to 6 nodes (40% reduction)', () => {
        const existing: FlowData = {
            nodes: [
                { id: 'n1' },
                { id: 'n2' },
                { id: 'n3' },
                { id: 'n4' },
                { id: 'n5' },
                { id: 'n6' },
                { id: 'n7' },
                { id: 'n8' },
                { id: 'n9' },
                { id: 'n10' }
            ],
            edges: []
        }

        // 6 nodes is 60% of 10 - that's a 40% reduction, should be blocked
        const incoming: FlowData = {
            nodes: [{ id: 'n1' }, { id: 'n2' }, { id: 'n3' }, { id: 'n4' }, { id: 'n5' }, { id: 'n6' }],
            edges: []
        }

        expect(shouldBlockDestructiveUpdate(existing, incoming)).toBe(true)
    })

    it('allows when going from 10 to 7 nodes (30% reduction)', () => {
        const existing: FlowData = {
            nodes: [
                { id: 'n1' },
                { id: 'n2' },
                { id: 'n3' },
                { id: 'n4' },
                { id: 'n5' },
                { id: 'n6' },
                { id: 'n7' },
                { id: 'n8' },
                { id: 'n9' },
                { id: 'n10' }
            ],
            edges: []
        }

        // 7 nodes is 70% of 10 - exactly at threshold
        const incoming: FlowData = {
            nodes: [{ id: 'n1' }, { id: 'n2' }, { id: 'n3' }, { id: 'n4' }, { id: 'n5' }, { id: 'n6' }, { id: 'n7' }],
            edges: []
        }

        expect(shouldBlockDestructiveUpdate(existing, incoming)).toBe(false)
    })
})
