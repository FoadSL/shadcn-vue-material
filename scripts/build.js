#!/usr/bin/env node
/**
 * Builds the registry. Run with --js to output JavaScript instead of TypeScript.
 *
 * Usage:
 *   node scripts/build.js        # TS output
 *   node scripts/build.js --js   # JS output (converts TS -> JS)
 */

import { execSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { convertVueSfc, convertTsFile } from './transform-ts-to-js.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const outputDir = path.join(rootDir, 'public', 'r', 'styles', 'new-york-v4')

const isJs = process.argv.includes('--js')

// 1. Run shadcn-vue build
console.log('Building registry...')
execSync('npx shadcn-vue build registry.json -o public/r/styles/new-york-v4', {
  cwd: rootDir,
  stdio: 'inherit',
})

// 2. If --js, convert TS to JS in the built JSON output
if (isJs) {
  console.log('Converting built output to JavaScript...')
  await convertBuiltOutput(outputDir)
}

console.log('Done.')

/**
 * Walk the built JSON output directory and convert TS content to JS
 * inside each component JSON file.
 */
async function convertBuiltOutput(dir) {
  if (!existsSync(dir)) {
    console.error('Output directory not found:', dir)
    process.exit(1)
  }

  const files = readdirSync(dir).filter((f) => f.endsWith('.json'))

  for (const file of files) {
    const filePath = path.join(dir, file)
    const data = JSON.parse(readFileSync(filePath, 'utf-8'))

    if (!data.files || !Array.isArray(data.files)) continue

    for (const item of data.files) {
      if (!item.content) continue

      const ext = path.extname(item.path)
      const isTs = ext === '.ts' || ext === '.tsx'
      const isVue = ext === '.vue'

      if (isVue) {
        try {
          item.content = await convertVueSfc(item.content, item.path)
        } catch (err) {
          console.warn(`  Warning: could not convert ${item.path}:`, err.message)
        }
      }

      if (isTs) {
        try {
          item.content = await convertTsFile(item.content, item.path)
        } catch (err) {
          console.warn(`  Warning: could not convert ${item.path}:`, err.message)
        }
        // Update path: .ts -> .js, .tsx -> .jsx
        item.path = item.path.replace(/\.tsx?$/, (m) =>
          m === '.tsx' ? '.jsx' : '.js',
        )
      }
    }

    writeFileSync(filePath, JSON.stringify(data, null, 2))
  }
}
