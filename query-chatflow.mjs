// Full analysis - show complete flowData structure
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

async function main() {
    const client = await pool.connect()

    try {
        const result = await client.query('SELECT * FROM "chat_flow" WHERE id = $1', ['fe5c4e0f-a219-45f2-9b23-0c780cf01307'])

        const chatflow = result.rows[0]
        const flowData = JSON.parse(chatflow.flowData)

        console.log('=== COMPLETE flowData JSON ===')
        console.log(JSON.stringify(flowData, null, 2))

        console.log('\n\n=== What Flowise Canvas Expects ===')
        console.log(`
Flowise React Flow espera:
{
  "nodes": [...],
  "edges": [...],
  "viewport": { "x": number, "y": number, "zoom": number }
}

Lo que tenemos:
{
  "nodes": ${flowData.nodes ? '✓' : '✗'},
  "edges": ${flowData.edges ? '✓' : '✗'},
  "viewport": ${flowData.viewport ? JSON.stringify(flowData.viewport) : '✗ FALTANTE'}
}
    `)
    } catch (err) {
        console.error('Error:', err.message)
    } finally {
        client.release()
        await pool.end()
    }
}

main()
