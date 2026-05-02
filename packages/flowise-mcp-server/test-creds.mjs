// Quick test of credential tools
import { listCredentials, resolveCredential, validateCredential } from './dist/credentials.js'

console.log('Testing MCP Credential Tools:\n')

console.log('1. list_credentials (dev):')
const creds = listCredentials('dev')
console.log(creds.map((c) => ({ type: c.type, uuid: c.uuid })))

console.log('\n2. resolve_credential (openRouterApi):')
console.log(resolveCredential('openRouterApi', 'dev'))

console.log('\n3. resolve_credential (UUID):')
console.log(resolveCredential('ddeb2757-f8e2-4ed7-9647-5a113332b432', 'dev'))

console.log('\n4. validate_credential (UUID):')
console.log(validateCredential('ddeb2757-f8e2-4ed7-9647-5a113332b432'))

console.log('\n5. validate_credential (type name):')
console.log(validateCredential('openRouterApi'))
