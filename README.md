# vxid.cc

A privacy-first toolkit with 59+ browser utilities. All tools run client-side — no sign-ups, no tracking, just practical tools for developers and creators.

## Overview

vxid.cc provides instant access to commonly needed tools without friction. The application handles file sharing, text manipulation, image processing, and data generation while keeping all operations client-side for maximum privacy.

### Core Capabilities

- **Checker Tools** — IP lookup, DNS records, WHOIS, SSL check, ping, useragent, screen info, leak detection
- **Dead Drop File Sharing** — Upload files with 6-digit codes, optional passwords, and auto-expiry
- **Sharing Tools** — Link shortener, pastebin, image host, secret notes, code/JSON/CSV sharing
- **Image Processing** — Compress, resize, convert, crop, blur, rotate, filter, remove backgrounds
- **Text Utilities** — Word count, case conversion, deduplication, and cleaning
- **Data Generators** — Passwords, UUIDs, barcodes, test credit cards, usernames, IBANs
- **Color Tools** — Picker, palette generator, and image color extraction

## Architecture

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 15 (App Router) | Server/client React components with TypeScript |
| Backend | Cloudflare R2 | Object storage for dead drop file sharing |
| Styling | Tailwind CSS v4 | Utility-first CSS framework |
| Components | shadcn/ui | Accessible, customizable UI primitives |
| Animations | Framer Motion + Lenis | UI transitions and smooth scrolling |
| Testing | Vitest | Unit and component testing (101+ tests) |

### Key Design Decisions

1. **Client-side processing** — All tools except dead drop run entirely in the browser
2. **Dark mode first** — Designed for dark mode with optional light theme
3. **Inline feedback** — No toast popups; all feedback appears within tool components
4. **Compact UI** — Tools fit in single cards with collapsible advanced options
5. **Centralized design system** — All colors and tokens in `lib/colors.ts`

## Project Structure

```
├── app/
│   ├── page.tsx              # Landing page + tools carousel
│   ├── download/page.tsx     # File download page
│   ├── s/[code]/page.tsx     # Unified share viewer
│   └── api/
│       ├── upload/           # Dead drop upload
│       ├── download/         # Dead drop download
│       └── share/            # Share creation & retrieval
├── components/
│   ├── tools/                 # 59 tool components
│   ├── tools-carousel.tsx     # Navigation and layout
│   └── ui/                    # shadcn components
└── lib/
    ├── tools-config.ts        # Tool definitions and categories
    ├── share-types.ts         # Share type definitions
    └── colors.ts              # Centralized design tokens
```

## Prerequisites

- Node.js 18.18+ (Node 20 recommended)
- npm 9+
- Cloudflare R2 account (only for dead drop feature)

## Setup Instructions

### 1. Clone and Install

```bash
git clone https://github.com/ndycode/vxid.cc.git
cd vxid.cc
npm install
```

### 2. Environment Configuration

Create a `.env.local` file:

```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=your_public_url
```

### 3. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |

## Testing

```bash
npm test
```

Test coverage includes:
- Color system constants (`lib/colors.ts`)
- Share types and constants (`lib/share-types.ts`)
- All 59 tool components render correctly
- UI elements and interactions

## Tools Reference

### Checker (11)
- **ip** — IP, location, ISP, VPN detection
- **dns** — DNS records (A, AAAA, MX, TXT, NS)
- **whois** — Domain registration info
- **ssl** — SSL certificate checker
- **ping** — Website latency checker
- **useragent** — Browser and device info
- **screen** — Resolution and viewport
- **cookies** — Browser storage test
- **webgl** — GPU and graphics info
- **password** — Password strength analyzer
- **leak** — Email/password breach checker

### Sharing (9)
- **drop** — File sharing with 6-digit codes
- **qr** — QR code generator
- **shorten** — URL shortener with expiry
- **paste** — Text pastebin with password
- **imghost** — Quick image sharing
- **secret** — Self-destructing notes
- **code** — Code snippets with syntax
- **json** — JSON sharing with validation
- **csv** — CSV with table preview

### Generate (15)
- **pass** — Secure passwords
- **color** — HEX/RGB/HSL converter
- **barcode** — CODE128, EAN-13, UPC, CODE39
- **fake** — Test names, emails, phones
- **palette** — Color harmonies
- **card** — Test credit cards
- **string** — Random strings
- **integer** — Random numbers
- **sequence** — Shuffle sequences
- **username** — Creative usernames
- **business** — Company names
- **iban** — Test bank accounts
- **mac** — MAC addresses
- **hash** — MD5, SHA-256, SHA-512
- **uuid** — UUID v4

### Text (10)
- **count** — Words, characters, reading time
- **case** — UPPER/lower/Title/camelCase
- **clean** — Strip whitespace
- **emoji** — Emoji search
- **days** — Date calculator
- **dedup** — Remove duplicates
- **reverse** — Reverse text
- **chars** — Special characters
- **numbers** — Base converter

### Image (14)
- **privacy** — EXIF stripper + anti-hash
- **compress** — Bulk compression
- **resize** — Bulk resize with presets
- **convert** — PNG/JPG/WebP converter
- **favicon** — Emoji to .ico
- **erase** — AI background removal
- **crop** — Crop and rotate
- **split** — Grid splitter
- **svg** — SVG optimizer
- **pick** — Color extractor
- **watermark** — Add text watermarks
- **ratio** — Aspect calculator
- **blur** — Blur or pixelate images
- **rotate** — Rotate and flip images
- **filter** — Apply image filters

## License

MIT
