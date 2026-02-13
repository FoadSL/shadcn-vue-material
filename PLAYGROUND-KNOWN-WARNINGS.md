# Known Warnings

## "No emitted event found. Please check component: ..."

**Status:** Harmless — does not affect functionality.

**Affected components:** Dialog, DialogContent, Select, SelectContent, Drawer, DrawerContent, Checkbox, Tooltip, TooltipContent, Slider, DropdownMenu, DropdownMenuContent, Popover, PopoverContent, RadioGroup, Switch, and other reka-ui wrapper components.

### Cause

The original upstream shadcn-vue components are TypeScript and declare their emits with external type references:

```ts
import type { DialogRootEmits } from "reka-ui"
const emits = defineEmits<DialogRootEmits>()
```

During TS→JS conversion (`scripts/transform-ts-to-js.js`), these external emit types can't be resolved — unlike local types, they live inside the `reka-ui` package. The converter strips the unresolvable type parameter, producing:

```js
const emits = defineEmits()
```

`defineEmits()` with no arguments tells Vue that the component declares **zero** events. The `useForwardPropsEmits` composable from reka-ui then logs a warning because it can't find any declared emits to forward.

Despite the warning, everything still works: undeclared events propagate through `$attrs`, and `useForwardPropsEmits` forwards them regardless.

### Why it wasn't fixed yet

We solved the analogous problem for **props** by adding a `KNOWN_EXTERNAL_PROPS` map in `transform-ts-to-js.js` (see the `PrimitiveProps` entry). That was necessary because missing prop declarations caused actual runtime errors (`"Property 'asChild' was accessed during render but is not defined"`).

For emits, the situation is different:
- The warnings are cosmetic — no runtime breakage.
- The number of unique emit type signatures across reka-ui components is large (30+ distinct types like `DialogRootEmits`, `SelectRootEmits`, `TooltipRootEmits`, etc.).
- Each type has different event names that would need manual mapping.

### Recommended solutions (pick one when ready)

#### Option A: Add `KNOWN_EXTERNAL_EMITS` map (same pattern as props)

Add a map in `transform-ts-to-js.js`:

```js
const KNOWN_EXTERNAL_EMITS = new Map([
  ['DialogRootEmits', ['update:open']],
  ['DialogContentEmits', ['escapeKeyDown', 'pointerDownOutside', /* ... */]],
  ['SelectRootEmits', ['update:modelValue', 'update:open']],
  // ... etc for each reka-ui emit type
])
```

Then in `extractEmitNames`, when encountering an unresolvable `TSTypeReference`, check this map and return the event names.

**Pros:** Fully eliminates warnings, mirrors the existing `KNOWN_EXTERNAL_PROPS` approach.
**Cons:** Requires maintaining the map when reka-ui updates its event signatures.

#### Option B: Auto-extract emit names from reka-ui's type definitions

Write a one-time script that reads reka-ui's `.d.ts` files from `node_modules` and auto-generates the emit map. Run it as a pre-build step or on demand after upgrading reka-ui.

**Pros:** No manual maintenance, always in sync.
**Cons:** More complex to implement, depends on reka-ui's type export structure.

#### Option C: Suppress the warnings

The warnings come from reka-ui's `useForwardPropsEmits`. If reka-ui exposes a way to suppress them, or if a Nuxt/Vite plugin can filter console warnings matching `No emitted event found`, this avoids the problem entirely.

**Pros:** Zero changes to the conversion pipeline.
**Cons:** Hides the symptom rather than fixing the root cause.

### Related files

- `scripts/transform-ts-to-js.js` — the conversion pipeline (see `extractEmitNames` function and `KNOWN_EXTERNAL_PROPS` map)
- `scripts/convert-source-to-js.js` — the script that runs the conversion on all components
- `custom/registry/` — the converted JS output
