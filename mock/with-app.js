const { spawn } = require("node:child_process");
const path = require("node:path");

const root = path.join(__dirname, "..");
const expoBin = path.join(root, "node_modules", ".bin", "expo");
const expoArgs = process.argv.slice(2);
const env = {
  ...process.env,
  EXPO_PUBLIC_API_PORT: process.env.EXPO_PUBLIC_API_PORT || "3001",
};

const children = [];
let shuttingDown = false;

function run(command, args) {
  const child = spawn(command, args, {
    cwd: root,
    env,
    stdio: "inherit",
  });
  children.push(child);
  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    shutdown(signal ? 0 : code ?? 0);
  });
}

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

run(process.execPath, [path.join(__dirname, "server.js")]);
run(expoBin, ["start", ...expoArgs]);
