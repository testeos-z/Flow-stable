/**
 * template-integrity.test.ts — Validates all 15 AgentFlow templates
 * through validateTemplate().
 *
 * Slice 3: AgentFlow Template Validation
 * Verifies that every template in templates/ passes structural validation.
 * PLACEHOLDER_ID is expected (templates are blueprints, not production nodes)
 * and is treated as a warning, not an error.
 */

import { describe, it, expect } from 'vitest'
import { validateTemplate } from '../agentflow.js'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

describe('Template Integrity', () => {
    const templatesDir = join(__dirname, '../../templates')
    const templateFiles = readdirSync(templatesDir).filter((f) => f.endsWith('.json') && !f.startsWith('_'))

    templateFiles.forEach((file) => {
        it(`template ${file} passes structural validation`, () => {
            const template = JSON.parse(readFileSync(join(templatesDir, file), 'utf-8'))
            const result = validateTemplate(
                {
                    flowType: 'AGENTFLOW',
                    nodeType: template.data.name,
                    nodeId: template.id,
                    strict: true
                },
                template
            )

            expect(result.valid).toBe(true)
            expect(result.errors).toHaveLength(0)
            // PLACEHOLDER_ID warnings are expected for templates
        })
    })

    it('stickyNoteAgentflow passes with type stickyNote', () => {
        const template = JSON.parse(readFileSync(join(templatesDir, 'stickyNoteAgentflow.json'), 'utf-8'))
        expect(template.type).toBe('stickyNote')
        const result = validateTemplate(
            {
                flowType: 'AGENTFLOW',
                nodeType: 'stickyNoteAgentflow',
                nodeId: template.id,
                strict: true
            },
            template
        )
        expect(result.valid).toBe(true)
    })

    it('all 15 AgentFlow templates are tested', () => {
        expect(templateFiles.length).toBe(15)
    })
})
