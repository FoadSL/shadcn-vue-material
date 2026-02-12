#!/usr/bin/env node
/**
 * Walk custom/registry/ directories and convert Vue SFCs with `lang="ts"`
 * script blocks in-place to plain JavaScript.
 *
 * Usage:
 *   node scripts/detype-vue-sfc.js
 *   pnpm detype:vue
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@vue/compiler-sfc'
import { convertVueSfc } from './transform-ts-to-js.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

// Directories to scan for Vue SFCs that may still have lang="ts"
const vueRoots = [
  path.join(rootDir, 'custom', 'registry', 'new-york-v4', 'ui'),
  path.join(rootDir, 'custom', 'registry', 'new-york-v4', 'blocks'),
  path.join(rootDir, 'custom', 'registry', 'new-york-v4', 'lib'),
  path.join(rootDir, 'custom', 'registry', 'new-york-v4', 'hooks'),
]

/**
 * Recursively yield all file paths under a directory.
 * @param {string} dir
 * @returns {AsyncGenerator<string>}
 */
async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walk(fullPath)
    } else if (entry.isFile()) {
      yield fullPath
    }
  }
}

/**
 * Check if a Vue SFC has any TypeScript script blocks.
 * @param {string} source
 * @param {string} filename
 * @returns {boolean}
 */
function hasTsScriptBlocks(source, filename) {
  const { descriptor } = parse(source, { filename })
  return (
    (descriptor.script && descriptor.script.lang === 'ts') ||
    (descriptor.scriptSetup && descriptor.scriptSetup.lang === 'ts')
  )
}

async function main() {
  console.log('Detyping Vue SFCs in custom/registry/ ...')
  console.log()

  let total = 0
  let converted = 0
  let skipped = 0

  for (const root of vueRoots) {
    const stat = await fs.stat(root).catch(() => null)
    if (!stat) continue

    for await (const file of walk(root)) {
      if (!file.endsWith('.vue')) continue

      total++
      const relPath = path.relative(rootDir, file)
      const source = await fs.readFile(file, 'utf8')

      if (!hasTsScriptBlocks(source, relPath)) {
        skipped++
        continue
      }

      try {
        const result = await convertVueSfc(source, relPath)

        if (result !== source) {
          await fs.writeFile(file, result, 'utf8')
          console.log(`  ✓ Converted ${relPath}`)
          converted++
        } else {
          skipped++
        }
      } catch (err) {
        console.warn(`  ⚠ Failed to convert ${relPath}: ${err.message}`)
      }
    }
  }

  console.log()
  console.log(`Done. ${converted} files converted, ${skipped} skipped (${total} total scanned).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
