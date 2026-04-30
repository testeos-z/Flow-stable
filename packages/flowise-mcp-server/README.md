# Flowise MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that provides programmatic integration with [Flowise](https://flowiseai.com/) AI workflow platform. This enables LLM-based tools like Claude Code to create, manage, and run Flowise chatflows and agentflows.

## Features

-   **Run Predictions**: Execute chatflows with questions, conversation history, file uploads, or lead capture
-   **Manage Chatflows**: Create, update, delete, and list chatflows programmatically
-   **Node Discovery**: List all available nodes and get detailed specifications for building flows
-   **Full Flow Types**: Supports CHATFLOW, AGENTFLOW, MULTIAGENT, and ASSISTANT types

## Prerequisites

-   [Node.js](https://nodejs.org/) 20+
-   [pnpm](https://pnpm.io/) package manager
-   A running [Flowise](https://github.com/FlowiseAI/Flowise) instance

## Installation

```bash
# Clone the repository
git clone https://github.com/wksbx/flowise-mcp-server.git
cd flowise-mcp-server

# Install dependencies
pnpm install

# Build the project
pnpm build
```

## Configuration

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit `.env` with your Flowise settings:

```env
FLOWISE_BASE_URL=http://localhost:3000
FLOWISE_API_KEY=your-api-key-here
```

-   `FLOWISE_BASE_URL`: URL where your Flowise instance is running
-   `FLOWISE_API_KEY`: API key from Flowise (Settings > API Keys)

## Usage

### Running Directly

```bash
pnpm start
```

### Running with Docker

```bash
# Build the Docker image
pnpm docker:build

# Run the container
pnpm docker:run
```

### Configuring with MCP Clients

Add to your MCP client configuration (e.g., Claude Desktop, Claude Code):

**Using Node directly:**

```json
{
    "mcpServers": {
        "flowise": {
            "command": "node",
            "args": ["/path/to/flowise-mcp-server/dist/index.js"],
            "env": {
                "FLOWISE_BASE_URL": "http://localhost:3000",
                "FLOWISE_API_KEY": "your-api-key-here"
            }
        }
    }
}
```

**Using Docker:**

```json
{
    "mcpServers": {
        "flowise": {
            "command": "docker",
            "args": [
                "run",
                "-i",
                "--rm",
                "--add-host=host.docker.internal:host-gateway",
                "--env-file",
                "/path/to/your/.env",
                "flowise-mcp-server"
            ]
        }
    }
}
```

## Available Tools

### Prediction Tools

| Tool                             | Description                                   |
| -------------------------------- | --------------------------------------------- |
| `create_prediction`              | Run a chatflow with a question                |
| `create_prediction_with_history` | Run with conversation history for context     |
| `create_prediction_with_files`   | Run with file attachments (images, documents) |
| `create_prediction_with_lead`    | Run and capture lead email                    |

### Chatflow Management

| Tool              | Description                             |
| ----------------- | --------------------------------------- |
| `list_chatflows`  | List all available chatflows            |
| `get_chatflow`    | Get a specific chatflow's configuration |
| `create_chatflow` | Create a new chatflow                   |
| `update_chatflow` | Update an existing chatflow             |
| `delete_chatflow` | Delete a chatflow (irreversible)        |

### Node Discovery

| Tool                    | Description                                |
| ----------------------- | ------------------------------------------ |
| `list_nodes`            | List all available node types              |
| `get_nodes_by_category` | Get nodes filtered by category             |
| `get_node`              | Get detailed spec for a specific node type |

## Examples

### Running a Chatflow

```
Use create_prediction with:
- chatflowId: "abc123"
- question: "What is the weather today?"
```

### Creating a Simple Chatflow

```
1. Use get_node to fetch specs for needed nodes (e.g., "chatOpenAI", "llmChain")
2. Use create_chatflow with:
   - name: "My Chatflow"
   - flowData: { nodes: [...], edges: [...] }
   - type: "CHATFLOW"
```

## Development

```bash
# Build TypeScript
pnpm build

# Run in development mode (build + run)
pnpm dev
```

## Testing

The project includes comprehensive unit tests using [Vitest](https://vitest.dev/).

```bash
# Run tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage
```

### Test Structure

```
src/
├── flowise-api.test.ts   # API client tests (8 tests)
└── handlers.test.ts      # Tool handler tests (26 tests)
```

## Project Structure

```
flowise-mcp-server/
├── src/
│   ├── index.ts           # MCP server entry point
│   ├── flowise-api.ts     # Flowise API client
│   ├── handlers.ts        # Tool handler functions
│   └── *.test.ts          # Unit tests
├── dist/                  # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── vitest.config.ts       # Test configuration
├── Dockerfile
├── .env.example           # Environment template
└── mcp-config.example.json
```

## Troubleshooting

### Connection Issues

-   Ensure Flowise is running and accessible at the configured URL
-   When using Docker, use `host.docker.internal` to connect to Flowise on the host machine
-   Verify your API key is correct in Flowise settings

### Authentication Errors

-   Check that your `FLOWISE_API_KEY` matches one configured in Flowise
-   API keys can be created in Flowise under Settings > API Keys

## License

MIT - see [LICENSE](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Related Projects

-   [Flowise](https://github.com/FlowiseAI/Flowise) - Drag & drop UI to build LLM flows
-   [Model Context Protocol](https://modelcontextprotocol.io/) - Open protocol for LLM tool integration
