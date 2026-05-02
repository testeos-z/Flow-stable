/**
 * Chatflow DB Operations
 *
 * Direct database access for diagnosing and repairing chatflows.
 * This bypasses the Flowise API which strips viewport on save.
 */

import pg from 'pg'

const { Pool } = pg

function getPool() {
    const pool = new Pool({
        host: process.env.FLOWISE_DB_HOST,
        port: parseInt(process.env.FLOWISE_DB_PORT || '5432'),
        database: process.env.FLOWISE_DB_NAME,
        user: process.env.FLOWISE_DB_USER,
        password: process.env.FLOWISE_DB_PASSWORD,
        ssl: process.env.FLOWISE_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    })
    return pool
}

export async function diagnoseChatflow(chatflowId: string): Promise<any> {
    const pool = getPool()
    const client = await pool.connect()

    try {
        const result = await client.query('SELECT * FROM "chat_flow" WHERE id = $1', [chatflowId])

        if (result.rows.length === 0) {
            return { found: false, message: 'Chatflow not found' }
        }

        const chatflow = result.rows[0]
        const flowData = JSON.parse(chatflow.flowData)

        const issues: string[] = []

        if (!flowData.viewport) {
            issues.push('Missing viewport')
        }

        if (!flowData.nodes || !Array.isArray(flowData.nodes)) {
            issues.push('Invalid or missing nodes array')
        }

        if (!flowData.edges || !Array.isArray(flowData.edges)) {
            issues.push('Invalid or missing edges array')
        }

        return {
            found: true,
            chatflowId,
            name: chatflow.name,
            issues,
            nodeCount: flowData.nodes?.length || 0,
            edgeCount: flowData.edges?.length || 0,
            hasViewport: !!flowData.viewport
        }
    } finally {
        client.release()
        await pool.end()
    }
}

export async function repairChatflow(chatflowId: string): Promise<any> {
    const pool = getPool()
    const client = await pool.connect()

    try {
        const result = await client.query('SELECT * FROM "chat_flow" WHERE id = $1', [chatflowId])

        if (result.rows.length === 0) {
            return { success: false, message: 'Chatflow not found' }
        }

        const chatflow = result.rows[0]
        const flowData = JSON.parse(chatflow.flowData)

        const repairs: string[] = []

        if (!flowData.viewport) {
            flowData.viewport = { x: 0, y: 0, zoom: 1 }
            repairs.push('Added default viewport')
        }

        if (!flowData.nodes) {
            flowData.nodes = []
            repairs.push('Initialized empty nodes array')
        }

        if (!flowData.edges) {
            flowData.edges = []
            repairs.push('Initialized empty edges array')
        }

        await client.query('UPDATE "chat_flow" SET "flowData" = $1 WHERE id = $2', [JSON.stringify(flowData), chatflowId])

        return {
            success: true,
            chatflowId,
            repairs,
            message: `Repaired ${repairs.length} issues`
        }
    } finally {
        client.release()
        await pool.end()
    }
}
