// ---------------------------------------------------------------------------
// RED tests for bucket-walker.ts (T-13)
// ---------------------------------------------------------------------------

import { walkBucket, inferMime, StorageClient, StorageItem } from '../bucket-walker'

type ListFn = StorageClient['from'] extends (bucket: string) => infer R
    ? R extends { list: (...args: any[]) => any }
        ? R['list']
        : never
    : never

const makeClient = (behaviors: Record<string, StorageItem[]>): StorageClient => ({
    from: (_bucket: string) => ({
        list: jest.fn(async (prefix: string, _opts?: any) => {
            const key = prefix === '' ? '/' : prefix
            const items = behaviors[key] ?? behaviors[prefix] ?? []
            return { data: items, error: null }
        }) as ListFn
    })
})

describe('inferMime', () => {
    it('maps .pdf → application/pdf', () => expect(inferMime('report.pdf')).toBe('application/pdf'))
    it('maps .PDF → application/pdf (case-insensitive)', () => expect(inferMime('REPORT.PDF')).toBe('application/pdf'))
    it('maps .md → text/markdown', () => expect(inferMime('README.md')).toBe('text/markdown'))
    it('maps .txt → text/plain', () => expect(inferMime('notes.txt')).toBe('text/plain'))
    it('maps .json → application/json', () => expect(inferMime('data.json')).toBe('application/json'))
    it('maps .docx → word processing', () =>
        expect(inferMime('plan.docx')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document'))
    it('falls back to octet-stream for unknown', () => expect(inferMime('data.bin')).toBe('application/octet-stream'))
})

describe('walkBucket', () => {
    it('returns [] for empty bucket', async () => {
        const client = makeClient({ '/': [] })
        const results = await walkBucket(client, 'test', '')
        expect(results).toEqual([])
    })

    it('returns flat files without recursion', async () => {
        const client = makeClient({
            '/': [
                { id: '1', name: 'a.txt', metadata: { size: 10 } },
                { id: '2', name: 'b.pdf', metadata: { size: 200 } }
            ]
        })
        const results = await walkBucket(client, 'test', '')
        expect(results).toHaveLength(2)
        expect(results[0]).toEqual({ path: 'a.txt', mime: 'text/plain', sizeBytes: 10 })
        expect(results[1]).toEqual({ path: 'b.pdf', mime: 'application/pdf', sizeBytes: 200 })
    })

    it('recurses into folders (id: null signals folder)', async () => {
        const client = makeClient({
            '/': [
                { id: null, name: 'reports' },
                { id: '3', name: 'root.txt', metadata: { size: 5 } }
            ],
            reports: [{ id: '4', name: 'nested.json', metadata: { size: 50 } }]
        })
        const results = await walkBucket(client, 'test', '')
        expect(results).toHaveLength(2)
        // Folder recursion processes nested files first (depth-first)
        expect(results[0]).toEqual({ path: 'reports/nested.json', mime: 'application/json', sizeBytes: 50 })
        expect(results[1]).toEqual({ path: 'root.txt', mime: 'text/plain', sizeBytes: 5 })
    })

    it('handles nested prefix path', async () => {
        const client = makeClient({
            'reports/one/abc-123': [{ id: '5', name: 'form.json', metadata: { size: 100 } }]
        })
        const results = await walkBucket(client, 'test', 'reports/one/abc-123')
        expect(results).toHaveLength(1)
        expect(results[0].path).toBe('reports/one/abc-123/form.json')
    })

    it('throws if maxDepth exceeded', async () => {
        // Create a chain of nested folders that exceeds maxDepth
        const client: StorageClient = {
            from: (_bucket: string) => ({
                list: jest.fn(async () => {
                    // Always return a folder, causing infinite recursion
                    return {
                        data: [{ id: null, name: 'deep' }],
                        error: null
                    }
                }) as ListFn
            })
        }
        await expect(walkBucket(client, 'test', '', { maxDepth: 1 })).rejects.toThrow('Max bucket walk depth (1) exceeded')
    })

    it('throws on storage listing error', async () => {
        const client: StorageClient = {
            from: (_bucket: string) => ({
                list: jest.fn(async () => ({
                    data: null,
                    error: { message: 'Permission denied', status: 403 }
                })) as ListFn
            })
        }
        await expect(walkBucket(client, 'test', '')).rejects.toThrow('Storage list failed: Permission denied')
    })
})
