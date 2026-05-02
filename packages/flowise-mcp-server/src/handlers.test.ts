import { describe, it, expect, vi } from 'vitest'
import {
    successResponse,
    errorResponse,
    handleCreatePrediction,
    handleCreatePredictionWithHistory,
    handleCreatePredictionWithFiles,
    handleCreatePredictionWithLead,
    handleListChatflows,
    handleGetChatflow,
    handleCreateChatflow,
    handleUpdateChatflow,
    handleDeleteChatflow,
    handleListNodes,
    handleGetNodesByCategory,
    handleGetNode,
    type FlowiseSdkClient
} from './handlers.js'
import type { FlowiseApiClient } from './flowise-api.js'

// Helper to create mock SDK client
function createMockSdkClient(createPredictionFn: FlowiseSdkClient['createPrediction'] = vi.fn()): FlowiseSdkClient {
    return { createPrediction: createPredictionFn }
}

// Helper to create mock API client
function createMockApiClient(requestFn: FlowiseApiClient['request'] = vi.fn()): FlowiseApiClient {
    return { request: requestFn }
}

describe('handlers', () => {
    describe('successResponse', () => {
        it('should format data as JSON text response', () => {
            const data = { id: '123', name: 'Test' }
            const result = successResponse(data)

            expect(result).toEqual({
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(data, null, 2)
                    }
                ]
            })
        })

        it('should handle arrays', () => {
            const data = [{ id: '1' }, { id: '2' }]
            const result = successResponse(data)

            expect(result.content[0].text).toBe(JSON.stringify(data, null, 2))
        })
    })

    describe('errorResponse', () => {
        it('should format error message with isError flag', () => {
            const message = 'Something went wrong'
            const result = errorResponse(message)

            expect(result).toEqual({
                content: [{ type: 'text', text: message }],
                isError: true
            })
        })
    })

    describe('handleCreatePrediction', () => {
        it('should return success response on successful prediction', async () => {
            const mockResponse = { text: 'Hello, world!' }
            const mockClient = createMockSdkClient(vi.fn().mockResolvedValue(mockResponse))

            const result = await handleCreatePrediction(mockClient, {
                chatflowId: 'flow-123',
                question: 'Hi there'
            })

            expect(mockClient.createPrediction).toHaveBeenCalledWith({
                chatflowId: 'flow-123',
                question: 'Hi there',
                streaming: false
            })
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('Hello, world!')
        })

        it('should pass optional parameters', async () => {
            const mockClient = createMockSdkClient(vi.fn().mockResolvedValue({}))

            await handleCreatePrediction(mockClient, {
                chatflowId: 'flow-123',
                question: 'Hi',
                chatId: 'chat-456',
                overrideConfig: { temperature: 0.5 }
            })

            expect(mockClient.createPrediction).toHaveBeenCalledWith({
                chatflowId: 'flow-123',
                question: 'Hi',
                chatId: 'chat-456',
                overrideConfig: { temperature: 0.5 },
                streaming: false
            })
        })

        it('should return error response on failure', async () => {
            const mockClient = createMockSdkClient(vi.fn().mockRejectedValue(new Error('Connection failed')))

            const result = await handleCreatePrediction(mockClient, {
                chatflowId: 'flow-123',
                question: 'Hi'
            })

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Connection failed')
        })
    })

    describe('handleCreatePredictionWithHistory', () => {
        it('should include history in the request', async () => {
            const mockClient = createMockSdkClient(vi.fn().mockResolvedValue({}))
            const history = [
                { message: 'Hello', type: 'userMessage' as const },
                { message: 'Hi there!', type: 'apiMessage' as const }
            ]

            await handleCreatePredictionWithHistory(mockClient, {
                chatflowId: 'flow-123',
                question: 'How are you?',
                history
            })

            expect(mockClient.createPrediction).toHaveBeenCalledWith({
                chatflowId: 'flow-123',
                question: 'How are you?',
                history,
                streaming: false
            })
        })
    })

    describe('handleCreatePredictionWithFiles', () => {
        it('should include uploads in the request', async () => {
            const mockClient = createMockSdkClient(vi.fn().mockResolvedValue({}))
            const uploads = [{ type: 'file', name: 'doc.pdf', mime: 'application/pdf', data: 'base64...' }]

            await handleCreatePredictionWithFiles(mockClient, {
                chatflowId: 'flow-123',
                question: 'Analyze this document',
                uploads
            })

            expect(mockClient.createPrediction).toHaveBeenCalledWith({
                chatflowId: 'flow-123',
                question: 'Analyze this document',
                uploads,
                streaming: false
            })
        })
    })

    describe('handleCreatePredictionWithLead', () => {
        it('should include leadEmail in the request', async () => {
            const mockClient = createMockSdkClient(vi.fn().mockResolvedValue({}))

            await handleCreatePredictionWithLead(mockClient, {
                chatflowId: 'flow-123',
                question: 'I want to learn more',
                leadEmail: 'user@example.com'
            })

            expect(mockClient.createPrediction).toHaveBeenCalledWith({
                chatflowId: 'flow-123',
                question: 'I want to learn more',
                leadEmail: 'user@example.com',
                streaming: false
            })
        })
    })

    describe('handleListChatflows', () => {
        it('should return list of chatflows', async () => {
            const mockChatflows = [
                { id: '1', name: 'Flow 1' },
                { id: '2', name: 'Flow 2' }
            ]
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockChatflows))

            const result = await handleListChatflows(mockApi)

            expect(mockApi.request).toHaveBeenCalledWith('GET', '/chatflows')
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('Flow 1')
            expect(result.content[0].text).toContain('Flow 2')
        })

        it('should return error on failure', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Network error')))

            const result = await handleListChatflows(mockApi)

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error listing chatflows')
        })
    })

    describe('handleGetChatflow', () => {
        it('should return chatflow by ID', async () => {
            const mockChatflow = { id: '123', name: 'My Flow', flowData: '{}' }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockChatflow))

            const result = await handleGetChatflow(mockApi, '123')

            expect(mockApi.request).toHaveBeenCalledWith('GET', '/chatflows/123')
            expect(result.content[0].text).toContain('My Flow')
        })

        it('should return error when chatflow not found', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Not found')))

            const result = await handleGetChatflow(mockApi, '999')

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error getting chatflow')
        })
    })

    describe('handleCreateChatflow', () => {
        it('should create chatflow with default type', async () => {
            const mockResponse = { id: 'new-123', name: 'New Flow' }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockResponse))

            const result = await handleCreateChatflow(mockApi, {
                name: 'New Flow',
                flowData: { nodes: [], edges: [] }
            })

            // fixFlowData injects viewport and ensures valid structure
            const callArgs = vi.mocked(mockApi.request).mock.calls[0]
            const body = callArgs[2] as { name: string; flowData: string; type: string }
            expect(callArgs[0]).toBe('POST')
            expect(callArgs[1]).toBe('/chatflows')
            const flowData = JSON.parse(body.flowData)
            expect(flowData.nodes).toEqual([])
            expect(flowData.edges).toEqual([])
            expect(flowData.viewport).toEqual({ x: 0, y: 0, zoom: 1 })
            expect(body.name).toBe('New Flow')
            expect(body.type).toBe('CHATFLOW')
            expect(result.content[0].text).toContain('new-123')
        })

        it('should create agentflow with chatbotConfig', async () => {
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue({}))

            await handleCreateChatflow(mockApi, {
                name: 'Agent Flow',
                flowData: { nodes: [{ id: '1' }], edges: [] },
                type: 'AGENTFLOW',
                chatbotConfig: { theme: 'dark' }
            })

            // fixFlowData injects viewport and node defaults
            const callArgs = vi.mocked(mockApi.request).mock.calls[0]
            const body = callArgs[2] as { name: string; flowData: string; type: string; chatbotConfig: string }
            expect(callArgs[0]).toBe('POST')
            expect(callArgs[1]).toBe('/chatflows')
            const flowData = JSON.parse(body.flowData)
            expect(flowData.nodes).toHaveLength(1)
            expect(flowData.nodes[0].id).toBe('1')
            expect(flowData.viewport).toEqual({ x: 0, y: 0, zoom: 1 })
            expect(body.name).toBe('Agent Flow')
            expect(body.type).toBe('AGENTFLOW')
            expect(body.chatbotConfig).toBe(JSON.stringify({ theme: 'dark' }))
        })
    })

    describe('handleUpdateChatflow', () => {
        it('should update chatflow name only', async () => {
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue({}))

            await handleUpdateChatflow(mockApi, {
                chatflowId: '123',
                name: 'Updated Name'
            })

            expect(mockApi.request).toHaveBeenCalledWith('PUT', '/chatflows/123', {
                name: 'Updated Name'
            })
        })

        it('should update flowData', async () => {
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue({}))
            const newFlowData = { nodes: [{ id: 'new' }], edges: [] }

            await handleUpdateChatflow(mockApi, {
                chatflowId: '123',
                flowData: newFlowData
            })

            // fixFlowData injects viewport and node defaults
            const callArgs = vi.mocked(mockApi.request).mock.calls[0]
            const body = callArgs[2] as { flowData: string }
            expect(callArgs[0]).toBe('PUT')
            expect(callArgs[1]).toBe('/chatflows/123')
            const flowData = JSON.parse(body.flowData)
            expect(flowData.nodes).toHaveLength(1)
            expect(flowData.nodes[0].id).toBe('new')
            expect(flowData.viewport).toEqual({ x: 0, y: 0, zoom: 1 })
        })

        it('should update multiple fields', async () => {
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue({}))

            await handleUpdateChatflow(mockApi, {
                chatflowId: '123',
                name: 'New Name',
                chatbotConfig: { key: 'value' }
            })

            expect(mockApi.request).toHaveBeenCalledWith('PUT', '/chatflows/123', {
                name: 'New Name',
                chatbotConfig: JSON.stringify({ key: 'value' })
            })
        })
    })

    describe('handleDeleteChatflow', () => {
        it('should delete chatflow and return success', async () => {
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue({}))

            const result = await handleDeleteChatflow(mockApi, '123')

            expect(mockApi.request).toHaveBeenCalledWith('DELETE', '/chatflows/123')
            expect(result.content[0].text).toContain('"success": true')
            expect(result.content[0].text).toContain('"deleted": "123"')
        })

        it('should return error on failure', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Permission denied')))

            const result = await handleDeleteChatflow(mockApi, '123')

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error deleting chatflow')
        })
    })

    describe('handleListNodes', () => {
        it('should return list of nodes', async () => {
            const mockNodes = [
                { name: 'chatOpenAI', category: 'Chat Models' },
                { name: 'llmChain', category: 'Chains' }
            ]
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockNodes))

            const result = await handleListNodes(mockApi)

            expect(mockApi.request).toHaveBeenCalledWith('GET', '/nodes')
            expect(result.content[0].text).toContain('chatOpenAI')
        })
    })

    describe('handleGetNodesByCategory', () => {
        it('should return nodes filtered by category', async () => {
            const mockNodes = [{ name: 'chatOpenAI' }, { name: 'chatAnthropic' }]
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockNodes))

            const result = await handleGetNodesByCategory(mockApi, 'Chat Models')

            expect(mockApi.request).toHaveBeenCalledWith('GET', '/nodes/category/Chat%20Models')
            expect(result.content[0].text).toContain('chatOpenAI')
        })

        it('should URL encode category name', async () => {
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue([]))

            await handleGetNodesByCategory(mockApi, 'Tools & Utilities')

            expect(mockApi.request).toHaveBeenCalledWith('GET', '/nodes/category/Tools%20%26%20Utilities')
        })
    })

    describe('handleGetNode', () => {
        it('should return node specification', async () => {
            const mockNode = {
                name: 'chatOpenAI',
                version: 5,
                baseClasses: ['BaseChatModel'],
                inputs: []
            }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockNode))

            const result = await handleGetNode(mockApi, 'chatOpenAI')

            expect(mockApi.request).toHaveBeenCalledWith('GET', '/nodes/chatOpenAI')
            expect(result.content[0].text).toContain('chatOpenAI')
            expect(result.content[0].text).toContain('BaseChatModel')
        })

        it('should URL encode node name', async () => {
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue({}))

            await handleGetNode(mockApi, 'custom/node')

            expect(mockApi.request).toHaveBeenCalledWith('GET', '/nodes/custom%2Fnode')
        })

        it('should return error when node not found', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Node not found')))

            const result = await handleGetNode(mockApi, 'unknownNode')

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error getting node')
        })
    })
})
