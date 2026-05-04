# Proposal: Slice 4 — ChatFlow MVP Templates

## Intent

Build 8 ChatFlow node templates to unblock ChatFlow flow creation in `flow-architect`. Today, only AgentFlow templates exist (15 JSONs). ChatFlow nodes have `type: "customNode"`, distinct anchor/inputParam shapes, and no template library. This change fills the gap for the MVP allowlist.

## Scope

### In Scope

-   8 template JSONs in `.agents/skills/flow-node/templates/chatflow/`
-   `validateChatFlowTemplate()` helper (handles `PLACEHOLDER_ID` as warning, mirroring AgentFlow's `validateTemplate`)
-   Template integrity tests (`schemas/__tests__/chatflow-templates.test.ts`)
-   `_version.json` manifest with checksums per template

### Out of Scope

-   Full 302-node coverage
-   Per-node config schemas beyond MVP nodes
-   Category-level schema refinements
-   Marketplace flow replication

## Capabilities

### New Capabilities

-   `chatflow-template-generation`: Accept a node name + ID, deep-clone a ChatFlow template, substitute IDs, return a complete `IReactFlowNode`.
-   `chatflow-template-integrity`: Validate all 8 ChatFlow templates against `ChatFlowNodeSchema` + `validateChatFlowSemantics()`.

### Modified Capabilities

-   `flow-node/spec.md` (FN-002/FN-003): Extend node template generation to cover ChatFlow types; update skill integration contract to return ChatFlow nodes.

## Approach

1. **Source extraction** (primary): Read each component `.ts` in `packages/components/nodes/`, map `this.*` → `data.*`, split `inputs[]` into `inputParams` (primitives) and `inputAnchors` (class connections), build `outputAnchors` from `baseClasses`/`outputs[]`.
2. **Envelope**: Wrap in ReactFlow node with `type: "customNode"`, `id: "PLACEHOLDER_ID"`, synthetic anchor IDs.
3. **Validation helper**: Add `validateChatFlowTemplate()` in `chatflow.ts` that runs `autoFixNode` → `ReactFlowNodeSchema` → `NodeDataSchema` → `ChatFlowNodeSchema`, downgrading `PLACEHOLDER_ID` errors to warnings (same pattern as `validateTemplate` in `agentflow.ts`).
4. **Tests**: Glob `templates/chatflow/*.json`, assert each passes schema + semantics, assert count === 8.

## Affected Areas

| Area                                           | Impact   | Description                             |
| ---------------------------------------------- | -------- | --------------------------------------- |
| `.agents/skills/flow-node/templates/chatflow/` | New      | 8 template JSONs + `_version.json`      |
| `.agents/skills/flow-node/schemas/chatflow.ts` | Modified | Add `validateChatFlowTemplate()` export |
| `.agents/skills/flow-node/schemas/__tests__/`  | New      | `chatflow-templates.test.ts`            |
| `openspec/specs/flow-node/spec.md`             | Modified | Extend FN-002/FN-003 to ChatFlow        |

## Risks

| Risk                                                           | Likelihood | Mitigation                                                                |
| -------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------- |
| Version drift between template and Flowise source              | Med        | `_version.json` checksums; CI diff against `packages/components/nodes/`   |
| Anchor naming mismatches break edge validation                 | Med        | Derive anchor `name` from `inputs[].name`, match Flowise serialization    |
| `PLACEHOLDER_ID` hard failures in `ChatFlowNodeSchema`         | Low        | `validateChatFlowTemplate()` filters `PLACEHOLDER_ID` issues to warnings  |
| Source extraction complexity (dual-output nodes like supabase) | Med        | Spot-check against marketplace JSONs; test dual-output shape explicitly   |
| Credential `optional: true` lost in extraction                 | Low        | Preserve `credential` object from `this.credential` as first `inputParam` |

## Rollback Plan

1. Delete `templates/chatflow/` directory.
2. Revert `chatflow.ts` to remove `validateChatFlowTemplate()` export.
3. Delete `chatflow-templates.test.ts`.
4. Revert `spec.md` changes.

## Dependencies

-   Slice 2 schema infrastructure (`chatflow.ts`, `common.ts`, `issues.ts`)
-   Slice 3 AgentFlow template pattern (`validateTemplate`, `template-integrity.test.ts`)
-   Flowise component source files in `packages/components/nodes/`

## Success Criteria

-   [ ] 8 template JSONs exist in `templates/chatflow/` and load without parse errors
-   [ ] Each template passes `validateChatFlowTemplate()` with `valid: true` and only `PLACEHOLDER_ID` warnings
-   [ ] Each template passes `validateChatFlowSemantics({ nodes: [template], edges: [] })` with 0 issues (after ID substitution)
-   [ ] `ChatFlowNodeSchema.safeParse()` passes on every template after substituting `PLACEHOLDER_ID`
-   [ ] `_version.json` lists all 8 templates with checksums
-   [ ] Test suite covers all 8 templates (≥1 schema test + ≥1 semantics test per template)
