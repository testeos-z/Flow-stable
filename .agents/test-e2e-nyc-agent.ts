/**
 * End-to-End Test: NYC Knowledge Agent
 *
 * Recreates the NYC Knowledge Agent flow using the new agent pipeline
 * to verify everything works end-to-end.
 */

import { assembleFlowData } from './skills/flow-architect/assembler'
import { runTestingPipeline, registerNodeValidator } from './testing-pipeline'
import { goldenTemplates } from './schemas/golden-templates'

// Import all specialist schemas
import { ChatOpenRouterNodeSchema } from './skills/node-specialist-chat-models/schemas/chatOpenRouter'
import { HuggingFaceEmbeddingsNodeSchema } from './skills/node-specialist-embeddings/schemas/huggingFace'
import { SupabaseNodeSchema } from './skills/node-specialist-vector-stores/schemas/supabase'
import { ToolAgentNodeSchema } from './skills/node-specialist-agents/schemas/toolAgent'
import { RetrieverToolNodeSchema } from './skills/node-specialist-tools/schemas/retrieverTool'
import { CustomMcpToolNodeSchema } from './skills/node-specialist-tools/schemas/customMcpTool'

// Register validators
registerNodeValidator('chatOpenRouter', ChatOpenRouterNodeSchema)
registerNodeValidator('huggingFaceInferenceEmbeddings', HuggingFaceEmbeddingsNodeSchema)
registerNodeValidator('supabase', SupabaseNodeSchema)
registerNodeValidator('toolAgent', ToolAgentNodeSchema)
registerNodeValidator('retrieverTool', RetrieverToolNodeSchema)
registerNodeValidator('customMcpTool', CustomMcpToolNodeSchema)

