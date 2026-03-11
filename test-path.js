const path = require('path');
const buildDir = '.ryunix';
const routePath = '/blog/demo';
const outputDir = path.join(buildDir, 'static', routePath);
console.log('OutputDir:', outputDir);
console.log('Resolved:', path.resolve(outputDir));
