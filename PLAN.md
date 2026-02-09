# Registry Plan: Custom JS Registry + Directory

This document outlines the plan for our custom shadcn-vue registry: a JavaScript version synced with shadcn-vue, and how it fits into the Registry Directory ecosystem.

---

## Overview

1. **Our registry**: Serves JavaScript (not TypeScript) components
2. **Sync**: Stays in sync with [shadcn-vue](https://github.com/unovue/shadcn-vue)
3. **Directory**: Can be listed in the Registry Directory (like [ui.shadcn.com/docs/directory](https://ui.shadcn.com/docs/directory)) once that exists in shadcn-vue

---

## Custom JS Registry (This Repo)

### Architecture

```
shadcn-vue (upstream)     →     Our registry repo
unovue/shadcn-vue                    my-shadcn-registry
       │                                    │
       │  Sync (copy registry/)             │
       ▼                                    ▼
   registry (TS)  ────►  Convert to JS  ────►  public/r/ (deployed)
```

### Implementation Status

| Task | Status |
|------|--------|
| Bootstrap from shadcn-vue | Done |
| Build script | Done (`pnpm build`, `pnpm build:js`) |
| TS → JS conversion | Done (`@unovue/detypes` in build:js) |
| Sync script | Done (`pnpm sync`) |
| Hosting | Deploy `public/r/` to static host |

### Custom design system (Vira)

We want this registry to expose components that are **pre-styled with our own design system** instead of the default shadcn theme.

- Source design system package: `C:\Users\shahab.shafiee\Desktop\projects\gitlab\vira\packages\material-design-css`
- Goal: align shadcn-vue primitives and examples with our **material-design-css** tokens, typography, spacing, and components.

High-level approach:

1. **Bridge layer** in this repo (or in a sibling package) that maps shadcn-vue tokens/classes to `material-design-css`:
   - Create shared CSS / tailwind preset (or plain CSS) that wraps `material-design-css` and exposes shadcn-compatible class names.
   - Keep the public API of components the same as upstream shadcn-vue (props, slots), but use our design system underneath.
2. **Registry items**:
   - For each component we customize, sync upstream code, then apply a transform (or manual fork) that swaps styling/utilities to our design system.
   - Ensure generated JSON in `public/r/...` reflects our design system classes + imports.
3. **Consumer apps**:
   - Point `components.json` to this registry.
   - Configure their tailwind/CSS pipeline to include `material-design-css` (or the bridge preset) so imported components render with the correct Vira design.

### JS-first development & overrides

We want to:

- Stay **fully synced** with upstream `shadcn-vue` registry.
- Develop **new components and overrides in JavaScript** (no TS) inside this repo.

Architecture:

1. **Synced TS source**:
   - `pnpm sync` copies `apps/v4/registry` from upstream into our local `registry/` folder and refreshes `registry.json` with the latest `items` from upstream.
2. **Custom JS source**:
   - Create a separate tree for JS-only work that is never touched by sync, e.g.:
     - `custom/registry/...` for new or overridden components written in JS + Vue.
   - For any new component, add a corresponding `item` entry to `registry.json` whose `files[].path` points into `custom/registry/...`.
3. **Merge on sync**:
   - The sync script keeps **all upstream items** up to date, but preserves **extra items** in `registry.json` that don’t exist upstream (our custom JS components).
4. **Build**:
   - `pnpm build` / `pnpm build:js` runs `shadcn-vue build` against `registry.json` so the final `public/r/...` JSON contains both:
     - All upstream components.
     - Our additional/overridden JS components where we’ve pointed `files[].path` to `custom/registry`.

### JS override workflow (for community-facing JS components)

We want our community to consume **JS-ready components** while we keep upstream in TS/Vue for easy syncing. We use this workflow:

1. **Keep upstream TS/Vue as sync source**
   - Do not edit `registry/new-york-v4/...` directly. These files are overwritten by `pnpm sync`.
   - Consumers never see these TS files directly; `pnpm build:js` + `@unovue/detypes` produce JS/TS-stripped output in `public/r/styles/new-york-v4/*.json`.

2. **Create JS overrides in `custom/registry`**
   - For each component we want to customize deeply (design system, animations, behavior):
     - Copy the upstream files from `registry/new-york-v4/...` into `custom/registry/...`, e.g.:
       - From `registry/new-york-v4/ui/button/Button.vue` → `custom/registry/button/Button.vue`
       - From `registry/new-york-v4/ui/button/index.ts` → `custom/registry/button/index.js`
     - Convert them to JS-only:
       - Remove `lang="ts"` and TypeScript types.
       - Keep the same props/slots API as upstream.
       - Swap Tailwind/shadcn classes to our `material-design-css` utilities and add any animations/logic we need.

3. **Wire JS overrides in `registry.json`**
   - For each overridden component, change its `item.files[].path` to point to `custom/registry/...` instead of `registry/...`.
   - Options:
     - Override the original name (e.g. `button`) so `@mycompany/button` installs our JS/Vira version.
     - Or add variants (e.g. `button-material`) that live alongside upstream `button`.

4. **Build JS registry for consumers**
   - Run `pnpm build:js` to:
     - Build all items from `registry.json` (including `custom/registry` JS files).
     - Transform TS/Vue to JS-ready content via `@unovue/detypes`.
     - Output final JSON files under `public/r/styles/new-york-v4/{name}.json`.

5. **Publish and usage**
   - Deploy `public/r/` to a static host.
   - Consumers add our registry to their `components.json` and run:
     - `npx shadcn-vue add @mycompany/button`
   - They receive **JS-ready components** that already use our Vira design system and custom behavior.

### Usage in Projects

Add to `components.json`:

```json
{
  "registries": {
    "@mycompany": "https://YOUR_URL/r/styles/new-york-v4/{name}.json"
  }
}
```

Then: `npx shadcn-vue add @mycompany/button`

---

## Preview & Landing Site

We want a **preview + marketing site that looks exactly like [shadcn-vue.com](https://www.shadcn-vue.com/)** and is backed by our JS registry.

### Source of Truth

- Upstream site lives in `C:\Users\shahab.shafiee\Desktop\projects\gitlab\shadcn-vue\apps\v4` (Nuxt app)
- We treat that app as the **canonical implementation** of the landing/docs UI

### How it fits with this repo

1. This repo focuses on **serving the JS registry** (`public/r/`)
2. The Nuxt docs/landing app (`apps/v4`) uses our registry endpoints as its **registry backend**
3. In production, both can be hosted under the same domain:
   - `https://our-domain.com` → Nuxt app (clone of shadcn-vue.com)
   - `https://our-domain.com/r/...` → JS registry JSON (from this repo)

### Dev workflow

1. Run the registry build here:
   - `pnpm build` or `pnpm build:js`
2. Run the Nuxt site from the `shadcn-vue` repo:
   - `cd C:\Users\shahab.shafiee\Desktop\projects\gitlab\shadcn-vue\apps\v4`
   - `pnpm install`
   - `pnpm dev`
3. Configure the Nuxt app’s registry config so that:
   - Local dev uses `http://localhost:PORT/r/...` from this repo
   - Production uses `https://our-domain.com/r/...` from this repo

Later we can automate this by adding:

- A shared deployment (same domain, `site` + `r/` assets)
- Optional script here to **sync docs assets** or configs from `shadcn-vue` so we stay in lockstep with upstream

---

## Registry Directory (shadcn-vue docs)

The [Registry Directory](https://ui.shadcn.com/docs/directory) lists community registries. shadcn-vue can add a similar page.

### Data Layer

- **registries.json**: `{ "@registry": "url" }` for CLI auto-discovery
- **directory.json**: Extended metadata (name, description, homepage) for the directory UI

### To Get Listed

When the directory exists in shadcn-vue, our registry can be added by:

1. Submitting a PR to add our registry to `directory.json` and `registries.json`
2. Or hosting `registries.json` ourselves and having it linked

### Directory Card Content

Each registry in the directory shows:

- Name (e.g. `@mycompany`)
- Title
- Description
- Add button (CLI command)
- View link (homepage)

---

## Sync Strategy

1. **Manual**: Run `pnpm sync` periodically, then `pnpm build:js`
2. **Automated**: GitHub Actions that:
   - Triggers on schedule or shadcn-vue release
   - Runs sync + build
   - Deploys to GitHub Pages / static host

---

## References

- [shadcn-vue](https://github.com/unovue/shadcn-vue)
- [shadcn-vue Registry docs](https://www.shadcn-vue.com/docs/registry)
- [registry.json schema](https://shadcn-vue.com/schema/registry.json)
- [registry-item.json schema](https://shadcn-vue.com/schema/registry-item.json)
