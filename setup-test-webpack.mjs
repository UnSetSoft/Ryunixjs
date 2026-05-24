#!/usr/bin/env node
/**
 * Bootstrap the local integration app at test/webpack from ryunix-base.
 *
 * Usage:
 *   node setup-test-webpack.mjs [--force] [--skip-build]
 *   pnpm run setup:web
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const TEMPLATE_DIR = path.join(ROOT, 'packages/cra/templates/ryunix-base');
const TARGET_DIR = path.join(ROOT, 'test/webpack');
const APP_NAME = 'ryunix-integration-app';

const args = new Set(process.argv.slice(2));
const force = args.has('--force');
const skipBuild = args.has('--skip-build');

function log(message) {
  console.log(message);
}

function fail(message) {
  console.error(`\nsetup-test-webpack: ${message}`);
  process.exit(1);
}

function run(command, commandArgs, { label }) {
  log(`\n→ ${label}`);
  const result = spawnSync(command, commandArgs, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.error) {
    fail(`could not run ${command}: ${result.error.message}`);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function directoryHasAppFiles(dir) {
  if (!fs.existsSync(dir)) {
    return false;
  }

  const entries = fs.readdirSync(dir).filter((name) => name !== '.gitignore');
  return entries.length > 0;
}

function writeIntegrationPackageJson() {
  const pkg = {
    name: APP_NAME,
    version: '1.0.0',
    private: true,
    homepage: './',
    scripts: {
      dev: 'ryunix dev',
      start: 'ryunix start',
      build: 'ryunix build',
    },
    dependencies: {
      '@unsetsoft/ryunixjs': 'workspace:*',
    },
    devDependencies: {
      '@unsetsoft/ryunix-presets': 'workspace:*',
    },
    engines: {
      node: '^20 || ^22 || ^24',
    },
  };

  fs.writeFileSync(
    path.join(TARGET_DIR, 'package.json'),
    `${JSON.stringify(pkg, null, 2)}\n`,
    'utf8',
  );
}

function assertTemplateReady() {
  if (!fs.existsSync(TEMPLATE_DIR)) {
    fail(`template not found at ${TEMPLATE_DIR}`);
  }

  for (const relativePath of ['app/index.ryx', 'ryunix.config.js']) {
    const filePath = path.join(TEMPLATE_DIR, relativePath);
    if (!fs.existsSync(filePath)) {
      fail(`template is incomplete (missing ${relativePath})`);
    }
  }
}

function copyTemplate() {
  fs.mkdirSync(path.dirname(TARGET_DIR), { recursive: true });
  fs.cpSync(TEMPLATE_DIR, TARGET_DIR, { recursive: true, force: true });

  const templateGitignore = path.join(TEMPLATE_DIR, 'gitignore');
  if (fs.existsSync(templateGitignore)) {
    fs.copyFileSync(templateGitignore, path.join(TARGET_DIR, '.gitignore'));
  }
}

function verifySetup() {
  for (const relativePath of [
    'app/index.ryx',
    'ryunix.config.js',
    'package.json',
  ]) {
    if (!fs.existsSync(path.join(TARGET_DIR, relativePath))) {
      fail(`setup incomplete (missing test/webpack/${relativePath})`);
    }
  }

  const linkedCore = path.join(
    TARGET_DIR,
    'node_modules/@unsetsoft/ryunixjs',
  );
  if (!fs.existsSync(linkedCore)) {
    fail(
      'workspace link missing for @unsetsoft/ryunixjs; run pnpm install from the repo root',
    );
  }
}

log('RyunixJS — setup test/webpack integration app\n');

assertTemplateReady();

if (directoryHasAppFiles(TARGET_DIR)) {
  if (!force) {
    fail(
      'test/webpack already exists. Remove it or rerun with --force to recreate it.',
    );
  }

  log('Removing existing test/webpack (--force)...');
  fs.rmSync(TARGET_DIR, { recursive: true, force: true });
}

log('Copying ryunix-base template → test/webpack');
copyTemplate();
writeIntegrationPackageJson();

run('pnpm', ['install'], { label: 'Linking workspace packages (pnpm install)' });

if (!skipBuild) {
  run('pnpm', ['build'], { label: 'Building monorepo packages (pnpm build)' });
}

verifySetup();

log('\nDone. Start the dev server with:\n');
log('  pnpm run:web\n');
log('Other useful commands:');
log('  pnpm run:web:build   # production build');
log('  pnpm run:web:start   # serve production build');
