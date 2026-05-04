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
    handleValidateAgentflow,
    handleListCredentialTypes,
    handleResolveCredential
} from './handlers.js'
import {
    handleGetMcpServerConfig,
    handleEnableMcpServer,
    handleUpdateMcpServerConfig,
    handleDisableMcpServer,
    handleRefreshMcpToken
} from './handlers/mcp-server-config.js'
import {
    handleFlowListTools,
    handleFlowGetTool,
    handleFlowCreateTool,
    handleFlowUpdateTool,
    handleFlowDeleteTool
} from './handlers/tools-management.js'
import {
    handleListCredentials,
    handleGetCredential,
    handleCreateCredential,
    handleUpdateCredential,
    handleDeleteCredential
} from './handlers/credentials-api.js'
import {
    handleCustomMcpList,
    handleCustomMcpGet,
    handleCustomMcpCreate,
    handleCustomMcpUpdate,
    handleCustomMcpDelete,
    handleCustomMcpGetTools,
    handleCustomMcpAuthorize
} from './handlers/custom-mcp-servers.js'
import { handleListVariables, handleCreateVariable, handleUpdateVariable, handleDeleteVariable } from './handlers/variables.js'
import { handleListApiKeys, handleCreateApiKey, handleUpdateApiKey, handleDeleteApiKey } from './handlers/apikey-management.js'
import {
    handleListAssistants,
    handleGetAssistant,
    handleCreateAssistant,
    handleUpdateAssistant,
    handleDeleteAssistant,
    handleGetAssistantChatModels,
    handleGetAssistantDocStores,
    handleGetAssistantTools,
    handleGenerateAssistantInstruction
} from './handlers/assistants.js'

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
    'Validate CHATFLOW flowData structure without saving. Checks for structural issues, ' +
        'missing viewport, invalid credentials, and common errors. Use this BEFORE creating or updating a CHATFLOW.',
    {
        flowData: z
            .object({
                nodes: z.array(z.any()).describe('Array of node objects'),
                edges: z.array(z.any()).describe('Array of edge objects')
            })
            .describe('The flow configuration to validate'),
        type: z.enum(['CHATFLOW', 'MULTIAGENT', 'ASSISTANT']).optional().default('CHATFLOW').describe('Type of flow')
    },
    async (params) => handleValidateChatflow(params)
)

// Tool: Validate Agentflow
server.tool(
    'validate_agentflow',
    'Validate AGENTFLOW flowData structure and semantics without saving. Checks for valid node types, ' +
        'exactly one Start node, ending nodes, Condition branches, Loop direction, and Agent configuration. ' +
        'Use this BEFORE creating or updating an AGENTFLOW.',
    {
        flowData: z
            .object({
                nodes: z.array(z.any()).describe('Array of node objects'),
                edges: z.array(z.any()).describe('Array of edge objects')
            })
            .describe('The AGENTFLOW configuration to validate')
    },
    async (params) => handleValidateAgentflow(params)
)

