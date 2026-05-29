/**
 * Download and patch the official MDX TextMate grammar for Ryunix docs.
 * @see https://github.com/wooorm/markdown-tm-language/blob/main/source.mdx.tmLanguage
 */
const fs = require('node:fs')
const path = require('node:path')
const { execSync } = require('node:child_process')

const pkgRoot = path.join(__dirname, '..')
const outPath = path.join(pkgRoot, 'syntaxes/source.mdx.tmLanguage')
const upstreamUrl =
  'https://raw.githubusercontent.com/mdx-js/mdx-analyzer/main/packages/vscode-mdx/syntaxes/source.mdx.tmLanguage'

const PATCH_PY = String.raw`
import plistlib, json, sys, urllib.request

url = sys.argv[1]
out = sys.argv[2]

with urllib.request.urlopen(url) as r:
    grammar = plistlib.loads(r.read())

repo = grammar["repository"]

RYX_JSX = {"patterns": [
    {"include": "source.js.ryx#ryx-tag"},
    {"include": "source.js.ryx#ryx-tag-without-attributes"},
]}

RYX_FENCED = {"patterns": [{
    "begin": r"(?:^|\G)[\t ]*(\`{3,}|~{3,})(?:[\t ]*((?i:ryx|ryunix))(?:[\t ]+((?:[^\n\r\`])+))?)(?:[\t ]*$)",
    "beginCaptures": {
        "1": {"name": "string.other.begin.code.fenced.mdx"},
        "2": {"name": "entity.name.function.mdx"},
    },
    "end": r"(?:^|\G)[\t ]*(\1)(?:[\t ]*$)",
    "endCaptures": {"1": {"name": "string.other.end.code.fenced.mdx"}},
    "name": "markup.code.ryx.mdx",
    "patterns": [{
        "begin": r"(^|\G)(\s*)(.*)",
        "while": r"(^|\G)(?![\t ]*([\`~]{3,})[\t ]*$)",
        "contentName": "meta.embedded.block.js.ryx",
        "patterns": [{"include": "source.js.ryx"}],
    }],
}]}

repo["extension-mdx-esm"] = {
    "name": "meta.embedded.block.js.ryx",
    "begin": r"(?:^|\G)(?=(?i:export|import)[ ])",
    "end": r"^(?=[\t ]*$)|$",
    "patterns": [{"include": "source.js.ryx#statements"}],
}

repo["extension-mdx-expression-flow"] = {
    "begin": r"(?:^|\G)[\t ]*(\{)(?!.*\}[\t ]*.)",
    "beginCaptures": {"1": {"name": "string.other.begin.expression.mdx.js"}},
    "contentName": "meta.embedded.block.js.ryx",
    "end": r"(\})(?:[\t ]*$)",
    "endCaptures": {"1": {"name": "string.other.begin.expression.mdx.js"}},
    "patterns": [{"include": "source.js.ryx#expression"}],
}

repo["extension-mdx-expression-text"] = {
    "begin": r"\{",
    "beginCaptures": {"0": {"name": "string.other.begin.expression.mdx.js"}},
    "contentName": "meta.embedded.block.js.ryx",
    "end": r"\}",
    "endCaptures": {"0": {"name": "string.other.begin.expression.mdx.js"}},
    "patterns": [{"include": "source.js.ryx#expression"}],
}

repo["extension-mdx-jsx-flow"] = RYX_JSX
repo["extension-mdx-jsx-text"] = RYX_JSX

repo["github-alert-ryunix"] = {
    "match": r"\[!((?:NOTE|TIP|IMPORTANT|WARNING|CAUTION))\]",
    "name": "markup.quote.alert.mdx",
    "captures": {
        "0": {"name": "markup.quote.alert.mdx"},
        "1": {"name": "keyword.other.alert-type.mdx constant.language.alert.mdx"},
    },
}

repo["markdown-text"]["patterns"].insert(0, {"include": "#github-alert-ryunix"})

repo["commonmark-block-quote"]["patterns"].insert(0, {"include": "#markdown-text"})
repo["commonmark-block-quote"]["patterns"].insert(1, {"include": "#github-alert-ryunix"})

repo["commonmark-code-fenced-ryx"] = RYX_FENCED

fenced = repo["commonmark-code-fenced"]["patterns"]
js_idx = next(i for i, p in enumerate(fenced) if p.get("include") == "#commonmark-code-fenced-js")
if not any(p.get("include") == "#commonmark-code-fenced-ryx" for p in fenced):
    fenced.insert(js_idx + 1, {"include": "#commonmark-code-fenced-ryx"})

with open(out, "wb") as f:
    plistlib.dump(grammar, f)
`

function main() {
  const pyPath = path.join(__dirname, '.prepare-mdx-grammar.py')
  fs.writeFileSync(pyPath, PATCH_PY, 'utf8')
  console.log('Downloading and patching upstream source.mdx.tmLanguage…')
  execSync(`python3 "${pyPath}" "${upstreamUrl}" "${outPath}"`, {
    stdio: 'inherit',
    maxBuffer: 10 * 1024 * 1024,
  })
  fs.unlinkSync(pyPath)
  console.log(`Wrote ${path.relative(pkgRoot, outPath)}`)
}

main()
