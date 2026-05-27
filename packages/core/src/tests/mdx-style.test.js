describe('MDX defaultComponents with RYUNIX_STYLE', () => {
  it('adds ryx-h1 class when style is enabled', async () => {
    await jest.isolateModulesAsync(async () => {
      process.env.RYUNIX_STYLE = 'true'
      const { defaultComponents } = await import('../lib/ui/mdx.js')
      const el = defaultComponents.h1({ children: 'Title' })
      expect(el.props.className).toContain('ryx-h1')
    })
  })

  it('omits ryx-h1 class when style is disabled', async () => {
    await jest.isolateModulesAsync(async () => {
      process.env.RYUNIX_STYLE = 'false'
      const { defaultComponents } = await import('../lib/ui/mdx.js')
      const el = defaultComponents.h1({ children: 'Title' })
      expect(el.props.className).toBeUndefined()
    })
  })

  it('sets data-ryx-unstyled when unstyled prop is passed', async () => {
    await jest.isolateModulesAsync(async () => {
      process.env.RYUNIX_STYLE = 'true'
      const { defaultComponents } = await import('../lib/ui/mdx.js')
      const el = defaultComponents.h1({ unstyled: true, children: 'Title' })
      expect(el.props['data-ryx-unstyled']).toBe(true)
      expect(el.props.className).toBeUndefined()
    })
  })
})
