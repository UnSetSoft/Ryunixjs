> **Language / Idioma:** [English](./SECURITY.md) · [Español](./SECURITY.es.md)

# Security Policy

## Supported Versions

We currently support the following versions of RyunixJS:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.2.4 | :x:                |

## Reporting a Vulnerability

If you've found a security vulnerability in RyunixJS, please do not open a public issue. Instead, report it privately to the maintainers.

You can report vulnerabilities by:
- Sending an email to [support@unsetsoft.com](mailto:support@unsetsoft.com)
- Creating a private vulnerability report on GitHub (if available)

Please include as much information as possible:
- A description of the vulnerability.
- Steps to reproduce the issue.
- Potential impact.
- Any suggested fixes.


## Security Mechanisms in RyunixJS

RyunixJS includes several built-in security features:
- **XSS Protection**: Automatic HTML escaping in SSR and SSG.
- **CSRF Protection**: Validation of custom headers for Server Actions.
- **CSP Support**: Support for nonces in streaming SSR.
- **Path Traversal Protection**: Validation of file paths in the production server.
- **Prototype Pollution Guard**: Sanitization of props during island hydration.
- **Dangerous URI Blocking**: Automatic blocking of `javascript:` and `vbscript:` URIs.

But we are not perfect, so please report any vulnerabilities you find.