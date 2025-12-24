# vxid.cc

> **the tools you keep forgetting to bookmark**

A sleek, privacy-first toolkit with 13 essential utilities — all running client-side in your browser. No sign-ups, no tracking, just useful tools.

---

## ✨ Features

### 🔗 Sharing
| Tool | Description |
|------|-------------|
| **drop** | Upload files, get a 6-digit code, share instantly. Supports password protection, custom expiry (10m-7d), download limits, and QR codes. |
| **qr** | Generate QR codes from any text or URL. Customizable colors and sizes. |

### 🔐 Generate
| Tool | Description |
|------|-------------|
| **pass** | Secure password generator with adjustable length (8-64) and character options (uppercase, numbers, symbols). |
| **color** | Color converter with presets. Supports HEX ↔ RGB ↔ HSL with one-click copy. |
| **hash** | Real-time text hashing. Supports MD5, SHA-1, SHA-256, SHA-512. |

### 📝 Text
| Tool | Description |
|------|-------------|
| **clean** | Strip whitespace, empty lines, and duplicate spaces. Toggle options for precise control. |
| **count** | Word, character, and sentence counter with reading time estimate. |
| **days** | Calculate days between dates with quick presets (+7d, +30d, +1y). |
| **emoji** | Searchable emoji picker organized by category. Tap to copy. |
| **case** | Convert text between 11 case formats (UPPER, lower, Title, camelCase, snake_case, etc). |

### 🖼️ Image
| Tool | Description |
|------|-------------|
| **convert** | Convert images between PNG, JPG, and WEBP. Quality slider for compression. |
| **favicon** | Generate favicons from emoji or uploaded images. Export all sizes (16-256px). |
| **erase** | AI-powered background removal. Runs entirely in your browser (~5MB model download on first use). |

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## ⚙️ Environment Setup

Copy `env.example.txt` to `.env.local`:

```env
# Cloudflare R2 (for dead drop file storage)
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
```

> **Note:** Only the "drop" tool requires R2 storage. All other tools work without any configuration.

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router) |
| React | React 19 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Animation | Framer Motion |
| Icons | Phosphor Icons |
| Storage | Cloudflare R2 |
| AI (bg-remove) | @imgly/background-removal |

---

## 📁 Project Structure

```
├── app/
│   ├── page.tsx          # Landing page
│   ├── share/page.tsx    # Tools carousel
│   ├── download/page.tsx # File download page
│   └── api/              # Upload/download endpoints
├── components/
│   ├── tools/            # 13 tool components
│   ├── tools-carousel.tsx
│   └── ui/               # shadcn components
├── lib/
│   └── tools-config.ts   # Tool definitions
└── public/
    └── logo.png
```

---

## 🎨 Design

- **Dark mode first** with light mode toggle
- **Motion animations** on all tool cards
- **Custom styled** range sliders and scrollbars
- **Mobile responsive** carousel navigation
- **No native browser pickers** — all custom themed

---

## 📄 License

MIT — use it however you want.

---

<p align="center">
  <strong>vxid.cc</strong> — minimal tools, maximum utility
</p>
