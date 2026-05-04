# flow-node-skill Specification

## Purpose

Define behavior for the `flow-node` specialist skill — a knowledge bank of complete `inputParams` templates for 15 AgentFlow and 8 ChatFlow node types. Solves empty `inputParams` on API-created nodes that break Flowise config UIs.

## Requirements

### FN-001: Skill file structure

The `.agents/skills/flow-node/SKILL.md` file MUST exist with YAML frontmatter, Role, Rules, Process, and Resources sections. The skill MUST be loadable via the skill tool as "flow-node".

**Scenarios**:

-   **FN-001-S1 (Happy path)**: GIVEN the project has a `.agents/skills/` directory; WHEN the skill file is created; THEN the frontmatter includes `name: flow-node`, a `description` field, and a `trigger` field listing AgentFlow delegation conditions.
-   **FN-001-S2 (Loadable)**: GIVEN the skill file exists; WHEN an agent invokes `skill(name: "flow-node")`; THEN the skill content is injected into the agent's context with all four sections present.

### FN-002: Node template generation

The skill MUST accept a node type name and a node ID, deep-clone the stored template, substitute the ID, and return a complete `IReactFlowNode` object.

**Scenarios**:

-   **FN-002-S1 (Agent type template)**: GIVEN the skill is loaded; WHEN invoked with type `"Agent"` and id `"agentAgentflow_0"`; THEN the returned object has `data.inputParams` with 16 entries (name, systemMessage, humanMessagePrompt, memoryKey, workerNodes, agent, humanMessage, tools, memory, inputModeration, apiConfig, returnSourceDocuments, maxIterations, conversationalAgent, toolsAgent, chatbotType), `data.inputAnchors` with 11 entries, `data.outputAnchors` with 1 entry, `data.inputs` initialized, and `data.filePath` pointing to the component source.
-   **FN-002-S2 (ID substitution)**: GIVEN a template with placeholder ids; WHEN invoked with a specific node ID; THEN all `inputParams[].id`, `inputAnchors[].id`, and `outputAnchors[].id` contain the given node ID.
-   **FN-002-S3 (ChatFlow)**: GIVEN the skill is loaded; WHEN invoked with `"chatOpenAI"` and id; THEN returns object with `inputParams`, `inputAnchors`, `outputAnchors`, `category: "Chat Models"`.

### FN-003: Type coverage

For each of 15 AgentFlow and 8 ChatFlow types, the skill MUST return a type-specific template matching `initNode()`.

**Scenarios**:

-   **FN-003-S1 (Type coverage)**: GIVEN the skill is loaded; WHEN queried for all 23 types; THEN each returns non-empty `inputParams`, matching `name` and `category`.
-   **FN-003-S2 (Template uniqueness)**: GIVEN two different types; WHEN compared; THEN they differ in `inputParams` shape and anchor counts.
-   **FN-003-S3 (ChatFlow coverage)**: GIVEN the skill is loaded; WHEN queried for 8 ChatFlow types; THEN each returns non-empty `inputParams` and correct `category`.

### FN-004: Template version tracking

Each template MUST include `data.version` matching the component's current version at extraction time, enabling staleness detection when Flowise updates.

**Scenarios**:

-   **FN-004-S1 (Version present)**: GIVEN any of the 15 templates; WHEN inspecting `data.version`; THEN it is non-null and matches the version from the source component's constructor.
-   **FN-004-S2 (Staleness surfaceable)**: GIVEN a template with version `2.0`; WHEN the source component updates to `2.1`; THEN the mismatch between template version and source version is detectable through inspection.

### FN-005: Skill integration contract

The skill MUST return `{valid: boolean, node: IReactFlowNode | null, warnings: string[]}` so orchestrating agents (e.g., `flow-architect`) can consume it programmatically.

**Scenarios**:

-   **FN-005-S1 (Valid response)**: GIVEN a valid type and ID; WHEN the skill processes the request; THEN the response has `valid: true`, a non-null `node`, and empty `warnings`.
-   **FN-005-S2 (Delegation chain)**: GIVEN `flow-architect` needs an AgentFlow node; WHEN it delegates to `flow-node` sub-agent; THEN `flow-node` returns the structured response consumable without further parsing.

### FN-006: Unsupported type rejection

When an unsupported type is requested, the skill MUST return `valid: false`. ChatFlow types MUST be accepted.

**Scenarios**:

