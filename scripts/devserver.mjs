import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const PIDFILE = path.join(ROOT, ".next", "devserver.json");
const DEFAULT_PORT = 3000;

function parseArgs(argv) {
  const args = argv.slice(2);
  const cmd = args[0] ?? "status";
  const portIndex = args.findIndex((a) => a === "--port");
  const port =
    portIndex >= 0 ? Number(args[portIndex + 1]) || DEFAULT_PORT : DEFAULT_PORT;
  return { cmd, port };
}

function ensureNextDir() {
  const dir = path.dirname(PIDFILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readPidfile() {
  try {
    const raw = fs.readFileSync(PIDFILE, "utf8");
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    const pid = Number(data.pid);
    const port = Number(data.port);
    if (!Number.isFinite(pid) || pid <= 0) return null;
    if (!Number.isFinite(port) || port <= 0) return null;
    return { pid, port, startedAt: Number(data.startedAt) || null };
  } catch {
    return null;
  }
}

function writePidfile(pid, port) {
  ensureNextDir();
  fs.writeFileSync(
    PIDFILE,
    JSON.stringify({ pid, port, startedAt: Date.now() }, null, 2),
    "utf8",
  );
}

function deletePidfile() {
  try {
    fs.unlinkSync(PIDFILE);
  } catch {
    // ignore
  }
}

function isRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitForHttpOk(port, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://localhost:${port}`, { method: "GET" });
      if (res.ok) return { ok: true, status: res.status };
      lastError = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastError = e;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return { ok: false, error: lastError };
}

function stopPid(pid) {
  if (!Number.isFinite(pid) || pid <= 0) return { stopped: false, reason: "invalid pid" };
  if (!isRunning(pid)) return { stopped: true, reason: "not running" };

  if (process.platform === "win32") {
    const child = spawn("taskkill", ["/PID", String(pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true,
    });
    return { stopped: true, reason: `taskkill (pid ${pid})`, childPid: child.pid };
  }

  try {
    process.kill(-pid, "SIGTERM");
  } catch {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // ignore
    }
  }
  return { stopped: true, reason: `SIGTERM (pid ${pid})` };
}

async function startDev({ port }) {
  const child = spawn(
    "npm",
    ["run", "dev", "--", "--port", String(port)],
    {
      detached: true,
      stdio: "ignore",
      shell: true,
      windowsHide: true,
      env: { ...process.env },
    },
  );
  child.unref();
  writePidfile(child.pid, port);

  const ready = await waitForHttpOk(port, 45_000);
  return { pid: child.pid, port, ready };
}

async function main() {
  const { cmd, port } = parseArgs(process.argv);

  if (cmd === "status") {
    const info = readPidfile();
    if (!info) {
      console.log("devserver: no pidfile");
      process.exit(0);
    }
    console.log(`devserver: pid=${info.pid} port=${info.port} running=${isRunning(info.pid)}`);
    process.exit(0);
  }

  if (cmd === "stop") {
    const info = readPidfile();
    if (!info) {
      console.log("devserver: no pidfile; nothing to stop");
      process.exit(0);
    }
    const result = stopPid(info.pid);
    deletePidfile();
    console.log(`devserver: stopped pid=${info.pid} (${result.reason})`);
    process.exit(0);
  }

  if (cmd === "start") {
    const info = readPidfile();
    if (info?.pid && isRunning(info.pid)) {
      console.log(`devserver: already running pid=${info.pid} port=${info.port}`);
      process.exit(0);
    }
    const started = await startDev({ port });
    if (started.ready.ok) {
      console.log(`devserver: started pid=${started.pid} port=${started.port} (HTTP ${started.ready.status})`);
      process.exit(0);
    }
    console.log(`devserver: started pid=${started.pid} port=${started.port} (not reachable yet)`);
    process.exit(2);
  }

  if (cmd === "restart") {
    const info = readPidfile();
    if (info?.pid) {
      stopPid(info.pid);
      deletePidfile();
    }
    const started = await startDev({ port });
    if (started.ready.ok) {
      console.log(`devserver: restarted pid=${started.pid} port=${started.port} (HTTP ${started.ready.status})`);
      process.exit(0);
    }
    console.log(`devserver: restarted pid=${started.pid} port=${started.port} (not reachable yet)`);
    process.exit(2);
  }

  console.log(`devserver: unknown command "${cmd}" (use: status|start|stop|restart)`);
  process.exit(1);
}

main().catch((e) => {
  console.error("devserver: fatal", e);
  process.exit(1);
});

