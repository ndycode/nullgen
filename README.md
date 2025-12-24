# vxid.cc

A privacy-first toolkit with 16 essential utilities — all running client-side in your browser. No sign-ups, no tracking, just useful tools. Developed as a personal project to provide quick access to commonly needed web utilities.

## Overview

vxid.cc provides users with instant access to commonly needed tools without the friction of sign-ups or advertisements. The application handles file sharing, text manipulation, image processing, and code generation while keeping all operations client-side for maximum privacy.

### Core Capabilities

- **Dead Drop file sharing** with 6-digit codes, password protection, and auto-expiry
- **Client-side image processing** including format conversion, compression, resizing, and AI background removal
- **Privacy tools** for EXIF stripping, anti-hash pixel noise, and fake metadata injection
- **Text utilities** for cleaning, case conversion, word counting, and hashing
- **Generator tools** for passwords, QR codes, favicons, and color palettes

## Architecture

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 15 (App Router) | Server/client React components with TypeScript |
| Backend | Cloudflare R2 | Object storage for dead drop file sharing |
| Styling | Tailwind CSS v4 | Utility-first CSS framework |
| Components | shadcn/ui | Accessible, customizable UI primitives |
| Animations | Framer Motion | UI transitions and micro-interactions |
| Icons | Phosphor Icons | Consistent icon system |

### Key Design Decisions

1. **Client-side processing**: All tools except dead drop run entirely in the browser
2. **Dark mode first**: Designed for dark mode with optional light theme
3. **Mobile-first responsive**: Carousel navigation on mobile, inline arrows on desktop
4. **No native browser pickers**: Custom styled inputs for consistent theming

## Project Structure

```
├── app/
│   ├── page.tsx              # Landing page + tools carousel
│   ├── download/page.tsx     # File download page
│   └── api/                  # Upload/download endpoints
├── components/
│   ├── tools/                # 16 tool components
│   │   ├── dead-drop.tsx     # File sharing with codes
│   │   ├── qr-gen.tsx        # QR code generator
│   │   ├── passgen.tsx       # Password generator
│   │   ├── color-picker.tsx  # Color converter
│   │   ├── privacy-stripper.tsx # EXIF removal + anti-hash
│   │   ├── image-compressor.tsx # Bulk compression
│   │   ├── bulk-resizer.tsx  # Bulk resize with presets
│   │   ├── word-count.tsx    # Word/char counter
│   │   ├── case-converter.tsx # Case transformation
│   │   ├── text-cleaner.tsx  # Whitespace cleaner
│   │   ├── emoji-picker.tsx  # Emoji search
│   │   ├── image-converter.tsx # Format converter
│   │   ├── favicon-gen.tsx   # Favicon generator
│   │   ├── hash-gen.tsx      # Text hashing
│   │   ├── date-diff.tsx     # Date calculator
│   │   └── bg-remover.tsx    # AI background removal
│   ├── tools-carousel.tsx    # Navigation and layout
│   └── ui/                   # shadcn components
└── lib/
    └── tools-config.ts       # Tool definitions and categories
```

## Prerequisites

- Node.js 18.18 or higher (Node 20 recommended)
- npm 9+ (or equivalent package manager)
- Cloudflare R2 account (only for dead drop feature)

## Setup Instructions

### 1. Clone and Install

```bash
git clone https://github.com/ndycode/vxid.cc.git
cd vxid.cc
npm install
```

### 2. Environment Configuration

Create a `.env.local` file with:

```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=your_public_url
```

### 3. Development

```bash
npm run dev
```

Visit `http://localhost:3000`

### 4. Production Build

```bash
npm run build
npm start
```

## Tools Reference

### Sharing
| Tool | Description | Dependencies |
|------|-------------|--------------|
| **drop** | File sharing with 6-digit codes | Cloudflare R2 |
| **qr** | Instant QR code generation | qrcode.react |

### Generate
| Tool | Description | Dependencies |
|------|-------------|--------------|
| **pass** | Secure password generator | - |
| **color** | Color format converter (HEX/RGB/HSL) | - |
| **hash** | MD5, SHA-256, SHA-512 hashing | - |

### Text
| Tool | Description | Dependencies |
|------|-------------|--------------|
| **count** | Word, character, reading time | - |
| **case** | UPPER / lower / Title case | - |
| **clean** | Strip whitespace and empty lines | - |
| **emoji** | Search and copy emojis | - |
| **days** | Days between dates calculator | - |

### Image
| Tool | Description | Dependencies |
|------|-------------|--------------|
| **privacy** | EXIF stripper + anti-hash + fake metadata | piexifjs, jszip |
| **compress** | Bulk image compression | jszip |
| **resize** | Bulk resize with presets (FHD, HD, etc) | jszip |
| **convert** | PNG ↔ JPG ↔ WebP converter | - |
| **favicon** | Emoji to .ico generator | - |
| **erase** | AI background removal | @imgly/background-removal |

## License

MIT
