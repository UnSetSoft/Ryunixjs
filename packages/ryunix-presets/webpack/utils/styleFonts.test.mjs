import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeFontConfig } from '../../.generated/webpack/utils/styleFonts.js'

test('google font config builds fonts.googleapis.com link', () => {
  const font = normalizeFontConfig({
    google: 'Inter:wght@400;500;600;700',
  })
  assert.equal(font.family, 'Inter')
  assert.match(font.links.join(''), /fonts\.googleapis\.com/)
})

test('unknown preset falls back to system', () => {
  assert.equal(normalizeFontConfig('unknown-preset').id, 'system')
})
