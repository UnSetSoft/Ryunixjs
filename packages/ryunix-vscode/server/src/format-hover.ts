import ts from 'typescript'

function partsToText(
  parts: ts.SymbolDisplayPart[] | readonly ts.SymbolDisplayPart[] | undefined,
): string {
  return parts?.map((p) => p.text).join('') ?? ''
}

function formatTags(tags: ts.JSDocTagInfo[] | undefined): string {
  if (!tags?.length) return ''
  return tags
    .map((tag) => {
      const name = tag.name ? `@${tag.name}` : ''
      const text = partsToText(tag.text)
      return text ? `${name} ${text}` : name
    })
    .filter(Boolean)
    .join('\n\n')
}

/** Markdown similar to VS Code TypeScript hover (signature + docs + import). */
export function formatQuickInfoMarkdown(
  info: ts.QuickInfo,
  importLine?: string,
): string {
  const signature = partsToText(info.displayParts).trim()
  const docs = partsToText(
    typeof info.documentation === 'string'
      ? [{ text: info.documentation, kind: '' }]
      : info.documentation,
  ).trim()
  const tagDocs = formatTags(info.tags)

  const blocks: string[] = []

  if (signature) {
    blocks.push('```typescript\n' + signature + '\n```')
  }

  const prose = [docs, tagDocs].filter(Boolean).join('\n\n')
  if (prose) blocks.push(prose)

  if (importLine) {
    blocks.push('---\n' + importLine)
  }

  return blocks.join('\n\n') || signature || 'No information available.'
}

/** Build `import Name` / `import { Name } from 'module'` from definition site. */
export function importLineFromDefinition(
  source: ts.SourceFile,
  definitionStart: number,
  symbolName: string,
): string | undefined {
  const line = source.getLineAndCharacterOfPosition(definitionStart).line
  const lineText = source.getFullText().split(/\r?\n/)[line] ?? ''

  const namedImport = lineText.match(
    new RegExp(
      `import\\s*\\{[^}]*\\b${symbolName}\\b[^}]*\\}\\s*from\\s*['"]([^'"]+)['"]`,
    ),
  )
  if (namedImport) {
    return `import { ${symbolName} } from '${namedImport[1]}'`
  }

  const defaultImport = lineText.match(
    new RegExp(
      `import\\s+${symbolName}\\s+from\\s*['"]([^'"]+)['"]`,
    ),
  )
  if (defaultImport) {
    return `import ${symbolName} from '${defaultImport[1]}'`
  }

  const reExport = lineText.match(
    /export\s+(?:function|const|class)\s+(\w+)/,
  )
  if (reExport?.[1] === symbolName) {
    const rel = source.fileName.split(/[/\\]/).pop()
    return rel ? `Defined in \`${rel}\`` : undefined
  }

  return undefined
}
