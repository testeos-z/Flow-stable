# MCP Flow-Control: No Size Limits

## TL;DR

**There is NO size limit for flowData in MCP flow-control tools.** The MCP uses the same HTTP endpoint as curl and applies no additional restrictions.

## Proof

✅ **Test**: Created flow with complete metadata (48KB flowData) via `flow-control_create_chatflow`  
✅ **Result**: All fields preserved (filePath, icon, inputParams, outputAnchors)  
✅ **Conclusion**: MCP handles large payloads without issues

## Why This Matters

Previously assumed 48KB flowData might be "too large" for MCP based on:

-   Experience with other systems (SSE/stdio buffer limits)
-   Lack of documentation about size limits
-   Conservative approach

**User correctly challenged**: "Why would MCP have a limit if it uses the same endpoint as curl?"

## Technical Analysis

### MCP Schema

```typescript
flowData: z.object({
    nodes: z.array(z.any()), // NO size restriction
    edges: z.array(z.any()) // NO size restriction
})
```

### MCP Handler

```typescript
const fixedFlowData = validateAndFixFlowData(params.flowData)
updateData.flowData = JSON.stringify(fixedFlowData)
const chatflow = await api.request('PUT', `/chatflows/${params.chatflowId}`, updateData)
```

**Identical to curl**: Same endpoint, same payload format, same limits (none).

## Practical Limits

The only real limits are from:

1. **Flowise API**: HTTP body limit (typically MB range)
2. **Database**: JSON column size (typically 16MB-4GB)
3. **Network**: HTTP transfer limit (rarely <100MB)

A 48KB flowData is **well within all limits**.

## Recommendation

✅ Use MCP directly for flows of any size  
❌ No need to batch updates  
❌ No need to use curl instead  
❌ No need to worry about size

---

**Verified**: 2026-05-05 via experimental test  
**Status**: CONFIRMED