async function testNYCKnowledgeAgent() {
    console.log('='.repeat(70))
    console.log('END-TO-END TEST: NYC Knowledge Agent')
    console.log('='.repeat(70))

    // Step 1: Get golden templates for each node
    console.log('\n[1/5] Loading golden templates...')
    const chatModel = JSON.parse(JSON.stringify(goldenTemplates.chatOpenRouter))
    const embeddings = JSON.parse(JSON.stringify(goldenTemplates.huggingFaceInferenceEmbeddings))
    const vectorStore = JSON.parse(JSON.stringify(goldenTemplates.supabase))
    const agent = JSON.parse(JSON.stringify(goldenTemplates.toolAgent))
    const retriever = JSON.parse(JSON.stringify(goldenTemplates.retrieverTool))
    const mcpTool = JSON.parse(JSON.stringify(goldenTemplates.customMcpTool))

    // Step 2: Configure node parameters
    console.log('[2/5] Configuring node parameters...')

    // Chat Model: Use Gemma (only free model with tool-calling)
    chatModel.id = 'chatOpenRouter_0'
    chatModel.data.id = 'chatOpenRouter_0'
    chatModel.data.inputs.modelName = 'google/gemma-4-26b-a4b-it:free'
    chatModel.data.inputs.temperature = 0.7
    chatModel.data.credential = 'ddeb2757-f8e2-4ed7-9647-5a113332b432'

    // Embeddings
    embeddings.id = 'huggingFaceInferenceEmbeddings_0'
    embeddings.data.id = 'huggingFaceInferenceEmbeddings_0'
    embeddings.data.inputs.model = 'intfloat/multilingual-e5-large-instruct'
    embeddings.data.inputs.endpoint = 'https://router.huggingface.co/hf-inference/models'
    embeddings.data.credential = 'aae7223f-da1b-47d5-bb26-1a2f1b2a3d5b'

    // Vector Store
    vectorStore.id = 'supabase_0'
    vectorStore.data.id = 'supabase_0'
    vectorStore.data.inputs.tableName = 'nyc'
    vectorStore.data.inputs.queryName = 'match_nyc_flowise'
    vectorStore.data.inputs.contentColumnName = 'context'
    vectorStore.data.inputs.vectorColumnName = 'embedding'
    vectorStore.data.inputs.embeddings = '{{huggingFaceInferenceEmbeddings_0.data.instance}}'
    vectorStore.data.credential = '0df85d26-749b-4fac-9a88-7399663a3099'

    // Agent
    agent.id = 'toolAgent_0'
    agent.data.id = 'toolAgent_0'
    agent.data.inputs.model = '{{chatOpenRouter_0.data.instance}}'
    agent.data.inputs.tools = ['{{retrieverTool_0.data.instance}}', '{{customMcpTool_0.data.instance}}']
    agent.data.inputs.systemMessage = 'You are a helpful assistant with knowledge about New York City.'

    // Retriever Tool
    retriever.id = 'retrieverTool_0'
    retriever.data.id = 'retrieverTool_0'
    retriever.data.inputs.name = 'nyc_search'
    retriever.data.inputs.description = 'Search for information about New York City in the knowledge base.'
    retriever.data.inputs.retriever = '{{supabase_0.data.instance}}'

    // MCP Tool
    mcpTool.id = 'customMcpTool_0'
    mcpTool.data.id = 'customMcpTool_0'
    mcpTool.data.inputs.mcpServer = 'nyc-data'
    mcpTool.data.inputs.toolName = 'query_nyc_data'

    // Step 3: Assemble flow
    console.log('[3/5] Assembling flowData...')
    const nodes = [chatModel, embeddings, vectorStore, agent, retriever, mcpTool]
    const connections = [
        { source: 'chatOpenRouter_0', target: 'toolAgent_0' },
        { source: 'huggingFaceInferenceEmbeddings_0', target: 'supabase_0' },
        { source: 'supabase_0', target: 'retrieverTool_0' },
        { source: 'retrieverTool_0', target: 'toolAgent_0' },
        { source: 'customMcpTool_0', target: 'toolAgent_0' }
    ]

    const assembly = assembleFlowData(nodes, connections, {
        name: 'NYC Knowledge Agent (Pipeline Test)',
        description: 'Test flow created with agent pipeline'
    })

    if (!assembly.valid || !assembly.flowData) {
        console.error('❌ Assembly failed:')
        assembly.errors.forEach((e) => console.error(`  - ${e}`))
        return
    }

    console.log('  ✅ Flow assembled successfully')
    console.log(`  📊 Nodes: ${assembly.flowData.nodes.length}`)
    console.log(`  📊 Edges: ${assembly.flowData.edges.length}`)

    // Step 4: Run testing pipeline
    console.log('\n[4/5] Running testing pipeline...')
    const result = await runTestingPipeline(assembly.flowData, {
        skipSmokeTest: true, // Skip API tests for now since Flowise may not be accessible
        skipIntegrationTest: true
    })

    // Step 5: Report results
    console.log('\n[5/5] Test Results:')
    console.log('='.repeat(70))

    for (const stage of result.stages) {
        const icon = stage.passed ? '✅' : '❌'
        console.log(`${icon} ${stage.stage} (${stage.durationMs}ms)`)

        if (stage.errors.length > 0) {
            for (const error of stage.errors) {
                console.log(`   → ${error}`)
            }
        }
    }

    console.log('='.repeat(70))
    console.log(`Overall: ${result.overall ? '✅ PASS' : '❌ FAIL'}`)

    if (result.errors.length > 0) {
        console.log('\nErrors:')
        result.errors.forEach((e) => console.log(`  - ${e}`))
    }

    // Validation checklist
    console.log('\nValidation Checklist:')
    console.log(`  ${chatModel.data.credential.includes('-') ? '✅' : '❌'} Chat model credential is UUID`)
    console.log(`  ${embeddings.data.credential.includes('-') ? '✅' : '❌'} Embeddings credential is UUID`)
    console.log(`  ${vectorStore.data.credential.includes('-') ? '✅' : '❌'} Vector store credential is UUID`)
    console.log(`  ${agent.data.inputs.model.includes('{{') ? '✅' : '❌'} Agent model uses template syntax`)
    console.log(`  ${agent.data.inputs.tools.every((t: string) => t.includes('{{')) ? '✅' : '❌'} Agent tools use template syntax`)
    console.log(`  ${vectorStore.data.inputs.embeddings.includes('{{') ? '✅' : '❌'} Vector store embeddings use template syntax`)
    console.log(`  ${retriever.data.inputs.retriever.includes('{{') ? '✅' : '❌'} Retriever uses template syntax`)

    return result
}

// Run if executed directly
if (require.main === module) {
    testNYCKnowledgeAgent()
        .then((result) => {
            process.exit(result?.overall ? 0 : 1)
        })
        .catch((error) => {
            console.error('Fatal error:', error)
            process.exit(1)
        })
}

export { testNYCKnowledgeAgent }
