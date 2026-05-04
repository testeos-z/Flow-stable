import { describe, it, expect, vi } from 'vitest'
import {
    handleListAssistants,
    handleGetAssistant,
    handleCreateAssistant,
    handleUpdateAssistant,
    handleDeleteAssistant,
    handleGetAssistantChatModels,
    handleGetAssistantDocStores,
    handleGetAssistantTools,
    handleGenerateAssistantInstruction
} from './assistants.js'
import type { FlowiseApiClient } from '../flowise-api.js'

function createMockApiClient(requestFn: FlowiseApiClient['request'] = vi.fn()): FlowiseApiClient {
    return { request: requestFn }
}

describe('assistants handlers', () => {
    // AST-001: List
    describe('handleListAssistants', () => {
        it('should list all assistants', async () => {
            const mockAssistants = [
                { id: 'ast-1', name: 'Coding Assistant', description: 'Writes code', icon: '/icons/code.svg' },
                { id: 'ast-2', name: 'Writer', description: 'Writes documents', icon: '/icons/doc.svg' }
            ]
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockAssistants))

            const result = await handleListAssistants(mockApi)

            expect(mockApi.request).toHaveBeenCalledWith('GET', '/assistants', undefined)
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('Coding Assistant')
            expect(result.content[0].text).toContain('Writer')
        })

        it('should return error on API failure', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Network error')))

            const result = await handleListAssistants(mockApi)

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error listing assistants')
        })
    })

    // AST-002: Get
    describe('handleGetAssistant', () => {
        it('should return assistant by ID with full config', async () => {
            const mockAssistant = {
                id: 'ast-1',
                name: 'Coding Assistant',
                description: 'Writes code',
                instructions: 'You are a helpful coding assistant...',
                iconSrc: '/icons/code.svg',
                chatModels: ['model-1'],
                docStores: [],
                tools: ['tool-1'],
                temperature: 0.7
            }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockAssistant))

            const result = await handleGetAssistant(mockApi, 'ast-1')

            expect(mockApi.request).toHaveBeenCalledWith('GET', '/assistants/ast-1', undefined)
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('Coding Assistant')
            expect(result.content[0].text).toContain('temperature')
        })

        it('should return error when assistant not found', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Assistant not found')))

            const result = await handleGetAssistant(mockApi, 'nonexistent')

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error getting assistant')
        })
    })

    // AST-003: Create
    describe('handleCreateAssistant', () => {
        it('should create a minimal assistant with name only', async () => {
            const mockResponse = { id: 'ast-new', name: 'My Assistant', description: '', iconSrc: '' }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockResponse))

            const result = await handleCreateAssistant(mockApi, { name: 'My Assistant' })

            expect(mockApi.request).toHaveBeenCalledWith('POST', '/assistants', { name: 'My Assistant' })
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('ast-new')
        })

        it('should create assistant with full configuration', async () => {
            const mockResponse = { id: 'ast-full', name: 'Full Assistant', description: 'Desc', iconSrc: '/icon.svg', temperature: 0.5 }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockResponse))

            const result = await handleCreateAssistant(mockApi, {
                name: 'Full Assistant',
                description: 'Desc',
                iconSrc: '/icon.svg',
                details: { temperature: 0.5 }
            })

            expect(mockApi.request).toHaveBeenCalledWith('POST', '/assistants', {
                name: 'Full Assistant',
                description: 'Desc',
                iconSrc: '/icon.svg',
                details: { temperature: 0.5 }
            })
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('ast-full')
        })

        it('should return error on quota exceeded', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Organization quota exceeded')))

            const result = await handleCreateAssistant(mockApi, { name: 'Another' })

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error creating assistant')
        })
    })

    // AST-004: Update
    describe('handleUpdateAssistant', () => {
        it('should update assistant instructions', async () => {
            const mockResponse = {
                id: 'ast-1',
                name: 'Coding Assistant',
                instructions: 'You are helpful and concise...'
            }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockResponse))

            const result = await handleUpdateAssistant(mockApi, 'ast-1', {
                instructions: 'You are helpful and concise...'
            })

            expect(mockApi.request).toHaveBeenCalledWith('PUT', '/assistants/ast-1', {
                instructions: 'You are helpful and concise...'
            })
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('helpful and concise')
        })

        it('should return error when assistant not found', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Assistant not found')))

            const result = await handleUpdateAssistant(mockApi, 'bad-id', { name: 'New Name' })

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error updating assistant')
        })
    })

    // AST-005: Delete
    describe('handleDeleteAssistant', () => {
        it('should delete an assistant', async () => {
            const mockResponse = { message: 'Assistant deleted' }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockResponse))

            const result = await handleDeleteAssistant(mockApi, 'ast-1')

            expect(mockApi.request).toHaveBeenCalledWith('DELETE', '/assistants/ast-1', undefined)
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('Assistant deleted')
        })

        it('should return error when assistant not found', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('404: Assistant not found')))

            const result = await handleDeleteAssistant(mockApi, 'nonexistent')

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error deleting assistant')
        })
    })

    // AST-006: Get Chat Models
    describe('handleGetAssistantChatModels', () => {
        it('should list available chat models', async () => {
            const mockModels = [
                { provider: 'OpenAI', model: 'gpt-4o', config: { temperature: 0.7 } },
                { provider: 'Anthropic', model: 'claude-sonnet-4-20250514', config: { temperature: 0.5 } }
            ]
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockModels))

            const result = await handleGetAssistantChatModels(mockApi)

            expect(mockApi.request).toHaveBeenCalledWith('GET', '/assistants/components/chatmodels', undefined)
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('gpt-4o')
            expect(result.content[0].text).toContain('claude-sonnet-4-20250514')
        })

        it('should return error on API failure', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Internal server error')))

            const result = await handleGetAssistantChatModels(mockApi)

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error getting assistant chat models')
        })
    })

    // AST-007: Get Document Stores
    describe('handleGetAssistantDocStores', () => {
        it('should list available document stores', async () => {
            const mockStores = [
                { id: 'ds-1', name: 'Knowledge Base', type: 'pinecone', vectorCount: 1500 },
                { id: 'ds-2', name: 'Docs', type: 'supabase', vectorCount: 320 }
            ]
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockStores))

            const result = await handleGetAssistantDocStores(mockApi)

            expect(mockApi.request).toHaveBeenCalledWith('GET', '/assistants/components/docstores', undefined)
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('Knowledge Base')
            expect(result.content[0].text).toContain('pinecone')
        })

        it('should return error on API failure', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Service unavailable')))

            const result = await handleGetAssistantDocStores(mockApi)

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error getting assistant doc stores')
        })
    })

    // AST-008: Get Tools
    describe('handleGetAssistantTools', () => {
        it('should list available tools', async () => {
            const mockTools = [
                { name: 'web-search', type: 'custom', description: 'Search the web' },
                { name: 'code-interpreter', type: 'custom', description: 'Execute Python code' }
            ]
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockTools))

            const result = await handleGetAssistantTools(mockApi)

            expect(mockApi.request).toHaveBeenCalledWith('GET', '/assistants/components/tools', undefined)
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('web-search')
            expect(result.content[0].text).toContain('code-interpreter')
        })

        it('should return error on API failure', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('Gateway timeout')))

            const result = await handleGetAssistantTools(mockApi)

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error getting assistant tools')
        })
    })

    // AST-009: Generate Instruction (AI-powered, long-running)
    describe('handleGenerateAssistantInstruction', () => {
        it('should return AI-generated instruction text', async () => {
            const mockInstruction = {
                instruction:
                    'You are a helpful coding assistant that specializes in TypeScript. ' +
                    'You provide clear explanations and follow best practices. ' +
                    'Always include code examples when relevant.'
            }
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue(mockInstruction))

            const result = await handleGenerateAssistantInstruction(mockApi, {
                prompt: 'A helpful coding assistant'
            })

            expect(mockApi.request).toHaveBeenCalledWith('POST', '/assistants/generate/instruction', {
                prompt: 'A helpful coding assistant'
            })
            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('helpful coding assistant')
            expect(result.content[0].text).toContain('TypeScript')
        })

        it('should pass context when provided', async () => {
            const mockApi = createMockApiClient(vi.fn().mockResolvedValue({ instruction: 'Expanded...' }))

            await handleGenerateAssistantInstruction(mockApi, {
                prompt: 'Customer support bot',
                context: { tone: 'professional', language: 'en' }
            })

            expect(mockApi.request).toHaveBeenCalledWith('POST', '/assistants/generate/instruction', {
                prompt: 'Customer support bot',
                context: { tone: 'professional', language: 'en' }
            })
        })

        it('should handle slow responses gracefully', async () => {
            const mockApi = createMockApiClient(
                vi.fn().mockImplementation(
                    () =>
                        new Promise((resolve) => {
                            setTimeout(() => resolve({ instruction: 'Be helpful and kind...' }), 150)
                        })
                )
            )

            const result = await handleGenerateAssistantInstruction(mockApi, {
                prompt: 'A helpful coding assistant'
            })

            expect(result.isError).toBeUndefined()
            expect(result.content[0].text).toContain('Be helpful and kind')
        })

        it('should return error on generation timeout', async () => {
            const mockApi = createMockApiClient(vi.fn().mockRejectedValue(new Error('LLM generation timed out after 30 seconds')))

            const result = await handleGenerateAssistantInstruction(mockApi, {
                prompt: 'A helpful coding assistant'
            })

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error generating assistant instruction')
        })

        it('should catch errors for invalid params via wrapHandler safety net', async () => {
            // When the handler is called with null API client, passthroughHandler
            // catches the TypeError and wraps it with the error prefix.
            const result = await handleGenerateAssistantInstruction(null as unknown as FlowiseApiClient, { prompt: 'Test' })

            expect(result.isError).toBe(true)
            expect(result.content[0].text).toContain('Error generating assistant instruction')
        })
    })
})
