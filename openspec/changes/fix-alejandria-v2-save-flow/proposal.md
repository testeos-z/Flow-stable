# Proposal: Fix Alejandria v2 Save Flow

## Intent

Restore broken flow 011c1e9d (500 error: "Start input type not found"). Multilingual information hub: detects user language, translates queries per-source requirements (MCPs/Supabase), searches parallel, normalizes responses, returns in original language.

## Scope

### In Scope

-   Clone backup 50306854 as restoration source
-   Create 7 tool nodes (3 RetrieverTools + 4 CustomMcpTools)
-   Apply 8 fixes: models, prompts, state variables
-   Connect tool anchors, validate flowData, test multilingual queries

### Out of Scope

-   New sources, UI changes, performance optimization, chat history migration

## Capabilities

### New Capabilities

None — restoring existing capability.

### Modified Capabilities

-   `flow-node`: May need language metadata in RetrieverTool/CustomMcpTool templates (delta spec if CT-007 insufficient).

## Approach

1. Read backup 50306854, extract 10-node structure
2. Create 7 tools via flow-node specialist
3. Apply 8 fixes: model IDs, prompts, state vars
4. Assemble flowData (17 nodes + edges + viewport)
5. Validate (Zod + graph), test smoke + multilingual integration
6. Save via update_chatflow(011c1e9d)

## Affected Areas

| Area                        | Impact               | Description                                                            |
| --------------------------- | -------------------- | ---------------------------------------------------------------------- |
| `chatflow/011c1e9d`         | Modified             | Broken flow restored to 17-node working structure                      |
| `chatflow/50306854`         | None                 | Backup flow remains intact (read-only)                                 |
| `.agents/skills/flow-node/` | Modified (if needed) | Add language metadata support to RetrieverTool/CustomMcpTool templates |

## Risks

| Risk                      | Likelihood | Mitigation                                 |
| ------------------------- | ---------- | ------------------------------------------ |
| Backup also corrupted     | Low        | Validate before clone; escalate if invalid |
| MCP nodes unavailable     | Medium     | Check list_nodes first                     |
| Translation logic missing | Medium     | Add to Router/Planner prompts if needed    |
| Credentials inactive      | Medium     | Verify OpenRouter/Supabase before test     |

## Rollback Plan

Backup 50306854 untouched. If update fails → broken flow 011c1e9d retains state. If tests fail → delete 011c1e9d, escalate redesign.

## Dependencies

-   Backup 50306854 accessible via get_chatflow
-   flow-control MCP operational, credentials active
-   flowise-node-reference for tool templates

## Success Criteria

-   [ ] Flow 011c1e9d returns 200 on smoke test ("Hello" query)
-   [ ] Flow 011c1e9d detects input language (English) and returns answer in English
-   [ ] Flow 011c1e9d successfully searches at least one non-English source (Spanish/French MCP or Supabase)
-   [ ] flowData includes viewport, 17 nodes, correct edge count, no orphan nodes
-   [ ] All 5 validation stages pass (Zod, structure, graph, smoke, integration)
