import { createElement, cloneElement, Fragment } from './createElement'
import { render, init } from './render'

import * as Dom from './dom'
import * as Workers from './workers'
import * as Reconciler from './reconciler'
import * as Components from './components'
import * as Commits from './commits'

export default {
  cloneElement,
  createElement,
  render,
  init,
  Fragment,
  Dom,
  Workers,
  Reconciler,
  Components,
  Commits,
}
