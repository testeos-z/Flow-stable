import { getCredentialData, getCredentialParam, getBaseClasses } from '../../../src/utils'
import { UploadTool } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class SupabaseStorageUpload implements INode {
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
        this.label = 'Supabase Storage Upload'
        this.name = 'supabaseStorageUpload'
        this.version = 1.0
        this.type = 'SupabaseStorageUpload'
        this.icon = 'supabase-storage.svg'
        this.category = 'Tools'
        this.description = 'Upload a file to a Supabase Storage bucket'
        this.baseClasses = [this.type, ...getBaseClasses(UploadTool), 'Tool']
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
                label: 'Content Type',
                name: 'contentType',
                type: 'string',
                description: 'Optional MIME type (e.g., image/png). When set to a binary type, fileContent is decoded from base64',
                optional: true
            },
            {
                label: 'Destination Path',
                name: 'destinationPath',
                type: 'string',
                description: 'Path where the file should be stored in the bucket',
                additionalParams: true,
                optional: true
            },
            {
                label: 'File Content',
                name: 'fileContent',
                type: 'string',
                description: 'Content of the file to upload (plain text or base64-encoded binary)',
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
        const contentType = (nodeData.inputs?.contentType as string) || undefined

        return new UploadTool({
            url: supabaseProjUrl,
            apiKey: supabaseApiKey,
            bucket: supabaseBucketName,
            basePath: supabaseBasePath,
            contentType
        })
    }
}

module.exports = { nodeClass: SupabaseStorageUpload }
