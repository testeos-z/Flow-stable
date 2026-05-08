import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { createSupabaseClient, handleStorageError } from '../SupabaseStorageCommon'

const UploadSchema = z.object({
    destinationPath: z.string().describe('Path where the file should be stored in the bucket'),
    fileContent: z.string().describe('Content of the file to upload (plain text or base64-encoded binary)')
})

export class UploadTool extends DynamicStructuredTool {
    private supabase: ReturnType<typeof createSupabaseClient>
    private bucket: string
    private basePath: string
    private contentType?: string

    constructor(args: { url: string; apiKey: string; bucket: string; basePath?: string; contentType?: string }) {
        super({
            name: 'supabase_storage_upload',
            description: 'Upload a file to a Supabase Storage bucket',
            schema: UploadSchema,
            baseUrl: '',
            method: 'GET',
            headers: {}
        })
        this.supabase = createSupabaseClient(args.url, args.apiKey)
        this.bucket = args.bucket
        this.basePath = args.basePath ?? ''
        this.contentType = args.contentType
    }

    private resolvePath(path: string): string {
        if (this.basePath) {
            return `${this.basePath}/${path}`.replace(/\/+/g, '/')
        }
        return path
    }

    private isBinaryContentType(): boolean {
        if (!this.contentType) return false
        const ct = this.contentType.toLowerCase()
        if (ct.startsWith('text/')) return false
        if (ct === 'application/json') return false
        if (ct === 'application/javascript') return false
        if (ct === 'application/xml') return false
        return true
    }

    private prepareBody(fileContent: string): string | Buffer {
        if (this.isBinaryContentType()) {
            return Buffer.from(fileContent, 'base64')
        }
        return fileContent
    }

    async _call(arg: z.output<typeof UploadSchema>): Promise<string> {
        const destinationPath = this.resolvePath(arg.destinationPath)
        const body = this.prepareBody(arg.fileContent)

        const { data, error } = await this.supabase.storage.from(this.bucket).upload(destinationPath, body, {
            contentType: this.contentType,
            upsert: true
        })
        handleStorageError(error)

        if (!data) {
            throw new Error(`Upload failed: ${destinationPath}`)
        }

        const { data: publicUrlData } = this.supabase.storage.from(this.bucket).getPublicUrl(destinationPath)

        return JSON.stringify({
            path: destinationPath,
            publicUrl: publicUrlData?.publicUrl ?? ''
        })
    }
}
