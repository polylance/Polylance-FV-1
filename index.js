/**
 * PolyLance Production Chat & Global Realtime Sync Entry Point
 * Used by Render, CI/CD, or direct node index.js executions (CommonJS)
 */
const { spawn, execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const chatServiceDir = path.resolve(__dirname, "polylance-chat-service");

console.log("🚀 Initializing PolyLance Production Chat & Database Sync Service...");

// Pre-flight check: Ensure express and dependencies exist in polylance-chat-service
const expressPath = path.resolve(chatServiceDir, "node_modules", "express");
const distServer = path.resolve(chatServiceDir, "dist", "server.js");

if (!fs.existsSync(expressPath) || !fs.existsSync(distServer)) {
  console.log("📦 Installing dependencies and generating database schema inside polylance-chat-service...");
  try {
    execSync("npm install --legacy-peer-deps && npx prisma generate && npm run build", {
      cwd: chatServiceDir,
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: process.env.NODE_ENV || "production" }
    });
  } catch (installErr) {
    console.warn("⚠️ Note during dependency installation:", installErr.message);
  }
}

if (fs.existsSync(distServer)) {
  const child = spawn(process.execPath, [distServer], {
    cwd: chatServiceDir,
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: process.env.NODE_ENV || "production" }
  });
  child.on("exit", (code) => process.exit(code || 0));
} else {
  const isWin = process.platform === "win32";
  const npmCmd = isWin ? "npm.cmd" : "npm";
  const child = spawn(npmCmd, ["run", "dev"], {
    cwd: chatServiceDir,
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: process.env.NODE_ENV || "production" }
  });
  child.on("exit", (code) => process.exit(code || 0));
}
