#!/usr/bin/env npx tsx
/**
 * generate-node-schemas.ts
 *
 * T1.2: Genera schemas por categoría leyéndo del node catalogue.
 * - Lee 00-node-catalogue.md (nodos por categoría)
 * - Lee 01-credential-map.md (credenciales requeridas)
 * - Genera schemas en schemas/nodes/generated/{category}/
 * - Produce _version.json con checksums SHA256
 *
 * Usage: npx tsx scripts/generate-node-schemas.ts
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SKILL_DIR = join(__dirname, '..')
// PROJECT_DIR: Flow-stable/.agents/skills/flow-node -> .. -> .. -> Flow-stable
const PROJECT_DIR = join(SKILL_DIR, '..', '..', '..')

// Verify PROJECT_DIR has .agents (git repo check)
if (!existsSync(join(PROJECT_DIR, '.agents'))) {
    console.error(`❌ PROJECT_DIR does not appear to be the git repo root: ${PROJECT_DIR}`)
    process.exit(1)
}
const GENERATED_DIR = join(SKILL_DIR, 'schemas', 'nodes', 'generated')
const TEMPLATES_DIR = join(SKILL_DIR, 'templates')
const CATALOGUE_PATH = join(PROJECT_DIR, '.agents', 'skills', 'flowise-node-reference', 'references', '00-node-catalogue.md')
const CRED_MAP_PATH = join(PROJECT_DIR, '.agents', 'skills', 'flowise-node-reference', 'references', '01-credential-map.md')

// ============================================================================
// Types
// ============================================================================

interface NodeInfo {
    name: string
    provider?: string
    notes: string
}

interface Category {
    name: string
    nodes: NodeInfo[]
}

// ============================================================================
// Helpers
// ============================================================================

function sha256(content: string): string {
    return createHash('sha256').update(content, 'utf8').digest('hex')
}

function computeTemplateChecksums(): Record<string, string> {
    const checksums: Record<string, string> = {}

    // AgentFlow templates
    const agentTemplates = join(TEMPLATES_DIR)
    if (existsSync(agentTemplates)) {
        for (const file of readdirSync(agentTemplates)) {
            if (file.endsWith('.json') && file !== '_version.json') {
                const fullPath = join(agentTemplates, file)
                const content = readFileSync(fullPath, 'utf-8')
                checksums[`agentflow/${file}`] = sha256(content)
            }
        }
    }

    // ChatFlow templates
    const chatflowTemplates = join(TEMPLATES_DIR, 'chatflow')
    if (existsSync(chatflowTemplates)) {
        for (const file of readdirSync(chatflowTemplates)) {
            if (file.endsWith('.json')) {
                const fullPath = join(chatflowTemplates, file)
                const content = readFileSync(fullPath, 'utf-8')
                checksums[`chatflow/${file}`] = sha256(content)
            }
        }
    }

    return checksums
}

// ============================================================================
// Parser: Extract categories from node catalogue markdown
// ============================================================================

function parseCategories(markdown: string): Category[] {
    const categories: Category[] = []

    // Split by ## headers (excluding the title)
    const sections = markdown.split(/(?=^## )/m).filter(Boolean)

    for (const section of sections) {
        const lines = section.trim().split('\n')
        if (lines.length < 2) continue

        const headerLine = lines[0].trim() // e.g., "## Chat Models (36)"
        if (!headerLine.startsWith('## ')) continue

        // Extract category name and count
        const match = headerLine.match(/^##\s+(.+?)\s*\((\d+)\)?/)
        if (!match) continue

        const categoryName = match[1].trim()
        const category: Category = { name: categoryName, nodes: [] }

        // Parse table rows (skip header and separator lines)
        let inTable = false
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i]

            // Detect table start
            if (line.includes('|') && line.includes('---')) {
                inTable = true
                continue
            }

            // End of table
            if (inTable && !line.includes('|')) {
                inTable = false
            }

            if (!inTable || !line.includes('|')) continue

            // Skip header row
            if (line.match(/^\|\s*Nodo\s*\|/)) continue

            // Parse table cells
            const cells = line
                .split('|')
                .map((c) => c.trim())
                .filter(Boolean)
            if (cells.length < 2) continue

            const nodeName = cells[0]
            const provider = cells.length > 1 ? cells[1] : undefined
            const notes = cells.length > 2 ? cells[cells.length - 1] : ''

            // Skip entries that look like headers or separators
            if (!nodeName || nodeName.includes('---') || nodeName.startsWith('**')) continue

            // Clean up node name (remove count suffix like "×2")
            const cleanName = nodeName.replace(/\s*×\d+\s*$/, '').trim()

            category.nodes.push({
                name: cleanName,
                provider,
                notes
            })
        }

        if (category.nodes.length > 0) {
            categories.push(category)
        }
    }

    return categories
}

// ============================================================================
// Parser: Extract credentials from credential map
// ============================================================================

function parseCredentialMap(markdown: string): Map<string, string[]> {
    const credMap = new Map<string, string[]>()

    // Match tables with | credentialName | nodes |
    const tableRegex = /^\|\s*`([^`]+)`\s*\|\s*(.+?)\s*$/gm
    let match

    while ((match = tableRegex.exec(markdown)) !== null) {
        const credName = match[1].trim()
        const nodesRaw = match[2].trim()

        // Extract node names that reference this credential
        const nodeNames: string[] = []
        const nodeMatches = nodesRaw.matchAll(/Chat(\w+)|chat(\w+)|(\w+(?:Vector)?Store)/gi)
        for (const m of nodeMatches) {
            const name = m[1] || m[2] || m[3]
            if (name) nodeNames.push(name)
        }

        if (nodeNames.length > 0) {
            credMap.set(credName, nodeNames)
        }
    }

    return credMap
}

// ============================================================================
// Generator: Create per-node schema files
// ============================================================================

function toSchemaName(nodeName: string): string {
    return nodeName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '')
}

function toFileName(nodeName: string): string {
    return nodeName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
}

function generateNodeSchema(node: NodeInfo, category: string): string {
    const schemaName = toSchemaName(node.name)
    const safeName = node.name.replace(/[^a-zA-Z0-9]/g, '')

    // Build credential reference if we have provider info
    const credImport = node.provider ? `\nimport { validateCredential, validateCredentialProvider } from '../../../credentials.js'` : ''
    const credArg = node.provider ? `, '${node.provider}'` : ''
    const credCheck = node.provider
        ? `\n  if (data.credential) {\n    issues.push(...validateCredential(data.credential))\n    issues.push(...validateCredentialProvider('${safeName}', '${node.provider}'))\n  }`
        : ''

    return `/**
 * ${toFileName(node.name)}.ts — Schema for ${node.name}
 *
 * Auto-generated from node catalogue.
 * Category: ${category}
 * Provider: ${node.provider || 'N/A'}
 * Notes: ${node.notes}
 */
