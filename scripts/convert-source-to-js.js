#!/usr/bin/env node
/**
 * One-off helper to generate JS-first source copies of all registry files.
 *
 * It:
 * - Reads `registry.json`
 * - For every file path starting with `registry/`, copies it into `custom/registry/...`
 * - Uses `@unovue/detypes` to strip TypeScript syntax from .ts/.tsx/.vue files
 * - Leaves other file types as-is
 *
 * IMPORTANT:
 * - This script does NOT modify `registry.json`.
 * - Upstream sync (`pnpm sync`) will continue to manage `registry/` and `registry.json`.
 * - You can gradually point items in `registry.json` to `custom/registry/...` as you customize components.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const registryJsonPath = path.join(rootDir, 'registry.json')
const customRoot = path.join(rootDir, 'custom')

async function main() {
  if (!existsSync(registryJsonPath)) {
    console.error('registry.json not found at', registryJsonPath)
    process.exit(1)
  }

  const { transform } = await import('@unovue/detypes')
  const registry = JSON.parse(readFileSync(registryJsonPath, 'utf-8'))

  if (!Array.isArray(registry.items)) {
    console.error('registry.json has no "items" array')
    process.exit(1)
  }

  /** @type {Set<string>} */
  const filePaths = new Set()

  for (const item of registry.items) {
    if (!Array.isArray(item.files)) continue
    for (const file of item.files) {
      if (!file || typeof file.path !== 'string') continue
      const p = file.path
      // Only process upstream-managed registry files.
      if (!p.startsWith('registry/')) continue
      filePaths.add(p)
    }
  }

  console.log('Converting source files to JS in custom/registry ...')

  for (const relPath of filePaths) {
    const srcPath = path.join(rootDir, relPath)

    const ext = path.extname(relPath)
    const isTs = ext === '.ts' || ext === '.tsx'
    const isVue = ext === '.vue'

    // For TS/TSX files, output .js/.jsx so the source tree is truly JS-first.
    const destRelPath = isTs
      ? relPath.replace(/\.tsx?$/, (m) => (m === '.tsx' ? '.jsx' : '.js'))
      : relPath
    const destPath = path.join(customRoot, destRelPath)

    if (!existsSync(srcPath)) {
      console.warn('  Skipping (not found):', relPath)
      continue
    }

    const destDir = path.dirname(destPath)
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true })
    }

    let content = readFileSync(srcPath, 'utf-8')

    // For pure TS/TSX files, use detypes transform to strip types.
    if (isTs) {
      try {
        // Call with (code, fileName) so detypes uses its internal defaults
        content = await transform(content, relPath)
      } catch (err) {
        console.warn(`  Warning: could not convert ${relPath}:`, err.message)
      }
    }

    // For Vue SFCs, we currently copy them as-is (including <script setup lang="ts">),
    // to avoid accidentally breaking templates. Tooling in v4 fully supports TS in SFCs.

    writeFileSync(destPath, content)
    console.log(
      '  Wrote',
      path.relative(rootDir, destPath),
      relPath !== destRelPath ? `(from ${relPath})` : '',
    )
  }

  console.log('Done. JS-first sources are in custom/registry/.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

