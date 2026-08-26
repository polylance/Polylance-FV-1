/**
 * PolyLance Production Chat & Global Realtime Sync Entry Point
 * Used by Render, CI/CD, or direct node index.js executions (CommonJS)
 */
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const chatServiceDir = path.resolve(__dirname, "polylance-chat-service");

console.log("🚀 Initializing PolyLance Production Chat & Database Sync Service...");

const distServer = path.resolve(chatServiceDir, "dist", "server.js");

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