-   **FN-006-S1 (ChatFlow accepted)**: GIVEN the skill is loaded; WHEN invoked with `"chatOpenAI"`; THEN returns `valid: true`, non-null node, empty warnings.
-   **FN-006-S2 (Unknown rejected)**: GIVEN the skill is loaded; WHEN invoked with `"NonExistent"`; THEN returns `valid: false` with type list.

### Requirement: CT-001–CT-008: ChatFlow MVP per-template requirements

The 8 ChatFlow MVP templates MUST exist with these fields:

| ID     | Name                          | Category      | inputParams                                                | Anchors                |
| ------ | ----------------------------- | ------------- | ---------------------------------------------------------- | ---------------------- |
| CT-001 | chatOpenRouter                | Chat Models   | modelName, cred (opt), temperature, maxTokens              | output: ChatOpenRouter |
| CT-002 | chatOpenAI                    | Chat Models   | modelName, cred (req), temperature, maxTokens, topP        | output: ChatOpenAI     |
| CT-003 | chatAnthropic                 | Chat Models   | modelName, cred, temperature, maxTokens                    | output: ChatAnthropic  |
| CT-004 | bufferMemory                  | Memory        | memoryKey, humanPrefix, aiPrefix, inputKey, returnMessages | —                      |
| CT-005 | huggingFaceInferenceEmbedding | Embeddings    | model, cred                                                | output: Embeddings     |
| CT-006 | supabase vector store         | Vector Stores | tableName, queryName, topK, cred (req)                     | output: VectorStore    |
| CT-007 | retrieverTool                 | Tools         | name, description, vectorStoreRetriever                    | input: retriever       |
| CT-008 | toolAgent                     | Agents        | model, tools (array)                                       | input: model, tools    |

#### Scenario: CT-XXX-S1 (Valid template passes)

-   GIVEN valid template from CT-001–CT-008; WHEN `validateChatFlowTemplate()` runs; THEN returns `valid: true` with `PLACEHOLDER_ID` warnings.

#### Scenario: CT-XXX-S2 (Missing required field fails)

-   GIVEN template from CT-001–CT-008 with inputParam removed; WHEN `validateChatFlowTemplate()` runs; THEN returns `valid: false` citing missing field.

### Requirement: CT-009: IReactFlowNode validity

All templates MUST pass `ReactFlowNodeSchema` and `NodeDataSchema`.

-   CT-009-S1: GIVEN 8 templates; WHEN parsed against schemas; THEN all pass.
-   CT-009-S2: GIVEN invalid `position` type; WHEN validated; THEN `ReactFlowNodeSchema` fails.

### Requirement: CT-010: ChatFlowNodeSchema compliance

All templates MUST pass `ChatFlowNodeSchema` with `type: "customNode"` and name in MVP allowlist.

-   CT-010-S1: GIVEN 8 templates with substituted IDs; WHEN `ChatFlowNodeSchema.safeParse()` runs; THEN all succeed.
-   CT-010-S2: GIVEN disallowed name; WHEN validated; THEN returns `success: false`.

### Requirement: CT-011: PLACEHOLDER_ID handling

All templates MUST use `PLACEHOLDER_ID`. `validateChatFlowTemplate()` MUST treat it as a warning.

-   CT-011-S1: GIVEN template with `PLACEHOLDER_ID`; WHEN validated; THEN `valid: true` with warnings.
-   CT-011-S2: GIVEN template with substituted ID; WHEN validated; THEN passes clean.

### Requirement: CT-012: Version manifest

`_version.json` MUST track all 8 templates with SHA256 checksums.

-   CT-012-S1: GIVEN `_version.json`; WHEN loaded; THEN has 8 entries with matching checksums.
-   CT-012-S2: GIVEN modified template; WHEN integrity test runs; THEN checksum mismatch detected.

### Requirement: CT-013: Template integrity tests

Tests MUST validate all 8 templates against schemas and semantics.

-   CT-013-S1: GIVEN test suite globs `templates/chatflow/*.json`; WHEN run; THEN all pass.
-   CT-013-S2: GIVEN template missing required field; WHEN test runs; THEN fails descriptively.

## Dependencies

-   `flowise-node-reference` skill: inputParams structure contract
-   AgentFlow source components in `packages/components/nodes/agentflow/` (read-only reference)
-   `flow-architect` skill: delegation target

## Risks

-   **Template drift**: Flowise component updates change `initNode()` output, making stored templates stale. Mitigated by version tracking (FN-004).
-   **Type name mismatch**: Skill keys may not match component `this.name`. Mitigated by verifying against component source.
-   **Template size**: 15 JSON templates embedded in `templates/` subdirectory to avoid context budget issues.
