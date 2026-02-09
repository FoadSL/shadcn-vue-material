import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@vue/compiler-sfc'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

// Roots we want to detype (only custom JS-first copies)
const vueRoots = [
  path.join(rootDir, 'custom', 'registry', 'new-york-v4', 'ui'),
  path.join(rootDir, 'custom', 'registry', 'new-york-v4', 'blocks'),
]

const { transform } = await import('@unovue/detypes')

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

async function detypeVueFile(absPath) {
  const relPath = path.relative(rootDir, absPath).replace(/\\/g, '/')
  let source = await fs.readFile(absPath, 'utf8')

  const { descriptor } = parse(source, { filename: relPath })

  const scriptBlocks = []
  if (descriptor.script && descriptor.script.lang === 'ts') {
    scriptBlocks.push({ block: descriptor.script, kind: 'script' })
  }
  if (descriptor.scriptSetup && descriptor.scriptSetup.lang === 'ts') {
    scriptBlocks.push({ block: descriptor.scriptSetup, kind: 'scriptSetup' })
  }

  if (!scriptBlocks.length) {
    return false
  }

  // Sort by start offset DESC so later replacements don't disturb earlier offsets.
  scriptBlocks.sort((a, b) => b.block.loc.start.offset - a.block.loc.start.offset)

  let sfcSource = source
  for (const entry of scriptBlocks) {
    const { block, kind } = entry
    const tsCode = block.content
    let jsCode = tsCode

    try {
      // Use a .ts-like virtual filename so detypes picks the TypeScript parser
      const virtualName = relPath.replace(/\.vue$/, `.${kind}.ts`)
      jsCode = await transform(tsCode, virtualName)
    } catch (err) {
      console.warn(`  ⚠️ Could not detype <${kind}> in ${relPath}:`, err.message)
      continue
    }

    // Rebuild <script> tag attributes, dropping lang="ts" but keeping others (e.g. setup).
    const attrs = block.attrs ?? {}
    const attrParts = []
    for (const [name, value] of Object.entries(attrs)) {
      if (name === 'lang') continue
      if (value === true || value === '') {
        attrParts.push(` ${name}`)
      } else {
        attrParts.push(` ${name}="${value}"`)
      }
    }

    const openTag = `<script${attrParts.join('')}>`
    const newBlock = `${openTag}\n${jsCode.trim()}\n</script>`

    // Replace the entire original <script ...>...</script> block.
    // We locate the opening <script...> tag before the content start
    // and the closing </script> tag after the content end.
    const contentStart = block.loc.start.offset
    const contentEnd = block.loc.end.offset

    const tagStart = sfcSource.lastIndexOf('<script', contentStart)
    if (tagStart === -1) {
      console.warn(`  ⚠️ Could not find <script> tag for <${kind}> in ${relPath}`)
      continue
    }
    const closeIdx = sfcSource.indexOf('</script>', contentEnd)
    if (closeIdx === -1) {
      console.warn(`  ⚠️ Could not find </script> end tag for <${kind}> in ${relPath}`)
      continue
    }
    const tagEnd = closeIdx + '</script>'.length

    sfcSource = sfcSource.slice(0, tagStart) + newBlock + sfcSource.slice(tagEnd)
  }

  if (sfcSource !== source) {
    await fs.writeFile(absPath, sfcSource, 'utf8')
    console.log('  ✓ Detyped', relPath)
    return true
  }

  return false
}

async function main() {
  console.log('Detyping Vue SFCs in custom/registry/new-york-v4 ...')

  for (const root of vueRoots) {
    if (!(await fs.stat(root).catch(() => null))) continue

    for await (const file of walk(root)) {
      if (!file.endsWith('.vue')) continue
      await detypeVueFile(file)
    }
  }

  console.log('Done detyping Vue SFCs.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

