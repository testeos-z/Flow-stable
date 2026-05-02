// Query both chatflows for comparison
import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
    host: 'shinkansen.proxy.rlwy.net',
    port: 42841,
    database: 'railway',
    user: 'postgres',
    password: 'ZymZkNDIsArJLsOQTSzhaKDweMJPPVsx',
    ssl: false
})

async function queryChatflow(id, label) {
    const client = await pool.connect()
    try {
        const result = await client.query('SELECT id, name, "flowData" FROM "chat_flow" WHERE id = $1', [id])
        const row = result.rows[0]
        if (!row) {
            console.log(`\n=== ${label} (${id}) ===`)
            console.log('NOT FOUND')
            return
        }
        const flowData = JSON.parse(row.flowData)

        console.log(`\n=== ${label} ===`)
        console.log(`Name: ${row.name}`)
        console.log(`ID: ${id}`)
        console.log(`Nodes: ${flowData.nodes?.length || 0}`)
        console.log(`Edges: ${flowData.edges?.length || 0}`)
        console.log(`Viewport: ${JSON.stringify(flowData.viewport || 'MISSING')}`)

        // Check node types
        if (flowData.nodes) {
            const types = {}
            flowData.nodes.forEach((n) => {
                types[n.data?.type || 'unknown'] = (types[n.data?.type || 'unknown'] || 0) + 1
            })
            console.log('Node types:', JSON.stringify(types, null, 2))
        }

        // Check for missing required fields in nodes
        if (flowData.nodes) {
            const issues = []
            flowData.nodes.forEach((n, i) => {
                if (!n.positionAbsolute) issues.push(`Node ${i} (${n.id}): missing positionAbsolute`)
                if (!n.width) issues.push(`Node ${i} (${n.id}): missing width`)
                if (!n.height) issues.push(`Node ${i} (${n.id}): missing height`)
                if (n.selected === undefined) issues.push(`Node ${i} (${n.id}): missing selected`)
                if (n.dragging === undefined) issues.push(`Node ${i} (${n.id}): missing dragging`)
                if (!n.handleBounds) issues.push(`Node ${i} (${n.id}): missing handleBounds`)
            })
            if (issues.length > 0) {
                console.log('\n⚠️  ISSUES FOUND:')
                issues.forEach((i) => console.log('  -', i))
            } else {
                console.log('\n✅ No node field issues')
            }
        }

        // Check edge issues
        if (flowData.edges) {
            const edgeIssues = []
            flowData.edges.forEach((e, i) => {
                if (!e.sourceHandle && e.sourceHandle !== null) edgeIssues.push(`Edge ${i} (${e.id}): missing sourceHandle`)
                if (!e.targetHandle && e.targetHandle !== null) edgeIssues.push(`Edge ${i} (${e.id}): missing targetHandle`)
                if (!e.type) edgeIssues.push(`Edge ${i} (${e.id}): missing type`)
                if (!e.data) edgeIssues.push(`Edge ${i} (${e.id}): missing data`)
            })
            if (edgeIssues.length > 0) {
                console.log('\n⚠️  EDGE ISSUES:')
                edgeIssues.forEach((i) => console.log('  -', i))
            }
        }

        // Key difference check
        const critical = []
        if (!flowData.viewport) critical.push('MISSING viewport — CANVAS WILL NOT RENDER')
        if (!Array.isArray(flowData.nodes)) critical.push('nodes is not an array')
        if (!Array.isArray(flowData.edges)) critical.push('edges is not an array')
        if (critical.length > 0) {
            console.log('\n🔴 CRITICAL:')
            critical.forEach((c) => console.log('  -', c))
        }
    } catch (err) {
        console.error(`Error for ${label}:`, err.message)
    } finally {
        client.release()
    }
}

async function main() {
    const FAILING_ID = 'fe5c4e0f-a219-45f2-9b23-0c780cf01307'
    const WORKING_ID = '409dc550-19a7-4d67-9cd2-5b8b2af0973e'

    await queryChatflow(FAILING_ID, '🔴 FAILING Chatflow')
    await queryChatflow(WORKING_ID, '🟢 WORKING Chatflow')

    await pool.end()
}

main().catch((e) => console.error('Fatal:', e.message))
