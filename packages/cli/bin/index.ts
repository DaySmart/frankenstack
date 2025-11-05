#!/usr/bin/env node
const minimist = require("minimist");
const version = require("../package.json").version;

// Lightweight debug banner & helpers (enabled when FRANK_DEBUG or FRANK_VERBOSE set)
const DEBUG_ENABLED = !!(process.env.FRANK_DEBUG || process.env.FRANK_VERBOSE);
function debugLog(...args: any[]) {
  if (DEBUG_ENABLED) {
    const ts = new Date().toISOString();
    console.log(`[frank][debug][${ts}]`, ...args);
  }
}
debugLog("Entrypoint loaded", { argv: process.argv });

process.on("beforeExit", (code) => debugLog("beforeExit", code));
process.on("exit", (code) => debugLog("exit", code));
process.on("SIGINT", () => {
  console.log("SIGINT received");
  process.exit(130);
});
// Lazy-load Deployer only when needed to avoid loading heavy deps for --version/help
let Deployer: any;

const run = async () => {
  debugLog("Parsing argv");
  const args = minimist(process.argv);
  process.argv = process.argv.slice(0, 2);
  const command = args._[2];
  debugLog("Parsed command", command, "positionals", args._);
  if (command === "help" || args.help) {
    console.log(`
Frankenstack v${version}

Usage:
    frank deploy <file> [--params=<'{"key": "value"}'>]
    frank rollback <env> <componentName>
    frank iam <file>
    frank remove <env> <componentName>
    frank component describe <env> <component>

Options:
    --profile   AWS profile to use
    --stageOveride Use non-default Frankenstack API
        `);
    process.exit(0);
  } else if (command === "version" || args.version) {
    console.log(`Frankenstack CLI v${version}`);
    process.exit(0);
  }
  const file = args._[3];
  debugLog("Template file arg", file);
  if (!Deployer) {
    debugLog("Loading Deployer class from ../src");
    Deployer = require("../src").default;
  }
  const deploy = new Deployer(command, file, args);
  debugLog("Deployer instance created");
  try {
    debugLog("Invoking deploy.run()");
    await deploy.run();
    debugLog("deploy.run() resolved");
  } catch (err: any) {
    console.error(
      "ERROR:",
      err && err.stack ? err.stack : err && err.message ? err.message : err
    );
    process.exit(1);
  }
};

run();
