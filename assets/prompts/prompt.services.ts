/**
 * Servicio para manejo de prompts y secciones de Planteamientos IA
 * Implementado con patrón Singleton para garantizar una única instancia
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import * as XLSX from 'xlsx'
import { logger } from '@/utils/logger'

// ============================================================================
// TYPES
// ============================================================================

export type PlanteamientosSection = {
    bodyWithoutPlanteamientos: string
    planteamientosMdSection: string
}

/**
 * Tipo para agentes cargados desde archivos XLSX de agora
 */
export interface AgoraAgentXLSXData {
    Persona: number
    Género: string
    Edad: number
    'Raza/Etnia': string
    Borough: string
    'Nivel educativo': string
    'Orientación política': string
    Religión: string
    'Estatus migratorio': string
    'Identidad LGBTIQ+': string
    Discapacidad: string
    Idioma: string
    'Ocupación/Sector': string
    Ingresos: string
    'Peso %': number
    'Perfil generado': string
}

// ============================================================================
// SERVICE CLASS (SINGLETON)
// ============================================================================

/**
 * Servicio singleton para gestión de prompts y planteamientos IA
 * Proporciona métodos para leer, extraer y normalizar secciones de Markdown
 */
export class PromptService {
    private static instance: PromptService
    private readonly promptsBasePath: string
    private readonly fileTemplate: string

    /**
     * Constructor privado para implementar patrón Singleton
     */
    private constructor() {
        this.promptsBasePath = resolve(__dirname, '')
        this.fileTemplate = '{base}/{filename}'
    }

    /**
     * Obtiene la instancia única del servicio
     * @returns Instancia singleton de PromptService
     */
    public static getInstance(): PromptService {
        if (!PromptService.instance) {
            PromptService.instance = new PromptService()
        }
        return PromptService.instance
    }

    // ========================================================================
    // PRIVATE HELPERS
    // ========================================================================

    /**
     * Lee el archivo global_guidelines.yaml desde el path configurado
     * @returns Contenido del archivo como string, o string vacío si falla
     */
    private readGlobalGuidelines(): string {
        try {
            // Construir path usando el template configurado
            const filePath = this.fileTemplate.replace('{base}', this.promptsBasePath).replace('{filename}', 'global_guidelines.yaml')

            const content = readFileSync(filePath, 'utf-8')

            if (typeof content === 'string' && content.trim()) {
                return content
            }
        } catch (error) {
            // Silenciar errores como en la versión Python
        }
        return ''
    }

    /**
     * Extrae las líneas de bullets de la sección "Planteamientos IA"
     * @param text Texto donde buscar la sección
     * @returns Array de bullets encontrados (sin el "- " inicial)
     */
    private extractPlanteamientosLines(text: string): string[] {
        if (!text) {
            return []
        }

        const lower = text.toLowerCase()
        const start = lower.indexOf('planteamientos ia')

        if (start < 0) {
            return []
        }

        // Tomar desde el título hasta el final o hasta siguiente sección conocida
        let section = text.substring(start)

        const markers = ['lineamientos globales', 'notas sobre mcp']
        for (const marker of markers) {
            const idx = section.toLowerCase().indexOf(marker)
            if (idx > 0) {
                section = section.substring(0, idx)
                break
            }
        }

        // Extraer bullets que inician con "- "
        const bullets: string[] = []
        for (const rawLine of section.split('\n')) {
            const line = rawLine.trim()
            if (line.startsWith('- ')) {
                bullets.push(line.substring(2).trim())
            }
        }

        return bullets
    }

    // ========================================================================
    // PUBLIC API
    // ========================================================================

    /**
     * Genera un bloque Markdown con la sección de Planteamientos IA
     * @returns Bloque markdown formateado con encabezado y bullets
     */
    public getPlanteamientosMdBlock(): string {
        const guidelines = this.readGlobalGuidelines()
        let bullets = this.extractPlanteamientosLines(guidelines)

        if (bullets.length === 0) {
            bullets = [
                '¿Qué ocurrirá cuando se implemente la solución?',
                '¿Es viable en cada uno de los campos del agente?',
                'Consecuencias Positivas/Negativas'
            ]
        }

        const md: string[] = ['\n## Planteamientos IA\n']
        for (const bullet of bullets) {
            md.push(`\n- ${bullet}\n`)
        }

        return md.join('')
    }

