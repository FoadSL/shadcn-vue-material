#!/usr/bin/env node
/**
 * Syncs registry source from shadcn-vue upstream.
 *
 * Usage:
 *   node scripts/sync-from-upstream.js
 *
 * Set UPSTREAM_PATH to override the upstream repo location (default: ../shadcn-vue)
 */

import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const upstreamPath =
  process.env.UPSTREAM_PATH || path.resolve(rootDir, '..', 'shadcn-vue')
const upstreamRegistry = path.join(upstreamPath, 'apps', 'v4', 'registry')
const upstreamRegistryJson = path.join(upstreamPath, 'apps', 'v4', 'registry.json')

if (!existsSync(upstreamRegistry)) {
  console.error('Upstream registry not found at:', upstreamRegistry)
  console.error('Set UPSTREAM_PATH if shadcn-vue is elsewhere.')
  process.exit(1)
}

const targetRegistry = path.join(rootDir, 'registry')
const targetRegistryJson = path.join(rootDir, 'registry.json')

console.log('Syncing from:', upstreamPath)
console.log('  registry/ -> registry/')

rmSync(targetRegistry, { recursive: true, force: true })
cpSync(upstreamRegistry, targetRegistry, { recursive: true })

console.log('  registry.json -> registry.json')
// Copy but preserve our name/homepage and any extra (custom) items.
const upstream = JSON.parse(readFileSync(upstreamRegistryJson, 'utf-8'))
const ours = existsSync(targetRegistryJson)
  ? JSON.parse(readFileSync(targetRegistryJson, 'utf-8'))
  : {}

// Keep any items that are not present upstream (e.g. custom JS components),
// identified by (name + type) combo.
const upstreamKey = (item) => `${item.name}::${item.type}`
const upstreamKeys = new Set(upstream.items.map(upstreamKey))
const customItems = Array.isArray(ours.items)
  ? ours.items.filter((item) => !upstreamKeys.has(upstreamKey(item)))
  : []

const merged = {
  name: ours.name || 'my-shadcn-registry',
  homepage: ours.homepage || 'https://github.com/YOUR_ORG/my-shadcn-registry',
  items: [...upstream.items, ...customItems],
}

writeFileSync(targetRegistryJson, JSON.stringify(merged, null, 2))

console.log('Sync complete.')
