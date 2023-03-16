#!/usr/bin/env node
const { execSync } = require('child_process');
const { join } = require('path');
require('dotenv').config({ path: join(__dirname, '../.env') });

async function run() {
  await import('../src/setup/index.js');
}

if (process.argv[2] === 'stop') {
  console.log(process.env.COMPOSE_FILE);
  console.log();
  console.log(process.env);
  execSync('docker-compose stop');
} else run();
