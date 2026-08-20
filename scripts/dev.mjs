import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function runService(command, args, label, dir) {
  const processEnv = { ...process.env, FORCE_COLOR: '1' };
  const child = spawn(command, args, {
    cwd: path.resolve(rootDir, dir),
    shell: true,
    env: processEnv
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`[${label}] ${line.trim()}`);
      }
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      if (line.trim()) {
        console.error(`[${label} ERROR] ${line.trim()}`);
      }
    });
  });

  child.on('close', (code) => {
    console.log(`[${label}] Process exited with code ${code}`);
    process.exit(code || 0);
  });

  return child;
}

console.log('🚀 Starting PolyLance Monorepo Dev Environment...');
runService('npm', ['run', 'dev'], 'BACKEND', 'polylance-chat-service');
runService('npm', ['run', 'dev'], 'FRONTEND', 'frontend');
