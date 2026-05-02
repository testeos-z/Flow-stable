#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { createRequire } from 'module'
import { createFlowiseApiClient, getDefaultConfig } from './flowise-api.js'
import {
    handleCreatePrediction,
    handleCreatePredictionWithHistory,
    handleCreatePredictionWithFiles,
    handleCreatePredictionWithLead,
    handleListChatflows,
    handleGetChatflow,
    handleCreateChatflow,
    handleUpdateChatflow,
    handleDeleteChatflow,
    handleListNodes,
    handleGetNodesByCategory,
    handleGetNode,
    handleDiagnoseChatflow,
    handleRepairChatflow,
    handleTestChatflow,
    handleValidateChatflow,
    handleListCredentials,
    handleResolveCredential
} from './handlers.js'

const require = createRequire(import.meta.url)
const { FlowiseClient } = require('flowise-sdk')

// Get configuration from environment variables
const config = getDefaultConfig()

// Initialize Flowise SDK client
const flowiseClient = new FlowiseClient({
    baseUrl: config.baseUrl,
    apiKey: config.apiKey
})

// Initialize Flowise API client for direct API calls
const flowiseApi = createFlowiseApiClient(config)

// Create MCP server
const server = new McpServer({
    name: 'flowise-mcp',
    version: '1.0.0'
})

// Tool: Create Prediction (run a chatflow)
server.tool(
    'create_prediction',
    'Run a Flowise chatflow with a question and get a response. Use this to interact with AI workflows configured in Flowise.',
    {
        chatflowId: z.string().describe('The ID of the chatflow to run'),
        question: z.string().describe('The question or prompt to send to the chatflow'),
        chatId: z.string().optional().describe('Optional session ID for conversation continuity'),
        overrideConfig: z.record(z.string(), z.any()).optional().describe('Optional configuration overrides for the chatflow')
    },
    async (params) => handleCreatePrediction(flowiseClient, params)
)

// Tool: Create Prediction with History
server.tool(
    'create_prediction_with_history',
    'Run a Flowise chatflow with conversation history for context-aware responses.',
    {
        chatflowId: z.string().describe('The ID of the chatflow to run'),
        question: z.string().describe('The question or prompt to send to the chatflow'),
        history: z
            .array(
                z.object({
                    message: z.string(),
                    type: z.enum(['apiMessage', 'userMessage'])
                })
            )
            .describe('Previous messages in the conversation'),
        chatId: z.string().optional().describe('Optional session ID for conversation continuity'),
        overrideConfig: z.record(z.string(), z.any()).optional().describe('Optional configuration overrides for the chatflow')
    },
    async (params) => handleCreatePredictionWithHistory(flowiseClient, params)
)

// Tool: Create Prediction with File Upload
server.tool(
    'create_prediction_with_files',
    'Run a Flowise chatflow with file attachments (images, documents, etc.).',
    {
        chatflowId: z.string().describe('The ID of the chatflow to run'),
        question: z.string().describe('The question or prompt to send to the chatflow'),
        uploads: z
            .array(
                z.object({
                    data: z.string().optional().describe('Base64 encoded file data'),
                    type: z.string().describe("File type (e.g., 'file', 'url')"),
                    name: z.string().describe('File name'),
                    mime: z.string().describe("MIME type (e.g., 'image/png', 'application/pdf')")
                })
            )
            .describe('Files to upload with the request'),
        chatId: z.string().optional().describe('Optional session ID for conversation continuity'),
        overrideConfig: z.record(z.string(), z.any()).optional().describe('Optional configuration overrides for the chatflow')
    },
    async (params) => handleCreatePredictionWithFiles(flowiseClient, params)
)

// Tool: Create Prediction with Lead Email
server.tool(
    'create_prediction_with_lead',
    'Run a Flowise chatflow and capture a lead email for the conversation.',
    {
        chatflowId: z.string().describe('The ID of the chatflow to run'),
        question: z.string().describe('The question or prompt to send to the chatflow'),
        leadEmail: z.string().email().describe('Email address of the lead/user'),
        chatId: z.string().optional().describe('Optional session ID for conversation continuity'),
        overrideConfig: z.record(z.string(), z.any()).optional().describe('Optional configuration overrides for the chatflow')
    },
    async (params) => handleCreatePredictionWithLead(flowiseClient, params)
)

// Tool: List Chatflows
server.tool('list_chatflows', 'List all chatflows available in Flowise. Returns chatflow IDs, names, and metadata.', {}, async () =>
    handleListChatflows(flowiseApi)
)

// Tool: Get Chatflow
server.tool(
    'get_chatflow',
    'Get a specific chatflow by ID, including its full configuration with nodes and edges.',
    {
        chatflowId: z.string().describe('The ID of the chatflow to retrieve')
    },
    async ({ chatflowId }) => handleGetChatflow(flowiseApi, chatflowId)
)

// Tool: Create Chatflow
server.tool(
    'create_chatflow',
    'Create a new chatflow in Flowise with specified nodes and edges configuration.',
    {
        name: z.string().describe('Name of the chatflow'),
        flowData: z
            .object({
                nodes: z.array(z.any()).describe('Array of node objects with id, position, type, and data'),
                edges: z.array(z.any()).describe('Array of edge objects connecting nodes')
            })
            .describe('The flow configuration with nodes and edges'),
        type: z.enum(['CHATFLOW', 'AGENTFLOW', 'MULTIAGENT', 'ASSISTANT']).optional().default('CHATFLOW').describe('Type of chatflow'),
        chatbotConfig: z.record(z.string(), z.any()).optional().describe('Optional chatbot configuration')
    },
    async (params) => handleCreateChatflow(flowiseApi, params)
)

