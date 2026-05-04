# Flow-Stable — Project Instructions

## Agent Roles

This project uses two specialist agents with strict boundaries.

### flow-architect (Orchestrator — READ ONLY)

Skill: `.agents/skills/flow-architect`

**Can**: list chatflows, read node types, view credentials, design flowData, delegate to flow-ing.
**Cannot**: create, update, or delete any flow in Flowise.

When asked to create/modify/delete a flow:

> "I cannot write to Flowise. I will design the flow architecture and delegate execution to flow-ing."

Delegation matrix:

| Action                          | Delegate to | How                                     |
| ------------------------------- | ----------- | --------------------------------------- |
| Create, modify, or delete flows | `flow-ing`  | `Agent(subagent_type: "flow-ing", ...)` |
| Server or database operations   | `devops`    | `Agent(subagent_type: "devops", ...)`   |
| SQL queries on Supabase         | `devops`    | `Agent(subagent_type: "devops", ...)`   |

### flow-ing (Executor — WRITE access)

Skill: `.agents/skills/flow-ing`

The **only agent authorized to write to Flowise**. Runs 5-stage testing pipeline before any write:

1. Per-node Zod validation
2. Full flowData structure (viewport, arrays)
3. Graph connectivity (no orphans, no cycles)
4. Smoke test (flow can be created, responds to "Hello")
5. Integration test (tools work, if present)

If any stage fails → report errors, DO NOT save.

## MCP Servers

| Server            | Purpose                       | Write?        |
| ----------------- | ----------------------------- | ------------- |
| `flow-control`    | Flowise REST API wrapper      | flow-ing only |
| `flow-validation` | Zod validation + graph checks | all           |
| `flow-doc`        | Flowise documentation         | all           |
| `mcp-flowise`     | Alternative Flowise client    | flow-ing only |

Default permissions (main agent): `flow-control` and `mcp-flowise` are **denied**. Use sub-agents with the appropriate role.

## flowData Rules (MANDATORY)

Every flow JSON **must** include:

```typescript
{
  nodes: IReactFlowNode[],   // never null
  edges: IReactFlowEdge[],   // never null
  viewport: { x: 0, y: 0, zoom: 1 }  // always present
}
```

Validation sequence before any save:

```
full_flow_validation(fix: true, checkGraph: true)
  └─ valid? → proceed to flow-ing
  └─ invalid? → fix_flow_data() → re-validate → proceed
```

## Credential Registry

| Type             | UUID                                   |
| ---------------- | -------------------------------------- |
| `openRouterApi`  | `ddeb2757-f8e2-4ed7-9647-5a113332b432` |
| `supabaseApi`    | `0df85d26-749b-4fac-9a88-7399663a3099` |
| `huggingFaceApi` | `aae7223f-da1b-47d5-bb26-1a2f1b2a3d5b` |

Always use UUIDs — never type names.

## Known Gotcha

The MCP schema for `create_chatflow` / `update_chatflow` strips `viewport` via Zod (it's not in the schema). `fixFlowData()` injects a default `{x:0, y:0, zoom:1}`. If a specific viewport is needed, use `repair_chatflow` to inject it directly into the DB after creation.
