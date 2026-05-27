import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { remarkGithubAlerts } from '../../.generated/webpack/plugins/remark-github-alerts.js'

const run = remarkGithubAlerts()

function blockquote(children) {
  return { type: 'root', children: [{ type: 'blockquote', children }] }
}

function paragraph(text) {
  return { type: 'paragraph', children: [{ type: 'text', value: text }] }
}

function getBlockquote(tree) {
  return tree.children[0]
}

describe('remarkGithubAlerts', () => {
  it('adds ryx-alert--warning and removes marker line', () => {
    const tree = blockquote([
      paragraph('[!WARNING]'),
      paragraph('Deprecated API.'),
    ])
    run(tree)
    const bq = getBlockquote(tree)
    assert.deepEqual(bq.data.hProperties.className, [
      'ryx-alert',
      'ryx-alert--warning',
    ])
    assert.equal(bq.data.hProperties.dataAlert, 'warning')
    assert.equal(bq.children.length, 1)
    assert.equal(bq.children[0].children[0].value, 'Deprecated API.')
  })

  it('maps NOTE, TIP, IMPORTANT, CAUTION', () => {
    for (const type of ['NOTE', 'TIP', 'IMPORTANT', 'CAUTION']) {
      const tree = blockquote([paragraph(`[!${type}]`), paragraph('Body.')])
      run(tree)
      const bq = getBlockquote(tree)
      assert.ok(
        bq.data.hProperties.className.includes(
          `ryx-alert--${type.toLowerCase()}`,
        ),
      )
    }
  })

  it('strips inline marker and keeps body in the same paragraph', () => {
    const tree = blockquote([paragraph('[!NOTE] Inline note text.')])
    run(tree)
    const bq = getBlockquote(tree)
    assert.ok(bq.data.hProperties.className.includes('ryx-alert--note'))
    assert.equal(bq.children[0].children[0].value, 'Inline note text.')
  })

  it('handles GFM-escaped brackets', () => {
    const tree = blockquote([
      paragraph('\\[!WARNING\\]'),
      paragraph('Escaped marker line.'),
    ])
    run(tree)
    const bq = getBlockquote(tree)
    assert.ok(bq.data.hProperties.className.includes('ryx-alert--warning'))
  })

  it('leaves plain blockquotes unchanged', () => {
    const tree = blockquote([paragraph('Plain quote without alert marker.')])
    run(tree)
    const bq = getBlockquote(tree)
    assert.equal(bq.data, undefined)
  })
})
