const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');
const frontendDist = path.join(frontendDir, 'dist');
const rootDist = path.join(rootDir, 'dist');

console.log('🚀 [PolyLance Vercel Build] Step 1/3: Installing frontend dependencies...');
execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });

console.log('🚀 [PolyLance Vercel Build] Step 2/3: Compiling frontend with Vite & TypeScript...');
execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

console.log('🚀 [PolyLance Vercel Build] Step 3/3: Syncing build output artifacts...');
if (fs.existsSync(frontendDist)) {
  fs.cpSync(frontendDist, rootDist, { recursive: true, force: true });
  console.log(`✅ Build successful! Output generated at frontend/dist and ./dist (${fs.readdirSync(frontendDist).length} assets)`);
} else {
  console.error('❌ Error: frontend/dist was not generated!');
  process.exit(1);
}
