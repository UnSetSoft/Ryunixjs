import fs from 'node:fs';

const outputDirs = ['out', 'server/out'];

for (const dir of outputDirs) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}
