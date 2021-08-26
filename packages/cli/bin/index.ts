#!/usr/bin/env node
const minimist = require('minimist');
import Deployer from '../src';

const run = async () => {
    const args = minimist(process.argv);
    process.argv = process.argv.slice(0, 2);
    const file = args._[3];
    const command = args._[2];
    const deploy = new Deployer(command, file, args);
    try {
        await deploy.run();
    } catch(err) {
        console.error("ERROR:", err.message);
        process.exit(1);
    }
}

run();