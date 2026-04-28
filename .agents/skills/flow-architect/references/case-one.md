# Case One — Public Problem

**Type file**: `src/types/edge/form_case_one.type.ts`
**Factory method**: `FlowFactory.executeCaseOne()`

## What it is

The user defines an existing **public problem** (what is wrong). The system proposes a solution and evaluates it across all three flows.

## Input schema

```typescript
interface EdgeformCaseOne {
    id: string
    name: string // Problem name
    description: Description // Extended description + Storage file path
    time_existence_error: TimeExistenceError // How long the problem has existed
    group_comunity: GroupComunity[] // Affected community groups
    consequences: Consequence[] // Consequences + sub-consequences
    causes: Cause[] // Identified causes + custom causes
    final_goal: FinalGoal // Desired solution goal + Storage path
    pressure: Pressure // Political urgency / pressure level
    previous_measures: PreviousMeasures // Prior attempted measures + Storage path
    constraints: Constraint[] // Legal / financial constraints
    constraint_custom: any // Additional custom constraints
    aditional_files: any[] // Attached files
}
```

## Flow

```
User defines PROBLEM
    ↓
FACTUM — analyzes: what is the best SOLUTION? (proposes and evaluates)
    ↓
ÁGORA — measures: citizen perception of that proposed solution
POLITEIA — designs: how to communicate that solution
    (ÁGORA and POLITEIA run in parallel)
```

## Agents participating

All agents from all three flows (25+ agents total):

-   FACTUM: context_engineer, orchestrator, 4 transversal, 13 thematic, government_master, format_report_agent
-   ÁGORA: consultor_core, virtual citizens, agora_analysis_agent, deep_insights_agent, deep_interpretation_agent
-   POLITEIA: politeia_master_core, estrategia_framing_agent, mensajes_agent, rrss_digital_agent, crisis_prebunking_agent

## How reports are stored

```
public.form_case_one          ← raw case data (Supabase)
  ↓ FK
public.form_case_one_extend_docs  ← description/goal/measures file paths (Storage)

ai.simulations                ← simulation record (id, case_id)
  ↓ FK
ai.a2a_report_files           ← all generated reports
  - flow: 'factum' | 'agora' | 'politeia'
  - agent_name: which agent generated
  - object_path: Supabase Storage path
  - public_url: public URL of the report

ai.tasks                      ← A2A task log per agent (submitted → completed)
ai.conversations + ai.contents ← full conversation history per agent
```
