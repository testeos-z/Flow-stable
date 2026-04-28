# Flow: FACTUM (Technical Analysis)

**Factory**: `src/utils/flow/factum/FactumFactory/`
**Runs**: First — always before ÁGORA and POLITEIA.

## Agents

| Agent                                    | Type        | Role                                                   |
| ---------------------------------------- | ----------- | ------------------------------------------------------ |
| `context_engineer`                       | Transversal | Territorial analysis (legal, fiscal, sociodemographic) |
| `orchestrator`                           | Chief       | Generates JSON orchestration plan                      |
| Risk / Temporal / Territorial evaluators | Transversal | Phase 1 parallel evaluation                            |
| 13 thematic agents                       | Thematic    | Domain-specific analysis (parallel)                    |
| `government_master`                      | Chief       | MCDA synthesis + A2A queries + final decision          |
| `format_report_agent`                    | Chief       | Final Markdown cleanup                                 |

**Thematic agents**: `economic`, `health`, `education`, `environment`, `housing_territory`, `mobility`, `inclusion`, `industry`, `macro_fiscal`, `public_admin`, `transparency`, `foreign_relations`, `digital_transformation`

**Prompt files**: `access/prompts/chief/`, `access/prompts/thematic/`

## Execution phases

```
1. Pre-stage         Load case data from Supabase + Storage files
2. context_engineer  Produces territorial contextual document
3. orchestrator      Produces JSON plan: which thematic agents run + dependencies
4. Phase 1           4 transversal agents IN PARALLEL → evaluation documents
5. Phase 2           N thematic agents IN PARALLEL (per orchestrator plan) → specialist docs
6. Phase 2 Rewrite   Transversal agents read thematic docs → enrich them (A2A)
7. Phase 3 Queries   government_master sends queries TO each thematic agent (A2A)
                     → agents return structured JSON answers
8. Phase 4 Research  government_master queries MCPs (OpenAlex, InternalResearch)
9. Phase 5 Rewrite   government_master reformulates all specialist documents
10. Phase 6 Synthesis government_master produces Final Technical Report
11. format_report    Cleans mixed JSON/Markdown → pure Markdown
```

## Agent interaction map

```
context_engineer ──[context doc]──────────────────► orchestrator
orchestrator ─────[JSON plan]─────────────────────► Phase 1 agents
                                                  ► Phase 2 agents
Phase 1 agents ───[evaluation docs]───────────────► Phase 2 Rewrite
Phase 2 agents ───[specialist docs]──► Phase 2 Rewrite
Phase 2 Rewrite ──[enriched docs]─────────────────► government_master
government_master ─[queries]──────────► thematic agents (Phase 3)
thematic agents ───[answers JSON]─────► government_master
government_master ─[search queries]───► MCPs (Phase 4)
MCPs ──────────────[results]──────────► government_master
government_master ─[final report MD]──► format_report_agent
format_report_agent ─[clean MD]───────► ai.a2a_report_files (flow=factum)
government_master ─[JSON 3 paragraphs]► ÁGORA flow input
```

## Outputs

| Output                 | Format                                 | Destination                         |
| ---------------------- | -------------------------------------- | ----------------------------------- |
| Final technical report | Markdown                               | `ai.a2a_report_files` (flow=factum) |
| JSON for ÁGORA         | JSON — 3 neutral paragraphs, no jargon | ÁGORA flow input                    |
| Individual agent docs  | Markdown                               | `ai.a2a_report_files` per agent     |

## government_master MCDA

**Weights**: Technical (35) · Fiscal (30) · Institutional (15) · Social (10) · Environmental (10)
**Decisions**: `APPROVE` · `ADJUSTMENTS` · `REFORMULATE` · `PILOT` · `CONDITIONAL PAUSE`

## Critical rules

-   Thematic agents in Phase 2 run **IN PARALLEL** — never sequentially
-   Phase 3 is A2A: government_master queries agents by name, agents respond to master
-   `buildLanguageDirective(output_language)` injected at position 0 of every prompt
-   `format_report_agent` uses `buildFormatReportSystemInstructions(output_language)`
