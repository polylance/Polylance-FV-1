import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const children = [];

function runService(command, args, label, dir) {
  const processEnv = { ...process.env, FORCE_COLOR: '1' };
  const child = spawn(command, args, {
    cwd: path.resolve(rootDir, dir),
    shell: true,
    env: processEnv
  });

  children.push(child);

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
    cleanup();
  });

  return child;
}

function cleanup() {
  children.forEach((c) => {
    try {
      if (c && !c.killed) {
        c.kill('SIGTERM');
      }
    } catch {}
  });
}

process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});
process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

async function isBackendRunning() {
  try {
    const res = await fetch('http://localhost:3001/health');
    return res.ok;
  } catch {
    return false;
  }
}

console.log('🚀 Starting PolyLance Monorepo Dev Environment...');
(async () => {
  const backendAlive = await isBackendRunning();
  if (backendAlive) {
    console.log('[BACKEND] PolyLance Hardened Escrow Chat Server is already running on http://localhost:3001');
  } else {
    runService('npm', ['run', 'dev'], 'BACKEND', 'polylance-chat-service');
  }
  runService('npm', ['run', 'dev'], 'FRONTEND', 'frontend');
})();


