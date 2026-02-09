#!/usr/bin/env node
/**
 * Strip the most common TypeScript syntax from Vue SFCs in
 * custom/registry/new-york-v4/blocks so scripts become valid JS:
 * - Remove lang="ts" on <script> / <script setup>
 * - Remove `generic="..."` on <script setup> (Vue 3.5+)
 * - Remove `import type` lines
 * - Drop simple `interface` and `type` declarations
 * - Replace `defineProps<...>(` and `withDefaults(defineProps<...>(` with JS versions
 * - Replace `defineEmits<...>(` with `defineEmits(`
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const blocksRoot = path.join(rootDir, 'custom', 'registry', 'new-york-v4', 'blocks')

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walk(full)
    } else if (entry.isFile() && full.endsWith('.vue')) {
      yield full
    }
  }
}

function stripTsFromVueSource(source) {
  let code = source

  // 1) Remove lang="ts" (or 'ts') on script tags
  code = code.replace(/(<script\b[^>]*?)\s+lang=(["'])ts\2([^>]*>)/g, '$1$3')

  // 1b) Remove generic="..." attribute on script tags (Vue 3.5+)
  code = code.replace(/(<script\b[^>]*?)\s+generic=["'][^"']*["']([^>]*>)/g, '$1$2')

  // 2) Remove `import type ...` lines
  code = code.replace(/^\s*import\s+type\s+.*?;?\s*$/gm, '')

  // 3) Remove simple `type X = ...` one-liners
  code = code.replace(/^\s*type\s+\w+\s*=\s*.*?;?\s*$/gm, '')

  // 4) Remove simple `interface X { ... }` blocks (non-nested heuristics)
  code = code.replace(
    /^\s*(export\s+)?interface\s+\w+\s*{[\s\S]*?^\s*}\s*$/gm,
    '',
  )

  // 5) Drop generic arguments from defineProps / withDefaults(defineProps<...>())
  // withDefaults(defineProps<...>(
  code = code.replace(
    /withDefaults\s*\(\s*defineProps<[^>]+>\s*\(/g,
    'withDefaults(defineProps(',
  )
  // plain defineProps<...>(
  code = code.replace(/defineProps<[^>]+>\s*\(/g, 'defineProps(')

  // 6) Drop generic arguments from defineEmits<...>()
  code = code.replace(/defineEmits<[^>]+>\s*\(/g, 'defineEmits(')

  return code
}

async function main() {
  console.log('Stripping TS syntax from Vue SFCs in blocks/ ...')

  for await (const file of walk(blocksRoot)) {
    const rel = path.relative(rootDir, file).replace(/\\/g, '/')
    let source = await fs.readFile(file, 'utf8')
    const next = stripTsFromVueSource(source)
    if (next !== source) {
      await fs.writeFile(file, next, 'utf8')
      console.log('  ✓ Updated', rel)
    }
  }

  console.log('Done stripping TS from blocks/ components.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

