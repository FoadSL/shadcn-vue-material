# shadcn-vue-material

A custom [shadcn-vue](https://github.com/unovue/shadcn-vue) registry that serves components in **JavaScript** with **Material Design 3** styling.

Stays synced with upstream shadcn-vue while giving you JS-ready, MD3-styled components that can be installed via the shadcn CLI.

## Features

- **JavaScript components** — No TypeScript required in consuming projects
- **Material Design 3** — Components styled with MD3 design tokens
- **Full shadcn-vue catalog** — All upstream components, converted and customizable
- **Custom registry API** — Install via `npx shadcn-vue add @your-registry/button`
- **Nuxt 4 playground** — Preview and test all components locally

## Quick Start

```bash
pnpm install
pnpm build:js          # Build the JS registry
pnpm serve:public      # Preview at http://localhost:4173
```

## Usage in Your Project

Add the registry to your `components.json`:

```json
{
  "registries": {
    "@mycompany": "https://your-domain.com/r/styles/new-york-v4/{name}.json"
  }
}
```

Install components:

```bash
npx shadcn-vue add @mycompany/button
npx shadcn-vue add @mycompany/dialog
```

## Project Structure

```
shadcn-vue-material/
├── registry/              # Upstream TS source (synced, don't edit)
├── custom/registry/       # Converted JS components (editable)
├── scripts/               # Build, sync, and conversion scripts
├── public/r/              # Built output (deploy this)
├── playground/v4/         # Nuxt 4 preview app
├── packages/              # Material Design 3 CSS package
└── registry.json          # Component registry manifest
```

## Development

### Prerequisites

- Node.js v20+
- pnpm v10+

### Run the Playground

```bash
pnpm playground:sync          # Sync components + rebuild registry
cd playground/v4
pnpm dev                      # http://localhost:3000
```

### Sync from Upstream

Pull the latest components from shadcn-vue and convert to JS:

```bash
pnpm sync                     # Update registry/ from upstream
pnpm convert:source:js        # Convert TS → JS into custom/registry/
pnpm playground:sync          # Sync to playground
```

The sync expects `shadcn-vue` as a sibling directory. Override with:

```bash
UPSTREAM_PATH=/path/to/shadcn-vue pnpm sync
```

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm build:js` | Build JS registry to `public/r/` |
| `pnpm sync` | Sync upstream TS source into `registry/` |
| `pnpm convert:source:js` | Convert `registry/` → `custom/registry/` |
| `pnpm playground:sync` | Sync to playground + rebuild |
| `pnpm serve:public` | Serve built registry locally |

## Deployment

Build and deploy the `public/r/` directory to any static host:

```bash
pnpm build:js
# Deploy public/r/ to GitHub Pages, Netlify, Vercel, Cloudflare, etc.
```

Your registry will be available at:

```
https://your-domain.com/r/styles/new-york-v4/{component-name}.json
```

## Documentation

| Document | Description |
|----------|-------------|
| [GUIDE.md](./GUIDE.md) | Complete project guide — architecture, pipeline, workflows, troubleshooting |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | How to contribute — setup, code style, PR checklist |
| [KNOWN-WARNINGS.md](./KNOWN-WARNINGS.md) | Known harmless warnings and future solutions |
| [PLAN.md](./PLAN.md) | Original project plan and roadmap |

## How the TS-to-JS Conversion Works

The custom conversion pipeline (`scripts/transform-ts-to-js.js`) uses:

1. **Babel AST** — Converts Vue macros (`defineProps<T>()`, `defineEmits<T>()`) to runtime equivalents
2. **TypeScript compiler** — Strips type annotations while preserving template-only imports
3. **Known external types** — Resolves props from external packages like reka-ui's `PrimitiveProps`

See the [Conversion Pipeline](./GUIDE.md#ts-to-js-conversion-pipeline) section in GUIDE.md for details.

## License

MIT
