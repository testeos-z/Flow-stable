// ---------------------------------------------------------------------------
// language.ts — Detect text language using franc (ESM) + optional LLM fallback.
//
// HEXAGONAL RULE: NO Supabase. NO @langchain/community/document_loaders.
// franc is ESM-only (v6). We use dynamic import() for production.
// Tests can inject a mock franc via francLoader param to avoid ESM issues.
// ---------------------------------------------------------------------------

/**
 * Minimal structural type for any chat model that exposes `.invoke(prompt)`.
 */
export interface LanguageDetectionLLM {
    invoke: (prompt: unknown) => Promise<{ content?: unknown } | unknown>
}

/**
 * ISO 639-3 → 639-1 mapping for languages expected in Case One simulations.
 */
const ISO_639_3_TO_1: Record<string, string> = {
    spa: 'es',
    eng: 'en',
    por: 'pt',
    fra: 'fr',
    deu: 'de',
    ita: 'it'
}

const isValidIso6391 = (code: string): boolean => /^[a-z]{2}$/.test(code)

const extractLlmCode = (raw: unknown): string => {
    if (raw === null || raw === undefined) return ''
    const text =
        typeof raw === 'string'
            ? raw
            : typeof raw === 'object' && raw !== null && 'content' in raw
            ? String((raw as { content?: unknown }).content ?? '')
            : String(raw)
    return text.trim().toLowerCase().slice(0, 2)
}

interface FrancModule {
    franc: (text: string, options?: { minLength?: number }) => string
}

/**
 * Detect the language of `text`.
 *
 * Strategy:
 *   1. If `llm` is provided, ask the LLM for an ISO 639-1 code.
 *   2. Otherwise, run `franc` on the text.
 *   3. Map ISO 639-3 → 639-1 via inline table. Unknown → ''.
 *
 * @param francLoader — injectable for tests; defaults to dynamic import('franc')
 */
export async function detectLanguage(text: string, llm?: LanguageDetectionLLM, francLoader?: () => Promise<FrancModule>): Promise<string> {
    if (llm) {
        try {
            const response = await llm.invoke(
                `Respond with ONLY the ISO 639-1 code (e.g. es, en, pt, fr) for this text. No prose, no quotes.\n\n${text.slice(0, 500)}`
            )
            const code = extractLlmCode(response)
            if (isValidIso6391(code)) return code
        } catch {
            // fall through to franc
        }
    }

    // Resolve franc — use injected loader or dynamic import
    const loader: () => Promise<FrancModule> = francLoader ?? (() => import('franc'))
    const { franc } = await loader()
    const detected = franc(text, { minLength: 10 })
    if (detected === 'und') return ''
    return ISO_639_3_TO_1[detected] ?? ''
}
