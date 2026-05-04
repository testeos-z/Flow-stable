# Assistants Specification

## Purpose

CRUD management of Flowise Assistants, including retrieving their associated chat models, document stores, and tools, plus AI-generated instruction prompts.

## Requirements

### AST-001: List Assistants

The system MUST return all assistants in the workspace via `list_assistants`.

**API**: `GET /api/v1/assistants`

#### Scenario: List assistants

-   WHEN `list_assistants()` is called
-   THEN response returns assistant objects with id, name, description, icon

### AST-002: Get Assistant

The system MUST return a single assistant by ID via `get_assistant`.

**API**: `GET /api/v1/assistants/{id}`

#### Scenario: Get assistant with details

-   WHEN `get_assistant({ id })` is called
-   THEN response includes full config: name, description, instructions, icon, chat model refs, doc store refs, tool refs, quota, temperature

### AST-003: Create Assistant

The system MUST create an assistant via `create_assistant`.

**API**: `POST /api/v1/assistants`

**Contract**: `name` (string, required), `description` (string, optional), `instructions` (string, optional), `iconSrc` (string, optional), `chatModels` (array, optional), `docStores` (array, optional), `tools` (array, optional), `temperature` (number, optional)

**Note**: Creation MAY trigger org-level quota checks. If quota is exceeded, error response.

#### Scenario: Create minimal assistant

-   WHEN `create_assistant({ name: "My Assistant" })` is called
-   THEN assistant is created with defaults

#### Scenario: Quota exceeded

-   WHEN org has reached assistant limit
-   THEN error response: "Organization quota exceeded"

### AST-004: Update Assistant

The system MUST update an assistant via `update_assistant`.

**API**: `PUT /api/v1/assistants/{id}`

#### Scenario: Update instructions

-   WHEN `update_assistant({ id, instructions: "You are helpful..." })` is called
-   THEN instructions updated; other fields preserved

### AST-005: Delete Assistant

The system MUST delete an assistant via `delete_assistant`.

**API**: `DELETE /api/v1/assistants/{id}`

#### Scenario: Delete assistant

-   WHEN `delete_assistant({ id })` is called
-   THEN assistant is removed

### AST-006: Get Chat Models

The system MUST return chat models associated with an assistant via `get_assistant_chat_models`.

**API**: `GET /api/v1/assistants/{id}/chatmodels`

#### Scenario: Get chat models

-   WHEN `get_assistant_chat_models({ id })` is called
-   THEN response lists chat models with provider, model name, and configuration

### AST-007: Get Document Stores

The system MUST return document stores associated with an assistant via `get_assistant_doc_stores`.

**API**: `GET /api/v1/assistants/{id}/docstores`

#### Scenario: Get doc stores

-   WHEN `get_assistant_doc_stores({ id })` is called
-   THEN response lists document stores with name, type, and vector count

### AST-008: Get Tools

The system MUST return tools associated with an assistant via `get_assistant_tools`.

**API**: `GET /api/v1/assistants/{id}/tools`

#### Scenario: Get tools

-   WHEN `get_assistant_tools({ id })` is called
-   THEN response lists tools with name, type, and description

### AST-009: Generate Instruction

The system MUST generate AI-powered assistant instructions via `generate_assistant_instruction`.

**API**: `POST /api/v1/assistants/generate/instruction`

**Contract**: `prompt` (string, required) — base instruction to expand

**Note**: This is a long-running operation (10-30s) — the Flowise server calls an LLM internally. Document expected latency in tool description.

#### Scenario: Generate instruction

-   WHEN `generate_assistant_instruction({ prompt: "A helpful coding assistant" })` is called
-   THEN response returns AI-generated expanded instruction text

#### Scenario: Generation timeout

-   WHEN LLM takes longer than 30s
-   THEN error response with timeout message (not crash)

### Error Handling

-   All API errors (4xx, 5xx) MUST be caught and returned as error responses
-   Quota errors MUST include clear message and remaining quota
-   `generate_assistant_instruction` MUST handle server-side LLM timeouts gracefully
