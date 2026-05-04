/**
 * chatflow-templates.test.ts — Validates ChatFlow templates
 * through validateChatFlowTemplate() and ChatFlowNodeSchema.
 *
 * Slice 4 PR1: 4 simple ChatFlow templates + validateChatFlowTemplate()
 * Slice 4 PR2: 3 chat model templates + _version.json entries
 * Slice 4 PR3: toolAgent template + final integrity tests + re-exports
 */

import { describe, it, expect } from 'vitest'
import { validateChatFlowTemplate, ChatFlowNodeSchema } from '../chatflow.js'
import * as indexExports from '../index.js'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const templatesDir = join(__dirname, '../../templates/chatflow')
const templateFiles = readdirSync(templatesDir).filter((f) => f.endsWith('.json') && !f.startsWith('_'))

const expectedCategories: Record<string, string> = {
    chatOpenRouter: 'Chat Models',
    chatOpenAI: 'Chat Models',
    chatAnthropic: 'Chat Models',
    bufferMemory: 'Memory',
    huggingFaceInferenceEmbedding: 'Embeddings',
    supabase: 'Vector Stores',
    retrieverTool: 'Tools',
    toolAgent: 'Agents'
}

describe('ChatFlow Template Integrity', () => {
    templateFiles.forEach((file) => {
        it(`template ${file} passes structural validation`, () => {
            const template = JSON.parse(readFileSync(join(templatesDir, file), 'utf-8'))
            const result = validateChatFlowTemplate(
                {
                    flowType: 'CHATFLOW',
                    nodeType: template.data.name,
                    nodeId: template.id,
                    strict: true
                },
                template
            )

            expect(result.valid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })
    })

    it('all 8 ChatFlow templates are tested', () => {
        expect(templateFiles.length).toBe(8)
    })
})

describe('ChatFlow Template PLACEHOLDER_ID handling', () => {
    it('PLACEHOLDER_ID in template is a warning, not an error', () => {
        const template = JSON.parse(readFileSync(join(__dirname, '../../templates/chatflow/bufferMemory.json'), 'utf-8'))
        const result = validateChatFlowTemplate(
            {
                flowType: 'CHATFLOW',
                nodeType: 'bufferMemory',
                nodeId: 'PLACEHOLDER_ID',
                strict: true
            },
            template
        )

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
        expect(result.warnings.length).toBeGreaterThan(0)
        expect(result.warnings.some((w) => w.message.includes('PLACEHOLDER_ID'))).toBe(true)
    })

    it('template with substituted ID passes clean', () => {
        const template = JSON.parse(readFileSync(join(__dirname, '../../templates/chatflow/bufferMemory.json'), 'utf-8'))
        // Substitute all PLACEHOLDER_ID occurrences
        const jsonStr = JSON.stringify(template).replace(/PLACEHOLDER_ID/g, 'abc123')
        const substituted = JSON.parse(jsonStr)

        const result = validateChatFlowTemplate(
            {
                flowType: 'CHATFLOW',
                nodeType: 'bufferMemory',
                nodeId: 'abc123',
                strict: true
            },
            substituted
        )

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
        // No PLACEHOLDER_ID warnings after substitution
        expect(result.warnings.some((w) => w.message.includes('PLACEHOLDER_ID'))).toBe(false)
    })

    templateFiles.forEach((file) => {
        it(`${file} emits PLACEHOLDER_ID warnings (not errors)`, () => {
            const template = JSON.parse(readFileSync(join(templatesDir, file), 'utf-8'))
            const result = validateChatFlowTemplate(
                {
                    flowType: 'CHATFLOW',
                    nodeType: template.data.name,
                    nodeId: template.id,
                    strict: true
                },
                template
            )

            expect(result.valid).toBe(true)
            expect(result.errors).toHaveLength(0)
            expect(result.warnings.some((w) => w.message.includes('PLACEHOLDER_ID'))).toBe(true)
        })
    })
})

describe('ChatFlowNodeSchema accepts all templates', () => {
    templateFiles.forEach((file) => {
        it(`ChatFlowNodeSchema accepts ${file}`, () => {
            const template = JSON.parse(readFileSync(join(templatesDir, file), 'utf-8'))
            // Substitute PLACEHOLDER_ID so schema-level refine doesn't hard-fail
            const jsonStr = JSON.stringify(template).replace(/PLACEHOLDER_ID/g, 'test-node-id')
            const substituted = JSON.parse(jsonStr)

            const result = ChatFlowNodeSchema.safeParse(substituted)
            expect(result.success).toBe(true)
        })
    })
})

describe('ChatFlow PR2 — Chat Model Templates', () => {
    it('chatOpenRouter passes validateChatFlowTemplate()', () => {
        const template = JSON.parse(readFileSync(join(templatesDir, 'chatOpenRouter.json'), 'utf-8'))
        const result = validateChatFlowTemplate(
            {
                flowType: 'CHATFLOW',
                nodeType: 'chatOpenRouter',
                nodeId: template.id,
                strict: true
            },
            template
        )

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
    })

    it('chatOpenAI passes validateChatFlowTemplate()', () => {
        const template = JSON.parse(readFileSync(join(templatesDir, 'chatOpenAI.json'), 'utf-8'))
        const result = validateChatFlowTemplate(
            {
                flowType: 'CHATFLOW',
                nodeType: 'chatOpenAI',
                nodeId: template.id,
                strict: true
            },
            template
        )

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
    })

    it('chatAnthropic passes validateChatFlowTemplate()', () => {
        const template = JSON.parse(readFileSync(join(templatesDir, 'chatAnthropic.json'), 'utf-8'))
        const result = validateChatFlowTemplate(
            {
                flowType: 'CHATFLOW',
                nodeType: 'chatAnthropic',
                nodeId: template.id,
                strict: true
            },
            template
        )

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
    })

    it('chatOpenRouter credential is optional', () => {
        const template = JSON.parse(readFileSync(join(templatesDir, 'chatOpenRouter.json'), 'utf-8'))
        const credentialParam = template.data.inputParams.find((p: any) => p.name === 'credential')
        expect(credentialParam).toBeDefined()
        expect(credentialParam.optional).toBe(true)
    })

    it('chatOpenAI credential is required', () => {
        const template = JSON.parse(readFileSync(join(templatesDir, 'chatOpenAI.json'), 'utf-8'))
        const credentialParam = template.data.inputParams.find((p: any) => p.name === 'credential')
        expect(credentialParam).toBeDefined()
        expect(credentialParam.optional).toBeUndefined()
    })

    it('chatAnthropic credential is required', () => {
        const template = JSON.parse(readFileSync(join(templatesDir, 'chatAnthropic.json'), 'utf-8'))
        const credentialParam = template.data.inputParams.find((p: any) => p.name === 'credential')
        expect(credentialParam).toBeDefined()
        expect(credentialParam.optional).toBeUndefined()
    })

    it('all 3 chat models have category "Chat Models"', () => {
        const chatOpenRouter = JSON.parse(readFileSync(join(templatesDir, 'chatOpenRouter.json'), 'utf-8'))
        const chatOpenAI = JSON.parse(readFileSync(join(templatesDir, 'chatOpenAI.json'), 'utf-8'))
        const chatAnthropic = JSON.parse(readFileSync(join(templatesDir, 'chatAnthropic.json'), 'utf-8'))

        expect(chatOpenRouter.data.category).toBe('Chat Models')
        expect(chatOpenAI.data.category).toBe('Chat Models')
        expect(chatAnthropic.data.category).toBe('Chat Models')
    })
})

describe('ChatFlow PR3 — ToolAgent + Final Integrity', () => {
    it('toolAgent passes validateChatFlowTemplate()', () => {
        const template = JSON.parse(readFileSync(join(templatesDir, 'toolAgent.json'), 'utf-8'))
        const result = validateChatFlowTemplate(
            {
                flowType: 'CHATFLOW',
                nodeType: 'toolAgent',
                nodeId: template.id,
                strict: true
            },
            template
        )

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
    })

    it('toolAgent has correct category', () => {
        const template = JSON.parse(readFileSync(join(templatesDir, 'toolAgent.json'), 'utf-8'))
        expect(template.data.category).toBe('Agents')
    })

    it('toolAgent has required inputAnchors (model, tools)', () => {
        const template = JSON.parse(readFileSync(join(templatesDir, 'toolAgent.json'), 'utf-8'))
        const modelAnchor = template.data.inputAnchors.find((a: any) => a.name === 'model')
        const toolsAnchor = template.data.inputAnchors.find((a: any) => a.name === 'tools')
        expect(modelAnchor).toBeDefined()
        expect(modelAnchor.type).toBe('BaseChatModel')
        expect(toolsAnchor).toBeDefined()
        expect(toolsAnchor.type).toBe('Tool')
        expect(toolsAnchor.list).toBe(true)
    })

    it('toolAgent inputParams include systemMessage, maxIterations, returnDirect', () => {
        const template = JSON.parse(readFileSync(join(templatesDir, 'toolAgent.json'), 'utf-8'))
        const systemMessage = template.data.inputParams.find((p: any) => p.name === 'systemMessage')
        const maxIterations = template.data.inputParams.find((p: any) => p.name === 'maxIterations')
        const returnDirect = template.data.inputParams.find((p: any) => p.name === 'returnDirect')

        expect(systemMessage).toBeDefined()
        expect(systemMessage.type).toBe('string')
        expect(systemMessage.optional).toBe(true)

        expect(maxIterations).toBeDefined()
        expect(maxIterations.type).toBe('number')
        expect(maxIterations.default).toBe(5)

        expect(returnDirect).toBeDefined()
        expect(returnDirect.type).toBe('boolean')
        expect(returnDirect.default).toBe(false)
    })

    templateFiles.forEach((file) => {
        it(`${file} has correct category`, () => {
            const template = JSON.parse(readFileSync(join(templatesDir, file), 'utf-8'))
            const expected = expectedCategories[template.data.name]
            expect(expected).toBeDefined()
            expect(template.data.category).toBe(expected)
        })
    })

    it('missing required field fails validation (CT-013-S2)', () => {
        const template = JSON.parse(readFileSync(join(templatesDir, 'bufferMemory.json'), 'utf-8'))
        // Remove a required field
        const broken = { ...template }
        broken.data = { ...template.data }
        delete (broken.data as any).label

        const result = validateChatFlowTemplate(
            {
                flowType: 'CHATFLOW',
                nodeType: 'bufferMemory',
                nodeId: template.id,
                strict: true
            },
            broken
        )

        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
    })

    it('validateChatFlowTemplate is re-exported from schemas/index.ts', () => {
        expect(typeof indexExports.validateChatFlowTemplate).toBe('function')
    })
})
