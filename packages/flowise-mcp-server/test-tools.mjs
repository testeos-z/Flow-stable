// Quick test of MCP server tools
import { handleListCredentials, handleResolveCredential, handleValidateChatflow } from './handlers.js'

async function test() {
    console.log('Testing MCP Tools:\n')

    // Test list_credentials
    console.log('1. list_credentials:')
    const creds = await handleListCredentials('dev')
    console.log(JSON.parse(creds.content[0].text))

    // Test resolve_credential
    console.log('\n2. resolve_credential (openRouterApi):')
    const resolved = await handleResolveCredential('openRouterApi', 'dev')
    console.log(JSON.parse(resolved.content[0].text))

    // Test validate_chatflow
    console.log('\n3. validate_chatflow (valid):')
    const valid = await handleValidateChatflow({
        flowData: {
            nodes: [
                {
                    id: 'test',
                    type: 'customNode',
                    position: { x: 0, y: 0 },
                    positionAbsolute: { x: 0, y: 0 },
                    data: { id: 'test', name: 'test', credential: 'ddeb2757-f8e2-4ed7-9647-5a113332b432' }
                }
            ],
            edges: []
        }
    })
    console.log(JSON.parse(valid.content[0].text))

    // Test validate_chatflow with invalid credential
    console.log('\n4. validate_chatflow (invalid credential):')
    const invalid = await handleValidateChatflow({
        flowData: {
            nodes: [
                {
                    id: 'test',
                    type: 'customNode',
                    position: { x: 0, y: 0 },
                    positionAbsolute: { x: 0, y: 0 },
                    data: { id: 'test', name: 'test', credential: 'openRouterApi' }
                }
            ],
            edges: []
        }
    })
    console.log(JSON.parse(invalid.content[0].text))
}

test().catch(console.error)