// Tool: Update Chatflow
server.tool(
    'update_chatflow',
    "Update an existing chatflow's configuration, nodes, edges, or metadata.",
    {
        chatflowId: z.string().describe('The ID of the chatflow to update'),
        name: z.string().optional().describe('New name for the chatflow'),
        flowData: z
            .object({
                nodes: z.array(z.any()).describe('Array of node objects'),
                edges: z.array(z.any()).describe('Array of edge objects')
            })
            .optional()
            .describe('Updated flow configuration'),
        chatbotConfig: z.record(z.string(), z.any()).optional().describe('Updated chatbot configuration')
    },
    async (params) => handleUpdateChatflow(flowiseApi, params)
)

// Tool: Delete Chatflow
server.tool(
    'delete_chatflow',
    'Delete a chatflow from Flowise. This action is irreversible.',
    {
        chatflowId: z.string().describe('The ID of the chatflow to delete')
    },
    async ({ chatflowId }) => handleDeleteChatflow(flowiseApi, chatflowId)
)

// Tool: List Nodes
server.tool('list_nodes', 'List all available node types in Flowise that can be used to build chatflows.', {}, async () =>
    handleListNodes(flowiseApi)
)

// Tool: Get Nodes by Category
server.tool(
    'get_nodes_by_category',
    "Get all nodes in a specific category (e.g., 'Chat Models', 'Agents', 'Memory', 'Tools').",
    {
        category: z.string().describe("The category name (e.g., 'Chat Models', 'Agents', 'Memory', 'Chains', 'Tools')")
    },
    async ({ category }) => handleGetNodesByCategory(flowiseApi, category)
)

// Tool: Get Node by Name
server.tool(
    'get_node',
    'Get detailed information about a specific node type by its name.',
    {
        nodeName: z.string().describe("The name of the node (e.g., 'chatOpenAI', 'conversationalAgent')")
    },
    async ({ nodeName }) => handleGetNode(flowiseApi, nodeName)
)

// Tool: Diagnose Chatflow
server.tool(
    'diagnose_chatflow',
    'Diagnose a chatflow by checking for missing fields (viewport, node metadata) directly in the database. ' +
        'Use this when a chatflow crashes the canvas or was created via API. ' +
        'Returns a report of issues found. Requires FLOWISE_DB_* env vars.',
    {
        chatflowId: z.string().describe('The ID of the chatflow to diagnose')
    },
    async ({ chatflowId }) => handleDiagnoseChatflow(chatflowId)
)

// Tool: Repair Chatflow
server.tool(
    'repair_chatflow',
    'Repair a chatflow by applying automatic fixes (viewport, node metadata) and updating the database directly. ' +
        'This bypasses the Flowise API which strips viewport on save. ' +
        'Returns a list of fields that were repaired. Requires FLOWISE_DB_* env vars.',
    {
        chatflowId: z.string().describe('The ID of the chatflow to repair')
    },
    async ({ chatflowId }) => handleRepairChatflow(chatflowId)
)

// Tool: Test Chatflow
server.tool(
    'test_chatflow',
    'Run smoke and integration tests on a chatflow. Creates a temporary copy, runs predictions, ' +
        'and reports results. Useful for validating flows before production use.',
    {
        chatflowId: z.string().describe('The ID of the chatflow to test')
    },
    async ({ chatflowId }) => handleTestChatflow(flowiseApi, chatflowId)
)

// Tool: Validate Chatflow
server.tool(
    'validate_chatflow',
    'Validate flowData structure without saving. Checks for structural issues, ' +
        'missing viewport, invalid credentials, and common errors. Use this BEFORE creating or updating a flow.',
    {
        flowData: z
            .object({
                nodes: z.array(z.any()).describe('Array of node objects'),
                edges: z.array(z.any()).describe('Array of edge objects')
            })
            .describe('The flow configuration to validate')
    },
    async (params) => handleValidateChatflow(params)
)

// Tool: List Credentials
server.tool(
    'list_credentials',
    'List available credentials in the registry. Returns credential types, names, and UUIDs. ' +
        'Use this to get the correct UUID for a credential type (e.g., "openRouterApi" → UUID).',
    {
        env: z.string().optional().default('dev').describe('Environment (dev, qa, prod)')
    },
    async ({ env }) => handleListCredentials(env)
)

// Tool: Resolve Credential
server.tool(
    'resolve_credential',
    'Resolve a credential type name to its UUID. If given a UUID, returns it as-is. ' +
        'Use this when you need to convert "openRouterApi" to its actual UUID.',
    {
        type: z.string().describe('Credential type name (e.g., "openRouterApi") or UUID'),
        env: z.string().optional().default('dev').describe('Environment (dev, qa, prod)')
    },
    async ({ type, env }) => handleResolveCredential(type, env)
)

// Start the server
async function main() {
    const transport = new StdioServerTransport()
    await server.connect(transport)
    console.error('Flowise MCP server running on stdio')
}

main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
})
