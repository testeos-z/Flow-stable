// ---------------------------------------------------------------------------
// file-parsers.ts — Parse documents from bucket into chunkable entries.
//
// HEXAGONAL RULE: Accept blob + mime, return structured text + metadata.
// NO Supabase storage, NO embedding logic. Pure parsing.
// ---------------------------------------------------------------------------

/**
 * A Blob-like interface so tests don't need the real Web API.
 */
export interface BlobLike {
    text(): Promise<string>
    arrayBuffer?(): Promise<ArrayBuffer>
    type?: string
    size?: number
}

/**
 * Parsed document entry — one per page (PDF) or one per file (others).
 */
export interface ParsedEntry {
    text: string
    metadata: Record<string, unknown>
}

function makeEntry(text: string, extra: Record<string, unknown> = {}): ParsedEntry {
    return { text, metadata: { ...extra, parsed_at: new Date().toISOString() } }
}

export async function parsePlainText(blob: { text(): Promise<string> }): Promise<ParsedEntry[]> {
    const text = await blob.text()
    return [makeEntry(text, { mime_type: 'text/plain' })]
}

export async function parseMarkdown(blob: { text(): Promise<string> }): Promise<ParsedEntry[]> {
    const text = await blob.text()
    return [makeEntry(text, { mime_type: 'text/markdown' })]
}

export async function parseJson(blob: { text(): Promise<string> }): Promise<ParsedEntry[]> {
    const text = await blob.text()
    return [makeEntry(text, { mime_type: 'application/json' })]
}

export async function parsePdf(blob: { arrayBuffer(): Promise<ArrayBuffer> }): Promise<ParsedEntry[]> {
    // Dynamic import — PDFLoader pulls in pdfjs-dist which is heavy.
    const { PDFLoader } = await import('@langchain/community/document_loaders/fs/pdf')
    const buffer = Buffer.from(await blob.arrayBuffer())
    const loader = new PDFLoader(new Blob([new Uint8Array(buffer)]), {
        splitPages: true
    })
    const docs = await loader.load()

    return docs.map((doc) => ({
        text: doc.pageContent,
        metadata: {
            mime_type: 'application/pdf',
            page_number: doc.metadata?.loc?.pageNumber ?? doc.metadata?.pageNumber ?? doc.metadata?.page
        }
    }))
}

export async function parseDocx(blob: { arrayBuffer(): Promise<ArrayBuffer> }): Promise<ParsedEntry[]> {
    const { DocxLoader } = await import('@langchain/community/document_loaders/fs/docx')
    const buffer = Buffer.from(await blob.arrayBuffer())
    const loader = new DocxLoader(new Blob([buffer]))
    const docs = await loader.load()

    return docs.map((doc) => ({
        text: doc.pageContent,
        metadata: {
            mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            page_number: doc.metadata?.loc?.pageNumber ?? doc.metadata?.pageNumber ?? doc.metadata?.page
        }
    }))
}

/**
 * Dispatch to the correct parser based on MIME type.
 * @throws if mime is unsupported.
 */
export async function parseByMime(blob: BlobLike, mime: string): Promise<ParsedEntry[]> {
    const normalized = mime.toLowerCase()
    switch (normalized) {
        case 'text/plain':
            return parsePlainText(blob)
        case 'text/markdown':
            return parseMarkdown(blob)
        case 'application/json':
            return parseJson(blob)
        case 'application/pdf': {
            if (!blob.arrayBuffer) throw new Error('Blob missing arrayBuffer')
            return parsePdf(blob as BlobLike & { arrayBuffer(): Promise<ArrayBuffer> })
        }
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
            if (!blob.arrayBuffer) throw new Error('Blob missing arrayBuffer')
            return parseDocx(blob as BlobLike & { arrayBuffer(): Promise<ArrayBuffer> })
        }
        default:
            throw new Error(`Unsupported mime: ${mime}`)
    }
}
