---
description: Initial project setup
---

# Setup

## Install
```bash
npm install
cp .env.example .env.local
```

## Environment Variables

**Required:**
```
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

**Optional:**
```
R2_PUBLIC_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Database
Run `schema.sql` in Supabase SQL Editor.

// turbo
## Verify
```bash
npm run dev
```
