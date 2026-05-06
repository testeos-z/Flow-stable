# MCP Flow-Control Environment Configuration

## How It Works

The MCP server loads environment variables from `packages/flowise-mcp-server/.env` via the `load-env.sh` script.

### Startup Flow

```bash
load-env.sh:
  ↓
1. source packages/flowise-mcp-server/.env  # Load all env vars
2. exec packages/flowise-mcp-server/dist/index.js  # Start MCP server
```

### Environment Variables

The MCP server reads:

```bash
# Flowise API connection
FLOWISE_BASE_URL=http://host.docker.internal:3000  # or your Flowise URL
FLOWISE_API_KEY=your-api-key-here

# Direct DB access (for diagnose_chatflow and repair_chatflow)
FLOWISE_DB_HOST=
FLOWISE_DB_PORT=
FLOWISE_DB_NAME=railway
FLOWISE_DB_USER=postgres
FLOWISE_DB_PASSWORD=
FLOWISE_DB_SSL=false
```

### Configuration File

-   **Template**: `packages/flowise-mcp-server/.env.example`
-   **Active config**: `packages/flowise-mcp-server/.env` (gitignored)
-   **Loader script**: `load-env.sh` (project root)

## Important Notes

### ✅ DO

-   Configure `.env` file in `packages/flowise-mcp-server/` before starting MCP
-   Use `load-env.sh` to start the MCP server (auto-loads env vars)
-   Keep `.env` file in `.gitignore` (contains credentials)

### ❌ DON'T

-   Manually export `FLOWISE_API_URL` before running scripts - unnecessary, the MCP already has it
-   Set environment variables in shell - they won't reach the MCP server process
-   Hardcode URLs in scripts - use the MCP tools which already have the configuration

## Why This Matters

**Scripts that call Flowise API directly** (like curl) need the URL. But:

-   MCP tools (`flow-control_*`) already have `FLOWISE_BASE_URL` from `.env`
-   No need to export variables - they're loaded automatically by `load-env.sh`
-   The MCP client uses the configured URL from its environment

## Example: Correct vs Incorrect

### ❌ Incorrect (Redundant)

```bash
export FLOWISE_API_URL=http://localhost:3000  # Unnecessary!
curl -X PUT "$FLOWISE_API_URL/api/v1/chatflows/..."
```

### ✅ Correct (MCP already configured)

```bash
# Just use MCP tools - they already have the URL
flow-control_update_chatflow(chatflowId, flowData)
```

### ✅ Also Correct (If using curl directly, not MCP)

```bash
# Read from MCP's .env file
source packages/flowise-mcp-server/.env
curl -X PUT "$FLOWISE_BASE_URL/api/v1/chatflows/..."
```

---

**Updated**: 2026-05-05  
**Context**: Alejandria v2 save regeneration with metadata
