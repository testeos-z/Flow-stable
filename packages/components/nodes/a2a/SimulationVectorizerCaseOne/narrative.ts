// ---------------------------------------------------------------------------
// narrative.ts — Pure formatter for Case One simulation data.
//
// HEXAGONAL RULE: NO imports beyond TS types. NO Supabase, NO langchain.
// This module is a deterministic input→output transformation. Easy to test.
// ---------------------------------------------------------------------------

/**
 * Generic named entry used for communities, causes, consequences, constraints.
 * The form may send extra keys — we only consume `name` and `description`.
 */
export interface NamedEntry {
    name?: string | null
    description?: string | null
    [key: string]: unknown
}

/**
 * Shape of the Case One simulation data as returned by the
 * `form_case_one/get/{id}` edge function.
 *
 * Unknown keys are ignored by the formatter (forward-compatible).
 */
export interface CaseOneData {
    id?: string
    caseName?: string | null
    /**
     * Can be a plain string OR an object with a `.name` property
     * (legacy form variant). The formatter handles both.
     */
    descriptionText?: string | { name?: string | null } | null
    time_existence_error?: string | null
    communities?: NamedEntry[] | null
    causes?: NamedEntry[] | null
    consequences?: NamedEntry[] | null
    constraints?: NamedEntry[] | null
    [key: string]: unknown
}

const safe = (v: unknown): string => {
    if (v === null || v === undefined) return ''
    if (typeof v === 'string') return v.trim()
    if (typeof v === 'object' && v !== null && 'name' in v) {
        const name = (v as { name?: unknown }).name
        return typeof name === 'string' ? name.trim() : ''
    }
    return String(v).trim()
}

const formatEntries = (entries: NamedEntry[] | null | undefined): string => {
    if (!entries || entries.length === 0) return ''
    return entries
        .map((e) => {
            const name = safe(e?.name)
            const desc = safe(e?.description)
            if (name && desc) return `- ${name}: ${desc}`
            if (name) return `- ${name}`
            if (desc) return `- ${desc}`
            return ''
        })
        .filter(Boolean)
        .join('\n')
}

/**
 * Transform Case One form data into a clean narrative string for vectorization.
 *
 * Output is deterministic, contains only semantic content (no IDs, no paths,
 * no technical fields), and is safe to embed.
 *
 * @throws if `data.id` is missing or empty — defensive: the caller MUST
 *         have resolved a simulation id before formatting.
 */
export function prepareCaseForVectorization(data: CaseOneData): string {
    if (!data || typeof data !== 'object') {
        throw new Error('prepareCaseForVectorization: data is required')
    }
    if (!data.id || (typeof data.id === 'string' && data.id.trim() === '')) {
        throw new Error('prepareCaseForVectorization: data.id is required')
    }

    const sections: string[] = []

    const caseName = safe(data.caseName)
    if (caseName) sections.push(`Caso: ${caseName}`)

    const description = safe(data.descriptionText)
    sections.push(`Descripción: ${description || 'Sin descripción detallada'}`)

    const timeExistence = safe(data.time_existence_error)
    sections.push(`Tiempo de existencia: ${timeExistence || 'Tiempo no especificado'}`)

    const communities = formatEntries(data.communities)
    if (communities) sections.push(`Comunidades:\n${communities}`)

    const causes = formatEntries(data.causes)
    if (causes) sections.push(`Causas:\n${causes}`)

    const consequencesText = formatEntries(data.consequences)
    if (consequencesText) {
        sections.push(`Consecuencias:\n${consequencesText}`)
    } else {
        sections.push('Consecuencias: Sin consecuencias registradas')
    }

    const constraints = formatEntries(data.constraints)
    if (constraints) sections.push(`Restricciones:\n${constraints}`)

    // Join with single blank line; then normalize whitespace:
    //   - collapse runs of spaces/tabs (not newlines) to a single space
    //   - collapse runs of 3+ newlines down to exactly 2
    return sections
        .join('\n\n')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}
