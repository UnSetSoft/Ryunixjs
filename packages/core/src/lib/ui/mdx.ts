import { createElement } from '../reconciler/createElement.js'
import { createContext } from '../hooks/hooks.js'
import type {
  RyunixComponent,
  RyunixElement,
  RyunixNode,
} from '../../types/internal.js'

const { Provider: MDXProvider, useContext: useMDXComponents } = createContext<
  Record<string, RyunixComponent>
>('ryunix.mdx', {})

const getMDXComponents = (
  components?: Record<string, RyunixComponent>,
): Record<string, RyunixComponent> => {
  const contextComponents = useMDXComponents() as Record<
    string,
    RyunixComponent
  >
  return {
    ...contextComponents,
    ...components,
  }
}

const RYUNIX_STYLE_ENABLED =
  globalThis.process && String(globalThis.process.env?.RYUNIX_STYLE) === 'true'

const ryxProps = (props: Record<string, unknown>): Record<string, unknown> => {
  const { unstyled, ...rest } = props
  if (unstyled || rest['data-ryx-unstyled']) {
    return { ...rest, 'data-ryx-unstyled': true }
  }
  return rest
}

const mergeClassName = (existing: unknown, base: string): string => {
  if (!existing) return base
  if (Array.isArray(existing)) return [...existing, base].join(' ')
  return `${existing} ${base}`
}

const styledMdxHost = (
  tag: string,
  ryxClass: string | undefined,
  props: Record<string, unknown>,
): RyunixNode => {
  const next = ryxProps(props)
  if (!RYUNIX_STYLE_ENABLED || !ryxClass || next['data-ryx-unstyled']) {
    return createElement(tag, next)
  }
  return createElement(tag, {
    ...next,
    className: mergeClassName(next.className, ryxClass),
  })
}

const defaultComponents: Record<
  string,
  (props: Record<string, unknown>) => RyunixNode
> = {
  h1: (props) => styledMdxHost('h1', 'ryx-h1', props),
  h2: (props) => styledMdxHost('h2', 'ryx-h2', props),
  h3: (props) => styledMdxHost('h3', 'ryx-h3', props),
  h4: (props) => styledMdxHost('h4', 'ryx-h4', props),
  h5: (props) => styledMdxHost('h5', 'ryx-h5', props),
  h6: (props) => styledMdxHost('h6', 'ryx-h6', props),
  p: (props) => styledMdxHost('p', 'ryx-p', props),
  a: (props) => styledMdxHost('a', 'ryx-a', props),
  strong: (props) => styledMdxHost('strong', 'ryx-strong', props),
  em: (props) => styledMdxHost('em', 'ryx-em', props),
  code: (props) => styledMdxHost('code', 'ryx-code', props),
  ul: (props) => styledMdxHost('ul', 'ryx-ul', props),
  ol: (props) => styledMdxHost('ol', 'ryx-ol', props),
  li: (props) => styledMdxHost('li', 'ryx-li', props),
  blockquote: (props) => styledMdxHost('blockquote', 'ryx-blockquote', props),
  pre: (props) => styledMdxHost('pre', 'ryx-pre', props),
  hr: (props) => styledMdxHost('hr', 'ryx-hr', props),
  table: (props) => styledMdxHost('table', 'ryx-table', props),
  thead: (props) => styledMdxHost('thead', 'ryx-thead', props),
  tbody: (props) => styledMdxHost('tbody', 'ryx-tbody', props),
  tr: (props) => styledMdxHost('tr', 'ryx-tr', props),
  th: (props) => styledMdxHost('th', 'ryx-th', props),
  td: (props) => styledMdxHost('td', 'ryx-td', props),
  img: (props) => styledMdxHost('img', 'ryx-img', props),
}

const Image = ({
  src,
  ...props
}: { src: string } & Record<string, unknown>): RyunixElement => {
  return createElement('img', { ...props, src })
}

const MDXContent = ({
  children,
  components = {},
}: {
  children?: RyunixNode
  components?: Record<string, RyunixComponent>
}): RyunixElement => {
  const mergedComponents = getMDXComponents(components)

  return createElement(
    MDXProvider as string | symbol | RyunixComponent,
    { value: mergedComponents },
    createElement('div', null, children),
  )
}

export {
  MDXContent,
  MDXProvider,
  useMDXComponents,
  getMDXComponents,
  defaultComponents,
  ryxProps,
  Image,
}