    /**
     * Genera las instrucciones completas para incluir Planteamientos IA en reportes
     * Incluye requisitos de extensión y profundidad obligatorios
     * @returns String con las instrucciones formateadas
     */
    public getPlanteamientosInstruction(): string {
        const guidelines = this.readGlobalGuidelines()
        let bullets = this.extractPlanteamientosLines(guidelines)

        if (bullets.length === 0) {
            bullets = [
                '¿Qué ocurrirá cuando se implemente la solución?',
                '¿Es viable en cada uno de los campos del agente?',
                'Consecuencias Positivas/Negativas.'
            ]
        } else {
            // Asegurar punto final en el último bullet para estilo
            const lastIndex = bullets.length - 1
            const lastBullet = bullets[lastIndex]
            if (lastBullet && !lastBullet.endsWith('.')) {
                bullets[lastIndex] = lastBullet + '.'
            }
        }

        const header = "Además, al final incluye un bloque titulado 'Planteamientos IA' que responda de forma concreta:\n"

        const lines: string[] = [header]
        for (const bullet of bullets) {
            lines.push(`- ${bullet}\n`)
        }

        // Directiva global de extensión para TODOS los reportes
        lines.push('\nRequisitos de extensión y profundidad (obligatorios):\n')
        lines.push('- Desarrolla cada sección con múltiples párrafos extensos (8-12 líneas).\n')
        lines.push('- Profundiza con contexto, evidencias, comparativos y análisis de implicaciones.\n')
        lines.push('- Incluye ejemplos, casos comparables y benchmarking cuando sea aplicable.\n')
        lines.push('- Si el espacio se agota, continúa en nuevos párrafos SIN repetir contenido.\n')
        lines.push('Usa viñetas claras y no dejes preguntas en blanco.')

        return lines.join('')
    }

    /**
     * Verifica si un texto contiene la sección de Planteamientos IA
     * @param text Texto a verificar
     * @returns true si contiene la sección o algún bullet de planteamientos
     */
    public hasPlanteamientosBlock(text: string): boolean {
        try {
            const content = text || ''
            const lower = content.toLowerCase()

            if (lower.includes('planteamientos ia')) {
                return true
            }

            const guidelines = this.readGlobalGuidelines()
            const bullets = this.extractPlanteamientosLines(guidelines)

            for (const bullet of bullets) {
                if (bullet && lower.includes(bullet.toLowerCase())) {
                    return true
                }
            }
        } catch (error) {
            return false
        }

        return false
    }

    /**
     * Extrae la sección de Planteamientos IA del texto y la retorna por separado
     * @param text Texto completo del cual extraer la sección
     * @returns Objeto con el cuerpo sin planteamientos y la sección de planteamientos
     */
    public extractPlanteamientosSection(text: string): PlanteamientosSection {
        if (!text) {
            return {
                bodyWithoutPlanteamientos: '',
                planteamientosMdSection: this.getPlanteamientosMdBlock()
            }
        }

        const lower = text.toLowerCase()
        const idx = lower.indexOf('planteamientos ia')

        if (idx < 0) {
            return {
                bodyWithoutPlanteamientos: text,
                planteamientosMdSection: this.getPlanteamientosMdBlock()
            }
        }

        // Cortar en el primer match
        const before = text.substring(0, idx).trimEnd()
        let after = text.substring(idx).trimStart()

        // Reemplazar el texto original "planteamientos ia" con el encabezado markdown correcto
        // si no está ya formateado como encabezado
        if (!after.startsWith('## ')) {
            // Buscar dónde termina la línea del título (puede ser "planteamientos ia", "Planteamientos IA", etc.)
            const firstNewline = after.indexOf('\n')
            if (firstNewline >= 0) {
                // Reemplazar solo la primera línea con el encabezado markdown
                after = '## Planteamientos IA\n' + after.substring(firstNewline + 1)
            } else {
                // Si no hay salto de línea, reemplazar todo con el encabezado
                after = '## Planteamientos IA\n'
            }
        }

        // Normalizar múltiples saltos de línea en la sección
        after = after.replace(/\n{3,}/g, '\n\n')

        return {
            bodyWithoutPlanteamientos: before,
            planteamientosMdSection: after
        }
    }

