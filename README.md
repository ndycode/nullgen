# vxid.cc

A privacy-first toolkit with 64+ browser utilities. All tools run client-side — no sign-ups, no tracking, just practical tools for developers and creators.

## Features

### Core Capabilities

- **Checker Tools** — IP lookup, DNS records, WHOIS, SSL check, ping, user agent, screen info, leak detection
- **File Sharing** — Dead drop with 8-digit codes, optional passwords, and auto-expiry
- **Sharing Tools** — Link shortener, pastebin, image host, secret notes, code/JSON/CSV sharing
- **Image Processing** — Compress, resize, convert, crop, blur, rotate, filter, remove backgrounds
- **Text Utilities** — Word count, case conversion, regex tester, Lorem ipsum, base64 encoding
- **Data Generators** — Passwords, UUIDs, timestamps, gradients, barcodes, test data

### User Experience

- **Favorites** — Bookmark frequently-used tools with the heart icon
- **Recent Tools** — Quick access to your last 6 used tools
- **Keyboard Shortcuts** — `Esc` to go back, `Cmd/Ctrl+K` for search, arrow keys to navigate
- **Animated Background** — Subtle floating gradient orbs for visual polish
- **Skeleton Loaders** — Smooth shimmer loading states
- **Success Animations** — Confetti feedback on key actions

## Tech Stack

| Layer        | Technology              | Purpose                             |
| ------------ | ----------------------- | ----------------------------------- |
| Framework    | Next.js 16 (App Router) | Server/client React with TypeScript |
| Storage      | Cloudflare R2           | Object storage for file sharing     |
| Styling      | Tailwind CSS v4         | Utility-first CSS                   |
| Components   | shadcn/ui               | Accessible UI primitives            |
| Animations   | Framer Motion           | UI transitions                      |
| Color Picker | react-colorful          | Custom color selection              |
| Effects      | canvas-confetti         | Success animations                  |

## Quick Start

```bash
# Clone and install
git clone https://github.com/ndycode/vxid.cc.git
cd vxid.cc
npm install

# Configure environment (optional, for file sharing)
cp .env.example .env.local
# Edit .env.local with your R2 credentials

# Start development server
npm run dev
```

Visit `http://localhost:3000`

## Project Structure

```
├── app/
│   ├── page.tsx              # Landing + tools carousel
│   ├── error.tsx             # Root error boundary
│   ├── not-found.tsx         # Custom 404 page
│   ├── loading.tsx           # Root loading state
│   ├── s/[code]/page.tsx     # Share viewer
│   └── api/                  # Upload/download/share APIs
├── components/
│   ├── tools/                # 64 tool components
│   ├── tools-carousel.tsx    # Navigation with favorites/recent
│   ├── error-boundary.tsx    # Client-side error boundary
│   ├── animated-background.tsx
│   └── ui/                   # shadcn + custom components
├── lib/
│   ├── db/                   # Database layer (domain-split)
│   │   ├── client.ts         # Supabase client + utilities
│   │   ├── session-db.ts     # Upload session operations
│   │   ├── file-db.ts        # File metadata operations
│   │   ├── share-db.ts       # Share operations
│   │   ├── token-db.ts       # Download token operations
│   │   └── ...               # Additional DB tokens
│   ├── tools-config.ts       # Tool definitions (IDs are stable)
│   ├── tool-preferences.ts   # Favorites/recent (localStorage)
│   ├── env.ts                # Environment config with validation
│   ├── r2.ts                 # R2 storage service
│   ├── passwords.ts          # Password hashing (scrypt)
│   ├── constants.ts          # Constants + validation functions
│   ├── confetti.ts           # Animation utilities
│   └── ...                   # Additional utilities
└── scripts/sql/              # Database migrations
    ├── 001_perf_tables.sql   # Core table schema
    ├── 002_cleanup_documentation.sql # Cleanup job docs
    ├── 003_atomic_functions.sql  # Atomic share/upload functions
    ├── 004_check_constraints.sql # Schema CHECK constraints
    └── 005_burned_invariant.sql  # Burned state irreversibility
```

## Environment Variables

```env
# Required for file sharing (fails loudly if missing)
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional
R2_PUBLIC_URL=your_public_url
UPSTASH_REDIS_REST_URL=your_upstash_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Feature Flags (all enabled by default, set to "false" to disable)
FEATURE_UPLOAD_ENABLED=true      # Kill switch for file uploads
FEATURE_DOWNLOAD_ENABLED=true    # Kill switch for file downloads
FEATURE_SHARE_ENABLED=true       # Kill switch for share creation
FEATURE_CRON_ENABLED=true        # Kill switch for cleanup jobs

# Development only
ENV_VALIDATION_STRICT=false  # Skip env validation for testing
```

## Available Scripts

| Command                 | Description               |
| ----------------------- | ------------------------- |
| `npm run dev`           | Start development server  |
| `npm run build`         | Create production build   |
| `npm run start`         | Start production server   |
| `npm run lint`          | Run ESLint                |
| `npm run format`        | Format code with Prettier |
| `npm test`              | Run test suite            |
| `npm run test:coverage` | Run tests with coverage   |
| `npm run typecheck`     | Check TypeScript types    |

## Tools (64)

### Checker (11)

ip, dns, whois, ssl, ping, useragent, screen, cookies, webgl, password, leak

### Sharing (9)

drop, qr, shorten, paste, imghost, secret, code, json, csv

### Generate (15)

pass, color, barcode, fake, palette, card, string, integer, sequence, username, business, iban, mac, hash, gradient

### Text (14)

count, case, clean, emoji, days, dedup, reverse, chars, numbers, lorem, base64, regex, timestamp, uuid

### Image (15)

compress, resize, convert, favicon, erase, crop, split, svg, pick, watermark, ratio, blur, rotate, filter, privacy

## Design Principles

1. **Client-side first** — All processing in the browser
2. **Dark mode default** — With optional light theme
3. **Mobile-first** — Responsive design throughout
4. **No sign-ups** — Preferences stored in localStorage
5. **Instant feedback** — No blocking modals or toasts

## Deployment

### GitHub Secrets

The following secrets must be configured in GitHub for CI and scheduled jobs:

| Secret        | Purpose                                            |
| ------------- | -------------------------------------------------- |
| `APP_URL`     | Base URL of deployed app (e.g., `https://vxid.cc`) |
| `CRON_SECRET` | Bearer token for cleanup endpoint authentication   |

### Database Migrations

Run SQL migrations in order against your Supabase database:

```bash
# Via Supabase Dashboard > SQL Editor, or psql:
psql $DATABASE_URL -f scripts/sql/001_perf_tables.sql
psql $DATABASE_URL -f scripts/sql/002_cleanup_documentation.sql
psql $DATABASE_URL -f scripts/sql/003_atomic_functions.sql
psql $DATABASE_URL -f scripts/sql/004_check_constraints.sql
psql $DATABASE_URL -f scripts/sql/005_burned_invariant.sql
```

### Pre-commit Hooks

This project uses husky + lint-staged. After `npm install`, hooks are auto-configured via the `prepare` script. Staged files are linted and formatted on commit.

## License

MIT
