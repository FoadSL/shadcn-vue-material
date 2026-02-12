import { cp, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { rimraf } from 'rimraf'

async function main() {
  // Root of the repo (three levels up from playground/v4/scripts)
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const repoRoot = path.resolve(__dirname, '..', '..', '..')

  const customUiRoot = path.join(
    repoRoot,
    'custom',
    'registry',
    'new-york-v4',
    'ui',
  )

  const playgroundUiRoot = path.join(
    repoRoot,
    'playground',
    'v4',
    'registry',
    'new-york-v4',
    'ui',
  )

  console.log('🔁 Syncing custom UI into playground registry...')
  console.log(`Custom UI:        ${customUiRoot}`)
  console.log(`Playground UI:    ${playgroundUiRoot}`)

  const entries = await readdir(customUiRoot, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory())
      continue

    const src = path.join(customUiRoot, entry.name)

    // Skip empty component folders (no .vue files) – these are likely failed conversions.
    const hasVue = (await readdir(src)).some((f) => f.endsWith('.vue'))
    if (!hasVue) {
      console.log(`  ⚠️ Skipping ${entry.name} (no .vue files, likely empty/failed conversion)`)
      continue
    }

    const dest = path.join(playgroundUiRoot, entry.name)

    console.log(`  • ${entry.name}`)

    // Remove any previous copy and then copy fresh.
    await rimraf(dest)
    await cp(src, dest, { recursive: true })
  }

  console.log('✅ Custom UI synced. Run `pnpm registry:build` in playground/v4 next.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

