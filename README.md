# vxid.cc

A privacy-first toolkit with 38+ browser utilities. No sign-ups, no tracking.

## Quick Start

```bash
npm install
npm run dev
```

## Tools

<details>
<summary><strong>Generate (15 tools)</strong></summary>

| Tool | Description |
|------|-------------|
| pass | Secure passwords |
| color | HEX/RGB/HSL converter |
| barcode | CODE128, EAN-13, UPC, CODE39 |
| fake | Test names, emails, phones |
| palette | Color harmonies |
| card | Test credit cards |
| string | Random strings |
| integer | Random numbers |
| sequence | Shuffle sequences |
| username | Creative usernames |
| business | Company names |
| iban | Test bank accounts |
| mac | MAC addresses |
| hash | MD5, SHA-256, SHA-512 |
| uuid | UUID v4 |

</details>

<details>
<summary><strong>Text (10 tools)</strong></summary>

| Tool | Description |
|------|-------------|
| count | Words, characters, reading time |
| case | UPPER/lower/Title/camelCase |
| clean | Strip whitespace |
| emoji | Emoji search |
| days | Date calculator |
| dedup | Remove duplicates |
| reverse | Reverse text |
| chars | Special characters |
| numbers | Base converter |

</details>

<details>
<summary><strong>Image (11 tools)</strong></summary>

| Tool | Description |
|------|-------------|
| privacy | EXIF stripper + anti-hash |
| compress | Bulk compression |
| resize | Bulk resize with presets |
| convert | PNG/JPG/WebP converter |
| favicon | Emoji to .ico |
| erase | AI background removal |
| crop | Crop and rotate |
| split | Grid splitter |
| svg | SVG optimizer |
| pick | Color extractor |
| watermark | Add text watermarks |
| ratio | Aspect calculator |

</details>

<details>
<summary><strong>Sharing (2 tools)</strong></summary>

| Tool | Description |
|------|-------------|
| drop | File sharing with 6-digit codes |
| qr | QR code generator |

</details>

## Tech Stack

- **Next.js 15** - React framework
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Cloudflare R2** - File storage (dead drop only)

## Environment Variables

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
```

## License

MIT
