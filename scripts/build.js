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

// 2. If --js, convert TS to JS
if (isJs) {
  console.log('Converting to JavaScript...')
  await convertToJs(outputDir)
}

console.log('Done.')

async function convertToJs(dir) {
  const { transform } = await import('@unovue/detypes')

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

      if (isTs || isVue) {
        try {
          // Let detypes strip TypeScript syntax
          item.content = await transform(item.content, item.path, {
            removeTsComments: true,
          })
        } catch (err) {
          console.warn(`  Warning: could not convert ${item.path}:`, err.message)
        }
      }

      // For Vue SFCs, make sure we don't advertise TS in the language attribute
      if (isVue && typeof item.content === 'string') {
        item.content = item.content
          // <script setup lang="ts"> → <script setup>
          .replace(
            /<script(\s+setup)?\s+lang=["']ts["'](\s*)>/g,
            '<script$1$2>',
          )
          // Remove import type ... lines (in case transform didn't strip them)
          .replace(/^\s*import\s+type\s+[^;]+;\s*$/gm, '')
      }

      // Update path: .ts -> .js, .tsx -> .jsx
      if (isTs) {
        item.path = item.path.replace(/\.tsx?$/, (m) =>
          m === '.tsx' ? '.jsx' : '.js',
        )
      }
    }

    writeFileSync(filePath, JSON.stringify(data, null, 2))
  }
}
