/** Public exports from @unsetsoft/ryunixjs used for navigation and hovers. */
export const RYUNIX_EXPORT_NAMES = [
  'useStore',
  'useReducer',
  'useEffect',
  'useLayoutEffect',
  'useRef',
  'useMemo',
  'useCallback',
  'createContext',
  'useQuery',
  'useHash',
  'useMetadata',
  'useId',
  'useDebounce',
  'useThrottle',
  'useStorePriority',
  'useTransition',
  'useDeferredValue',
  'usePersistentStore',
  'useSwitch',
  'RouterProvider',
  'useRouter',
  'Children',
  'NavLink',
  'Link',
  'usePathname',
  'useSearchParams',
  'ServerBoundary',
  'Suspense',
  'lazy',
  'memo',
  'createElement',
  'Fragment',
  'render',
  'hydrate',
  'init',
] as const

export type RyunixExportName = (typeof RYUNIX_EXPORT_NAMES)[number]

export const RYUNIX_EXPORT_DOCS: Record<string, string> = {
  useStore:
    'Hook de estado de Ryunix. Devuelve `[value, setValue]` para el componente actual.',
  useReducer: 'Estado con reducer: `useReducer(reducer, initialArg, init?)`.',
  useEffect:
    'Efecto después del commit. Segunda argumento opcional: array de dependencias.',
  useLayoutEffect:
    'Como `useEffect`, ejecutado de forma síncrona tras mutaciones DOM.',
  useRef: 'Referencia mutable `{ current }` que persiste entre renders.',
  useMemo: 'Memoiza un valor; se recalcula cuando cambian las dependencias.',
  useCallback: 'Memoiza una función estable entre renders.',
  createContext: 'Crea un contexto React-like para `useContext` del core.',
  Link: 'Enlace de navegación cliente (App Router).',
  NavLink: 'Enlace con estado activo según la ruta.',
  RouterProvider:
    'Proveedor del router de Ryunix; envuelve el árbol de la app.',
  useRouter: 'Acceso al contexto del router.',
  usePathname: 'Pathname actual de la ruta.',
  useSearchParams: 'Query string de la URL como objeto utilizable.',
  ServerBoundary: 'Marca contenido solo-servidor; la hidratación omite hijos.',
  Suspense: 'Boundary de Suspense para `lazy` y `loading.ryx`.',
  lazy: 'Carga diferida de un componente: `lazy(() => import(...))`.',
  memo: 'Memoiza un componente función si las props no cambian.',
  Metatags:
    'Export de metadatos SEO de ruta (`title`, `description`, …). Leído en build por AppRouter.',
  frontmatter: 'Alias de `Metatags` (también lo lee el preset en build).',
  generateMetadata: 'Función async que devuelve metadatos dinámicos para SSR.',
}