import z from 'zod'
import { ErrorCodes } from '../../../issues.js'
import type { FlowNodeIssue } from '../../../issues.js'${credImport}

export const ${schemaName}Schema = z.object({
  credential: z.string().uuid().optional(),
})

export function validate${schemaName}(node: unknown): FlowNodeIssue[] {
  const result = ${schemaName}Schema.safeParse(node)
  if (!result.success) {
    return result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      code: ErrorCodes.INVALID_FIELD,
      message: issue.message,
      severity: 'error' as const,
    }))
  }

  const data = result.data as unknown as Record<string, unknown>
  const issues: FlowNodeIssue[] = []${credCheck}
  return issues
}
`
}

// ============================================================================
// Main
// ============================================================================

function main() {
    console.log('🎯 Flow-Node Schema Generator')
    console.log('==============================')

    // Ensure output directory
    mkdirSync(GENERATED_DIR, { recursive: true })
    mkdirSync(join(GENERATED_DIR, '.gitkeep'), { recursive: true })

    // Read source files
    if (!existsSync(CATALOGUE_PATH)) {
        console.error(`❌ Catalogue not found: ${CATALOGUE_PATH}`)
        process.exit(1)
    }
    if (!existsSync(CRED_MAP_PATH)) {
        console.error(`❌ Credential map not found: ${CRED_MAP_PATH}`)
        process.exit(1)
    }

    const catalogueMd = readFileSync(CATALOGUE_PATH, 'utf-8')
    const credMapMd = readFileSync(CRED_MAP_PATH, 'utf-8')

    // Parse
    const categories = parseCategories(catalogueMd)
    const credMap = parseCredentialMap(credMapMd)

    console.log(`\n📊 Found ${categories.length} categories`)

    // Generate per-category schemas
    let totalNodes = 0
    const allChecksums = { ...computeTemplateChecksums() }

    for (const category of categories) {
        const catDir = join(GENERATED_DIR, toFileName(category.name))
        mkdirSync(catDir, { recursive: true })

        // Generate index.ts for category
        const indexLines: string[] = [`/**`, ` * ${category.name} — Auto-generated index`, ` * ${category.nodes.length} nodes`, ` */`, '']

        for (const node of category.nodes) {
            const schemaCode = generateNodeSchema(node, category.name)
            const fileName = `${toFileName(node.name)}.ts`
            const filePath = join(catDir, fileName)

            writeFileSync(filePath, schemaCode)

            const schemaName = toSchemaName(node.name)
            indexLines.push(`export { ${schemaName}Schema, validate${schemaName} } from './${toFileName(node.name)}.js'`)

            totalNodes++
        }

        writeFileSync(join(catDir, 'index.ts'), indexLines.join('\n'))

        console.log(`  ✅ ${category.name}: ${category.nodes.length} nodes`)
    }

    // Generate _version.json
    const versionData = {
        version: '1.0',
        generatedAt: new Date().toISOString(),
        description: 'Version manifest for generated node schemas. Checksums enable staleness detection.',
        categories: categories.map((c) => ({
            name: c.name,
            nodeCount: c.nodes.length
        })),
        checksums: allChecksums
    }

    writeFileSync(join(GENERATED_DIR, '_version.json'), JSON.stringify(versionData, null, 2))

    // Generate root index
    const rootIndex = [
        `/**`,
        ` * generated — Auto-generated node schemas`,
        ` * ${totalNodes} nodes across ${categories.length} categories`,
        ` */`,
        '',
        ...categories.map((c) => `export * from './${toFileName(c.name)}/index.js'`)
    ]
    writeFileSync(join(GENERATED_DIR, 'index.ts'), rootIndex.join('\n'))

    console.log(`\n✅ Generated ${totalNodes} node schemas across ${categories.length} categories`)
    console.log(`📁 Output: ${GENERATED_DIR}`)
    console.log(`📋 Version: ${versionData.version}`)
    console.log(`🔢 Checksums: ${Object.keys(allChecksums).length} files tracked`)
}

main()
