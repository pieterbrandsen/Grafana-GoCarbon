#!/usr/bin/env node
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
import { execSync } from 'child_process';

async function run() {
    await import('../src/setup/index.js');
}

if (process.argv[2] === 'stop') {
    execSync('docker-compose stop');
}
else run();
