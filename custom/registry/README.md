This folder will hold **custom JS-first registry source** that is not managed by upstream sync.

- Put new/override components here in JS + Vue (e.g. `button/Button.vue`, `button/index.js`).
- Add corresponding entries to `registry.json` whose `files[].path` points into `custom/registry/...`.
- `pnpm sync` will NOT touch this folder. It only refreshes `registry/` and merges upstream items into `registry.json` while preserving any custom items you add.

