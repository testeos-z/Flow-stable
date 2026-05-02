// End-to-end pipeline test
// Simulates what flow-architect + flow-ing would do

import { assembleFlowData } from '../../.agents/skills/flow-architect/assembler.js'
import { goldenTemplates } from '../../.agents/schemas/golden-templates.js'

console.log('End-to-End Pipeline Test')
console.log('='.repeat(70))

// Step 1: flow-architect creates nodes using golden templates
console.log('\n[flow-architect] Creating nodes from golden templates...')

const chatModel = JSON.parse(JSON.stringify(goldenTemplates.chatOpenRouter))
const embeddings = JSON.parse(JSON.stringify(goldenTemplates.huggingFaceInferenceEmbeddings))
const vectorStore = JSON.parse(JSON.stringify(goldenTemplates.supabase))
const agent = JSON.parse(JSON.stringify(goldenTemplates.toolAgent))
const retriever = JSON.parse(JSON.stringify(goldenTemplates.retrieverTool))
const mcpTool = JSON.parse(JSON.stringify(goldenTemplates.customMcpTool))

// Configure nodes
chatModel.data.inputs.modelName = 'google/gemma-4-26b-a4b-it:free'
chatModel.data.credential = 'ddeb2757-f8e2-4ed7-9647-5a113332b432'

embeddings.data.inputs.model = 'intfloat/multilingual-e5-large-instruct'
embeddings.data.credential = 'aae7223f-da1b-47d5-bb26-1a2f1b2a3d5b'

vectorStore.data.inputs.tableName = 'nyc'
vectorStore.data.inputs.queryName = 'match_nyc_flowise'
vectorStore.data.inputs.embeddings = '{{huggingFaceInferenceEmbeddings_0.data.instance}}'
vectorStore.data.credential = '0df85d26-749b-4fac-9a88-7399663a3099'

agent.data.inputs.model = '{{chatOpenRouter_0.data.instance}}'
agent.data.inputs.tools = ['{{retrieverTool_0.data.instance}}', '{{customMcpTool_0.data.instance}}']

retriever.data.inputs.retriever = '{{supabase_0.data.instance}}'
mcpTool.data.inputs.mcpServer = 'nyc-data'

console.log('  ✅ 6 nodes configured')

// Step 2: Assemble flowData
console.log('\n[flow-architect] Assembling flowData...')
const assembly = assembleFlowData(
    [chatModel, embeddings, vectorStore, agent, retriever, mcpTool],
    [
        { source: 'chatOpenRouter_0', target: 'toolAgent_0' },
        { source: 'huggingFaceInferenceEmbeddings_0', target: 'supabase_0' },
        { source: 'supabase_0', target: 'retrieverTool_0' },
        { source: 'retrieverTool_0', target: 'toolAgent_0' },
        { source: 'customMcpTool_0', target: 'toolAgent_0' }
    ]
)

if (!assembly.valid) {
    console.error('❌ Assembly failed:', assembly.errors)
    process.exit(1)
}

console.log(`  ✅ Flow assembled: ${assembly.flowData.nodes.length} nodes, ${assembly.flowData.edges.length} edges`)

// Step 3: Validate credentials
console.log('\n[flow-ing] Validating credentials...')
import { validateCredential } from './dist/credentials.js'

const nodes = assembly.flowData.nodes
const credErrors = []
for (const node of nodes) {
    if (node.data?.credential) {
        const v = validateCredential(node.data.credential)
        if (!v.valid) credErrors.push(`${node.data.name}: ${v.error}`)
    }
}

if (credErrors.length > 0) {
    console.error('❌ Credential errors:', credErrors)
} else {
    console.log('  ✅ All credentials valid')
}

// Step 4: Check template syntax
console.log('\n[flow-ing] Checking template syntax...')
const templateRegex = /^\{\{[a-zA-Z0-9_]+\.data\.instance\}\}$/
const templateErrors = []

for (const node of nodes) {
    const inputs = node.data?.inputs || {}
    for (const [key, value] of Object.entries(inputs)) {
        if (typeof value === 'string' && value.includes('{{') && !templateRegex.test(value)) {
            templateErrors.push(`${node.data.name}.${key}: "${value}"`)
        }
    }
}

if (templateErrors.length > 0) {
    console.error('❌ Template syntax errors:', templateErrors)
} else {
    console.log('  ✅ Template syntax correct')
}

// Step 5: Summary
console.log('\n' + '='.repeat(70))
console.log('Pipeline Test Summary:')
console.log('  Nodes:', nodes.map((n) => n.data?.name).join(', '))
console.log('  Assembly:', assembly.valid ? '✅ PASS' : '❌ FAIL')
console.log('  Credentials:', credErrors.length === 0 ? '✅ PASS' : '❌ FAIL')
console.log('  Templates:', templateErrors.length === 0 ? '✅ PASS' : '❌ FAIL')
console.log('  Overall:', assembly.valid && credErrors.length === 0 && templateErrors.length === 0 ? '✅ READY TO CREATE' : '❌ HAS ERRORS')
console.log('='.repeat(70))
