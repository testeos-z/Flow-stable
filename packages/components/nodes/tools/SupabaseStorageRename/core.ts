import { z } from 'zod/v3'
import { DynamicStructuredTool } from '../OpenAPIToolkit/core'
import { createSupabaseClient, handleStorageError } from '../SupabaseStorageCommon'

const RenameSchema = z.object({
    sourcePath: z.string().describe('Current path of the file in the bucket'),
    newName: z.string().describe('New filename (kept in the same folder)')
})

export class RenameTool extends DynamicStructuredTool {
    private supabase: ReturnType<typeof createSupabaseClient>
    private bucket: string
    private basePath: string

    constructor(args: { url: string; apiKey: string; bucket: string; basePath?: string }) {
        super({
            name: 'supabase_storage_rename',
            description: 'Rename a file in a Supabase Storage bucket (keeps it in the same folder)',
            schema: RenameSchema,
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

    private computeDestinationPath(sourcePath: string, newName: string): string {
        const lastSlashIndex = sourcePath.lastIndexOf('/')
        if (lastSlashIndex === -1) {
            return newName
        }
        const folder = sourcePath.substring(0, lastSlashIndex)
        return `${folder}/${newName}`
    }

    async _call(arg: z.output<typeof RenameSchema>): Promise<string> {
        const sourcePath = this.resolvePath(arg.sourcePath)
        const destinationPath = this.resolvePath(this.computeDestinationPath(arg.sourcePath, arg.newName))

        const { data, error } = await this.supabase.storage.from(this.bucket).move(sourcePath, destinationPath)
        handleStorageError(error)

        if (!data) {
            throw new Error(`Rename failed: ${sourcePath} → ${destinationPath}`)
        }

        const { data: publicUrlData } = this.supabase.storage.from(this.bucket).getPublicUrl(destinationPath)

        return JSON.stringify({
            path: destinationPath,
            publicUrl: publicUrlData?.publicUrl ?? ''
        })
    }
}
