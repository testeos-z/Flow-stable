# Case Four

**Factory method**: `FlowFactory.executeCaseFour()` (defined in routing layer)

## Current status

Case Four exists in the routing and type system but does not have a dedicated type file
(`form_case_four.type.ts`) or a fully implemented factory method in the current codebase.

The routing layer maps Case Four inputs to the standard FACTUM → ÁGORA → POLITEIA pipeline
using the same storage pattern as Cases One, Two, and Three.

## Expected pattern (based on system architecture)

When implemented, Case Four will follow the same structural pattern:

```
User input (Case Four specific form)
    ↓
FACTUM — technical evaluation
    ↓
ÁGORA + POLITEIA — in parallel
```

Reports stored in:

```
public.form_case_four (when created)
ai.simulations → ai.a2a_report_files
  - flow: 'factum' | 'agora' | 'politeia'
```

## For implementors

When adding Case Four:

1. Create `src/types/edge/form_case_four.type.ts` with the input schema
2. Add `public.form_case_four` table in Supabase
3. Implement `FlowFactory.executeCaseFour()` following the pattern of `executeCaseOne()`
4. The three-flow pipeline (FACTUM → ÁGORA ‖ POLITEIA) requires no changes
