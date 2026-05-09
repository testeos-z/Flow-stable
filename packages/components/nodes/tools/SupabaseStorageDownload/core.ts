import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { createSupabaseClient, handleStorageError } from '../SupabaseCommon'

const DownloadSchema = z.object({
    sourcePath: z.string().describe('Path of the file to download from the bucket')
})

export class DownloadTool extends DynamicStructuredTool {
    private supabase: ReturnType<typeof createSupabaseClient>
    private bucket: string
    private basePath: string

    constructor(args: { url: string; apiKey: string; bucket: string; basePath?: string }) {
        super({
            name: 'supabase_storage_download',
            description: 'Download a file from a Supabase Storage bucket',
            schema: DownloadSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        })
        this.supabase = createSupabaseClient(args.url, args.apiKey)
        this.bucket = args.bucket
        this.basePath = args.basePath ?? ''
    }

    private resolvePath(path: string): string {
        if (this.basePath) {
            return `${this.basePath}/${path}`.replace(/\/+/g, '/')
        }
        return path
    }

    async _call(arg: z.output<typeof DownloadSchema>): Promise<string> {
        const sourcePath = this.resolvePath(arg.sourcePath)

        const { data, error } = await this.supabase.storage.from(this.bucket).download(sourcePath)
        handleStorageError(error)

        let content = ''
        if (data) {
            content = await data.text()
        } else {
            throw new Error(`File not found: ${sourcePath}`)
        }

        const { data: publicUrlData } = this.supabase.storage.from(this.bucket).getPublicUrl(sourcePath)

        return JSON.stringify({
            content,
            publicUrl: publicUrlData?.publicUrl ?? ''
        })
    }
}
