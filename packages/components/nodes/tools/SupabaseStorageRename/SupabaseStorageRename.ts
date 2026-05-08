import { getCredentialData, getCredentialParam, getBaseClasses } from '../../../src/utils'
import { RenameTool } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class SupabaseStorageRename implements INode {
    label: string
    name: string
    version: number
    type: string
    icon: string
    category: string
    description: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'Supabase Storage Rename'
        this.name = 'supabaseStorageRename'
        this.version = 1.0
        this.type = 'SupabaseStorageRename'
        this.icon = 'supabase-storage.svg'
        this.category = 'Tools'
        this.description = 'Rename a file in a Supabase Storage bucket (keeps it in the same folder)'
        this.baseClasses = [this.type, ...getBaseClasses(RenameTool), 'Tool']
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['supabaseApi']
        }
        this.inputs = [
            {
                label: 'Supabase Project URL',
                name: 'supabaseProjUrl',
                type: 'string',
                description: 'Supabase project URL (e.g., https://your-project.supabase.co)'
            },
            {
                label: 'Bucket Name',
                name: 'supabaseBucketName',
                type: 'string',
                description: 'Name of the Supabase Storage bucket'
            },
            {
                label: 'Base Path',
                name: 'supabaseBasePath',
                type: 'string',
                description: 'Optional base path prepended to all file paths',
                optional: true
            },
            {
                label: 'Source Path',
                name: 'sourcePath',
                type: 'string',
                description: 'Current path of the file in the bucket',
                additionalParams: true,
                optional: true
            },
            {
                label: 'New Name',
                name: 'newName',
                type: 'string',
                description: 'New filename (kept in the same folder)',
                additionalParams: true,
                optional: true
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const supabaseApiKey = getCredentialParam('supabaseApiKey', credentialData, nodeData)

        const supabaseProjUrl = nodeData.inputs?.supabaseProjUrl as string
        const supabaseBucketName = nodeData.inputs?.supabaseBucketName as string
        const supabaseBasePath = (nodeData.inputs?.supabaseBasePath as string) || ''

        return new RenameTool({
            url: supabaseProjUrl,
            apiKey: supabaseApiKey,
            bucket: supabaseBucketName,
            basePath: supabaseBasePath
        })
    }
}

module.exports = { nodeClass: SupabaseStorageRename }
