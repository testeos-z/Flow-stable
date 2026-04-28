# Case Two — Public Policy

**Type file**: `src/types/edge/form_case_two.type.ts`
**Factory method**: `FlowFactory.executeCaseTwo()`

## What it is

The user brings a **fully defined public policy** (solution already designed). The system evaluates viability, measures citizen perception, and designs the communication strategy.

**Key difference from Case One**: FACTUM only validates — it does NOT propose a solution.

## Input schema

```typescript
interface EdgeformCaseTwo {
    id: string
    name: string
    description: Description // Policy document + Storage path
    policy_objective: PolicyObjective[] // Policy objectives (what it aims to achieve)
    target_population: TargetPopulation[] // Beneficiary population segments
    locations: Location[] // Implementation locations (lat/lon/address)
    estimated_budget: EstimatedBudget // Budget amount + currency
    additional_financing: AdditionalFinancing | null // Co-financing sources
    key_actors: KeyActor[] // Who executes (institutions, ministries, etc.)
    constraints: Constraint[] // Legal / financial / institutional constraints
    constraint_custom: ConstraintCustom | null
}
```

## Flow

```
User proposes PUBLIC POLICY (solution already defined)
    ↓
FACTUM — evaluates: viable? budget sufficient? institutional capacity?
    ↓
ÁGORA — measures: citizen perception
POLITEIA — designs: how to communicate and execute it
    (ÁGORA and POLITEIA run in parallel)
```

## Agents participating

Same full set as Case One (25+ agents). The orchestrator receives the policy definition and configures thematic agents accordingly — budget analysis is weighted more heavily when `estimated_budget` is present.

## How reports are stored

```
public.form_case_two          ← raw policy data
  ↓ FK
public.form_case_two_extend_docs  ← attached documents (Storage paths)

ai.simulations → ai.a2a_report_files  ← same pattern as Case One
  - flow: 'factum' | 'agora' | 'politeia'
  - agent_name, object_path, public_url
```
