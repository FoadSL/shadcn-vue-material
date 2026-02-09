#!/usr/bin/env node
/**
 * Filters registry.json to Option A: only custom + overridden items.
 *
 * Keeps:
 * - "index", "style", "utils" (required for CLI / registry deps)
 * - Any item whose files all point to custom/registry/ (custom or overridden)
 *
 * Use after switching to Option A or if registry.json was accidentally restored to full.
 *
 * Usage: node scripts/filter-registry-custom-only.js
 */

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const registryPath = path.join(rootDir, 'registry.json')

const REQUIRED_NAMES = new Set(['index', 'style', 'utils'])

function isCustomOrOverridden(item) {
  if (REQUIRED_NAMES.has(item.name)) return true
  const files = item.files
  if (!Array.isArray(files) || files.length === 0) return false
  return files.every(
    (f) => f && typeof f.path === 'string' && f.path.startsWith('custom/registry/')
  )
}

const raw = readFileSync(registryPath, 'utf-8')
const registry = JSON.parse(raw)

const filtered = registry.items.filter(isCustomOrOverridden)

const out = {
  name: registry.name,
  homepage: registry.homepage,
  items: filtered,
}

writeFileSync(registryPath, JSON.stringify(out, null, 2))
console.log(
  `Filtered registry: ${registry.items.length} -> ${filtered.length} items (custom + overridden + index/style/utils).`
)
