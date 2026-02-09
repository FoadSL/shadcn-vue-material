import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@vue/compiler-sfc'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const rel = 'registry/new-york-v4/ui/dialog/DialogClose.vue'
const src = readFileSync(path.join(rootDir, rel), 'utf8')
const { descriptor } = parse(src, { filename: rel })

console.log('has script:', !!descriptor.script, 'has setup:', !!descriptor.scriptSetup)
console.log('script:', descriptor.script && { lang: descriptor.script.lang, attrs: descriptor.script.attrs, start: descriptor.script.loc.start, end: descriptor.script.loc.end })
console.log('setup:', descriptor.scriptSetup && { lang: descriptor.scriptSetup.lang, attrs: descriptor.scriptSetup.attrs, start: descriptor.scriptSetup.loc.start, end: descriptor.scriptSetup.loc.end })

