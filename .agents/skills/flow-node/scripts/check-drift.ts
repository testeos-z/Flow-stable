#!/usr/bin/env npx tsx
/**
 * check-drift.ts
 *
 * T1.3: Detecta drift entre checksums registrados y templates reales.
 * - Lee _version.json existente
 * - Recalcula checksums de templates reales
 * - Compara y detecta drift
 * - Exit 1 si drift detectado
 *
 * Usage: npx tsx scripts/check-drift.ts
 */

import { readFileSync, existsSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SKILL_DIR = join(__dirname, '..')
// PROJECT_DIR: Flow-stable/.agents/skills/flow-node -> .. -> .. -> Flow-stable
const PROJECT_DIR = join(SKILL_DIR, '..', '..', '..')
const GENERATED_DIR = join(SKILL_DIR, 'schemas', 'nodes', 'generated')
const TEMPLATES_DIR = join(SKILL_DIR, 'templates')
const VERSION_FILE = join(GENERATED_DIR, '_version.json')

// ============================================================================
// Helpers
// ============================================================================

function sha256(content: string): string {
    return createHash('sha256').update(content, 'utf8').digest('hex')
}

function computeTemplateChecksums(): Record<string, string> {
    const checksums: Record<string, string> = {}

    // AgentFlow templates (root templates/)
    if (existsSync(TEMPLATES_DIR)) {
        for (const file of readdirSync(TEMPLATES_DIR)) {
            if (file.endsWith('.json') && file !== '_version.json') {
                const fullPath = join(TEMPLATES_DIR, file)
                const content = readFileSync(fullPath, 'utf-8')
                checksums[`agentflow/${file}`] = sha256(content)
            }
        }
    }

    // ChatFlow templates (templates/chatflow/)
    const chatflowDir = join(TEMPLATES_DIR, 'chatflow')
    if (existsSync(chatflowDir)) {
        for (const file of readdirSync(chatflowDir)) {
            if (file.endsWith('.json')) {
                const fullPath = join(chatflowDir, file)
                const content = readFileSync(fullPath, 'utf-8')
                checksums[`chatflow/${file}`] = sha256(content)
            }
        }
    }

    return checksums
}

// ============================================================================
// Main
// ============================================================================

function main() {
    console.log('🔍 Drift Checker')
    console.log('================')

    // Check if version file exists
    if (!existsSync(VERSION_FILE)) {
        console.log('❌ No _version.json found. Run generate-node-schemas.ts first.')
        process.exit(1)
    }

    // Read stored version
    let storedVersion: {
        version: string
        generatedAt: string
        checksums: Record<string, string>
    }

    try {
        storedVersion = JSON.parse(readFileSync(VERSION_FILE, 'utf-8'))
    } catch {
        console.error('❌ Failed to parse _version.json')
        process.exit(1)
    }

    if (!storedVersion.checksums) {
        console.error('❌ _version.json missing checksums field')
        process.exit(1)
    }

    // Compute current checksums
    const currentChecksums = computeTemplateChecksums()

    console.log(`\n📊 Tracking ${Object.keys(storedVersion.checksums).length} template files`)
    console.log(`📊 Current templates: ${Object.keys(currentChecksums).length} files\n`)

    // Compare
    const drift: Array<{
        file: string
        status: 'added' | 'removed' | 'changed'
        stored?: string
        current?: string
    }> = []

    // Check for added or changed files
    for (const [file, checksum] of Object.entries(currentChecksums)) {
        if (!(file in storedVersion.checksums)) {
            drift.push({ file, status: 'added', current: checksum })
        } else if (storedVersion.checksums[file] !== checksum) {
            drift.push({ file, status: 'changed', stored: storedVersion.checksums[file], current: checksum })
        }
    }

    // Check for removed files
    for (const [file, checksum] of Object.entries(storedVersion.checksums)) {
        if (!(file in currentChecksums)) {
            drift.push({ file, status: 'removed', stored: checksum })
        }
    }

    if (drift.length === 0) {
        console.log('✅ No drift detected — all templates match their checksums')
        process.exit(0)
    }

    // Report drift
    console.log('⚠️  DRIFT DETECTED\n')
    console.log('─'.repeat(60))

    for (const d of drift) {
        if (d.status === 'added') {
            console.log(`➕ ADDED:   ${d.file}`)
            console.log(`           checksum: ${d.current}`)
        } else if (d.status === 'removed') {
            console.log(`➖ REMOVED: ${d.file}`)
            console.log(`           was:      ${d.stored}`)
        } else if (d.status === 'changed') {
            console.log(`🔄 CHANGED: ${d.file}`)
            console.log(`           stored:   ${d.stored?.slice(0, 16)}...`)
            console.log(`           current:  ${d.current?.slice(0, 16)}...`)
        }
    }

    console.log('─'.repeat(60))
    console.log(`\n💥 ${drift.length} file(s) with drift`)
    console.log('\nTo regenerate checksums, run: npx tsx scripts/generate-node-schemas.ts')

    process.exit(1)
}

main()
