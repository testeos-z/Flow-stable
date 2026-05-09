import { getCredentialData, getCredentialParam, getBaseClasses } from '../../../src/utils'
import { InvokeEdgeFunctionTool } from './core'
import type { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'

class SupabaseEdgeFunction implements INode {
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
        this.label = 'Supabase Edge Function'
        this.name = 'supabaseEdgeFunction'
        this.version = 1.0
        this.type = 'SupabaseEdgeFunction'
        this.icon = 'supabase-edge-function.svg'
        this.category = 'Tools'
        this.description = 'Invoke a Supabase Edge Function by name with a JSON payload'
        this.baseClasses = [this.type, ...getBaseClasses(InvokeEdgeFunctionTool)]
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
                label: 'Function Name',
                name: 'functionName',
                type: 'string',
                description: 'Name of the Edge Function to invoke',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Request Body',
                name: 'requestBody',
                type: 'string',
                description: 'JSON string to send as the request body',
                additionalParams: true,
                optional: true
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const supabaseApiKey = getCredentialParam('supabaseApiKey', credentialData, nodeData)

        const supabaseProjUrl = nodeData.inputs?.supabaseProjUrl as string

        return new InvokeEdgeFunctionTool({
            url: supabaseProjUrl,
            apiKey: supabaseApiKey
        })
    }
}

module.exports = { nodeClass: SupabaseEdgeFunction }