// Tool: List Credential Types (local registry)
server.tool(
    'list_credential_types',
    'List available credential types from the local hardcoded registry. Returns credential type names, descriptions, and UUIDs. ' +
        'Use this to get the correct UUID for a credential type (e.g., "openRouterApi" → UUID).',
    {
        env: z.string().optional().default('dev').describe('Environment (dev, qa, prod)')
    },
    async ({ env }) => handleListCredentialTypes(env)
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

// ======================
// MCP Server Config Tools
// ======================

// Tool: Get MCP Server Config
server.tool(
    'get_mcp_server_config',
    'Get the current MCP server configuration (enabled status, token, transport, port, baseUrl).',
    {},
    async () => handleGetMcpServerConfig(flowiseApi)
)

// Tool: Enable MCP Server
server.tool('enable_mcp_server', 'Enable the built-in Flowise MCP server so it can accept connections.', {}, async () =>
    handleEnableMcpServer(flowiseApi)
)

// Tool: Update MCP Server Config
server.tool(
    'update_mcp_server_config',
    'Update MCP server configuration. All fields optional — only provided fields are changed.',
    {
        transport: z.string().optional().describe('Transport type (e.g., "stdio", "sse")'),
        port: z.number().optional().describe('Port number for the MCP server'),
        baseUrl: z.string().optional().describe('Base URL for the MCP server')
    },
    async (params) => handleUpdateMcpServerConfig(flowiseApi, params)
)

// Tool: Disable MCP Server
server.tool('disable_mcp_server', 'Disable the MCP server. Flows using it will lose MCP access.', {}, async () =>
    handleDisableMcpServer(flowiseApi)
)

// Tool: Refresh MCP Token
server.tool(
    'refresh_mcp_token',
    'Generate/rotate the MCP server token. Old token is invalidated immediately. Returns the new token.',
    {},
    async () => handleRefreshMcpToken(flowiseApi)
)

// ======================
// Tools Management Tools (flow_ prefixed)
// ======================

// Tool: List Tools
server.tool(
    'flow_list_tools',
    'List all tools in the Flowise workspace. Supports pagination.',
    {
        page: z.number().optional().describe('Page number (default: 1)'),
        limit: z.number().optional().describe('Results per page (default: 50)')
    },
    async (params) => handleFlowListTools(flowiseApi, params)
)

// Tool: Get Tool
server.tool(
    'flow_get_tool',
    'Get a single tool by ID, including its full definition (name, type, icon, funcBody, etc.).',
    {
        id: z.string().describe('The ID of the tool to retrieve')
    },
    async ({ id }) => handleFlowGetTool(flowiseApi, id)
)

// Tool: Create Tool
server.tool(
    'flow_create_tool',
    'Create a new tool in Flowise (Custom Tool, Child Process, etc.).',
    {
        name: z.string().describe('Tool name'),
        type: z.string().describe('Tool type (e.g., "CustomTool", "ChildProcess")'),
        iconSrc: z.string().optional().describe('Icon URL for the tool'),
        funcBody: z.string().optional().describe('Function body (JavaScript code for CustomTool)'),
        description: z.string().optional().describe('Tool description')
    },
    async (params) => handleFlowCreateTool(flowiseApi, params)
)

// Tool: Update Tool
server.tool(
    'flow_update_tool',
    'Update an existing tool. Only provided fields are changed.',
    {
        id: z.string().describe('The ID of the tool to update'),
        name: z.string().optional().describe('New tool name'),
        type: z.string().optional().describe('New tool type'),
        iconSrc: z.string().optional().describe('New icon URL'),
        funcBody: z.string().optional().describe('New function body'),
        description: z.string().optional().describe('New description')
    },
    async (params) => {
        const { id, ...updateParams } = params
        return handleFlowUpdateTool(flowiseApi, id, updateParams)
    }
)

// Tool: Delete Tool
server.tool(
    'flow_delete_tool',
    'Delete a tool from Flowise. Tools referenced by active flows will return an error.',
    {
        id: z.string().describe('The ID of the tool to delete')
    },
    async ({ id }) => handleFlowDeleteTool(flowiseApi, id)
)

// ======================
// Credentials API Tools
// ======================

// Tool: List Credentials (API-based)
server.tool(
    'list_credentials',
    'List credentials managed via the Flowise API. Credential values are masked. Supports pagination.',
    {
        page: z.number().optional().describe('Page number (default: 1)'),
        limit: z.number().optional().describe('Results per page (default: 50)')
    },
    async (params) => handleListCredentials(flowiseApi, params)
)

// Tool: Get Credential
server.tool(
    'get_credential',
    'Get a single credential by ID. Returns credential type, name, and masked value.',
    {
        id: z.string().describe('The ID of the credential to retrieve')
    },
    async ({ id }) => handleGetCredential(flowiseApi, id)
)

// Tool: Create Credential
server.tool(
    'create_credential',
    'Create a new credential in Flowise. WARNING: plainDataEnv contains plaintext API keys — do NOT log these values.',
    {
        name: z.string().describe('Display name for the credential'),
        credentialName: z.string().describe('Credential type name (e.g., "openRouterApi", "supabaseApi")'),
        plainDataEnv: z.record(z.string(), z.string()).describe('Key-value pairs for the credential (e.g., { openRouterApiKey: "sk-..." })')
    },
    async (params) => handleCreateCredential(flowiseApi, params)
)

// Tool: Update Credential
server.tool(
    'update_credential',
    'Update an existing credential. Only provided fields are changed.',
    {
        id: z.string().describe('The ID of the credential to update'),
        name: z.string().optional().describe('New display name'),
        credentialName: z.string().optional().describe('New credential type name'),
        plainDataEnv: z.record(z.string(), z.string()).optional().describe('New key-value pairs for the credential')
    },
    async (params) => {
        const { id, ...updateParams } = params
        return handleUpdateCredential(flowiseApi, id, updateParams)
    }
)

// Tool: Delete Credential
server.tool(
    'delete_credential',
    'Delete a credential from Flowise. Credentials referenced by flows will return an error.',
    {
        id: z.string().describe('The ID of the credential to delete')
    },
    async ({ id }) => handleDeleteCredential(flowiseApi, id)
)

// ======================
// Custom MCP Servers Tools
// ======================

// Tool: List Custom MCP Servers
server.tool(
    'list_custom_mcp_servers',
    'List all custom MCP servers configured in the current workspace. Returns server IDs, names, transport types, and enabled status.',
    {},
    async () => handleCustomMcpList(flowiseApi)
)

// Tool: Get Custom MCP Server
server.tool(
    'get_custom_mcp_server',
    'Get a single custom MCP server by ID, including full configuration (transport, url/command, environment variables).',
    {
        id: z.string().describe('The ID of the custom MCP server to retrieve')
    },
    async ({ id }) => handleCustomMcpGet(flowiseApi, id)
)

// Tool: Create Custom MCP Server
server.tool(
    'create_custom_mcp_server',
    'Create a new custom MCP server configuration. Supports both stdio (command/args) and SSE (url) transports.',
    {
        name: z.string().describe('Display name for the custom MCP server'),
        command: z.string().optional().describe('Command to execute (for stdio transport)'),
        args: z.array(z.string()).optional().describe('Command arguments'),
        env: z.record(z.string(), z.string()).optional().describe('Environment variables for the server process'),
        description: z.string().optional().describe('Human-readable description of the server')
    },
    async (params) => handleCustomMcpCreate(flowiseApi, params)
)

// Tool: Update Custom MCP Server
server.tool(
    'update_custom_mcp_server',
    'Update an existing custom MCP server configuration. All fields optional — only provided fields are changed.',
    {
        id: z.string().describe('The ID of the custom MCP server to update'),
        name: z.string().optional().describe('New display name'),
        command: z.string().optional().describe('New command'),
        args: z.array(z.string()).optional().describe('New command arguments'),
        env: z.record(z.string(), z.string()).optional().describe('New environment variables'),
        description: z.string().optional().describe('New description')
    },
    async (params) => {
        const { id, ...updateParams } = params
        return handleCustomMcpUpdate(flowiseApi, id, updateParams)
    }
)

// Tool: Delete Custom MCP Server
server.tool(
    'delete_custom_mcp_server',
    'Delete a custom MCP server configuration. Servers referenced by active flows will return an error.',
    {
        id: z.string().describe('The ID of the custom MCP server to delete')
    },
    async ({ id }) => handleCustomMcpDelete(flowiseApi, id)
)

// Tool: Get Custom MCP Server Tools
server.tool(
    'get_custom_mcp_server_tools',
    'Get the list of tools discovered from an authorized custom MCP server. Each tool includes name, description, and input schema.',
    {
        id: z.string().describe('The ID of the custom MCP server')
    },
    async ({ id }) => handleCustomMcpGetTools(flowiseApi, id)
)

// Tool: Authorize Custom MCP Server
server.tool(
    'authorize_custom_mcp_server',
    'Connect to a custom MCP server and discover its available tools. ' +
        'This is a long-running operation (5-15 seconds) because it establishes a live connection ' +
        'to the external MCP server. On success the server is marked as authorized.',
    {
        id: z.string().describe('The ID of the custom MCP server to authorize')
    },
    async ({ id }) => handleCustomMcpAuthorize(flowiseApi, id)
)

// ======================
// Variables Tools
// ======================

// Tool: List Variables
server.tool(
    'list_variables',
    'List all variables in the Flowise workspace. Variables are key-value pairs usable across flows for configuration like API URLs or feature flags.',
    {},
    async () => handleListVariables(flowiseApi)
)

// Tool: Create Variable
server.tool(
    'create_variable',
    'Create a new variable in the Flowise workspace.',
    {
        variableName: z.string().describe('Variable name (unique identifier in the workspace)'),
        value: z.string().describe('Variable value'),
        type: z.enum(['static', 'runtime']).optional().describe('Variable type: static for fixed values, runtime for dynamic values')
    },
    async (params) => handleCreateVariable(flowiseApi, params)
)

// Tool: Update Variable
server.tool(
    'update_variable',
    'Update an existing variable. Only provided fields are changed.',
    {
        id: z.string().describe('The ID of the variable to update'),
        variableName: z.string().optional().describe('New variable name'),
        value: z.string().optional().describe('New variable value'),
        type: z.enum(['static', 'runtime']).optional().describe('New variable type')
    },
    async (params) => {
        const { id, ...updateParams } = params
        return handleUpdateVariable(flowiseApi, id, updateParams)
    }
)

// Tool: Delete Variable
server.tool(
    'delete_variable',
    'Delete a variable from the workspace. Flows referencing this variable may break.',
    {
        id: z.string().describe('The ID of the variable to delete')
    },
    async ({ id }) => handleDeleteVariable(flowiseApi, id)
)

// ======================
// API Key Management Tools
// ======================

// Tool: List API Keys
server.tool(
    'list_api_keys',
    'List all API keys in the Flowise workspace. Key values are masked — only names and creation dates are visible.',
    {},
    async () => handleListApiKeys(flowiseApi)
)

// Tool: Create API Key
server.tool(
    'create_api_key',
    'Create a new API key for programmatic access to Flowise. IMPORTANT: the full key value is returned ONCE — capture it immediately as it cannot be retrieved again.',
    {
        apiKeyName: z.string().describe('Display name for the API key (e.g., "ci-deploy-key")')
    },
    async (params) => handleCreateApiKey(flowiseApi, params)
)

// Tool: Update API Key
server.tool(
    'update_api_key',
    'Update an existing API key (rename). The key value itself is unchanged.',
    {
        id: z.string().describe('The ID of the API key to update'),
        apiKeyName: z.string().optional().describe('New display name for the API key')
    },
    async (params) => {
        const { id, ...updateParams } = params
        return handleUpdateApiKey(flowiseApi, id, updateParams)
    }
)

// Tool: Delete API Key
server.tool(
    'delete_api_key',
    'Delete (revoke) an API key. Any client using this key immediately loses access. Deleting the last key may lock out all API access.',
    {
        id: z.string().describe('The ID of the API key to delete')
    },
    async ({ id }) => handleDeleteApiKey(flowiseApi, id)
)

// ======================
// Assistants Tools
// ======================

// Tool: List Assistants
server.tool(
    'list_assistants',
    'List all assistants in the Flowise workspace. Returns assistant IDs, names, descriptions, and icons.',
    {},
    async () => handleListAssistants(flowiseApi)
)

// Tool: Get Assistant
server.tool(
    'get_assistant',
    'Get a single assistant by ID, including full configuration: instructions, chat model refs, doc store refs, tool refs, quota, and temperature.',
    {
        id: z.string().describe('The ID of the assistant to retrieve')
    },
    async ({ id }) => handleGetAssistant(flowiseApi, id)
)

// Tool: Create Assistant
server.tool(
    'create_assistant',
    'Create a new assistant with name, description, icon, and optional configuration details.',
    {
        name: z.string().describe('Display name for the assistant'),
        description: z.string().optional().describe('Short description of what the assistant does'),
        iconSrc: z.string().optional().describe('Icon URL for the assistant'),
        details: z
            .record(z.string(), z.any())
            .optional()
            .describe('Additional configuration (instructions, temperature, chatModels, docStores, tools, etc.)')
    },
    async (params) => handleCreateAssistant(flowiseApi, params)
)

// Tool: Update Assistant
server.tool(
    'update_assistant',
    'Update an existing assistant. All fields optional — only provided fields are changed.',
    {
        id: z.string().describe('The ID of the assistant to update'),
        name: z.string().optional().describe('New display name'),
        description: z.string().optional().describe('New description'),
        iconSrc: z.string().optional().describe('New icon URL'),
        details: z.record(z.string(), z.any()).optional().describe('New configuration details')
    },
    async (params) => {
        const { id, ...updateParams } = params
        return handleUpdateAssistant(flowiseApi, id, updateParams)
    }
)

// Tool: Delete Assistant
server.tool(
    'delete_assistant',
    'Delete an assistant from the workspace.',
    {
        id: z.string().describe('The ID of the assistant to delete')
    },
    async ({ id }) => handleDeleteAssistant(flowiseApi, id)
)

// Tool: Get Assistant Chat Models
server.tool(
    'get_assistant_chat_models',
    'Get the list of available chat models for assistants. Returns provider name, model name, and default configuration.',
    {},
    async () => handleGetAssistantChatModels(flowiseApi)
)

// Tool: Get Assistant Document Stores
server.tool(
    'get_assistant_doc_stores',
    'Get the list of available document stores for assistants. Returns store names, types, and vector counts.',
    {},
    async () => handleGetAssistantDocStores(flowiseApi)
)

// Tool: Get Assistant Tools
server.tool(
    'get_assistant_tools',
    'Get the list of available tools for assistants. Returns tool names, types, and descriptions.',
    {},
    async () => handleGetAssistantTools(flowiseApi)
)

// Tool: Generate Assistant Instruction
server.tool(
    'generate_assistant_instruction',
    'Generate AI-powered assistant instructions from a prompt. This is a long-running operation (10-30 seconds) because the Flowise server calls an LLM internally to expand the instruction.',
    {
        prompt: z.string().describe('Base instruction to expand on (e.g., "A helpful coding assistant")'),
        context: z.record(z.string(), z.any()).optional().describe('Additional context for the generation (tone, audience, etc.)')
    },
    async (params) => handleGenerateAssistantInstruction(flowiseApi, params)
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
