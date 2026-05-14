import { getCredentialData, getCredentialParam, getBaseClasses } from '../../../src/utils'
import { SimulationVectorizerTool } from './core'
import type { INode, INodeData, INodeParams, ICommonObject } from '../../../src/Interface'
import { createClient } from '@supabase/supabase-js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

class SimulationVectorizerCaseOne implements INode {
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
        this.label = 'Simulation Vectorizer (Case One)'
        this.name = 'simulationVectorizerCaseOne'
        this.version = 1.0
        this.type = 'SimulationVectorizerCaseOne'
        this.icon = 'simulation-vectorizer-case-one.svg'
        this.category = 'Tools'
        this.description =
            'Vectorizes Case One simulation data (form + bucket documents) into Supabase pgvector tables. Reads simulationId from flow state. Idempotent — re-running replaces previous vectors.'
        this.baseClasses = [this.type, 'Tool', 'DynamicStructuredTool', ...getBaseClasses(SimulationVectorizerTool)]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['supabaseUserAuth']
        }
        this.inputs = [
            {
                label: 'Embeddings',
                name: 'embeddings',
                type: 'Embeddings',
                description: 'Embedding model used to vectorize text (e.g. HuggingFace Inference, OpenAI Embeddings). Required.'
            },
            {
                label: 'Simulation ID',
                name: 'simulationId',
                type: 'string',
                acceptVariable: true,
                placeholder: '{{$flow.state.simulationId}}',
                description:
                    'UUID of the simulation to vectorize. Should come from flow state. The LLM does NOT decide this value — it is resolved before the tool is instantiated.'
            },
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true,
                description: 'Optional chunking strategy. Defaults to RecursiveCharacterTextSplitter (1500/200) if not connected.'
            },
            {
                label: 'Language Detection Model',
                name: 'languageDetectionModel',
                type: 'BaseChatModel',
                optional: true,
                description:
                    'Optional LLM used for language detection. If not connected, the `franc` library auto-detects language with ~95% accuracy.'
            },
            {
                label: 'Bucket Name',
                name: 'bucketName',
                type: 'string',
                default: 'a2a',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Bucket Base Path',
                name: 'bucketBasePath',
                type: 'string',
                default: 'reports/one',
                additionalParams: true,
                optional: true,
                description: 'Base path in bucket, without the trailing simulation ID (e.g. reports/one).'
            },
            {
                label: 'Schema Name',
                name: 'schemaName',
                type: 'string',
                default: 'knowledge',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Table — Simulations',
                name: 'tableSimulations',
                type: 'string',
                default: 'simulations',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Table — Document Simulations',
                name: 'tableDocumentSimulation',
                type: 'string',
                default: 'document_simulation',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Chunk Size',
                name: 'chunkSize',
                type: 'number',
                default: 1500,
                additionalParams: true,
                optional: true,
                description: 'Used only when no Text Splitter node is connected.'
            },
            {
                label: 'Chunk Overlap',
                name: 'chunkOverlap',
                type: 'number',
                default: 200,
                additionalParams: true,
                optional: true
            },
            {
                label: 'Source Flow',
                name: 'sourceFlow',
                type: 'string',
                default: 'simulation_vectorizer',
                additionalParams: true,
                optional: true
            },
            {
                label: 'JWT Cache TTL (minutes)',
                name: 'jwtCacheTtlMinutes',
                type: 'number',
                default: 50,
                additionalParams: true,
                optional: true
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<SimulationVectorizerTool> {
        const simulationId = nodeData.inputs?.simulationId as string | undefined
        if (!simulationId) {
            throw new Error('simulationId is required — wire it to {{$flow.state.simulationId}} or a variable')
        }
        if (!UUID_RE.test(simulationId.trim())) {
            throw new Error(`simulationId must be a valid UUID. Got: "${simulationId}"`)
        }

        if (!nodeData.inputs?.embeddings) {
            throw new Error('Embeddings input is required — connect an embedding model node (e.g. HuggingFace Inference)')
        }

        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const supabaseProjUrl =
            (nodeData.inputs?.supabaseProjUrl as string) || getCredentialParam('supabaseProjUrl', credentialData, nodeData)
        const supabaseAnonKey = getCredentialParam('supabaseAnonKey', credentialData, nodeData)
        const supabaseUserEmail = getCredentialParam('supabaseUserEmail', credentialData, nodeData)
        const supabaseUserPassword = getCredentialParam('supabaseUserPassword', credentialData, nodeData)

        if (!supabaseUserEmail) throw new Error('supabaseUserEmail is required in the supabaseUserAuth credential')
        if (!supabaseUserPassword) throw new Error('supabaseUserPassword is required in the supabaseUserAuth credential')

        const supabaseClient = createClient(supabaseProjUrl, supabaseAnonKey)

        return new SimulationVectorizerTool(
            {
                simulationId: simulationId.trim(),
                supabaseClient: supabaseClient as any,
                embeddings: nodeData.inputs?.embeddings,
                textSplitter: nodeData.inputs?.textSplitter,
                languageDetectionModel: nodeData.inputs?.languageDetectionModel,
                bucketName: (nodeData.inputs?.bucketName as string) || 'a2a',
                bucketBasePath: (nodeData.inputs?.bucketBasePath as string) || 'reports/one',
                schemaName: (nodeData.inputs?.schemaName as string) || 'knowledge',
                tableSimulations: (nodeData.inputs?.tableSimulations as string) || 'simulations',
                tableDocumentSimulation: (nodeData.inputs?.tableDocumentSimulation as string) || 'document_simulation',
                chunkSize: (nodeData.inputs?.chunkSize as number) || 1500,
                chunkOverlap: (nodeData.inputs?.chunkOverlap as number) || 200,
                sourceFlow: (nodeData.inputs?.sourceFlow as string) || 'simulation_vectorizer',
                jwtCacheTtlMinutes: (nodeData.inputs?.jwtCacheTtlMinutes as number) || 50
            },
            {
                email: supabaseUserEmail,
                password: supabaseUserPassword,
                jwtCacheTtlMinutes: (nodeData.inputs?.jwtCacheTtlMinutes as number) || 50
            }
        )
    }
}

module.exports = { nodeClass: SimulationVectorizerCaseOne }
