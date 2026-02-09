import { cp, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { rimraf } from 'rimraf'

async function main() {
  // Root of the repo (two levels up from playground/v4)
  const repoRoot = path.resolve(__dirname, '..', '..')

  const customBlocksRoot = path.join(
    repoRoot,
    'custom',
    'registry',
    'new-york-v4',
    'blocks',
  )

  const playgroundBlocksRoot = path.join(
    repoRoot,
    'playground',
    'v4',
    'registry',
    'new-york-v4',
    'blocks',
  )

  console.log('🔁 Syncing custom blocks into playground registry...')
  console.log(`Custom blocks:     ${customBlocksRoot}`)
  console.log(`Playground blocks: ${playgroundBlocksRoot}`)

  const entries = await readdir(customBlocksRoot, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory())
      continue

    const src = path.join(customBlocksRoot, entry.name)

    // Skip empty component folders (no .vue files) – these are likely failed conversions.
    const hasVue = (await readdir(src)).some((f) => f.endsWith('.vue'))
    if (!hasVue) {
      console.log(`  ⚠️ Skipping ${entry.name} (no .vue files, likely empty/failed conversion)`)
      continue
    }

    const destName = `custom-${entry.name}`
    const dest = path.join(playgroundBlocksRoot, destName)

    console.log(`  • ${entry.name} -> ${destName}`)

    // Remove any previous copy and then copy fresh.
    await rimraf(dest)
    await cp(src, dest, { recursive: true })
  }

  console.log('✅ Custom blocks synced. Run `pnpm registry:build` in playground/v4 next.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

