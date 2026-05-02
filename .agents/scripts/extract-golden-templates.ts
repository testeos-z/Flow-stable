/**
 * Golden Template Extraction Script
 *
 * Extracts exact node JSON from Flowise by:
 * 1. Creating a temporary flow with the node
 * 2. Fetching the flow data via API
 * 3. Saving the node JSON as a golden template
 *
 * Usage: npx ts-node extract-golden-templates.ts
 */

import * as fs from 'fs'
import * as path from 'path'

const FLOWISE_API_URL = process.env.FLOWISE_API_URL || 'http://localhost:3000'
const TEMPLATES_DIR = path.join(__dirname, '..', 'schemas', 'golden-templates')

interface NodeType {
    name: string
    label: string
    category: string
}

// Node types to extract
const NODE_TYPES: NodeType[] = [
    { name: 'chatOpenRouter', label: 'OpenRouter', category: 'Chat Models' },
    { name: 'chatAnthropic', label: 'ChatAnthropic', category: 'Chat Models' },
    { name: 'supabase', label: 'Supabase', category: 'Vector Stores' },
    { name: 'huggingFaceInferenceEmbeddings', label: 'HuggingFace Inference Embeddings', category: 'Embeddings' },
    { name: 'toolAgent', label: 'Tool Agent', category: 'Agents' },
    { name: 'retrieverTool', label: 'Retriever Tool', category: 'Tools' },
    { name: 'customMcpTool', label: 'Custom MCP Tool', category: 'Tools' },
    { name: 'bufferMemory', label: 'Buffer Memory', category: 'Memory' }
]

async function fetchNodeFromFlowise(nodeType: NodeType): Promise<any> {
    // This would use the Flowise API to get the node structure
    // For now, we document the expected approach
    console.log(`Extracting template for: ${nodeType.name}`)

    // In production:
    // 1. Create a flow with just this node
    // 2. GET /api/v1/chatflow/{id}
    // 3. Extract node.data from response
    // 4. Delete temporary flow

    return {
        name: nodeType.name,
        extracted: false,
        note: 'Manual extraction required - drag node to canvas and copy JSON'
    }
}

async function main() {
    // Ensure templates directory exists
    if (!fs.existsSync(TEMPLATES_DIR)) {
        fs.mkdirSync(TEMPLATES_DIR, { recursive: true })
    }

    console.log('Golden Template Extraction')
    console.log('='.repeat(50))
    console.log(`API URL: ${FLOWISE_API_URL}`)
    console.log(`Output: ${TEMPLATES_DIR}`)
    console.log('')

    for (const nodeType of NODE_TYPES) {
        const template = await fetchNodeFromFlowise(nodeType)
        const outputPath = path.join(TEMPLATES_DIR, `${nodeType.name}.json`)

        fs.writeFileSync(outputPath, JSON.stringify(template, null, 2))
        console.log(`✓ ${nodeType.name} → ${outputPath}`)
    }

    console.log('')
    console.log('Extraction complete!')
    console.log('')
    console.log('Next steps:')
    console.log('1. Open Flowise UI')
    console.log('2. Create a new flow')
    console.log('3. Drag each node type to canvas')
    console.log('4. Save flow and copy node.data JSON')
    console.log('5. Paste into corresponding .json file')
}

main().catch(console.error)
