const fs = require('fs')
const path = require('path')

const enableTailwind = (projectPath) => {
  // 1. Write tailwind.config.js
  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,mdx,ryx}",
    "./src/**/*.{js,jsx,ts,tsx,mdx,ryx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`
  fs.writeFileSync(path.join(projectPath, 'tailwind.config.js'), tailwindConfig)

  // 2. Write postcss.config.js for Tailwind v4 compatibility
  const postcssConfig = `module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {}, // You might not even need autoprefixer in v4, but it's safe to keep
  }
}
`
  fs.writeFileSync(path.join(projectPath, 'postcss.config.js'), postcssConfig)

  // 3. Inject Tailwind global directives into the template's main CSS
  const globalCssPathCandidates = [
    path.join(projectPath, 'app', 'global.css'),
    path.join(projectPath, 'src', 'app', 'global.css'),
    path.join(projectPath, 'app', 'assets', 'global.css'),
    path.join(projectPath, 'src', 'global.css')
  ]

  let cssInjected = false
  for (const cssPath of globalCssPathCandidates) {
    if (fs.existsSync(cssPath)) {
      const currentCss = fs.readFileSync(cssPath, 'utf8')
      const tailwindDirectives = `@import "tailwindcss";\n@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n`
      // Only inject if not already present
      if (!currentCss.includes('@tailwind')) {
        fs.writeFileSync(cssPath, tailwindDirectives + currentCss)
      }
      cssInjected = true
      break
    }
  }

  // If there's no global.css found, create a basic one in app/global.css
  if (!cssInjected) {
    const defaultCssPath = path.join(projectPath, 'app')
    if (fs.existsSync(defaultCssPath)) {
      const tailwindDirectives = `@import "tailwindcss";\n@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`
      fs.writeFileSync(path.join(defaultCssPath, 'global.css'), tailwindDirectives)
    }
  }
}

module.exports = { enableTailwind }
