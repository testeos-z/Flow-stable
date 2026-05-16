import { describe, it, expect, vi } from 'vitest'
import { runPrediction, runSmokeTest, runIntegrationTest, testChatflow } from './testing.js'
import type { FlowiseApiClient } from './flowise-api.js'

// Helper to create mock API client
function createMockApiClient(requestFn: FlowiseApiClient['request'] = vi.fn()): FlowiseApiClient {
    return { request: requestFn }
}

describe('testing', () => {
    describe('runPrediction', () => {
        it('should include overrideConfig in POST body when provided', async () => {
            const mockResponse = { text: 'Hello!' }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockResponse))

            const result = await runPrediction(mockApi, 'flow-123', 'How are you?', 30000, {
                temperature: 0.5
            })

            expect(mockApi.request).toHaveBeenCalledWith('POST', '/prediction/flow-123', {
                question: 'How are you?',
                history: [],
                overrideConfig: { temperature: 0.5 }
            })
            expect(result.success).toBe(true)
            expect(result.response).toEqual(mockResponse)
        })

        it('should omit overrideConfig from POST body when not provided', async () => {
            const mockResponse = { text: 'Hello!' }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockResponse))

            const result = await runPrediction(mockApi, 'flow-123', 'How are you?')

            expect(mockApi.request).toHaveBeenCalledWith('POST', '/prediction/flow-123', {
                question: 'How are you?',
                history: []
            })
            expect(result.success).toBe(true)
        })

        it('should return error on backend error even with overrideConfig', async () => {
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue({ error: 'Invalid config' }))

            const result = await runPrediction(mockApi, 'flow-123', 'Hi', 30000, {
                invalidKey: true
            })

            expect(result.success).toBe(false)
            expect(result.error).toBe('Invalid config')
        })
    })

    describe('runSmokeTest', () => {
        it('should forward overrideConfig to runPrediction', async () => {
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue({ text: 'I am working!' }))

            const result = await runSmokeTest(mockApi, 'flow-123', { temperature: 0.5 })

            expect(mockApi.request).toHaveBeenCalledWith('POST', '/prediction/flow-123', {
                question: 'Hello, are you working?',
                history: [],
                overrideConfig: { temperature: 0.5 }
            })
            expect(result.passed).toBe(true)
            expect(result.response).toBe('I am working!')
        })

        it('should work without overrideConfig', async () => {
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue({ text: 'I am working!' }))

            const result = await runSmokeTest(mockApi, 'flow-123')

            expect(mockApi.request).toHaveBeenCalledWith('POST', '/prediction/flow-123', {
                question: 'Hello, are you working?',
                history: []
            })
            expect(result.passed).toBe(true)
        })
    })

    describe('runIntegrationTest', () => {
        it('should skip test when flowHasTools is false even with overrideConfig', async () => {
            const mockApi = createMockApiClient(vi.fn())

            const result = await runIntegrationTest(mockApi, 'flow-123', false, {
                temperature: 0.5
            })

            expect(mockApi.request).not.toHaveBeenCalled()
            expect(result.passed).toBe(true)
            expect(result.toolCalls).toEqual([])
            expect(result.durationMs).toBe(0)
        })

        it('should forward overrideConfig to runPrediction when flowHasTools is true', async () => {
            const mockApi = createMockApiClient(
                vi.fn().mockResolvedValue({
                    text: 'Here is what I found',
                    sourceDocuments: [{ pageContent: 'doc1' }]
                })
            )

            const result = await runIntegrationTest(mockApi, 'flow-123', true, {
                temperature: 0.5
            })

            expect(mockApi.request).toHaveBeenCalledWith('POST', '/prediction/flow-123', {
                question: 'Search for information and tell me what you find.',
                history: [],
                overrideConfig: { temperature: 0.5 }
            })
            expect(result.passed).toBe(true)
            expect(result.toolCalls).toEqual(['retriever'])
        })

        it('should work without overrideConfig when flowHasTools is true', async () => {
            const mockApi = createMockApiClient(
                vi.fn().mockResolvedValue({
                    text: 'Here is what I found',
                    sourceDocuments: []
                })
            )

            const result = await runIntegrationTest(mockApi, 'flow-123', true)

            expect(mockApi.request).toHaveBeenCalledWith('POST', '/prediction/flow-123', {
                question: 'Search for information and tell me what you find.',
                history: []
            })
            expect(result.passed).toBe(true)
            expect(result.toolCalls).toEqual([])
        })
    })

    describe('testChatflow', () => {
        it('should thread overrideConfig through smoke and integration tests', async () => {
            const mockApi = createMockApiClient(
                vi.fn().mockImplementation((method, endpoint) => {
                    if (method === 'GET' && endpoint === '/chatflows/flow-123') {
                        return {
                            flowData: JSON.stringify({
                                nodes: [{ data: { name: 'RetrieverTool', category: 'Tools' } }]
                            })
                        }
                    }
                    if (method === 'POST' && endpoint === '/prediction/flow-123') {
                        return {
                            text: 'Working!',
                            sourceDocuments: [{ pageContent: 'doc1' }]
                        }
                    }
                    return {}
                })
            )

            const result = await testChatflow(mockApi, 'flow-123', { temperature: 0.5 })

            expect(result.flowId).toBe('flow-123')
            expect(result.smokeTest.passed).toBe(true)
            expect(result.integrationTest?.passed).toBe(true)
            expect(result.overall).toBe(true)

            // Verify overrideConfig was passed in both prediction calls
            const postCalls = vi.mocked(mockApi.request).mock.calls.filter((call) => call[0] === 'POST')
            expect(postCalls).toHaveLength(2)
            for (const call of postCalls) {
                const body = call[2] as Record<string, unknown>
                expect(body.overrideConfig).toEqual({ temperature: 0.5 })
            }
        })

        it('should work without overrideConfig', async () => {
            const mockApi = createMockApiClient(
                vi.fn().mockImplementation((method, endpoint) => {
                    if (method === 'GET' && endpoint === '/chatflows/flow-123') {
                        return {
                            flowData: JSON.stringify({
                                nodes: [{ data: { name: 'SimpleNode' } }]
                            })
                        }
                    }
                    if (method === 'POST' && endpoint === '/prediction/flow-123') {
                        return { text: 'Working!' }
                    }
                    return {}
                })
            )

            const result = await testChatflow(mockApi, 'flow-123')

            expect(result.smokeTest.passed).toBe(true)
            expect(result.integrationTest).toBeUndefined()
            expect(result.overall).toBe(true)

            const postCalls = vi.mocked(mockApi.request).mock.calls.filter((call) => call[0] === 'POST')
            expect(postCalls).toHaveLength(1)
            const body = postCalls[0][2] as Record<string, unknown>
            expect(body.overrideConfig).toBeUndefined()
        })
    })
})
