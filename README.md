# my-shadcn-registry

A JavaScript registry synced with [shadcn-vue](https://github.com/unovue/shadcn-vue). Serves components in JavaScript instead of TypeScript.

## Quick start

```bash
pnpm install
pnpm build:js      # Build JS registry (recommended)
pnpm build         # Build TS registry
```

Output goes to `public/r/styles/new-york-v4/`. Deploy this folder to host your registry.

## Sync from upstream

To pull the latest components from shadcn-vue:

```bash
pnpm sync
pnpm build:js
```

The sync script expects `shadcn-vue` as a sibling directory. Override with:

```bash
UPSTREAM_PATH=/path/to/shadcn-vue pnpm sync
```

## Usage in projects

Add your registry to `components.json`:

```json
{
  "registries": {
    "@shadcn": "https://shadcn-vue.com/r/styles/{style}/{name}.json",
    "@mycompany": "https://YOUR_URL/r/styles/new-york-v4/{name}.json"
  }
}
```

Then:

```bash
npx shadcn-vue add @mycompany/button
```

## Project structure

```
my-shadcn-registry/
├── registry/           # Source components (from shadcn-vue)
├── public/r/           # Built output (deploy this)
├── scripts/
│   ├── build.js        # Build registry
│   └── sync-from-upstream.js
├── registry.json       # Registry index
├── components.json
└── package.json
```

## Hosting

Deploy `public/r/` to any static host:

- GitHub Pages
- GitLab Pages
- Netlify
- Vercel

Your registry URL will be: `https://your-domain.com/r/styles/new-york-v4/{name}.json`
