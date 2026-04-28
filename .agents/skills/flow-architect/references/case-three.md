# Case Three — Policy Improvement

**Type file**: `src/types/edge/form_case_three.type.ts`
**Factory method**: `FlowFactory.executeCaseThree()`

## What it is

The user proposes an **improvement to an existing policy**. The system evaluates whether the improvement increases viability, how citizens perceive the change, and how to communicate that something is getting better.

**Key difference**: Starts from an existing baseline — FACTUM evaluates delta/trade-offs, not from scratch.

## Input schema

```typescript
interface EdgeformCaseThree {
    id: string
    name: string // Political objective name
    improve_politically: ImprovePolitically[] // Areas of improvement (what aspects change)
    improve_description: ImproveDescription // Description of improvement + Storage path
    group_comunity: GroupComunity | null // Target community group
    location: Location | null // Geographic location (lat/lon/address)
    topic: Topic | null // Policy topic + sub-topic
    // e.g. SUSTAINABILITY AND RISK, HOUSING
    goal: Goal // Target goal with percentage objective
    time_period_to_achive_goal: TimePeriod // Timeframe: 3m | 6m | 1y | 2y | 5y
}
```

## Flow

```
User defines IMPROVEMENT to existing policy
    ↓
FACTUM — analyzes: does it increase viability? what are the trade-offs?
    ↓
ÁGORA — measures: citizen perception of the improvement
POLITEIA — designs: how to communicate that something will improve
    (ÁGORA and POLITEIA run in parallel)
```

## POLITEIA framing difference

For Case Three, POLITEIA frames the narrative around **progress and improvement** rather than introducing something new. Key message: "this existing policy is getting better."

## Agents participating

Same full set as Cases One and Two. The orchestrator weights temporal analysis and institutional capacity agents more heavily when `time_period_to_achive_goal` is present.

## How reports are stored

Same pattern as Cases One and Two:

```
public.form_case_three → ai.simulations → ai.a2a_report_files
  - flow: 'factum' | 'agora' | 'politeia'
```
