#!/usr/bin/env node
const minimist = require("minimist");
const version = require("../package.json").version;
// Lazy-load Deployer only when needed to avoid loading heavy deps for --version/help
let Deployer: any;

const run = async () => {
  const args = minimist(process.argv);
  process.argv = process.argv.slice(0, 2);
  const command = args._[2];
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
  if (!Deployer) {
    Deployer = require("../src").default;
  }
  const deploy = new Deployer(command, file, args);
  try {
    await deploy.run();
  } catch (err: any) {
    console.error("ERROR:", err.message ? err.message : err);
    process.exit(1);
  }
};

run();
