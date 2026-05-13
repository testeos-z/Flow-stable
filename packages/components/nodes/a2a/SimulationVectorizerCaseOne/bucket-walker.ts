// ---------------------------------------------------------------------------
// bucket-walker.ts — Recursive Supabase Storage walker.
//
// HEXAGONAL RULE: Only accepts a minimal storage-client interface so tests
// don't need the full @supabase/supabase-js dependency. NO side-effects.
// ---------------------------------------------------------------------------

export interface StorageClient {
    from(bucket: string): {
        list(
            prefix: string,
            options?: { limit?: number; offset?: number; sortBy?: { column: string; order: string } }
        ): Promise<{
            data: StorageItem[] | null
            error: { message: string; status?: number } | null
        }>
    }
}

export interface StorageItem {
    id: string | null // null → folder
    name: string
    metadata?: { size?: number; mimetype?: string; lastModified?: string }
    created_at?: string
    updated_at?: string
}

export interface BucketFile {
    path: string
    mime: string
    sizeBytes: number
}

export interface WalkOptions {
    maxDepth?: number
    limit?: number
}

const MIME_MAP: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.md': 'text/markdown',
    '.txt': 'text/plain',
    '.json': 'application/json',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.csv': 'text/csv',
    '.html': 'text/html',
    '.xml': 'application/xml'
}

/**
 * Infer MIME type from a filename's extension. Case-insensitive.
 */
export function inferMime(filename: string): string {
    const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase()
    return MIME_MAP[ext] || 'application/octet-stream'
}

/**
 * Recursively walk a Supabase Storage bucket starting at `basePath`.
 *
 * `data[i].id === null` signals a folder (Supabase Storage convention).
 * Folders are recursed up to `maxDepth` (default 5).
 *
 * @throws if storage.list() returns an error or maxDepth is exceeded.
 */
export async function walkBucket(
    client: StorageClient,
    bucket: string,
    basePath: string,
    options: WalkOptions = {}
): Promise<BucketFile[]> {
    const { maxDepth = 5, limit = 1000 } = options
    return _walk(client, bucket, basePath, 0, maxDepth, limit)
}

async function _walk(
    client: StorageClient,
    bucket: string,
    prefix: string,
    depth: number,
    maxDepth: number,
    limit: number
): Promise<BucketFile[]> {
    if (depth > maxDepth) {
        throw new Error(`Max bucket walk depth (${maxDepth}) exceeded at: ${prefix}`)
    }

    const { data, error } = await client.from(bucket).list(prefix, { limit })

    if (error) {
        throw new Error(`Storage list failed: ${error.message}`)
    }

    if (!data || data.length === 0) {
        return []
    }

    const results: BucketFile[] = []

    for (const item of data) {
        if (item.id === null) {
            // folder — recurse
            const nested = await _walk(client, bucket, prefix ? `${prefix}/${item.name}` : item.name, depth + 1, maxDepth, limit)
            results.push(...nested)
        } else {
            // file
            const path = prefix ? `${prefix}/${item.name}` : item.name
            results.push({
                path,
                mime: inferMime(item.name),
                sizeBytes: item.metadata?.size ?? 0
            })
        }
    }

    return results
}
