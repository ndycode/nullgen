---
description: Development commands - dev server, build, test, lint
---

# Development Commands

// turbo-all

## Dev Server
```bash
npm run dev
```
App runs at `http://localhost:3000`

## Build
```bash
npm run build
```

## Test
```bash
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # with coverage
```

## Lint & Format
```bash
npm run lint          # check
npm run lint:fix      # auto-fix
npm run format        # format all
npm run format:check  # check only
npm run typecheck     # TypeScript
```

## Without Storage
```bash
ENV_VALIDATION_STRICT=false npm run dev
```
