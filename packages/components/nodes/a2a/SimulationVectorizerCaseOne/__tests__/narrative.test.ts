// ---------------------------------------------------------------------------
// RED tests for narrative.ts (T-07)
// Pure module — no Supabase / langchain imports allowed in narrative.ts.
// ---------------------------------------------------------------------------

import { prepareCaseForVectorization, CaseOneData } from '../narrative'

describe('prepareCaseForVectorization', () => {
    const fullCase: CaseOneData = {
        id: 'sim-001',
        caseName: 'Crisis hídrica en San Pedro',
        descriptionText: 'Una región atravesando escasez de agua.',
        time_existence_error: '6 meses',
        communities: [
            { name: 'Barrio Norte', description: 'Comunidad afectada' },
            { name: 'Barrio Sur', description: 'Comunidad rural' }
        ],
        causes: [{ name: 'Sequía prolongada', description: 'Falta de lluvias por 18 meses' }],
        consequences: [{ name: 'Migración', description: 'Familias se van a la ciudad' }],
        constraints: [{ name: 'Presupuesto limitado', description: 'No hay fondos suficientes' }]
    }

    it('returns string containing all main sections from full CaseOneData', () => {
        const out = prepareCaseForVectorization(fullCase)
        expect(typeof out).toBe('string')
        expect(out).toContain('Crisis hídrica en San Pedro')
        expect(out).toContain('Una región atravesando escasez de agua.')
        expect(out).toContain('6 meses')
        expect(out).toContain('Barrio Norte')
        expect(out).toContain('Barrio Sur')
        expect(out).toContain('Sequía prolongada')
        expect(out).toContain('Migración')
        expect(out).toContain('Presupuesto limitado')
    })

    it('handles null time_existence_error → "Tiempo no especificado"', () => {
        const data: CaseOneData = { ...fullCase, time_existence_error: null }
        const out = prepareCaseForVectorization(data)
        expect(out).toContain('Tiempo no especificado')
    })

    it('handles missing description → "Sin descripción detallada"', () => {
        const data: CaseOneData = { ...fullCase, descriptionText: undefined }
        const out = prepareCaseForVectorization(data)
        expect(out).toContain('Sin descripción detallada')
    })

    it('handles description as object with .name property → extracts name', () => {
        const data: CaseOneData = {
            ...fullCase,
            descriptionText: { name: 'Descripción extraída de objeto' } as any
        }
        const out = prepareCaseForVectorization(data)
        expect(out).toContain('Descripción extraída de objeto')
    })

    it('handles empty consequences array → "Sin consecuencias registradas"', () => {
        const data: CaseOneData = { ...fullCase, consequences: [] }
        const out = prepareCaseForVectorization(data)
        expect(out).toContain('Sin consecuencias registradas')
    })

    it('result has no double-spaces and no newline runs > 1', () => {
        const out = prepareCaseForVectorization(fullCase)
        expect(out).not.toMatch(/ {2,}/)
        expect(out).not.toMatch(/\n{3,}/)
    })

    it('throws if caseData.id is missing', () => {
        const data = { ...fullCase, id: undefined } as any
        expect(() => prepareCaseForVectorization(data)).toThrow()
    })

    it('throws if caseData.id is empty string', () => {
        const data = { ...fullCase, id: '' }
        expect(() => prepareCaseForVectorization(data)).toThrow()
    })
})
