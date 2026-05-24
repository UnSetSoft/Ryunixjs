#!/usr/bin/env node
import { copyFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const out = join(root, 'webpack', '.ts-out')

for (const name of ['index.js', 'eslint.config.js']) {
  copyFileSync(join(out, name), join(root, 'webpack', name))
}

rmSync(out, { recursive: true, force: true })
