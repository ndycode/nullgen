---
description: Backend reference - database, storage, API patterns
---

# Backend Reference

## Database (Supabase)

Schema: `schema.sql`

| Table | Purpose |
|-------|---------|
| `file_metadata` | Dead drop uploads |
| `upload_sessions` | Temp upload state |
| `shares` | Pastebin/code/secret shares |
| `share_contents` | Share content storage |
| `download_tokens` | One-time download tokens |

Access via `lib/db.ts`.

## Storage (Cloudflare R2)

Access via `lib/r2.ts` → `r2Storage` singleton.

```ts
// Upload/download
await r2Storage.uploadFile(buffer, key, mimeType);
await r2Storage.downloadRaw(key);
await r2Storage.downloadStream(key);

// Metadata
await r2Storage.getMetadata(code);
await r2Storage.saveMetadata(code, data);

// Delete
const result = await r2Storage.deleteFile(key); // { success, error? }
```

## API Routes

Location: `app/api/`

| Route | Purpose |
|-------|---------|
| `/api/upload` | Initiate upload session |
| `/api/upload/complete` | Finalize upload |
| `/api/download` | Initiate download |
| `/api/download/[token]` | Download with token |
| `/api/share` | Create/fetch shares |
