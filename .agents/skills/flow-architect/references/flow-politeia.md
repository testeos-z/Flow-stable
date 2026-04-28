# Flow: POLITEIA (Communication Strategy)

**Factory**: `src/utils/flow/politeia/PoliteiaFactory/index.ts`
**Runs**: In parallel with ÁGORA, after FACTUM completes.
**Input**: FACTUM technical report + ÁGORA citizen perception data (both required).

## Agents

| Agent                      | Type     | Role                                                                          |
| -------------------------- | -------- | ----------------------------------------------------------------------------- |
| `politeia_master_core`     | Chief    | Validates inputs, generates 4 briefs, integrates proposals, detects conflicts |
| `estrategia_framing_agent` | Thematic | Main narrative frame (3–5 keywords, historical/future/values)                 |
| `mensajes_agent`           | Thematic | Messages per audience (A/B/C) and per channel                                 |
| `rrss_digital_agent`       | Thematic | Calendar, hashtags, visual content, engagement tactics                        |
| `crisis_prebunking_agent`  | Thematic | Anticipate criticisms, counter-narratives, preemptive responses               |
| `format_report_agent`      | Chief    | Final Markdown cleanup                                                        |

**Also available** (optional thematic agents): `audiovisual_agent`, `media_training_agent`, `institutional_communication_agent`, `monitoring_agent`, `territory_alliances_agent`

**Prompt files**: `access/prompts/chief/politeia_master_core.yaml`, `access/prompts/politeia/`

## Execution phases

```
Phase 0: Preparation
  - Validate FACTUM + ÁGORA inputs (both required)
  - Define single political objective (promote SOLUTION, not problem)
  - Map A/B/C audiences from ÁGORA segments
  - Detect communication risks and "red lines"

Phase 1: Master Briefing
  - politeia_master_core generates 4 personalized briefs:
    → framing strategy brief
    → key messages brief
    → social media brief
    → crisis prebunking brief

Phase 2: Specialist Sprint (4 agents IN PARALLEL)
  - estrategia_framing_agent → framing proposal
  - mensajes_agent → messages proposal
  - rrss_digital_agent → social media proposal
  - crisis_prebunking_agent → crisis plan

Phase 3: Master Integration
  - politeia_master_core receives all 4 proposals
  - Detects internal conflicts (contradictory messages, inconsistencies)
  - Validates consistency with ÁGORA citizen perceptions
  - Produces single integrated consensus version

Phase 4: Final deliverables
  - Strategic Playbook (narrative document)
  - Execution Plan (JSON with owners, milestones, KPIs, budget)
```

## Agent interaction map

```
FACTUM report ──────[technical data]─────────────────► politeia_master_core
ÁGORA output ───────[citizen perception]─────────────► politeia_master_core
politeia_master_core ─[brief A]──► estrategia_framing_agent ─[proposal]─┐
politeia_master_core ─[brief B]──► mensajes_agent ─────────[proposal]───┤
politeia_master_core ─[brief C]──► rrss_digital_agent ──────[proposal]──┤─► politeia_master_core
politeia_master_core ─[brief D]──► crisis_prebunking_agent ─[proposal]──┘
politeia_master_core ─[integrated]──► format_report_agent
format_report_agent ─[clean MD]──► ai.a2a_report_files (flow=politeia)
```

## Outputs

| Output             | Format                                  | Destination                           |
| ------------------ | --------------------------------------- | ------------------------------------- |
| Strategic Playbook | Markdown                                | `ai.a2a_report_files` (flow=politeia) |
| Execution Plan     | JSON (owners, milestones, KPIs, budget) | `ai.a2a_report_files` (flow=politeia) |

## Critical rules

-   ÁGORA and POLITEIA run IN PARALLEL but BOTH need FACTUM output to start
-   ÁGORA is also required for POLITEIA — POLITEIA cannot run without citizen perception data
-   Specialist agents in Phase 2 run IN PARALLEL — never sequentially
-   Political objective = promote SOLUTION, never define the problem
-   `buildLanguageDirective(output_language)` at position 0 of every prompt
