import {
  findNearestHydrationBoundary,
  skipHydrationSubtree,
} from '../lib/hydration.js'

describe('hydration boundary recovery', () => {
  test('finds nearest boundary from nested fiber', () => {
    const boundaryType = () => null
    boundaryType.ryunix_type = 'RYUNIX_HYDRATION_BOUNDARY'
    const boundary = { type: boundaryType, parent: null }
    const nested = { type: 'p', parent: { type: 'span', parent: boundary } }

    expect(findNearestHydrationBoundary(nested)).toBe(boundary)
  })

  test('skips cursor subtree to boundary sibling', () => {
    const root = document.createElement('div')
    const boundary = document.createElement('div')
    const inside = document.createElement('span')
    const sibling = document.createElement('p')
    boundary.appendChild(inside)
    root.appendChild(boundary)
    root.appendChild(sibling)

    expect(skipHydrationSubtree(inside, boundary)).toBe(sibling)
  })
})
