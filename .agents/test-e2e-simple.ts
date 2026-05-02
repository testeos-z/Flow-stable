/**
 * End-to-End Pipeline Test
 *
 * Tests the complete agent pipeline by:
 * 1. Loading golden templates
 * 2. Configuring nodes with correct parameters
 * 3. Assembling flowData
 * 4. Running local validation (Zod + graph)
 * 5. Delegating to MCP tools for API operations
 *
 * IMPORTANT: This script does NOT call Flowise API directly.
 * It uses the MCP server (flow-validation) via stdio.
 * The MCP server handles authentication with its own .env config.
 */

import { assembleFlowData } from './skills/flow-architect/assembler'
import { runTestingPipeline, registerNodeValidator } from './testing-pipeline'
import { goldenTemplates } from './schemas/golden-templates'

// Register all validators
import { ChatOpenRouterNodeSchema } from './skills/node-specialist-chat-models/schemas/chatOpenRouter'
import { ToolAgentNodeSchema } from './skills/node-specialist-agents/schemas/toolAgent'

registerNodeValidator('chatOpenRouter', ChatOpenRouterNodeSchema)
registerNodeValidator('toolAgent', ToolAgentNodeSchema)

async function testPipeline() {
    console.log('='.repeat(70))
    console.log('PIPELINE E2E TEST: Simple Chat Agent')
    console.log('='.repeat(70))
    console.log('\nNOTE: This test validates the pipeline locally.')
    console.log('To create the flow in Flowise, use MCP tools:')
    console.log('  - flow-validation_validate_chatflow (validate before saving)')
    console.log('  - flow-control_create_chatflow (save to Flowise)')
    console.log('  - flow-validation_test_chatflow (run smoke tests)')

    // Step 1: Create nodes from golden templates
    console.log('\n[1/4] Loading golden templates...')
    const chatModel = JSON.parse(JSON.stringify(goldenTemplates.chatOpenRouter))
    const agent = JSON.parse(JSON.stringify(goldenTemplates.toolAgent))

    chatModel.id = 'chatOpenRouter_0'
    chatModel.data.id = 'chatOpenRouter_0'
    chatModel.data.inputs.modelName = 'google/gemma-4-26b-a4b-it:free'
    chatModel.data.credential = 'ddeb2757-f8e2-4ed7-9647-5a113332b432'

    agent.id = 'toolAgent_0'
    agent.data.id = 'toolAgent_0'
    agent.data.inputs.model = '{{chatOpenRouter_0.data.instance}}'
    agent.data.inputs.tools = []

    // Step 2: Assemble
    console.log('\n[2/4] Assembling flow...')
    const assembly = assembleFlowData([chatModel, agent], [{ source: 'chatOpenRouter_0', target: 'toolAgent_0' }])

    if (!assembly.valid) {
        console.error('❌ Assembly failed:')
        assembly.errors.forEach((e) => console.error(`  - ${e}`))
        process.exit(1)
    }

    console.log(`  ✅ ${assembly.flowData.nodes.length} nodes, ${assembly.flowData.edges.length} edges`)

    // Step 3: Run testing pipeline (local validation only)
    console.log('\n[3/4] Running local validation...')
    const result = await runTestingPipeline(assembly.flowData, {
        skipSmokeTest: true, // MCP handles API tests
        skipIntegrationTest: true
    })

    console.log('\nValidation Results:')
    for (const stage of result.stages) {
        const icon = stage.passed ? '✅' : '❌'
        console.log(`  ${icon} ${stage.stage} (${stage.durationMs}ms)`)
        stage.errors.forEach((e) => console.log(`     → ${e}`))
    }

    if (!result.overall) {
        console.error('\n❌ Local validation failed!')
        process.exit(1)
    }

    // Step 4: Report
    console.log('\n[4/4] Pipeline test complete!')
    console.log('\nTo create this flow in Flowise:')
    console.log('1. Use MCP tool: flow-validation_validate_chatflow')
    console.log('   - Validates credentials are UUIDs')
    console.log('   - Checks structure before saving')
    console.log('')
    console.log('2. Use MCP tool: flow-control_create_chatflow')
    console.log('   - Sends flowData to Flowise API')
    console.log('   - MCP server handles authentication')
    console.log('')
    console.log('3. Use MCP tool: flow-validation_test_chatflow')
    console.log('   - Runs smoke test (Hello prediction)')
    console.log('   - Runs integration test (tool invocation)')
    console.log('')
    console.log('FlowData JSON:')
    console.log(JSON.stringify(assembly.flowData, null, 2))
}

testPipeline().catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
})
