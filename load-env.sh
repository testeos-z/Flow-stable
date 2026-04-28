#!/bin/bash
set -a
source "$(dirname "$0")/packages/flowise-mcp-server/.env"
set +a
exec node "$(dirname "$0")/packages/flowise-mcp-server/dist/index.js"