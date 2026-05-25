import type { RyunixElement, RyunixRoute, useStore } from './index'

/** Compile-time smoke test for public core types (not executed). */
const _element: RyunixElement = {
  type: 'motion.div',
  props: { children: [] },
}

const _route: RyunixRoute = {
  path: '/blog/:slug',
  component: () => _element,
}

type _HookReturn = ReturnType<typeof useStore<number>>
const _state: _HookReturn = [0, () => {}]

void _element
void _route
void _state
