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