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
        this.version = 2.0
        this.type = 'SupabaseEdgeFunction'
        this.icon = 'supabase-edge-function.svg'
        this.category = 'Tools'
        this.description =
            'Invoke a Supabase Edge Function like a REST client. Choose HTTP method (GET/POST/PUT/PATCH/DELETE), set custom headers, and pass an optional JSON body — similar to Postman or Bruno.'
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
                description: 'Name of the Edge Function to invoke (e.g., hello-world)',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Default Method',
                name: 'defaultMethod',
                type: 'options',
                options: [
                    { label: 'POST', name: 'POST' },
                    { label: 'GET', name: 'GET' },
                    { label: 'PUT', name: 'PUT' },
                    { label: 'PATCH', name: 'PATCH' },
                    { label: 'DELETE', name: 'DELETE' }
                ],
                default: 'POST',
                description: 'Default HTTP method. The LLM can override this per call.',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Default Headers',
                name: 'defaultHeaders',
                type: 'string',
                description:
                    'Default HTTP headers as JSON object (e.g., {"Authorization": "Bearer token"}). Overridable by the LLM per call.',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Request Body',
                name: 'requestBody',
                type: 'string',
                description: 'Default JSON body. For POST, PUT, PATCH. Ignored for GET and DELETE. Overridable by the LLM per call.',
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
