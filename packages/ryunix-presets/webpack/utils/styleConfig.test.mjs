import assert from 'node:assert/strict'
import test from 'node:test'
import { buildStyleVarsCss, normalizeStyleConfig } from './styleConfig.cjs'
import { buildFontHeadLinks, normalizeFontConfig } from './styleFonts.cjs'

test('normalizeStyleConfig disables styles by default', () => {
  assert.equal(normalizeStyleConfig(undefined).enabled, false)
  assert.equal(normalizeStyleConfig(null).enabled, false)
  assert.equal(normalizeStyleConfig(false).enabled, false)
  assert.equal(normalizeStyleConfig({}).enabled, false)
})

test('normalizeStyleConfig keeps defaults for style: true', () => {
  const style = normalizeStyleConfig(true)
  assert.equal(style.enabled, true)
  assert.equal(style.font.id, 'system')
})

test('normalizeStyleConfig merges font preset', () => {
  const style = normalizeStyleConfig({ font: 'inter' })
  assert.equal(style.enabled, true)
  assert.equal(style.font.id, 'inter')
  assert.match(style.font.sans, /Inter/)
})

test('buildFontHeadLinks emits bunny.net stylesheet for inter', () => {
  const links = buildFontHeadLinks(normalizeFontConfig('inter'))
  assert.match(links, /fonts\.bunny\.net/)
  assert.match(links, /inter/i)
})

test('normalizeFontConfig supports self-hosted src', () => {
  const font = normalizeFontConfig({
    family: 'Brand Sans',
    src: '/assets/fonts/brand.woff2',
    fallback: 'system-ui, sans-serif',
  })
  assert.equal(font.id, 'custom')
  assert.match(font.fontFace, /@font-face/)
  assert.match(font.fontFace, /brand\.woff2/)
  assert.match(font.sans, /Brand Sans/)
})

test('buildStyleVarsCss includes font variables', () => {
  const css = buildStyleVarsCss(normalizeStyleConfig({ font: 'nunito' }))
  assert.match(css, /--ryx-font-sans:/)
  assert.match(css, /--ryx-tracking:/)
  assert.match(css, /Nunito Sans/)
})