    /**
     * Aplica normalizaciones simples para mejorar legibilidad de Markdown
     * - Inserta saltos alrededor de '---'
     * - Asegura saltos antes de encabezados '##' y '###'
     * - Colapsa más de 2 saltos consecutivos a 2
     * - Normaliza formato de encabezados
     * @param text Texto markdown a normalizar
     * @returns Texto markdown normalizado
     */
    public normalizeMarkdownStructure(text: string): string {
        if (!text) {
            return ''
        }

        let normalized = text

        // Asegurar separadores
        normalized = normalized.replace(/\s*---\s*/g, '\n\n---\n\n')

        // Encabezados: asegurar salto doble antes (H1..H6)
        normalized = normalized.replace(/\s*(#{1,6}[ \t])/g, '\n\n$1')

        // Forzar espacio tras # si falta (e.g., '#Titulo' -> '# Titulo')
        normalized = normalized.replace(/^(#{1,6})([^#\s])/gm, '$1 $2')

        // Eliminar líneas que sean solo hashes sin texto (encabezados huérfanos)
        normalized = normalized.replace(/^\s*#{1,6}\s*$/gm, '')

        // Limitar saltos múltiples
        normalized = normalized.replace(/\n{3,}/g, '\n\n')

        // Recortar espacios extra en líneas
        const lines = normalized.split('\n').map((line) => line.trimEnd())
        normalized = lines.join('\n').trim()

        return normalized
    }

    // ========================================================================
    // XLSX EXTRACTION
    // ========================================================================

    /**
     * Lee y extrae datos de un archivo XLSX
     * @param xlsxPath Ruta absoluta al archivo XLSX
     * @returns Array de datos extraídos del archivo
     */
    public readXLSXFile<T = AgoraAgentXLSXData>(xlsxPath: string): T[] {
        // Verificar que el archivo existe
        if (!existsSync(xlsxPath)) {
            logger.error(
                {
                    path: xlsxPath,
                    error: 'File not found'
                },
                `[PromptService] El archivo XLSX no existe: ${xlsxPath}`
            )
            return []
        }

        try {
            const workbook = XLSX.readFile(xlsxPath)
            const sheetName = workbook.SheetNames[0]

            if (!sheetName) {
                logger.warn(`[PromptService] No se encontraron hojas en el archivo: ${xlsxPath}`)
                return []
            }

            const worksheet = workbook.Sheets[sheetName]

            if (!worksheet) {
                logger.warn(`[PromptService] No se pudo acceder a la hoja: ${sheetName}`)
                return []
            }

            const data = XLSX.utils.sheet_to_json<T>(worksheet, { defval: '' })

            logger.info(`[PromptService] Leídas ${data.length} filas desde ${xlsxPath} (hoja: ${sheetName})`)

            return data
        } catch (error) {
            // Capturar mejor el error
            const errorMessage = error instanceof Error ? error.message : String(error)
            const errorStack = error instanceof Error ? error.stack : undefined
            const errorCode = error && typeof error === 'object' && 'code' in error ? error.code : undefined

            logger.error(
                {
                    path: xlsxPath,
                    message: errorMessage,
                    stack: errorStack,
                    code: errorCode,
                    error:
                        error instanceof Error
                            ? {
                                  name: error.name,
                                  message: error.message,
                                  stack: error.stack
                              }
                            : error
                },
                `[PromptService] Error leyendo archivo XLSX: ${xlsxPath}`
            )
            return []
        }
    }

    /**
     * Lee datos de agora desde un archivo XLSX
     * @param xlsxPath Ruta absoluta al archivo XLSX de agora
     * @returns Array de datos de agentes de agora
     */
    public readAgoraAgentsXLSX(xlsxPath: string): AgoraAgentXLSXData[] {
        return this.readXLSXFile<AgoraAgentXLSXData>(xlsxPath)
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Instancia única del servicio de prompts (Singleton)
 * Usar esta instancia en lugar de crear nuevas instancias
 */
export const promptService = PromptService.getInstance()
