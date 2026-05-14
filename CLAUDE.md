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

## Skills

### flowise-node-creator

Any agent can load `flowise-node-creator` when it needs to construct or validate a single Flowise node JSON. It provides the generic 7-step methodology (discover, check compatibility, resolve credential, build, generate anchors, validate, return). When domain-specific rules are needed, follow this loading order:

1. `flowise-node-creator` — generic methodology
2. `node-specialist-*` — category-specific constraints (e.g., chat-models, tools)
3. `flowise-node-reference` — catalog and compatibility lookups (restricted to `flow-architect` and `flow-ing`)

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

## Known Gotchas

### 1. MCP schema strips `viewport`

The MCP schema for `create_chatflow` / `update_chatflow` strips `viewport` via Zod (it's not in the schema). `fixFlowData()` injects a default `{x:0, y:0, zoom:1}`. If a specific viewport is needed, use `repair_chatflow` to inject it directly into the DB after creation.

### 2. DirectReply node field name: `directReplyMessage`, NOT `replyMessage`

The DirectReply node in AgentFlow V2 uses `directReplyMessage` as the field name (per node definition `inputs[0].name`). Using `replyMessage` silently fails — the node renders an empty space instead of the variable content. Always verify field names against `flow-control_get_node(nodeName)` before editing.

### 3. Condition node `sourceHandle` format

Condition node edges MUST match the node's `outputAnchors` IDs. These are `conditionAgentflow_N-output-0` (first condition) and `conditionAgentflow_N-output-1` (else branch). Custom handle names like `goEvidence` or `goFallback` cause edges to not render in the canvas UI. The long format `conditionAgentflow_N-output-conditionAgentflow-condition-X` also doesn't work. Always check `outputAnchors` on the Condition node to find the correct handle IDs.

### 4. AgentFlow `startTemplate` is NOT used at runtime

The `startTemplate` field exists in the Start node JSON but is **never read by the runtime code** (`Start.ts`). The Start node only processes `startState` (defaults) and the `question` input. `startTemplate` is a UI-only field that Flowise shows in the editor but ignores during execution.

**Fix**: Always add a state update in the first processing node (e.g., Router) to set flow state variables from `{{question}}` or `{{output}}`. Never rely on `startTemplate` to populate state values.

### 5. LLMs wrap JSON in markdown fences

Models like `gemini-2.5-flash-lite` frequently ignore "NO markdown" instructions and wrap JSON output in `\`\`\`json ... \`\`\``. Add a Custom Function node downstream to strip fences, rather than relying on prompt engineering alone.

### 6. Large flowData updates via MCP fail silently

The MCP `update_chatflow` tool has a ~5KB payload limit for inline parameters. For flows larger than that, use direct HTTP PUT to the Flowise API (`https://flow-stable-flow.up.railway.app/api/v1/chatflows/:id`) with Bearer auth.

### 7. Bibliotecario must list valid MCP source names

The Bibliotecario agent generates search plans with `source` fields. If the prompt does not explicitly list the valid source names (`nyc_data`, `ue_data`, `madeira_data`, `pt_data`, `openalex`), LLMs invent fake sources like `google` or `web_search` which don't map to any MCP tool. Always include a Valid Sources table and a Source Mapping from router names (e.g., `knowledge.nyc` → `nyc_data`) in the prompt.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **Flow-stable** (38107 symbols, 72474 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/Flow-stable/context` | Codebase overview, check index freshness |
| `gitnexus://repo/Flow-stable/clusters` | All functional areas |
| `gitnexus://repo/Flow-stable/processes` | All execution flows |
| `gitnexus://repo/Flow-stable/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
