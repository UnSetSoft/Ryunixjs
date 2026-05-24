import crypto from 'crypto'

/**
 * Strips // @client and // @server directive comments from source code
 * @param {string} source - The source code
 * @param {string} target - 'node' for server, 'web' for client
 * @returns {string} - Filtered source code
 */
function filterClientServerDirectives(source, target) {
  // Patterns for // @server and // @client block comments
  // These can appear as:
  // 1. // @client at start of line - entire file is client-only
  // 2. // @server at start of line - entire file is server-only
  // 3. // #__SERVER__ ... #__END_SERVER__ or /* @server ... @server */
  // 4. // #__CLIENT__ ... #__END_CLIENT__ or /* @client ... @client */

  const isServerBuild = target === 'node'

  // Check for file-level directives at the very start
  const clientDirectiveMatch = source.match(/^\s*\/\/\s*@client/m)
  const serverDirectiveMatch = source.match(/^\s*\/\/\s*@server/m)

  // (Removed check that used to strip @client component directives)

  // NOTE: We don't strip @server files here anymore!
  // The ryunix-server-action-loader will handle generating proxies for client builds
  // and stripping other server code.

  // Handle block-level directives with markers like // #__SERVER__ ... // #__END_SERVER__
  // or /* @server ... @server */
  let result = source

  if (isServerBuild) {
    // Remove client-only blocks from server build
    // Match // #__CLIENT__ ... // #__END_CLIENT__ or /* @client ... @client */
    result = result
      .replace(/\/\/\s*#__CLIENT__[\s\S]*?\/\/\s*#__END_CLIENT__/g, '')
      .replace(/\/\*\s*@client[\s\S]*?@client\s*\*\//g, '')
  } else {
    // Remove server-only blocks from client build
    result = result
      .replace(/\/\/\s*#__SERVER__[\s\S]*?\/\/\s*#__END_SERVER__/g, '')
      .replace(/\/\*\s*@server[\s\S]*?@server\s*\*\//g, '')
  }

  return result
}

export default function (content) {
  const hasServerDirective =
    content.includes('//@server') || content.includes('// @server')
  const hasClientDirective =
    content.includes('//@client') || content.includes('// @client')

  // Get build target from compiler - 'node' for server, 'web' for client
  // Try multiple ways to determine target
  let target = this.target

  // Try getting from compiler options
  if (!target && this._compiler && this._compiler.options) {
    target = this._compiler.options.target
  }

  // Try getting from webpack's global __webpack_require__.r or similar
  // Or check if we're in a server bundle by looking at the output path
  if (!target && this._compiler && this._compiler.outputPath) {
    // Server bundles typically go to server/ directory
    target = this._compiler.outputPath.includes('/server/') ? 'node' : 'web'
  }

  // Default to 'web' if not found
  if (!target) {
    target = 'web'
  }

  const isServerBuild = target === 'node'

  // NOTE: We used to strip @client files on the server build here,
  // but this breaks traditional SSR and causes imported server actions
  // to be dead-code eliminated from the server bundle.
  // We now let client components execute on the server to generate initial HTML.

  // NOTE: If building for client and file has @server directive, we DO NOT return empty.
  // The ryunix-server-action-loader will generate the proxies and strip other code.

  // If server build and has @server directive, just return content (no hooks processing)
  if (isServerBuild && hasServerDirective) {
    return content
  }

  // Filter out client/server specific code based on directives (for block-level directives)
  content = filterClientServerDirectives(content, target)

  // Auto-detection: Use hooks = Client (only for server builds)
  // Only check for hooks when building for server
  const hasHooks =
    isServerBuild &&
    /use(Store|Effect|LayoutEffect|Context|Ref|Memo|Id|Transition)/.test(
      content,
    )

  // Add RSC optimization marker for client components on server build
  if (isServerBuild && hasHooks) {
    const hash = crypto
      .createHash('md5')
      .update(this.resourcePath)
      .digest('hex')
      .slice(0, 8)

    // Improved injection: handle export default more safely
    if (content.includes('export default')) {
      return `${content} \n\n/** Ryunix RSC Optimization **/
try {
  let _ryx_target = null;
  if (typeof __webpack_exports__ !== 'undefined' && __webpack_exports__["default"]) {
    _ryx_target = __webpack_exports__["default"];
  } else if (typeof exports !== 'undefined' && exports.default) {
    _ryx_target = exports.default;
  } else if (typeof module !== 'undefined' && module.exports && module.exports.default) {
    _ryx_target = module.exports.default;
  }

  if (_ryx_target && typeof _ryx_target === 'function') {
    if (process.env.RYUNIX_DEBUG) {
      console.log("[RSC Loader Execution] Tagging " + _ryx_target.name + " with ID " + hash);
    }
  }
} catch (e) { }
`
    }
  }

  return content
}
