/**
 * Golden Templates — Real node structures extracted from working flows
 *
 * These are the EXACT JSON structures that Flowise generates when you drag
 * a node to the canvas. Used as ground truth for Zod schemas.
 *
 * Sources:
 * - chatOpenRouter: Based on working NYC Knowledge Agent flow
 * - supabase: Based on working vector store configuration
 * - toolAgent: Based on working test flow with template syntax
 * - huggingFaceInferenceEmbeddings: Based on working embedding setup
 * - retrieverTool: Based on working RAG setup
 * - customMcpTool: Based on working MCP integration
 */

export const goldenTemplates = {
    chatOpenRouter: {
        id: 'chatOpenRouter_0',
        position: { x: 100, y: 100 },
        positionAbsolute: { x: 100, y: 100 },
        type: 'customNode',
        width: 300,
        height: 640,
        selected: false,
        dragging: false,
        z: 0,
        data: {
            id: 'chatOpenRouter_0',
            label: 'OpenRouter',
            name: 'chatOpenRouter',
            version: 1,
            type: 'ChatOpenRouter',
            baseClasses: ['ChatOpenAI', 'BaseChatModel', 'BaseLanguageModel', 'Runnable'],
            category: 'Chat Models',
            description: 'Wrapper around OpenAI Large Language Models with OpenRouter',
            filePath:
                '/usr/src/flowise/packages/server/node_modules/flowise-components/dist/nodes/chatmodels/ChatOpenRouter/ChatOpenRouter.js',
            icon: '/OpenRouter.svg',
            credential: 'ddeb2757-f8e2-4ed7-9647-5a113332b432',
            inputs: {
                modelName: 'google/gemma-4-26b-a4b-it:free',
                temperature: 0.7,
                maxTokens: undefined,
                topP: 1,
                frequencyPenalty: 0,
                presencePenalty: 0,
                timeout: undefined,
                basePath: undefined,
                baseOptions: undefined,
                streaming: true,
                cache: false
            },
            inputParams: [
                {
                    label: 'Connect Credential',
                    name: 'credential',
                    type: 'credential',
                    id: 'chatOpenRouter-credential',
                    description: 'Needed to connect to OpenRouter API'
                },
                {
                    label: 'Model Name',
                    name: 'modelName',
                    type: 'asyncOptions',
                    id: 'chatOpenRouter-modelName',
                    description: 'Model name to use',
                    loadMethod: 'listModels'
                },
                {
                    label: 'Temperature',
                    name: 'temperature',
                    type: 'number',
                    id: 'chatOpenRouter-temperature',
                    description: 'Controls randomness',
                    placeholder: '0.7',
                    default: 0.7
                },
                {
                    label: 'Max Tokens',
                    name: 'maxTokens',
                    type: 'number',
                    id: 'chatOpenRouter-maxTokens',
                    description: 'Maximum number of tokens to generate',
                    optional: true
                },
                {
                    label: 'Top P',
                    name: 'topP',
                    type: 'number',
                    id: 'chatOpenRouter-topP',
                    description: 'Nucleus sampling parameter',
                    default: 1,
                    optional: true
                },
                {
                    label: 'Frequency Penalty',
                    name: 'frequencyPenalty',
                    type: 'number',
                    id: 'chatOpenRouter-frequencyPenalty',
                    description: 'Penalize repeated tokens',
                    default: 0,
                    optional: true
                },
                {
                    label: 'Presence Penalty',
                    name: 'presencePenalty',
                    type: 'number',
                    id: 'chatOpenRouter-presencePenalty',
                    description: 'Penalize new tokens',
                    default: 0,
                    optional: true
                },
                {
                    label: 'Timeout',
                    name: 'timeout',
                    type: 'number',
                    id: 'chatOpenRouter-timeout',
                    description: 'Request timeout in ms',
                    optional: true
                },
                {
                    label: 'BasePath',
                    name: 'basePath',
                    type: 'string',
                    id: 'chatOpenRouter-basePath',
                    description: 'Base API path',
                    optional: true
                },
                {
                    label: 'BaseOptions',
                    name: 'baseOptions',
                    type: 'json',
                    id: 'chatOpenRouter-baseOptions',
                    description: 'Additional options',
                    optional: true
                },
                {
                    label: 'Streaming',
                    name: 'streaming',
                    type: 'boolean',
                    id: 'chatOpenRouter-streaming',
                    description: 'Enable streaming',
                    default: true
                },
                {
                    label: 'Cache',
                    name: 'cache',
                    type: 'boolean',
                    id: 'chatOpenRouter-cache',
                    description: 'Enable cache',
                    default: false
                }
            ],
            inputAnchors: [],
            outputAnchors: [
                {
                    id: 'chatOpenRouter-output',
                    name: 'chatOpenRouter',
                    label: 'ChatOpenAI',
                    type: 'ChatOpenAI',
                    description: 'Chat model instance',
                    baseClasses: ['ChatOpenAI', 'BaseChatModel', 'BaseLanguageModel', 'Runnable']
                }
            ],
            outputs: {}
        }
    },

    supabase: {
        id: 'supabase_0',
        position: { x: 500, y: 300 },
        positionAbsolute: { x: 500, y: 300 },
        type: 'customNode',
        width: 300,
        height: 580,
        selected: false,
        dragging: false,
        z: 0,
        data: {
            id: 'supabase_0',
            label: 'Supabase',
            name: 'supabase',
            version: 1,
            type: 'Supabase_VectorStore',
            baseClasses: ['VectorStore', 'BaseRetriever'],
            category: 'Vector Stores',
            description: 'Upsert embedded data and perform similarity search upon query using Supabase with pgvector',
            filePath: '/usr/src/flowise/packages/server/node_modules/flowise-components/dist/nodes/vectorstores/Supabase/Supabase.js',
            icon: '/supabase.svg',
            credential: '0df85d26-749b-4fac-9a88-7399663a3099',
            inputs: {
                tableName: 'nyc',
                queryName: 'match_nyc_flowise',
                contentColumnName: 'context',
                vectorColumnName: 'embedding',
                embeddings: '{{huggingFaceInferenceEmbeddings_0.data.instance}}',
                recordManager: '',
                supabaseMetadataFilter: '',
                supabaseFilter: undefined,
                topK: 4
            },
            inputParams: [
                {
                    label: 'Connect Credential',
                    name: 'credential',
                    type: 'credential',
                    id: 'supabase-credential',
                    description: 'Needed to connect to Supabase API'
                },
                {
                    label: 'Table Name',
                    name: 'tableName',
                    type: 'string',
                    id: 'supabase-tableName',
                    description: 'Name of the table',
                    placeholder: 'documents'
                },
                {
                    label: 'Query Name',
                    name: 'queryName',
                    type: 'string',
                    id: 'supabase-queryName',
                    description: 'Name of the RPC function for similarity search',
                    placeholder: 'match_documents'
                },
                {
                    label: 'Content Column Name',
                    name: 'contentColumnName',
                    type: 'string',
                    id: 'supabase-contentColumnName',
                    description: 'Column name for content',
                    placeholder: 'content'
                },
                {
                    label: 'Vector Column Name',
                    name: 'vectorColumnName',
                    type: 'string',
                    id: 'supabase-vectorColumnName',
                    description: 'Column name for vectors',
                    placeholder: 'embedding'
                },
                {
                    label: 'Embeddings',
                    name: 'embeddings',
                    type: 'Embeddings',
                    id: 'supabase-embeddings',
                    description: 'Embeddings instance'
                },
                {
                    label: 'Record Manager',
                    name: 'recordManager',
                    type: 'RecordManager',
                    id: 'supabase-recordManager',
                    description: 'Record manager for deduplication',
                    optional: true
                },
                {
                    label: 'Supabase Metadata Filter',
                    name: 'supabaseMetadataFilter',
                    type: 'string',
                    id: 'supabase-supabaseMetadataFilter',
                    description: 'Filter by metadata',
                    optional: true,
                    additionalParams: true
                },
                {
                    label: 'Supabase Filter',
                    name: 'supabaseFilter',
                    type: 'json',
                    id: 'supabase-supabaseFilter',
                    description: 'Filter object',
                    optional: true,
                    additionalParams: true
                },
                {
                    label: 'Top K',
                    name: 'topK',
                    type: 'number',
                    id: 'supabase-topK',
                    description: 'Number of results to return',
                    default: 4,
                    optional: true,
                    additionalParams: true
                }
            ],
            inputAnchors: [
                {
                    id: 'supabase-embeddings-anchor',
                    name: 'embeddings',
                    label: 'Embeddings',
                    type: 'Embeddings',
                    description: 'Embeddings to use'
                },
                {
                    id: 'supabase-recordManager-anchor',
                    name: 'recordManager',
                    label: 'Record Manager',
                    type: 'RecordManager',
                    description: 'Record Manager',
                    optional: true
                }
            ],
            outputAnchors: [
                {
                    id: 'supabase-output',
                    name: 'supabase',
                    label: 'Supabase Vector Store',
                    type: 'VectorStore',
                    description: 'Vector store instance',
                    baseClasses: ['VectorStore', 'BaseRetriever']
                }
            ],
            outputs: {}
        }
    },

    toolAgent: {
        id: 'toolAgent_0',
        position: { x: 900, y: 100 },
        positionAbsolute: { x: 900, y: 100 },
        type: 'customNode',
        width: 300,
        height: 520,
        selected: false,
        dragging: false,
        z: 0,
        data: {
            id: 'toolAgent_0',
            label: 'Tool Agent',
            name: 'toolAgent',
            version: 1,
            type: 'Agent',
            baseClasses: ['AgentExecutor', 'BaseChain', 'Runnable'],
            category: 'Agents',
            description: 'Agent that uses tools to answer questions',
            filePath: '/usr/src/flowise/packages/server/node_modules/flowise-components/dist/nodes/agents/ToolAgent/ToolAgent.js',
            icon: '/agent.svg',
            credential: '',
            inputs: {
                systemMessage: 'You are a helpful assistant. Use the available tools to answer questions accurately.',
                model: '{{chatOpenRouter_0.data.instance}}',
                tools: ['{{retrieverTool_0.data.instance}}', '{{customMcpTool_0.data.instance}}'],
                memory: '',
                maxIterations: 5,
                verbose: false
            },
            inputParams: [
                {
                    label: 'System Message',
                    name: 'systemMessage',
                    type: 'string',
                    id: 'toolAgent-systemMessage',
                    description: 'System message for the agent',
                    rows: 4,
                    default: 'You are a helpful assistant',
                    optional: true
                },
                {
                    label: 'Model',
                    name: 'model',
                    type: 'BaseChatModel',
                    id: 'toolAgent-model',
                    description: 'Chat model to use'
                },
                {
                    label: 'Tools',
                    name: 'tools',
                    type: 'Tool',
                    id: 'toolAgent-tools',
                    description: 'Tools available to the agent',
                    list: true
                },
                {
                    label: 'Memory',
                    name: 'memory',
                    type: 'BaseChatMemory',
                    id: 'toolAgent-memory',
                    description: 'Memory for conversation',
                    optional: true
                },
                {
                    label: 'Max Iterations',
                    name: 'maxIterations',
                    type: 'number',
                    id: 'toolAgent-maxIterations',
                    description: 'Maximum number of iterations',
                    default: 5,
                    optional: true,
                    additionalParams: true
                },
                {
                    label: 'Verbose',
                    name: 'verbose',
                    type: 'boolean',
                    id: 'toolAgent-verbose',
                    description: 'Print verbose output',
                    default: false,
                    optional: true,
                    additionalParams: true
                }
            ],
            inputAnchors: [
                {
                    id: 'toolAgent-model-anchor',
                    name: 'model',
                    label: 'Chat Model',
                    type: 'BaseChatModel',
                    description: 'Chat model'
                },
                {
                    id: 'toolAgent-tools-anchor',
                    name: 'tools',
                    label: 'Tools',
                    type: 'Tool',
                    description: 'Tools',
                    list: true
                },
                {
                    id: 'toolAgent-memory-anchor',
                    name: 'memory',
                    label: 'Memory',
                    type: 'BaseChatMemory',
                    description: 'Memory',
                    optional: true
                }
            ],
            outputAnchors: [
                {
                    id: 'toolAgent-output',
                    name: 'toolAgent',
                    label: 'Agent',
                    type: 'AgentExecutor',
                    description: 'Agent executor',
                    baseClasses: ['AgentExecutor', 'BaseChain', 'Runnable']
                }
            ],
            outputs: {}
        }
    },

    huggingFaceInferenceEmbeddings: {
        id: 'huggingFaceInferenceEmbeddings_0',
        position: { x: 100, y: 500 },
        positionAbsolute: { x: 100, y: 500 },
        type: 'customNode',
        width: 300,
        height: 420,
        selected: false,
        dragging: false,
        z: 0,
        data: {
            id: 'huggingFaceInferenceEmbeddings_0',
            label: 'HuggingFace Inference Embeddings',
            name: 'huggingFaceInferenceEmbeddings',
            version: 1,
            type: 'HuggingFaceInferenceEmbeddings',
            baseClasses: ['HuggingFaceInferenceEmbeddings', 'Embeddings'],
            category: 'Embeddings',
            description: 'Generate embeddings via HuggingFace Inference API',
            filePath:
                '/usr/src/flowise/packages/server/node_modules/flowise-components/dist/nodes/embeddings/HuggingFaceInferenceEmbeddings/HuggingFaceInferenceEmbeddings.js',
            icon: '/huggingface.png',
            credential: 'aae7223f-da1b-47d5-bb26-1a2f1b2a3d5b',
            inputs: {
                model: 'intfloat/multilingual-e5-large-instruct',
                endpoint: 'https://router.huggingface.co/hf-inference/models',
                batchSize: 512,
                stripNewLines: true,
                timeout: undefined
            },
            inputParams: [
                {
                    label: 'Connect Credential',
                    name: 'credential',
                    type: 'credential',
                    id: 'huggingFaceInferenceEmbeddings-credential',
                    description: 'Needed to connect to HuggingFace API'
                },
                {
                    label: 'Model',
                    name: 'model',
                    type: 'string',
                    id: 'huggingFaceInferenceEmbeddings-model',
                    description: 'Model name',
                    placeholder: 'sentence-transformers/all-MiniLM-L6-v2'
                },
                {
                    label: 'Endpoint',
                    name: 'endpoint',
                    type: 'string',
                    id: 'huggingFaceInferenceEmbeddings-endpoint',
                    description: 'Custom endpoint URL',
                    placeholder: 'https://api-inference.huggingface.co/models',
                    optional: true
                },
                {
                    label: 'Batch Size',
                    name: 'batchSize',
                    type: 'number',
                    id: 'huggingFaceInferenceEmbeddings-batchSize',
                    description: 'Batch size for requests',
                    default: 512,
                    optional: true,
                    additionalParams: true
                },
                {
                    label: 'Strip New Lines',
                    name: 'stripNewLines',
                    type: 'boolean',
                    id: 'huggingFaceInferenceEmbeddings-stripNewLines',
                    description: 'Remove new lines from input',
                    default: true,
                    optional: true,
                    additionalParams: true
                },
                {
                    label: 'Timeout',
                    name: 'timeout',
                    type: 'number',
                    id: 'huggingFaceInferenceEmbeddings-timeout',
                    description: 'Request timeout in ms',
                    optional: true,
                    additionalParams: true
                }
            ],
            inputAnchors: [],
            outputAnchors: [
                {
                    id: 'huggingFaceInferenceEmbeddings-output',
                    name: 'huggingFaceInferenceEmbeddings',
                    label: 'Embeddings',
                    type: 'Embeddings',
                    description: 'Embeddings instance',
                    baseClasses: ['HuggingFaceInferenceEmbeddings', 'Embeddings']
                }
            ],
            outputs: {}
        }
    },

    retrieverTool: {
        id: 'retrieverTool_0',
        position: { x: 500, y: 700 },
        positionAbsolute: { x: 500, y: 700 },
        type: 'customNode',
        width: 300,
        height: 420,
        selected: false,
        dragging: false,
        z: 0,
        data: {
            id: 'retrieverTool_0',
            label: 'Retriever Tool',
            name: 'retrieverTool',
            version: 1,
            type: 'RetrieverTool',
            baseClasses: ['RetrieverTool', 'DynamicTool', 'Tool'],
            category: 'Tools',
            description: 'Use a retriever as a tool',
            filePath: '/usr/src/flowise/packages/server/node_modules/flowise-components/dist/nodes/tools/RetrieverTool/RetrieverTool.js',
            icon: '/retriever.svg',
            credential: '',
            inputs: {
                name: 'nyc_search',
                description:
                    'Search for information about New York City in the knowledge base. Use this tool when the user asks about NYC policies, events, or documents.',
                retriever: '{{supabase_0.data.instance}}'
            },
            inputParams: [
                {
                    label: 'Name',
                    name: 'name',
                    type: 'string',
                    id: 'retrieverTool-name',
                    description: 'Tool name (no spaces, unique within flow)',
                    placeholder: 'search_docs'
                },
                {
                    label: 'Description',
                    name: 'description',
                    type: 'string',
                    id: 'retrieverTool-description',
                    description: 'Description for the LLM to know when to use this tool',
                    rows: 4,
                    placeholder: 'Useful for searching documents...'
                },
                {
                    label: 'Retriever',
                    name: 'retriever',
                    type: 'BaseRetriever',
                    id: 'retrieverTool-retriever',
                    description: 'Retriever to use'
                }
            ],
            inputAnchors: [
                {
                    id: 'retrieverTool-retriever-anchor',
                    name: 'retriever',
                    label: 'Retriever',
                    type: 'BaseRetriever',
                    description: 'Retriever instance'
                }
            ],
            outputAnchors: [
                {
                    id: 'retrieverTool-output',
                    name: 'retrieverTool',
                    label: 'Tool',
                    type: 'Tool',
                    description: 'Tool instance',
                    baseClasses: ['RetrieverTool', 'DynamicTool', 'Tool']
                }
            ],
            outputs: {}
        }
    },

    customMcpTool: {
        id: 'customMcpTool_0',
        position: { x: 900, y: 700 },
        positionAbsolute: { x: 900, y: 700 },
        type: 'customNode',
        width: 300,
        height: 380,
        selected: false,
        dragging: false,
        z: 0,
        data: {
            id: 'customMcpTool_0',
            label: 'Custom MCP Tool',
            name: 'customMcpTool',
            version: 1,
            type: 'CustomMcpTool',
            baseClasses: ['Tool'],
            category: 'Tools',
            description: 'Use a tool from a connected MCP server',
            filePath: '/usr/src/flowise/packages/server/node_modules/flowise-components/dist/nodes/tools/CustomMcpTool/CustomMcpTool.js',
            icon: '/mcp.svg',
            credential: '',
            inputs: {
                mcpServer: 'nyc-data',
                toolName: 'query_nyc_data',
                description: 'Query the NYC data MCP server for additional information'
            },
            inputParams: [
                {
                    label: 'MCP Server',
                    name: 'mcpServer',
                    type: 'string',
                    id: 'customMcpTool-mcpServer',
                    description: 'Name of the MCP server'
                },
                {
                    label: 'Tool Name',
                    name: 'toolName',
                    type: 'string',
                    id: 'customMcpTool-toolName',
                    description: 'Name of the tool to use'
                },
                {
                    label: 'Description',
                    name: 'description',
                    type: 'string',
                    id: 'customMcpTool-description',
                    description: 'Description for the LLM',
                    optional: true
                }
            ],
            inputAnchors: [],
            outputAnchors: [
                {
                    id: 'customMcpTool-output',
                    name: 'customMcpTool',
                    label: 'Tool',
                    type: 'Tool',
                    description: 'Tool instance',
                    baseClasses: ['Tool']
                }
            ],
            outputs: {}
        }
    }
}

export type GoldenTemplateName = keyof typeof goldenTemplates

export function getGoldenTemplate(name: GoldenTemplateName): any {
    return goldenTemplates[name]
}

export function listGoldenTemplates(): GoldenTemplateName[] {
    return Object.keys(goldenTemplates) as GoldenTemplateName[]
}
