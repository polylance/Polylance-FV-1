/**
 * PolyLance Production Chat & Global Realtime Sync Entry Point
 * Used by Render, Heroku, or direct node index.js executions
 */
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const chatServiceDir = path.resolve(__dirname, "polylance-chat-service");

console.log("🚀 Initializing PolyLance Production Chat & Database Sync Service...");

// If built dist/server.js exists, run it directly
const distServer = path.resolve(chatServiceDir, "dist", "server.js");
const tsServer = path.resolve(chatServiceDir, "src", "server.js");

if (fs.existsSync(distServer)) {
  const child = spawn(process.execPath, [distServer], {
    cwd: chatServiceDir,
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: process.env.NODE_ENV || "production" }
  });
  child.on("exit", (code) => process.exit(code || 0));
} else {
  // If dist/server.js is not yet built, run through npm start inside polylance-chat-service
  const isWin = process.platform === "win32";
  const npmCmd = isWin ? "npm.cmd" : "npm";
  const child = spawn(npmCmd, ["run", "dev"], {
    cwd: chatServiceDir,
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: process.env.NODE_ENV || "production" }
  });
  child.on("exit", (code) => process.exit(code || 0));
}
