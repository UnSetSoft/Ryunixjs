import * as Ryunix from './lib/index.js'

export * from './lib/index.js'
export {
  Image,
  MDXContent,
  MDXProvider,
  useMDXComponents,
  getMDXComponents,
  defaultComponents,
  ryxProps,
} from './lib/components.js'

if (typeof window !== 'undefined') window.Ryunix = Ryunix
export default Ryunix
