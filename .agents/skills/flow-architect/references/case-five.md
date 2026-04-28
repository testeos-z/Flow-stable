# Case Five

**Factory method**: `FlowFactory.executeCaseFive()` (defined in routing layer)

## Current status

Case Five exists in the routing and type system but does not have a dedicated type file
(`form_case_five.type.ts`) or a fully implemented factory method in the current codebase.

The routing layer maps Case Five inputs to the standard FACTUM → ÁGORA → POLITEIA pipeline
using the same storage pattern as Cases One through Three.

## Expected pattern (based on system architecture)

When implemented, Case Five will follow the same structural pattern:

```
User input (Case Five specific form)
    ↓
FACTUM — technical evaluation
    ↓
ÁGORA + POLITEIA — in parallel
```

Reports stored in:

```
public.form_case_five (when created)
ai.simulations → ai.a2a_report_files
  - flow: 'factum' | 'agora' | 'politeia'
```

## For implementors

When adding Case Five:

1. Create `src/types/edge/form_case_five.type.ts` with the input schema
2. Add `public.form_case_five` table in Supabase
3. Implement `FlowFactory.executeCaseFive()` following the pattern of `executeCaseOne()`
4. The three-flow pipeline (FACTUM → ÁGORA ‖ POLITEIA) requires no changes
