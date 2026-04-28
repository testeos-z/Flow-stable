# Flow: ÁGORA (Citizen Perception)

**Factory**: `src/utils/flow/agora/AgoraFactory.ts`
**Runs**: In parallel with POLITEIA, after FACTUM completes.
**Input**: JSON output from FACTUM (3 neutral paragraphs about the proposed solution).

## Agents

| Agent                        | Type      | Role                                                        |
| ---------------------------- | --------- | ----------------------------------------------------------- |
| `consultor_core`             | Chief     | Designs neutral questionnaire, applies SINC quality control |
| Virtual citizens (~300–1000) | Synthetic | Answer questionnaire with unique sociodemographic profiles  |
| `agora_analysis_agent`       | Thematic  | Aggregates closed-ended responses by segment                |
| `deep_insights_agent`        | Thematic  | Analyzes emotional drivers                                  |
| `deep_interpretation_agent`  | Thematic  | Qualitative synthesis                                       |
| `format_report_agent`        | Chief     | Final Markdown cleanup                                      |

**Virtual citizens loaded from**: `context/agora/ciudadanos_ágora_v2.xlsx`
**Profile fields**: age, gender, education, income, ideology, territory, language

**Prompt files**: `access/prompts/chief/consultor_core.yaml`, `access/prompts/thematic/agora_analysis_agent_core.yaml`, `access/prompts/thematic/deep_insights_agent_core.yaml`

## Execution phases

```
1. Load FACTUM JSON output (3 neutral paragraphs, no technical jargon)
2. Load virtual citizens from XLSX
3. consultor_core designs neutral questionnaire:
   - 1 comprehension item (multiple choice + "Didn't understand")
   - 1 basic attitude item (support / rejection / neutrality)
   - 1–2 intensity items (0–100 scale, 5-point Likert)
   - 1 mobilization item (0–100)
   - 1 perceived credibility item
   - 1 relative priority item
   - Emotion checklist (hope, pride, anger, fear, distrust)
   - 2–3 quality control items (attention, consistency, time)
4. Virtual citizens answer questionnaire
5. SINC quality index applied — only High/Medium pass to aggregation
6. agora_analysis_agent aggregates closed-ended responses by segment
7. deep_insights_agent analyzes emotional drivers
8. deep_interpretation_agent produces qualitative synthesis
9. format_report_agent produces clean ÁGORA report
```

## Agent interaction map

```
FACTUM output ─────[JSON 3 paragraphs]────────────► consultor_core
consultor_core ────[questionnaire]─────────────────► virtual citizens
virtual citizens ──[raw responses]─────────────────► SINC filter
SINC filter ───────[High/Medium responses only]────► agora_analysis_agent
agora_analysis_agent ─[aggregated metrics]─────────► deep_insights_agent
deep_insights_agent ──[emotional analysis]─────────► deep_interpretation_agent
deep_interpretation_agent ─[qualitative synthesis]─► format_report_agent
format_report_agent ──[clean MD]───────────────────► ai.a2a_report_files (flow=agora)
ÁGORA output ──────[citizen perception data]───────► POLITEIA flow input
```

## SINC quality index

| Criterion     | Description                              |
| ------------- | ---------------------------------------- |
| Attention     | Passed subtle instruction check (1/0)    |
| Consistency   | No contradictions between mirror items   |
| Response time | Plausible time (not too fast / too slow) |
| Logic         | No logical contradictions across answers |

Only **High** and **Medium** SINC responses pass to the main aggregation.

## Output metrics

-   % Support / Rejection / Neutrality (+ CI 95%)
-   Mean intensity (0–100) and distribution (p25–p75)
-   Potential mobilization score
-   Mean credibility and priority
-   Polarization = (intense support% – intense rejection%)
-   ⚠️ HIGH RISK flag: intense rejection >10pp OR polarization >20pp

## Outputs

| Output                  | Format                                   | Destination                        |
| ----------------------- | ---------------------------------------- | ---------------------------------- |
| ÁGORA executive report  | Markdown (3–4 pages, by segment)         | `ai.a2a_report_files` (flow=agora) |
| ÁGORA technical report  | Markdown (10–15 pages, with methodology) | `ai.a2a_report_files` (flow=agora) |
| Citizen perception data | JSON                                     | POLITEIA flow input                |
