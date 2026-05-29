import {
  findNearestHydrationBoundary,
  findBoundaryDomFromNode,
  skipHydrationSubtree,
} from '../lib/hydration/policy.js'

describe('hydration boundary recovery', () => {
  test('finds nearest boundary from nested fiber', () => {
    const boundaryType = () => null
    boundaryType.ryunix_type = 'RYUNIX_HYDRATION_BOUNDARY'
    const boundary = { type: boundaryType, parent: null }
    const nested = { type: 'p', parent: { type: 'span', parent: boundary } }

    expect(findNearestHydrationBoundary(nested)).toBe(boundary)
  })

  test('does not treat ServerBoundary as hydration recovery target', () => {
    const serverType = () => null
    serverType.ryunix_type = 'RYUNIX_SERVER_BOUNDARY'
    const serverFiber = { type: serverType, parent: null }
    const nested = { type: 'span', parent: serverFiber }

    expect(findNearestHydrationBoundary(nested)).toBeNull()
  })

  test('finds boundary dom from hydrated node', () => {
    const root = document.createElement('div')
    const boundary = document.createElement('div')
    boundary.setAttribute('data-ryunix-hydrate-boundary', 'route')
    const inside = document.createElement('span')
    root.appendChild(boundary)
    boundary.appendChild(inside)

    expect(findBoundaryDomFromNode(inside)).toBe(boundary)
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
