import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { createSupabaseClient, handleStorageError } from '../SupabaseStorageCommon'

const MoveSchema = z.object({
    sourcePath: z.string().describe('Current path of the file in the bucket'),
    destinationPath: z.string().describe('New path for the file in the bucket')
})

export class MoveTool extends DynamicStructuredTool {
    private supabase: ReturnType<typeof createSupabaseClient>
    private bucket: string
    private basePath: string

    constructor(args: { url: string; apiKey: string; bucket: string; basePath?: string }) {
        super({
            name: 'supabase_storage_move',
            description: 'Move a file within a Supabase Storage bucket',
            schema: MoveSchema,
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

    async _call(arg: z.output<typeof MoveSchema>): Promise<string> {
        const sourcePath = this.resolvePath(arg.sourcePath)
        const destinationPath = this.resolvePath(arg.destinationPath)

        const { data, error } = await this.supabase.storage.from(this.bucket).move(sourcePath, destinationPath)
        handleStorageError(error)

        if (!data) {
            throw new Error(`Move failed: ${sourcePath} → ${destinationPath}`)
        }

        const { data: publicUrlData } = this.supabase.storage.from(this.bucket).getPublicUrl(destinationPath)

        return JSON.stringify({
            path: destinationPath,
            publicUrl: publicUrlData?.publicUrl ?? ''
        })
    }
}
