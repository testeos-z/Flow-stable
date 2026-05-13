#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
set -a
source "$SCRIPT_DIR/packages/flowise-mcp-server/.env"
set +a
exec node "$SCRIPT_DIR/packages/flowise-mcp-server/dist/index.js"