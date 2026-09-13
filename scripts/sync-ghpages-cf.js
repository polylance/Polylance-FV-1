const fs = require('fs');
const path = require('path');
const targetFolder = process.argv[2] || '.gh-pages-cf';
const dest = path.resolve(__dirname, '..', targetFolder);

if (!fs.existsSync(dest)) {
  console.error('Destination .gh-pages-cf does not exist');
  process.exit(1);
}

// 1. Copy latest frontend/dist into .gh-pages-cf
fs.cpSync(path.resolve(__dirname, '..', 'frontend', 'dist'), dest, { recursive: true, force: true });
fs.writeFileSync(path.join(dest, '.nojekyll'), '');

// 2. Also prepare package.json and a build.js script so Cloudflare Pages 'npm run build' succeeds
const buildScript = `
const fs = require('fs');
const path = require('path');
const root = __dirname;
const distDir = path.join(root, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}
if (fs.existsSync(path.join(root, 'assets'))) {
  fs.cpSync(path.join(root, 'assets'), path.join(distDir, 'assets'), { recursive: true, force: true });
}
['index.html', '404.html', 'polylanceLogo.png', 'polylance_logo.png', 'favicon.svg', 'icons.svg', '_headers'].forEach(f => {
  if (fs.existsSync(path.join(root, f))) {
    fs.copyFileSync(path.join(root, f), path.join(distDir, f));
  }
});
console.log('✅ Cloudflare Pages static build ready in root and dist/');
`;
fs.writeFileSync(path.join(dest, 'build.js'), buildScript.trim());

const pkg = {
  name: 'polylance-pages',
  version: '1.0.0',
  private: true,
  scripts: {
    build: 'node build.js'
  }
};
fs.writeFileSync(path.join(dest, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
console.log('✅ Synchronized gh-pages with package.json and build.js for Cloudflare Pages compatibility');
