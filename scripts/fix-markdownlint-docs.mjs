#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = new URL('../', import.meta.url).pathname;
const DOCS = join(REPO_ROOT, 'docs');

function githubSlug(text) {
  let s = text.replace(/`([^`]+)`/g, '$1');
  s = s.trim().toLowerCase();
  s = s.replace(/\s*[—–]\s*/g, '  ');
  s = s.replace(/[^\p{L}\p{N}\s-]/gu, '');
  s = s.replace(/ /g, '-');
  return s.replace(/^-|-$/g, '');
}

/** Slug compatible with markdownlint MD051 (GitHub-style, incl. `(\`/\`)` headings). */
function headingSlug(title) {
  const slug = githubSlug(title);
  if (/\(`\/`\)\s*$/.test(title.trim())) return `${slug}-`;
  return slug;
}

function fixLanguageBanner(content) {
  if (!content.startsWith('> **Language / Idioma:**')) return content;
  const bannerMatch = content.match(
    /^(> \*\*Language \/ Idioma:\*\*[^\n]*(?:\n> [^\n]*)*)\n\n/,
  );
  if (!bannerMatch) return content;
  const banner = `${bannerMatch[1]}\n\n`;
  let rest = content.slice(bannerMatch[0].length);
  const h1 = rest.match(/^# [^\n]+\n/);
  if (!h1) return content;
  rest = rest.slice(h1[0].length);
  if (rest.startsWith(banner)) return content;
  return `${h1[0]}\n${banner}${rest}`;
}

function fixEmphasisHeadings(content) {
  return content.replace(/^\*\*([^*\n]+)\*\*\s*$/gm, '### $1');
}

function fixTrailingHeadingPunctuation(content) {
  return content.replace(/^(#{1,6}\s+[^:\n]+)\.\s*$/gm, '$1');
}

function fixDuplicateVerifyHeadings(content, isEs) {
  const label = isEs ? 'Qué validar' : 'What to verify';
  let n = 0;
  return content.replace(new RegExp(`^### ${label}\\s*$`, 'gm'), () => {
    n += 1;
    const suffixes = isEs
      ? ['', ' (CRA)', ' (extensión)']
      : ['', ' (CRA)', ' (extension)'];
    return `### ${label}${suffixes[n - 1] ?? ` (${n})`}`;
  });
}

function fixOrderedListPrefix(content) {
  return content.replace(
    /(```[\s\S]*?```)\n\n(\d+)\. /g,
    (all, fence, num) => (num === '1' ? all : `${fence}\n\n1. `),
  );
}

function fixBlockquoteSpacing(content) {
  return content.replace(/^>( {2,})/gm, '> ');
}

function fixListMarkerSpace(content) {
  return content.replace(/^(\s*\d+\.)\s{2,}/gm, '$1 ');
}

function ensureReadmeLintDirectives(content) {
  const directive = '<!-- markdownlint-disable MD033 MD041 MD013 -->\n\n';
  if (content.includes('markdownlint-disable MD033')) {
    if (!content.includes('MD013')) {
      return content.replace(
        'markdownlint-disable MD033 MD041',
        'markdownlint-disable MD033 MD041 MD013',
      );
    }
    return content;
  }
  return `${directive}${content}`;
}

function ensureReadmeMd013Enable(content) {
  if (!content.includes('markdownlint-disable MD033')) return content;
  if (content.includes('markdownlint-enable MD013')) return content;
  const marker = '\n---\n\n## ';
  const idx = content.indexOf(marker);
  if (idx === -1) return content;
  return `${content.slice(0, idx)}\n<!-- markdownlint-enable MD013 -->${content.slice(idx)}`;
}

function fixTocLinkFragments(content) {
  const headings = new Map();
  for (const line of content.split('\n')) {
    const m = line.match(/^#{1,2}\s+(.+)$/);
    if (m) headings.set(m[1].trim(), headingSlug(m[1].trim()));
  }
  return content.replace(
    /\[([^\]]+)\]\(#([^)]+)\)/g,
    (full, text) => {
      const trimmed = text.trim();
      if (headings.has(trimmed)) {
        return `[${text}](#${headings.get(trimmed)})`;
      }
      for (const [title, slug] of headings) {
        if (title === trimmed) return `[${text}](#${slug})`;
      }
      return full;
    },
  );
}

function ensureBlankLines(content) {
  const lines = content.split('\n');
  const out = [];
  const blank = (l) => l.trim() === '';
  const hr = (l) => /^---\s*$/.test(l.trim());
  const heading = (l) => /^#{1,6}\s/.test(l.trim());
  const list = (l) => /^(\s*)((?:[-*+])|(?:\d+\.))\s+/.test(l);
  const fence = (l) => l.trim().startsWith('```');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prev = out.at(-1);
    const next = lines[i + 1];

    if (heading(line)) {
      if (prev !== undefined && !blank(prev) && !hr(prev)) out.push('');
      out.push(line);
      if (next !== undefined && !blank(next) && !list(next) && !hr(next)) out.push('');
      continue;
    }

    if (list(line)) {
      if (prev !== undefined && !blank(prev) && !list(prev) && !hr(prev)) out.push('');
      out.push(line);
      continue;
    }

    if (fence(line) && !line.trim().endsWith('```')) {
      if (prev !== undefined && !blank(prev)) out.push('');
      out.push(line);
      continue;
    }

    if (line.trim() === '```' && prev !== undefined && !blank(prev)) {
      out.push(line);
      if (next !== undefined && !blank(next) && !hr(next)) out.push('');
      continue;
    }

    if (
      prev !== undefined &&
      list(prev) &&
      !list(line) &&
      !blank(line) &&
      !hr(line)
    ) {
      out.push('');
    }

    out.push(line.replace(/[ \t]+$/u, ''));
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, files);
    else if (name.endsWith('.md')) files.push(p);
  }
  return files;
}

function addToc(content, isEs) {
  const tocLabel = isEs ? 'Índice' : 'Table of contents';
  if (content.includes(`## ${tocLabel}`)) return content;

  const headings = [];
  for (const line of content.split('\n')) {
    const m = line.match(/^(#{1,2})\s+(.+)$/);
    if (m && m[2].trim().toLowerCase() !== tocLabel.toLowerCase()) {
      headings.push({ level: m[1].length, title: m[2].trim() });
    }
  }
  const h1 = headings.find((h) => h.level === 1);
  const h2s = headings.filter((h) => h.level === 2);
  if (!h1) return content;

  const tocLines = [
    `## ${tocLabel}`,
    '',
    `- [${h1.title}](#${headingSlug(h1.title)})`,
    `  - [${tocLabel}](#${headingSlug(tocLabel)})`,
    ...h2s.map((h) => `  - [${h.title}](#${headingSlug(h.title)})`),
    '',
    '---',
    '',
  ].join('\n');

  const hr = content.indexOf('\n---\n');
  if (hr === -1) {
    const h2 = content.search(/^## /m);
    if (h2 === -1) return content;
    return `${content.slice(0, h2)}---\n\n${tocLines}${content.slice(h2)}`;
  }
  const after = hr + '\n---\n'.length;
  return `${content.slice(0, after)}\n${tocLines}${content.slice(after).replace(/^(\s*---\s*\n)+/, '')}`;
}

function processFile(file, { withToc = false, isEs = false, readmeHtml = false } = {}) {
  let content = readFileSync(file, 'utf8');

  if (readmeHtml) {
    content = ensureReadmeLintDirectives(content);
    content = ensureReadmeMd013Enable(content);
  } else {
    content = fixLanguageBanner(content);
  }

  content = fixEmphasisHeadings(content);
  content = fixTrailingHeadingPunctuation(content);
  if (file.includes('testing-guide') || file.includes('guia-de-pruebas')) {
    content = fixDuplicateVerifyHeadings(content, isEs);
  }
  content = fixOrderedListPrefix(content);
  content = fixBlockquoteSpacing(content);
  content = fixListMarkerSpace(content);
  content = ensureBlankLines(content);
  content = fixTocLinkFragments(content);
  if (withToc) content = addToc(content, isEs);

  writeFileSync(file, content.endsWith('\n') ? content : `${content}\n`);
}

const rootMd = readdirSync(REPO_ROOT)
  .filter((name) => name.endsWith('.md'))
  .map((name) => join(REPO_ROOT, name));

const packageReadmes = readdirSync(join(REPO_ROOT, 'packages'))
  .map((name) => join(REPO_ROOT, 'packages', name, 'README.md'))
  .filter((p) => statSync(p).isFile());

for (const file of walk(DOCS)) {
  processFile(file, { withToc: true, isEs: file.includes('/es/') });
}

for (const file of rootMd) {
  const base = file.split('/').pop();
  processFile(file, {
    withToc: false,
    isEs: base.endsWith('.es.md'),
    readmeHtml: base === 'README.md' || base === 'README.es.md',
  });
}

for (const file of packageReadmes) {
  processFile(file, { withToc: false, readmeHtml: true });
}

console.log(
  `Prepared ${walk(DOCS).length} docs + ${rootMd.length} root + ${packageReadmes.length} package READMEs (run Prettier next).`,
);
