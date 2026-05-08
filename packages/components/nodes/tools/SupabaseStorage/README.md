# Supabase Storage Nodes

Four Flowise tool nodes for managing files in Supabase Storage buckets.

## What you can do

| Node                        | Action                         | Typical use                                             |
| --------------------------- | ------------------------------ | ------------------------------------------------------- |
| **SupabaseStorageDownload** | Download a file to flow memory | Load a PDF, CSV, or text file as context for an LLM     |
| **SupabaseStorageUpload**   | Upload a file to Storage       | Save generated reports, user uploads, or processed data |
| **SupabaseStorageMove**     | Move a file to another folder  | Archive completed tasks, organize by date, etc.         |
| **SupabaseStorageRename**   | Rename a file                  | Fix typos, add version numbers, standardize naming      |

---

## Quick start

1. Add a **SupabaseStorageDownload** node to your flow
2. Select your `supabaseApi` credential (or create one)
3. Fill in:
    - **Supabase Project URL**: `https://your-project.supabase.co`
    - **Bucket Name**: `my-bucket`
4. Set **Source Path**: `documents/report.pdf`
5. Connect the output to an LLM node — `{{content}}` contains the file text

---

## Shared configuration

All four nodes share these inputs:

| Input                    | Required | Description                       | Example                      |
| ------------------------ | -------- | --------------------------------- | ---------------------------- |
| **Connect Credential**   | Yes      | Existing `supabaseApi` credential | —                            |
| **Supabase Project URL** | Yes      | Your Supabase project URL         | `https://abc123.supabase.co` |
| **Bucket Name**          | Yes      | Storage bucket name               | `documents`, `uploads`       |
| **Base Path**            | No       | Prefix added to all paths         | `v1`, `2024/reports`         |

### Where to find your Project URL

In your Supabase dashboard → Project Settings → API → URL

---

## Node details

### SupabaseStorageDownload

Download a file from Supabase Storage into the flow as text.

| Input           | Required | Description                 | Example              |
| --------------- | -------- | --------------------------- | -------------------- |
| **Source Path** | Yes      | File path inside the bucket | `reports/annual.pdf` |

**Outputs**:

| Output      | Type   | Description                                  |
| ----------- | ------ | -------------------------------------------- |
| `content`   | string | File content as UTF-8 text                   |
| `publicUrl` | string | Public URL of the file (if bucket is public) |

**Example**: Download a prompt template

```
Source Path: prompts/customer-support.txt
→ content: "You are a helpful support agent..."
→ publicUrl: "https://abc123.supabase.co/storage/v1/object/public/templates/prompts/customer-support.txt"
```

---

### SupabaseStorageUpload

Upload text or base64-encoded content to Supabase Storage.

| Input                | Required | Description            | Example                         |
| -------------------- | -------- | ---------------------- | ------------------------------- |
| **Destination Path** | Yes      | Where to save the file | `outputs/summary.txt`           |
| **File Content**     | Yes      | Content to upload      | Text or base64 string           |
| **Content Type**     | No       | MIME type hint         | `text/plain`, `application/pdf` |

**Outputs**:

| Output      | Type   | Description                      |
| ----------- | ------ | -------------------------------- |
| `path`      | string | Final file path in Storage       |
| `publicUrl` | string | Public URL (if bucket is public) |

**Example**: Save an LLM response

```
Destination Path: responses/2024-05-08/user-123.txt
File Content: {{llm.output}}
Content Type: text/plain
→ path: "responses/2024-05-08/user-123.txt"
→ publicUrl: "https://abc123.supabase.co/storage/v1/object/public/outputs/responses/2024-05-08/user-123.txt"
```

**Base64 upload**: If `Content Type` is a binary type (`application/pdf`, `image/png`, etc.), the node automatically decodes base64 content before uploading.

---

### SupabaseStorageMove

Move a file from one path to another.

