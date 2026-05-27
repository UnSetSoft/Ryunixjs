import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildPathFromParams,
  generateResolveSSGPathsCode,
  parseDynamicSegment,
} from '../../.generated/webpack/utils/ssgStaticParams.js'

test('parseDynamicSegment recognizes single and catch-all params', () => {
  assert.deepEqual(parseDynamicSegment('[locale]'), {
    param: 'locale',
    isCatchAll: false,
  })
  assert.deepEqual(parseDynamicSegment('[...path]'), {
    param: 'path',
    isCatchAll: true,
  })
  assert.equal(parseDynamicSegment('docs'), null)
})

test('buildPathFromParams substitutes regular and catch-all params', () => {
  assert.equal(
    buildPathFromParams('/:locale/docs/:...path', {
      locale: 'en',
      path: ['introduction', 'getting-started'],
    }),
    '/en/docs/introduction/getting-started',
  )

  assert.equal(buildPathFromParams('/:locale', { locale: 'es' }), '/es')
})

test('generateResolveSSGPathsCode emits expanders for dynamic routes', () => {
  const code = generateResolveSSGPathsCode(
    [{ path: '/about', meta: {} }],
    [
      {
        path: '/:locale',
        meta: {},
        segments: [
          {
            param: 'locale',
            layoutId: 'Layout_0',
            indexId: null,
          },
        ],
      },
    ],
  )

  assert.match(code, /export async function resolveSSGPaths/)
  assert.match(code, /expandSSG_0/)
  assert.match(code, /getOptExport\(Layout_0, 'generateStaticParams'\)/)
})
