---
description: Update all documentation to match current codebase structure
---

# Update Docs

// turbo-all

## 1. Find Docs
```powershell
Get-ChildItem -Filter *.md -Recurse -Depth 2 | Where-Object { $_.FullName -notlike "*node_modules*" }
```

## 2. Key Files
- `README.md` - Project overview
- `CONTRIBUTING.md` - Contribution guide
- `schema.sql` - Database schema

## 3. Verify Against Code
```powershell
# API routes
Get-ChildItem -Path app\api -Recurse -Filter route.ts

# Components
Get-ChildItem -Path components\tools -Filter *.tsx

# Lib utilities
Get-ChildItem -Path lib -Filter *.ts
```

## 4. Update Rules
- Commands must be runnable
- Env vars must match `lib/env.ts`
- File paths must exist
- No outdated instructions

## Quality Bar
New dev can: clone → setup → run → contribute
