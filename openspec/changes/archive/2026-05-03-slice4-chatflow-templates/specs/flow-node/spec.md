# Delta for flow-node

## MODIFIED Requirements

### Requirement: FN-002: Node template generation

The skill MUST accept a node type name and ID, clone the template, substitute the ID, and return a complete `IReactFlowNode` for AgentFlow and ChatFlow.

-   **FN-002-S1** (Agent): GIVEN skill loaded; WHEN invoked with `"Agent"` and id; THEN returns object with `inputParams`, `inputAnchors`, `outputAnchors`, `filePath`.
-   **FN-002-S2** (ID substitution): GIVEN template with placeholders; WHEN invoked with specific id; THEN all param/anchor ids contain given id.
-   **FN-002-S3** (ChatFlow): GIVEN skill loaded; WHEN invoked with `"chatOpenAI"` and id; THEN returns object with `inputParams`, `inputAnchors`, `outputAnchors`, `category: "Chat Models"`.

### Requirement: FN-003: Type coverage

For each of 15 AgentFlow and 8 ChatFlow types, the skill MUST return a type-specific template matching `initNode()`.

-   **FN-003-S1** (Coverage): GIVEN skill loaded; WHEN queried for all 23 types; THEN each returns non-empty `inputParams`, matching `name` and `category`.
-   **FN-003-S2** (Uniqueness): GIVEN two different types; WHEN compared; THEN they differ in `inputParams` shape and anchor counts.
-   **FN-003-S3** (ChatFlow coverage): GIVEN skill loaded; WHEN queried for 8 ChatFlow types; THEN each returns non-empty `inputParams` and correct `category`.

### Requirement: FN-006: Unsupported type rejection

When an unsupported type is requested, the skill MUST return `valid: false`. ChatFlow types MUST be accepted.

-   **FN-006-S1** (ChatFlow accepted): GIVEN skill loaded; WHEN invoked with `"chatOpenAI"`; THEN returns `valid: true`, non-null node, empty warnings.
-   **FN-006-S2** (Unknown rejected): GIVEN skill loaded; WHEN invoked with `"NonExistent"`; THEN returns `valid: false` with type list.

## ADDED Requirements

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
