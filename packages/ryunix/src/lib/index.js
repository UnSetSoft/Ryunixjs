import { createElement, Fragment } from './createElement'
import { render, init, safeRender } from './render'
import * as Hooks from './hooks'
import { memo } from './memo.js'
import { lazy, Suspense } from './lazy.js'
import { batchUpdates } from './batching.js'


// Ryunix.*
export default {
  createElement,
  render,
  init,
  Fragment,
  Hooks,

  memo,
  lazy,
  Suspense,

  safeRender,
  batchUpdates,
}
