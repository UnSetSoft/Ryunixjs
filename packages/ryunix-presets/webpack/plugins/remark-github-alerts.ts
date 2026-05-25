/**
 * GitHub-style markdown alerts: > [!NOTE], > [!WARNING], etc.
 * @see https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax#alerts
 */

const ALERT_RE = /^\\?\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\\?\]\s*/i

type MdastNode = {
  type?: string
  children?: MdastNode[]
  value?: string
  data?: {
    hProperties?: Record<string, unknown> & { className?: string | string[] }
  }
}

function paragraphText(node: MdastNode | undefined): string {
  if (!node || node.type !== 'paragraph' || !Array.isArray(node.children))
    return ''
  return node.children
    .filter((child) => child.type === 'text')
    .map((child) => child.value ?? '')
    .join('')
}

function setAlertClasses(node: MdastNode, alertType: string): void {
  node.data = node.data ?? {}
  const existing = node.data.hProperties?.className
  const classes = [
    ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
    'docs-alert',
    `docs-alert--${alertType}`,
  ]
  node.data.hProperties = {
    ...(node.data.hProperties ?? {}),
    className: classes,
    dataAlert: alertType,
  }
}

function stripAlertMarker(
  paragraph: MdastNode,
  match: RegExpMatchArray,
): boolean {
  const text = paragraphText(paragraph)
  const rest = text.slice(match[0].length).trim()
  if (!rest) return false
  paragraph.children = [{ type: 'text', value: rest }]
  return true
}

function visit(node: MdastNode, fn: (node: MdastNode) => void): void {
  if (!node || typeof node !== 'object') return
  fn(node)
  const children = node.children
  if (!Array.isArray(children)) return
  for (const child of children) visit(child, fn)
}

export function remarkGithubAlerts() {
  return (tree: MdastNode) => {
    visit(tree, (node) => {
      if (
        node.type !== 'blockquote' ||
        !Array.isArray(node.children) ||
        node.children.length === 0
      ) {
        return
      }

      const first = node.children[0]
      if (first.type !== 'paragraph') return

      const text = paragraphText(first)
      const match = text.match(ALERT_RE)
      if (!match) return

      const alertType = match[1].toLowerCase()
      const hasBody = stripAlertMarker(first, match)

      if (!hasBody) {
        node.children.shift()
      }

      setAlertClasses(node, alertType)
    })
  }
}

export default remarkGithubAlerts
