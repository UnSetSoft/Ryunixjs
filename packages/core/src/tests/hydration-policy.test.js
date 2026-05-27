import { getHydrationPolicy } from '../lib/hydration/policy.js'

describe('getHydrationPolicy', () => {
  const originalProcess = globalThis.process

  afterEach(() => {
    if (originalProcess === undefined) {
      delete globalThis.process
    } else {
      globalThis.process = originalProcess
    }
  })

  test('returns defaults when process is unavailable in the browser', () => {
    delete globalThis.process

    expect(getHydrationPolicy()).toEqual({
      recover: 'boundary',
      boundaries: 'route',
      strict: false,
    })
  })

  test('reads hydration env flags when process.env is present', () => {
    globalThis.process = {
      env: {
        RYUNIX_HYDRATION_RECOVER: 'none',
        RYUNIX_HYDRATION_BOUNDARIES: 'server-only',
        RYUNIX_HYDRATION_STRICT: 'true',
      },
    }

    expect(getHydrationPolicy()).toEqual({
      recover: 'none',
      boundaries: 'server-only',
      strict: true,
    })
  })
})
