/**
 * generator.test.ts — Tests for the schema generator.
 *
 * T1.5: Tests for the generator:
 * - Smoke test: corre generator sin errores
 * - Drift test: detecta drift cuando template cambia
 * - Version test: _version.json se actualiza correctamente
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync, unlinkSync } from 'fs'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

// Use __dirname for stable paths regardless of where vitest is run from
// __tests__ -> schemas -> flow-node (SKILL_DIR)
const __dirname = resolve(fileURLToPath(import.meta.url), '..')
const SKILL_DIR = resolve(__dirname, '..', '..')
const SCRIPTS_DIR = join(SKILL_DIR, 'scripts')
const GENERATED_DIR = join(SKILL_DIR, 'schemas', 'nodes', 'generated')
const VERSION_FILE = join(GENERATED_DIR, '_version.json')

async function runScript(scriptPath: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    try {
        const { stdout, stderr } = await execFileAsync('npx', ['tsx', scriptPath], {
            cwd: SKILL_DIR,
            timeout: 30000
        })
        return { stdout, stderr, exitCode: 0 }
    } catch (err: any) {
        return {
            stdout: err.stdout || '',
            stderr: err.stderr || '',
            exitCode: err.exitCode ?? 1
        }
    }
}

describe('Generator', () => {
    // ========================================================================
    // T1.5.1: Smoke test — corre generator sin errores
    // ========================================================================
    describe('Smoke test', () => {
        it('runs generator without errors', async () => {
            const generatorPath = join(SCRIPTS_DIR, 'generate-node-schemas.ts')
            expect(existsSync(generatorPath), 'Generator script should exist').toBe(true)

            const { stdout, stderr, exitCode } = await runScript('scripts/generate-node-schemas.ts')

            expect(exitCode, `Generator should exit with 0. stderr: ${stderr}`).toBe(0)
            expect(stdout, 'Generator should produce output').toBeDefined()
        })

        it('generates _version.json', async () => {
            const { exitCode } = await runScript('scripts/generate-node-schemas.ts')
            expect(exitCode, 'Generator should run successfully').toBe(0)

            expect(existsSync(VERSION_FILE), '_version.json should be created').toBe(true)

            const versionData = JSON.parse(readFileSync(VERSION_FILE, 'utf-8'))
            expect(versionData.version, '_version.json should have version field').toBeDefined()
            expect(versionData.generatedAt, '_version.json should have generatedAt').toBeDefined()
            expect(versionData.checksums, '_version.json should have checksums map').toBeDefined()
        })

        it('generates at least one category directory', async () => {
            await runScript('scripts/generate-node-schemas.ts')

            const entries = readdirSync(GENERATED_DIR, { withFileTypes: true })
            const categories = entries.filter((e) => e.isDirectory() && e.name !== '.gitkeep')

            expect(categories.length, 'Should generate at least one category').toBeGreaterThan(0)
        })
    })

    // ========================================================================
    // T1.5.2: Drift test — detecta drift cuando template cambia
    // ========================================================================
    describe('Drift detection', () => {
        // Generate baseline first for all drift tests
        beforeAll(async () => {
            mkdirSync(GENERATED_DIR, { recursive: true })
            await runScript('scripts/generate-node-schemas.ts')
        })

        it('exit code 1 when drift is detected', async () => {
            // Corrupt a template to simulate drift
            const templatePath = join(SKILL_DIR, 'templates', 'chatflow', 'chatOpenAI.json')
            const original = readFileSync(templatePath, 'utf-8')
            try {
                const corrupted = original.replace('"default": "gpt-4o-mini"', '"default": "gpt-5"')
                writeFileSync(templatePath, corrupted)

                const { stdout, stderr, exitCode } = await runScript('scripts/check-drift.ts')

                expect(exitCode, 'check-drift should exit with 1 when drift detected').toBe(1)
                expect(stdout + stderr, 'check-drift output should mention drift or checksum mismatch').toMatch(
                    /drift|checksum|mismatch|changed/i
                )
            } finally {
                writeFileSync(templatePath, original)
            }
        })

        it('exit code 0 when no drift', async () => {
            const { stdout, stderr, exitCode } = await runScript('scripts/check-drift.ts')

            expect(exitCode, 'check-drift should exit with 0 when no drift').toBe(0)
        })
    })

    // ========================================================================
    // T1.5.3: Version test — _version.json se actualiza correctamente
    // ========================================================================
    describe('Version file', () => {
        beforeAll(async () => {
            mkdirSync(GENERATED_DIR, { recursive: true })
            await runScript('scripts/generate-node-schemas.ts')
        })

        it('contains SHA256 checksums for each template', async () => {
            const versionData = JSON.parse(readFileSync(VERSION_FILE, 'utf-8'))

            expect(versionData.checksums).toBeDefined()
            expect(typeof versionData.checksums).toBe('object')

            for (const [key, value] of Object.entries(versionData.checksums)) {
                expect(key, 'Checksum key should be a non-empty string').toBeTruthy()
                expect(
                    typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value),
                    `Checksum for ${key} should be a valid SHA256 hex string`
                ).toBe(true)
            }
        })

        it('version field is semver-like', async () => {
            const versionData = JSON.parse(readFileSync(VERSION_FILE, 'utf-8'))

            expect(versionData.version).toMatch(/^\d+\.\d+/)
        })
    })
})
