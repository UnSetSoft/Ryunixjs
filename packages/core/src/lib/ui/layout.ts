import { createElement } from '../reconciler/createElement.js'
import { flattenArray } from '../../utils/index.js'

export interface HeaderProps {
  /** Brand image URL or imported asset. */
  image?: string
  /** Site or app name shown next to the image. */
  title: string
  /** Link target for the brand block. Default: `/`. */
  href?: string
  /** Alt text for the image. Defaults to `title`. */
  imageAlt?: string
  /** Pin header to the top with backdrop blur. Default: `true`. */
  sticky?: boolean
  className?: string
  /** Navigation, locale switcher, theme toggle, etc. */
  children?: unknown
}

export interface FooterProps {
  /** Optional brand image URL or imported asset. */
  image?: string
  /** Optional site name shown next to the image. */
  title?: string
  /** Short text under the brand block. */
  description?: string
  href?: string
  imageAlt?: string
  className?: string
  /** Link columns (`<div>` with `<h3>` + `<ul>`). */
  children?: unknown
  /** Bottom bar, left side (e.g. theme toggle). */
  bottomStart?: unknown
  /** Bottom bar, right side (e.g. copyright). */
  bottomEnd?: unknown
}

export interface MainProps {
  /** Max width of the inner content column. Defaults to `--ryx-content-max-width`. */
  maxWidth?: string
  className?: string
  innerClassName?: string
  children?: unknown
}

const renderBrand = ({
  image,
  title,
  href = '/',
  imageAlt,
  blockClass,
  linkClass,
  imageClass,
  titleClass,
}: {
  image?: string
  title?: string
  href?: string
  imageAlt?: string
  blockClass: string
  linkClass: string
  imageClass: string
  titleClass: string
}) => {
  if (!image && !title) return null

  const content = [
    image
      ? createElement('img', {
          src: image,
          alt: imageAlt ?? title ?? '',
          className: imageClass,
        })
      : null,
    title ? createElement('span', { className: titleClass }, title) : null,
  ].filter(Boolean)

  return createElement(
    'div',
    { className: blockClass },
    createElement('a', { href, className: linkClass }, ...content),
  )
}

const renderChildren = (children: unknown) => {
  if (children == null || children === false) return []
  return flattenArray(Array.isArray(children) ? children : [children]).filter(
    (child) => child != null && child !== false,
  )
}

const renderSlot = (className: string, children: unknown) => {
  const items = renderChildren(children)
  if (items.length === 0) return null
  return createElement('div', { className }, ...items)
}

export function Main({
  maxWidth,
  className = '',
  innerClassName = '',
  children,
}: MainProps) {
  const innerStyle =
    maxWidth != null && maxWidth !== ''
      ? { maxWidth, marginInline: 'auto', width: '100%' }
      : undefined

  return createElement(
    'main',
    {
      className: `ryx-main ${className}`.trim(),
    },
    createElement(
      'div',
      {
        className: `ryx-main-inner ${innerClassName}`.trim(),
        style: innerStyle,
      },
      ...renderChildren(children),
    ),
  )
}

export function Header({
  image,
  title,
  href = '/',
  imageAlt,
  sticky = true,
  className = '',
  children,
}: HeaderProps) {
  const headerClass = [
    'ryx-header',
    sticky !== false ? 'ryx-header--sticky' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return createElement(
    'header',
    {
      className: headerClass,
    },
    createElement(
      'div',
      { className: 'ryx-header-inner' },
      createElement(
        'div',
        { className: 'ryx-header-start' },
        renderBrand({
          image,
          title,
          href,
          imageAlt,
          blockClass: 'ryx-header-brand',
          linkClass: 'ryx-header-brand-link',
          imageClass: 'ryx-header-brand-image',
          titleClass: 'ryx-header-brand-title',
        }),
      ),
      renderSlot('ryx-header-end', children),
    ),
  )
}

export function Footer({
  image,
  title,
  description,
  href = '/',
  imageAlt,
  className = '',
  children,
  bottomStart,
  bottomEnd,
}: FooterProps) {
  const brand = renderBrand({
    image,
    title,
    href,
    imageAlt,
    blockClass: 'ryx-footer-brand',
    linkClass: 'ryx-footer-brand-link',
    imageClass: 'ryx-footer-brand-image',
    titleClass: 'ryx-footer-brand-title',
  })

  const brandColumn =
    brand || description
      ? createElement(
          'div',
          { className: 'ryx-footer-brand-column' },
          brand,
          description
            ? createElement(
                'p',
                { className: 'ryx-footer-description' },
                description,
              )
            : null,
        )
      : null

  const columns = renderChildren(children).map((child, index) =>
    createElement('div', { key: index, className: 'ryx-footer-column' }, child),
  )

  const bottomStartSlot = renderSlot('ryx-footer-bottom-start', bottomStart)
  const bottomEndSlot = renderSlot('ryx-footer-bottom-end', bottomEnd)
  const bottomBar =
    bottomStartSlot || bottomEndSlot
      ? createElement(
          'div',
          { className: 'ryx-footer-bottom' },
          bottomStartSlot,
          bottomEndSlot,
        )
      : null

  return createElement(
    'footer',
    {
      className: `ryx-footer ${className}`.trim(),
    },
    createElement('div', {
      className: 'ryx-footer-accent',
      'aria-hidden': 'true',
    }),
    createElement('div', {
      className: 'ryx-footer-glow',
      'aria-hidden': 'true',
    }),
    createElement(
      'div',
      { className: 'ryx-footer-inner' },
      brandColumn || columns.length > 0
        ? createElement(
            'div',
            { className: 'ryx-footer-grid' },
            brandColumn,
            ...columns,
          )
        : null,
      bottomBar,
    ),
  )
}
