# A2A Protocol Nodes for Flowise

Agent-to-Agent communication primitives for Flowise. Five reusable Tool/Memory nodes that give agents discovery, task delegation, artifact sharing, and deliberation — without modifying any existing node, table, or flow.

## Quickstart

1. Build Flowise with the new nodes (`pnpm build` in `packages/components`)
2. Drag an **A2A Registry** node to register agents with capabilities
3. Connect **A2A Task/Message** to create and track task lifecycles
4. Use **A2A Artifact** to share structured outputs with permission control
5. Open **A2A Shared Context** for multi-agent deliberation sessions
6. Add **A2A Memory Adapter** for session-persistent A2A context

All nodes default to **Local JSON** (zero-config, in-memory) for development. Switch to Supabase, PostgreSQL, or SQLite for production.

## Node Reference

| Node               | Category | Operations                                                                                |
| ------------------ | -------- | ----------------------------------------------------------------------------------------- |
| A2A Registry       | Tools    | register, get, find, updateStatus                                                         |
| A2A Task/Message   | Tools    | create, get, updateStatus, list, sendMessage, getMessages                                 |
| A2A Artifact       | Tools    | register, get, list, grant, revoke, check                                                 |
| A2A Shared Context | Tools    | createSession, getSession, addClaim, getClaims, addObservation, addDecision, getDecisions |
| A2A Memory Adapter | Memory   | saveA2AContext, loadA2AContext (+ standard chat history)                                  |

## Storage Backends

| Backend        | Config                                 | Use Case                    |
| -------------- | -------------------------------------- | --------------------------- |
| **Local JSON** | Zero config                            | Development, testing        |
| **Supabase**   | `supabaseApi` credential + project URL | Production, multi-agent     |
| **PostgreSQL** | `PostgresApi` credential               | Self-hosted                 |
| **SQLite**     | File path                              | Embedded, local development |

## Architecture

See [architecture.md](./architecture.md) for the adapter pattern, data flow, and design decisions.
