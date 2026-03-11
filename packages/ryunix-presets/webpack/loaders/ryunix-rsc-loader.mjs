import crypto from 'crypto';

export default function (content) {
  const isServer = content.includes('//@server') || content.includes('// @server');
  const isClient = content.includes('//@client') || content.includes('// @client');

  // Auto-detection: Use hooks = Client
  const hasHooks = /use(Store|Effect|LayoutEffect|Context|Ref|Memo|Id|Transition)/.test(content);

  if (isClient || (!isServer && hasHooks)) {
    const hash = crypto.createHash('md5').update(this.resourcePath).digest('hex').slice(0, 8);

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
    console.log("[RSC Loader Execution] Tagging", _ryx_target.name, "with ID", "${hash}");
    _ryx_target.ryunix_client_id = "${hash}";
    if (typeof window !== 'undefined') {
      window.__RYUNIX_ISLANDS__ = window.__RYUNIX_ISLANDS__ || {};
      window.__RYUNIX_ISLANDS__["${hash}"] = _ryx_target;
    }
  }
} catch (e) { }
`;
    }
  }

  return content;
}
