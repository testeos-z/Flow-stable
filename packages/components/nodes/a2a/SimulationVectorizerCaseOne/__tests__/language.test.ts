// ---------------------------------------------------------------------------
// RED tests for language.ts (T-10)
//
// franc is ESM-only — we inject a mock franc loader so Jest CJS can test.
// ---------------------------------------------------------------------------

import { detectLanguage } from '../language'

// Minimal mock for BaseChatModel
const makeLlm = (content: string | (() => string | Promise<string>) | Error) => ({
    invoke: jest.fn(async (_prompt: unknown) => {
        if (content instanceof Error) throw content
        const value = typeof content === 'function' ? await (content as any)() : content
        return { content: value }
    })
})

// Mock franc implementation
const mockFranc = jest.fn<string, [string, any?]>()
const mockFrancLoader = () => Promise.resolve({ franc: mockFranc })

beforeEach(() => {
    mockFranc.mockReset()
})

describe('detectLanguage', () => {
    it('detects Spanish via franc on a clearly Spanish text', async () => {
        mockFranc.mockReturnValue('spa')
        const spanish =
            'Hola mundo, este es un texto en español muy largo para que franc tenga material suficiente para detectar el idioma correctamente.'
        const result = await detectLanguage(spanish, undefined, mockFrancLoader)
        expect(result).toBe('es')
        expect(mockFranc).toHaveBeenCalledWith(spanish, { minLength: 10 })
    })

    it('detects English via franc on a clearly English text', async () => {
        mockFranc.mockReturnValue('eng')
        const english = 'Hello world, this is an English text long enough for detection by franc with plenty of vocabulary and structure.'
        const result = await detectLanguage(english, undefined, mockFrancLoader)
        expect(result).toBe('en')
    })

    it('uses LLM result when LLM returns a valid ISO 639-1 code', async () => {
        const llm = makeLlm('es')
        mockFranc.mockReturnValue('eng')
        const result = await detectLanguage('Hello world, this is an English text long enough for detection', llm as any, mockFrancLoader)
        expect(result).toBe('es')
        expect(llm.invoke).toHaveBeenCalledTimes(1)
        expect(mockFranc).not.toHaveBeenCalled()
    })

    it('falls back to franc when LLM returns invalid code', async () => {
        const llm = makeLlm('!@')
        mockFranc.mockReturnValue('spa')
        const result = await detectLanguage('Hola mundo en español', llm as any, mockFrancLoader)
        expect(result).toBe('es')
        expect(mockFranc).toHaveBeenCalledTimes(1)
    })

    it('returns "" when franc says "und" and no LLM is provided', async () => {
        mockFranc.mockReturnValue('und')
        const result = await detectLanguage('xx', undefined, mockFrancLoader)
        expect(result).toBe('')
    })

    it('trims whitespace and newlines around LLM response code', async () => {
        const llm = makeLlm('  \n  es \n  ')
        const result = await detectLanguage('Some text', llm as any, mockFrancLoader)
        expect(result).toBe('es')
    })

    it('falls back to franc when LLM throws an error', async () => {
        const llm = makeLlm(new Error('LLM unreachable'))
        mockFranc.mockReturnValue('spa')
        const spanish = 'Hola mundo en español'
        const result = await detectLanguage(spanish, llm as any, mockFrancLoader)
        expect(result).toBe('es')
        expect(mockFranc).toHaveBeenCalledTimes(1)
    })

    it('maps unknown franc code to empty string', async () => {
        mockFranc.mockReturnValue('jpn')
        const result = await detectLanguage('日本語のテキスト', undefined, mockFrancLoader)
        expect(result).toBe('')
    })
})
