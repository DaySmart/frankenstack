import fs from "fs";
import path from "path";
import os from "os";

interface LogOptions {
  command: string;
  deploymentGuid?: string;
}

function sanitize(segment: string) {
  return segment.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export class FileLogger {
  private baseDir: string;
  private command: string;
  private deploymentGuid?: string;
  private sessionTs: string;
  private generalStream?: fs.WriteStream;
  private deploymentStream?: fs.WriteStream;

  constructor(opts: LogOptions) {
    this.command = opts.command;
    this.deploymentGuid = opts.deploymentGuid;
    this.sessionTs = new Date().toISOString().replace(/[:]/g, "-");
    const envDir = this.resolveBaseDir();
    this.baseDir = envDir;
    this.ensureDir(this.baseDir);
    this.openGeneral();
    if (this.command === "deploy" && this.deploymentGuid) {
      this.openDeployment();
    }
  }

  private resolveBaseDir(): string {
    // Precedence: FRANK_LOG_DIR > FRANK_LOG_ROOT > OS-specific default.
    if (process.env.FRANK_LOG_DIR) return process.env.FRANK_LOG_DIR;
    if (process.env.FRANK_LOG_ROOT)
      return path.join(process.env.FRANK_LOG_ROOT, "logs");
    // Windows: %LOCALAPPDATA%/Frankenstack/logs ; else: ~/.frankenstack/logs
    if (process.platform === "win32") {
      const root =
        process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
      return path.join(root, "Frankenstack", "logs");
    }
    return path.join(os.homedir(), ".frankenstack", "logs");
  }

  private ensureDir(dir: string) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (err) {}
  }

  private openGeneral() {
    const fname = `frank-${this.sessionTs}-${sanitize(this.command)}.log`;
    const fpath = path.join(this.baseDir, fname);
    this.generalStream = fs.createWriteStream(fpath, { flags: "a" });
    this.write(
      this.generalStream,
      `# Frankenstack command ${this.command} start ts=${this.sessionTs}\n`
    );
  }

  private openDeployment() {
    const deployDir = path.join(this.baseDir, "deploy");
    this.ensureDir(deployDir);
    const fname = `${this.sessionTs}-${this.deploymentGuid}.log`;
    const fpath = path.join(deployDir, fname);
    this.deploymentStream = fs.createWriteStream(fpath, { flags: "a" });
    this.write(
      this.deploymentStream,
      `# Deploy ${this.deploymentGuid} started ts=${this.sessionTs}\n`
    );
  }

  log(msg: string, meta?: any) {
    const line = this.format(msg, meta);
    if (this.generalStream) this.write(this.generalStream, line);
    if (this.deploymentStream && this.command === "deploy")
      this.write(this.deploymentStream, line);
  }

  logConsole(level: string, parts: any[]) {
    const joined = parts
      .map((p) => {
        if (typeof p === "string") return p;
        try {
          return JSON.stringify(p);
        } catch {
          return "[unserializable]";
        }
      })
      .join(" ");
    this.log(`console.${level}`, { message: joined });
  }

  logDeploymentEvent(event: any) {
    if (this.command !== "deploy") return;
    const payload = event?.data?.subscribeToDeploymentUpdate || event;
    const baseLine = this.format("deployment-event", payload);
    if (this.deploymentStream) this.write(this.deploymentStream, baseLine);

    // Create per-component/job log if componentName or jobRunGuid present
    const componentName = payload?.componentName;
    const jobRunGuid = payload?.jobRunGuid;
    if (componentName || jobRunGuid) {
      const deployDir = path.join(this.baseDir, "deploy");
      this.ensureDir(deployDir);
      const parts = [this.sessionTs, this.deploymentGuid];
      if (componentName) parts.push(sanitize(componentName));
      if (jobRunGuid) parts.push(sanitize(jobRunGuid));
      const fname = parts.join("-") + ".log";
      const fpath = path.join(deployDir, fname);
      this.write(fs.createWriteStream(fpath, { flags: "a" }), baseLine);
    }
  }

  close(status?: string) {
    if (status) this.log(`# status=${status}`);
    try {
      this.generalStream?.end();
    } catch {}
    try {
      this.deploymentStream?.end();
    } catch {}
  }

  private format(msg: string, meta?: any) {
    const ts = new Date().toISOString();
    let metaStr = "";
    if (meta !== undefined) {
      try {
        metaStr = " " + JSON.stringify(meta);
      } catch {
        metaStr = " [meta-unserializable]";
      }
    }
    return `${ts} ${msg}${metaStr}\n`;
  }

  private write(stream: fs.WriteStream, line: string) {
    try {
      stream.write(line);
    } catch {}
  }
}

// Singleton accessor and console patch helper
let _globalLogger: FileLogger | null = null;
export function getLogger(opts?: LogOptions): FileLogger {
  if (!_globalLogger && opts) {
    _globalLogger = new FileLogger(opts);
  }
  return _globalLogger as FileLogger;
}

export function attachConsole(logger: FileLogger) {
  const original = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
  };
  Object.keys(original).forEach((k: any) => {
    (console as any)[k] = (...args: any[]) => {
      try {
        logger.logConsole(k, args);
      } catch {}
      (original as any)[k](...args);
    };
  });
  return () => {
    Object.keys(original).forEach((k: any) => {
      (console as any)[k] = (original as any)[k];
    });
  };
}
