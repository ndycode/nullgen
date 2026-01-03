# Contributing to vxid.cc

Thanks for your interest in contributing! This document provides guidelines for development.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/ndycode/vxid.cc.git
cd vxid.cc

# Install dependencies
npm install

# Set up environment variables (optional, for file sharing)
cp .env.example .env.local
# Edit .env.local with your R2 credentials

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the app.

## Available Scripts

| Command                 | Description                     |
| ----------------------- | ------------------------------- |
| `npm run dev`           | Start development server        |
| `npm run build`         | Create production build         |
| `npm run lint`          | Run ESLint                      |
| `npm run lint:fix`      | Fix ESLint errors automatically |
| `npm run format`        | Format code with Prettier       |
| `npm run format:check`  | Check code formatting           |
| `npm test`              | Run test suite                  |
| `npm run test:watch`    | Run tests in watch mode         |
| `npm run test:coverage` | Run tests with coverage report  |
| `npm run typecheck`     | Run TypeScript type checking    |

## Code Style

- **TypeScript**: Use proper types, avoid `any`
- **Components**: Functional components with hooks
- **Styling**: Tailwind CSS classes
- **Formatting**: Prettier (run `npm run format` before committing)

## Project Structure

```
├── app/                 # Next.js App Router pages & API
├── components/
│   ├── tools/           # Individual tool components
│   └── ui/              # Reusable UI primitives
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions & services
│   ├── constants.ts     # App constants
│   ├── env.ts           # Environment config with validation
│   ├── errors.ts        # Error classes
│   ├── logger.ts        # Structured logging
│   ├── db/              # Database layer (domain-split)
│   ├── r2.ts            # R2 storage service
│   └── passwords.ts     # Password hashing (scrypt)
├── types/               # TypeScript type definitions
├── vitest.config.ts     # Test configuration
└── vitest.setup.ts      # Test environment setup
```

## Adding a New Tool

1. Create component in `components/tools/[tool-name].tsx`
2. Add tool definition to `lib/tools-config.ts`
3. Add tests in `components/tools/tools.test.tsx` (or appropriate category test file)
4. Run `npm test` to verify

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run checks: `npm run lint && npm run typecheck && npm test`
5. Commit with descriptive message
6. Push and create a Pull Request

## Design Principles

1. **Client-side first** — All processing in the browser when possible
2. **Privacy-focused** — No tracking, minimal data collection
3. **Accessible** — Follow WCAG guidelines
4. **Mobile-first** — Responsive design throughout
5. **Instant feedback** — No blocking modals

## Questions?

Open an issue or reach out on GitHub.