| Input                | Required | Description           | Example                |
| -------------------- | -------- | --------------------- | ---------------------- |
| **Source Path**      | Yes      | Current file location | `drafts/report.pdf`    |
| **Destination Path** | Yes      | New file location     | `published/report.pdf` |

**Outputs**:

| Output      | Type   | Description                |
| ----------- | ------ | -------------------------- |
| `path`      | string | New file path              |
| `publicUrl` | string | Public URL at new location |

**Example**: Publish a draft

```
Source Path: drafts/annual-report.pdf
Destination Path: published/annual-report.pdf
→ path: "published/annual-report.pdf"
```

---

### SupabaseStorageRename

Rename a file while keeping it in the same folder.

| Input           | Required | Description              | Example                  |
| --------------- | -------- | ------------------------ | ------------------------ |
| **Source Path** | Yes      | Current file path        | `documents/old-name.txt` |
| **New Name**    | Yes      | New filename (no folder) | `new-name.txt`           |

**Outputs**:

| Output      | Type   | Description              |
| ----------- | ------ | ------------------------ |
| `path`      | string | New file path            |
| `publicUrl` | string | Public URL with new name |

**Example**: Fix a typo

```
Source Path: documents/anual-report.txt
New Name: annual-report.txt
→ path: "documents/annual-report.txt"
```

---

## How Base Path works

If you set **Base Path** to `v1`, all paths get that prefix automatically:

| Base Path      | Source Path        | Actual path in Storage     |
| -------------- | ------------------ | -------------------------- |
| (empty)        | `reports/2024.pdf` | `reports/2024.pdf`         |
| `v1`           | `reports/2024.pdf` | `v1/reports/2024.pdf`      |
| `backups/2024` | `january.zip`      | `backups/2024/january.zip` |

Use this to version your files or organize by tenant/date without changing every path in your flows.

---

## Common patterns

### Pattern 1: Load a document, process it, save the result

```
[Start] → [SupabaseStorageDownload: Load prompt]
                ↓
        [LLM: Process with prompt]
                ↓
        [SupabaseStorageUpload: Save response]
                ↓
        [Direct Reply: Return public URL]
```

### Pattern 2: Archive old files

```
[Condition: File older than 30 days?]
    Yes → [SupabaseStorageMove: Move to archive/]
    No  → [Direct Reply: File is current]
```

### Pattern 3: Rename uploaded files with timestamps

```
[SupabaseStorageUpload: User uploads file]
                ↓
        [Custom Function: Generate timestamped name]
                ↓
        [SupabaseStorageRename: Rename to 2024-05-08-filename.txt]
```

---

## Error handling

| Error                                                 | Cause                                   | Fix                                         |
| ----------------------------------------------------- | --------------------------------------- | ------------------------------------------- |
| `Missing Supabase API credential`                     | No credential selected or empty API key | Check credential in node settings           |
| `Invalid Supabase project URL`                        | URL format wrong                        | Use full URL: `https://project.supabase.co` |
| `Supabase Storage error: Object not found`            | File doesn't exist at path              | Check source path and bucket name           |
| `Supabase Storage error: The resource already exists` | Destination file already exists         | Delete first or use a different name        |
| `Supabase Storage error: Bucket not found`            | Bucket doesn't exist                    | Create bucket in Supabase dashboard         |

---

## Security notes

-   **Use RLS policies** on your Supabase Storage buckets to control access
-   **Public buckets**: Files are accessible by anyone with the public URL
-   **Private buckets**: Use `getPublicUrl` only if you have a signed URL setup; otherwise use the `content` output for processing
-   The `supabaseApi` credential stores your **anon/service_role key** — keep it secure

---

## Requirements

-   Flowise with `@supabase/supabase-js` dependency (included in this fork)
-   Supabase project with Storage enabled
-   Bucket created in Supabase dashboard
-   `supabaseApi` credential configured in Flowise

## See also

-   [Supabase Storage docs](https://supabase.com/docs/guides/storage)
-   [A2A Protocol nodes](./A2AStorage/) — uses the same Supabase adapter pattern
