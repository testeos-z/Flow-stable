import { getCredentialData, getCredentialParam, getBaseClasses } from '../../../src/utils'
import { MoveTool } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class SupabaseStorageMove implements INode {
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
        this.label = 'Supabase Storage Move'
        this.name = 'supabaseStorageMove'
        this.version = 1.0
        this.type = 'SupabaseStorageMove'
        this.icon = 'supabase-storage.svg'
        this.category = 'Tools'
        this.description = 'Move a file within a Supabase Storage bucket'
        this.baseClasses = [this.type, ...getBaseClasses(MoveTool), 'Tool']
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
                label: 'Destination Path',
                name: 'destinationPath',
                type: 'string',
                description: 'New path for the file in the bucket',
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

        return new MoveTool({
            url: supabaseProjUrl,
            apiKey: supabaseApiKey,
            bucket: supabaseBucketName,
            basePath: supabaseBasePath
        })
    }
}

module.exports = { nodeClass: SupabaseStorageMove }
