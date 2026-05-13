// ---------------------------------------------------------------------------
// RED tests for file-parsers.ts (T-16)
// ---------------------------------------------------------------------------

import { parsePlainText, parseMarkdown, parseJson, parsePdf, parseDocx, parseByMime } from '../file-parsers'

const makeBlob = (content: string): { text: () => Promise<string> } => ({
    text: async () => content
})

const makeArrayBlob = (content: string): { arrayBuffer: () => Promise<ArrayBuffer>; text: () => Promise<string> } => ({
    text: async () => content,
    arrayBuffer: async () => {
        const encoder = new TextEncoder()
        return encoder.encode(content).buffer as ArrayBuffer
    }
})

// Mock PDFLoader to return fake documents with page metadata
const mockPdfDocs = [
    { pageContent: 'Page 1 content', metadata: { loc: { pageNumber: 1 } } },
    { pageContent: 'Page 2 content', metadata: { loc: { pageNumber: 2 } } },
    { pageContent: 'Page 3 content', metadata: { loc: { pageNumber: 3 } } }
]

jest.mock('@langchain/community/document_loaders/fs/pdf', () => ({
    PDFLoader: jest.fn().mockImplementation(() => ({
        load: jest.fn().mockResolvedValue(mockPdfDocs)
    }))
}))

// Mock DocxLoader
const mockDocxDoc = { pageContent: 'Docx content here', metadata: {} }
jest.mock('@langchain/community/document_loaders/fs/docx', () => ({
    DocxLoader: jest.fn().mockImplementation(() => ({
        load: jest.fn().mockResolvedValue([mockDocxDoc])
    }))
}))

describe('parsePlainText', () => {
    it('returns one entry with text content', async () => {
        const blob = makeBlob('Hello world')
        const entries = await parsePlainText(blob)
        expect(entries).toHaveLength(1)
        expect(entries[0].text).toBe('Hello world')
        expect(entries[0].metadata.mime_type).toBe('text/plain')
    })
})

describe('parseMarkdown', () => {
    it('returns one entry with markdown content', async () => {
        const blob = makeBlob('# Title\n\nBody text')
        const entries = await parseMarkdown(blob)
        expect(entries).toHaveLength(1)
        expect(entries[0].text).toBe('# Title\n\nBody text')
        expect(entries[0].metadata.mime_type).toBe('text/markdown')
    })
})

describe('parseJson', () => {
    it('returns one entry with JSON string content', async () => {
        const json = JSON.stringify({ key: 'value', nested: [1, 2, 3] })
        const blob = makeBlob(json)
        const entries = await parseJson(blob)
        expect(entries).toHaveLength(1)
        expect(entries[0].text).toBe(json)
        expect(entries[0].metadata.mime_type).toBe('application/json')
    })
})

describe('parsePdf', () => {
    it('returns one entry per page from mocked PDFLoader', async () => {
        const blob = makeArrayBlob('fake pdf bytes')
        const entries = await parsePdf(blob)
        expect(entries).toHaveLength(3)
        expect(entries[0].text).toBe('Page 1 content')
        expect(entries[0].metadata.page_number).toBe(1)
        expect(entries[1].text).toBe('Page 2 content')
        expect(entries[1].metadata.page_number).toBe(2)
        expect(entries[2].text).toBe('Page 3 content')
        expect(entries[2].metadata.page_number).toBe(3)
    })
})

describe('parseDocx', () => {
    it('returns one entry from mocked DocxLoader', async () => {
        const blob = makeArrayBlob('fake docx bytes')
        const entries = await parseDocx(blob)
        expect(entries).toHaveLength(1)
        expect(entries[0].text).toBe('Docx content here')
        expect(entries[0].metadata.mime_type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    })
})

describe('parseByMime', () => {
    it('dispatches text/plain to parsePlainText', async () => {
        const blob = makeArrayBlob('plain')
        const entries = await parseByMime(blob, 'text/plain')
        expect(entries[0].text).toBe('plain')
    })

    it('dispatches application/json to parseJson', async () => {
        const blob = makeArrayBlob('{"a":1}')
        const entries = await parseByMime(blob, 'application/json')
        expect(entries[0].text).toBe('{"a":1}')
    })

    it('dispatches application/pdf (mocked)', async () => {
        const blob = makeArrayBlob('pdf')
        const entries = await parseByMime(blob, 'application/PDF') // case-insensitive
        expect(entries).toHaveLength(3)
    })

    it('throws for unsupported mime', async () => {
        const blob = makeArrayBlob('data')
        await expect(parseByMime(blob, 'image/png')).rejects.toThrow('Unsupported mime: image/png')
    })
})
