---
description: Add a new browser utility tool
---

# Add Tool

1. Create `components/tools/<name>.tsx`
2. Register in `lib/tools-config.ts`:
```ts
{
  id: "name",
  name: "Display Name",
  description: "...",
  category: "generate" | "text" | "image" | "checker" | "sharing",
  icon: IconComponent,
  component: ToolComponent,
}
```

## Guidelines
- Client-side only (no server calls)
- Dark mode compatible
- Mobile-first
- Include copy buttons for outputs
