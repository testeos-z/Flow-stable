# Delta for AgentFlow Validation

## ADDED Requirements

### Requirement: AGENTFLOW Schema Validation

The system MUST validate that an AGENTFLOW JSON conforms to `ZodAgentFlowObject` schema before semantic checks.

#### Scenario: Valid AGENTFLOW passes schema validation

-   GIVEN a JSON with `nodes` array where every node has `type: "agentFlow"`, `data.type` in Agent Flows enum, and `data.category: "Agent Flows"`
-   WHEN `validateAgentFlowData()` is called
-   THEN the result `valid` SHALL be `true`
-   AND `errors` SHALL be empty

#### Scenario: AGENTFLOW with CHATFLOW node fails schema validation

-   GIVEN a JSON with a node having `data.category: "Chains"` or `data.type: "ToolAgent"`
-   WHEN `validateAgentFlowData()` is called
-   THEN the result `valid` SHALL be `false`
-   AND `errors` SHALL contain a message indicating invalid node category for AGENTFLOW

#### Scenario: AGENTFLOW with missing viewport fails schema validation

-   GIVEN a JSON with valid nodes and edges but missing `viewport` object
-   WHEN `validateAgentFlowData()` is called
-   THEN the result `valid` SHALL be `false`
-   AND `errors` SHALL reference the missing `viewport`

### Requirement: AGENTFLOW Semantic Validation — Start Node

The system MUST ensure an AGENTFLOW contains exactly one `Start` node.

#### Scenario: AGENTFLOW with exactly one Start is valid

-   GIVEN an AGENTFLOW with one `Start` node connected to an `Agent` node
-   WHEN `validateAgentFlowSemantics()` is called
-   THEN no error SHALL be returned for Start node count

#### Scenario: AGENTFLOW with zero Start nodes is invalid

-   GIVEN an AGENTFLOW with nodes but no `Start` node
-   WHEN `validateAgentFlowSemantics()` is called
-   THEN an error SHALL be returned: "AGENTFLOW must have exactly 1 Start node, found 0"

#### Scenario: AGENTFLOW with multiple Start nodes is invalid

-   GIVEN an AGENTFLOW with two `Start` nodes
-   WHEN `validateAgentFlowSemantics()` is called
-   THEN an error SHALL be returned: "AGENTFLOW must have exactly 1 Start node, found 2"

### Requirement: AGENTFLOW Semantic Validation — Ending Nodes

The system MUST ensure an AGENTFLOW has at least one valid ending node.

#### Scenario: AGENTFLOW with DirectReply ending node is valid

-   GIVEN an AGENTFLOW where the last reachable node is `DirectReply`
-   WHEN semantics are validated
-   THEN no error SHALL be returned for ending nodes

#### Scenario: AGENTFLOW without ending node is invalid

-   GIVEN an AGENTFLOW where the last node is `Agent` with no outgoing edges
-   WHEN semantics are validated
-   THEN an error SHALL be returned: "AGENTFLOW must have at least one ending node (DirectReply, ExecuteFlow, HumanInput, End)"

### Requirement: AGENTFLOW Semantic Validation — Condition Nodes

The system MUST ensure every `Condition` or `ConditionAgent` node has at least two outgoing edges.

#### Scenario: Condition with two branches is valid

-   GIVEN a `Condition` node with two outgoing edges to different nodes
-   WHEN semantics are validated
-   THEN no error SHALL be returned for that Condition

#### Scenario: Condition with one branch is invalid

-   GIVEN a `Condition` node with only one outgoing edge
-   WHEN semantics are validated
-   THEN an error SHALL be returned: "Condition must have at least 2 outgoing edges"

### Requirement: AGENTFLOW Semantic Validation — Loop Nodes

The system MUST ensure every `Loop` node points to an earlier node in the graph.

#### Scenario: Loop pointing backward is valid

-   GIVEN a `Loop` node with an outgoing edge to a node that appears earlier in the execution path
-   WHEN semantics are validated
-   THEN no error SHALL be returned for that Loop

#### Scenario: Loop pointing forward is invalid

-   GIVEN a `Loop` node with an outgoing edge to a node that appears later or is unreachable from Start
-   WHEN semantics are validated
-   THEN an error SHALL be returned: "Loop must point to an earlier node"

### Requirement: AGENTFLOW Semantic Validation — Agent Configuration

The system MUST ensure every `Agent` node has a valid `agentModelConfig` with a `modelName`.

#### Scenario: Agent with modelName is valid

-   GIVEN an `Agent` node with `inputs.agentModelConfig.modelName: "openai/gpt-4"`
-   WHEN semantics are validated
-   THEN no error SHALL be returned for Agent configuration

#### Scenario: Agent without modelName is invalid

-   GIVEN an `Agent` node with `inputs.agentModelConfig` present but `modelName` missing or empty
-   WHEN semantics are validated
-   THEN an error SHALL be returned: "Agent must have agentModelConfig with modelName"

## MODIFIED Requirements

### Requirement: fixFlowData Preserves Existing Node Types

The system MUST NOT overwrite an existing `node.type` when fixing missing defaults.
(Previously: `fixFlowData` always injected `type: "customNode"` for any node missing a type.)

#### Scenario: fixFlowData preserves agentFlow type

-   GIVEN a node with `type: "agentFlow"` but missing `width` and `height`
-   WHEN `fixFlowData()` is called
-   THEN the node SHALL retain `type: "agentFlow"`
-   AND `width` and `height` SHALL receive default values

#### Scenario: fixFlowData injects customNode only when type is missing

-   GIVEN a node with no `type` field at all
-   WHEN `fixFlowData()` is called
-   THEN the node SHALL receive `type: "customNode"`

## REMOVED Requirements

None.
