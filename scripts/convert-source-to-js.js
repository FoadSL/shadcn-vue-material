#!/usr/bin/env node
/**
 * One-off helper to generate JS-first source copies of all registry files.
 *
 * It:
 * - Reads `registry.json`
 * - For every file path starting with `registry/`, copies it into `custom/registry/...`
 * - Converts Vue SFCs from TypeScript to JavaScript (macro conversion + type stripping)
 * - Converts .ts files to .js (type stripping, renames to .js)
 * - Leaves other file types as-is
 *
 * IMPORTANT:
 * - This script does NOT modify `registry.json`.
 * - Upstream sync (`pnpm sync`) will continue to manage `registry/` and `registry.json`.
 * - You can gradually point items in `registry.json` to `custom/registry/...` as you customize.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { convertVueSfc, convertTsFile } from './transform-ts-to-js.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const registryJsonPath = path.join(rootDir, 'registry.json')
const customRoot = path.join(rootDir, 'custom')

async function main() {
  if (!existsSync(registryJsonPath)) {
    console.error('registry.json not found at', registryJsonPath)
    process.exit(1)
  }

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

  const total = filePaths.size
  let converted = 0
  let skipped = 0
  let warnings = 0

  console.log(`Converting ${total} source files to JS in custom/registry ...`)
  console.log()

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
      console.warn(`  SKIP (not found): ${relPath}`)
      skipped++
      continue
    }

    const destDir = path.dirname(destPath)
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true })
    }

    let content = readFileSync(srcPath, 'utf-8')

    // Convert Vue SFCs
    if (isVue) {
      try {
        content = await convertVueSfc(content, relPath)
      } catch (err) {
        console.warn(`  WARN: Vue SFC conversion failed for ${relPath}: ${err.message}`)
        warnings++
        // Best-effort: at least strip lang="ts" and generic attributes
        content = content
          .replace(/(<script\b[^>]*?)\s+lang=(["'])ts\2([^>]*>)/g, '$1$3')
          .replace(/(<script\b[^>]*?)\s+generic=(["'])[^"']*\2([^>]*>)/g, '$1$3')
      }
    }

    // Convert plain TS/TSX files
    if (isTs) {
      try {
        content = await convertTsFile(content, relPath)
      } catch (err) {
        console.warn(`  WARN: TS conversion failed for ${relPath}: ${err.message}`)
        warnings++
      }
    }

    writeFileSync(destPath, content)
    const suffix = relPath !== destRelPath ? ` (from ${path.basename(relPath)})` : ''
    console.log(`  ✓ ${path.relative(rootDir, destPath)}${suffix}`)
    converted++
  }

  console.log()
  console.log(`Done. ${converted} files converted, ${skipped} skipped, ${warnings} warnings.`)
  console.log('JS-first sources are in custom/registry/.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
