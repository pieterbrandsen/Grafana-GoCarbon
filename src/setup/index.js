const dotenv = require('dotenv');
const axios = require('axios');
const { execSync } = require('child_process');
const { join } = require('path');
const fs = require('fs');

const minimist = require('minimist');

const argv = minimist(process.argv.slice(2));
console.dir(argv);

const isWindows = process.platform === 'win32';
let grafanaPort;
let grafanaApiUrl;

const { createLogger, format, transports } = require('winston');
const setup = require('./setup.js');
const getDashboards = require('../../dashboards/helper.js');

const { combine, timestamp, prettyPrint } = format;
const logger = createLogger({
  format: combine(
    timestamp(),
    prettyPrint(),
  ),
  transports: [new transports.File({ filename: 'logs/setup.log' })],
});

function sleep(milliseconds) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

const dashboards = getDashboards();
let adminLogin;

function handleSuccess(type) {
  console.log(`${type} dashboard setup done`);
  logger.info(`${type} dashboard setup done`);
}

function handleError(type, err) {
  logger.error(`${type} dashboard error: `, err);
  console.error(`${type} dashboard error: `, err.message, err.stack);
}

class GrafanaInitializer {
  static async SetupServiceInfoDashboard() {
    const type = 'Service-Info';
    try {
      const dashboard = dashboards.serviceInfo;
      await axios({
        url: `${grafanaApiUrl}/dashboards/db`,
        method: 'post',
        auth: adminLogin,
        data: dashboard,
      });
      handleSuccess(type);
    } catch (err) {
      handleError(type, err);
    }
  }

  static async SetupStatsDashboard() {
    const type = 'Stats';
    try {
      const dashboard = dashboards.stats;
      await axios({
        url: `${grafanaApiUrl}/dashboards/db`,
        method: 'post',
        auth: adminLogin,
        data: dashboard,
      });
      handleSuccess(type);
    } catch (err) {
      handleError(type, err);
    }
  }

  static async SetupServerStatsDashboard() {
    const type = 'Server-Stats';
    try {
      const dashboard = dashboards.serverStats;
      await axios({
        url: `${grafanaApiUrl}/dashboards/db`,
        method: 'post',
        auth: adminLogin,
        data: dashboard,
      });
      handleSuccess(type);
    } catch (err) {
      handleError(type, err);
    }
  }

  static async SetupAdminUtilsServerStatsDashboard() {
    const type = 'Admin-Utils-Server-Stats';
    try {
      const dashboard = dashboards.adminUtilsServerStats;
      await axios({
        url: `${grafanaApiUrl}/dashboards/db`,
        method: 'post',
        auth: adminLogin,
        data: dashboard,
      });
      handleSuccess(type);
    } catch (err) {
      handleError(type, err);
    }
  }

  static async Start() {
    await setup(argv);
    dotenv.config({ path: join(__dirname, '../../.env') });

    const grafanaIni = fs.readFileSync(join(__dirname, '../../grafanaConfig/grafana/grafana.ini'), 'utf8');
    const username = grafanaIni.match(/admin_user = (.*)/)[1];
    const password = grafanaIni.match(/admin_password = (.*)/)[1];
    adminLogin = { username, password };

    dotenv.config({ path: join(__dirname, '../../grafanaConfig/.env.grafana') });

    grafanaPort = process.env.GRAFANA_PORT;
    grafanaApiUrl = `http://localhost:${grafanaPort}/api`;
    console.log(`Grafana API URL: ${grafanaApiUrl}, serverPort: ${process.env.SERVER_PORT}`);

    const commands = [
      { command: 'docker-compose down --volumes --remove-orphans', name: 'docker-compose down' },
      { command: 'docker-compose build --no-cache', name: 'docker-compose build' },
      { command: 'docker-compose up -d', name: 'docker-compose up' },
    ];

    const carbonStoragePath = join(__dirname, '../../go-carbon-storage');
    const carbonCommands = [];
    if (fs.existsSync(carbonStoragePath) && argv.force) {
      if (!isWindows) carbonCommands.push({ command: `rm -rf ${carbonStoragePath}`, name: 'rm -rf go-carbon-storage folder' });
      else carbonCommands.push({ command: `rmdir /s /q ${carbonStoragePath}`, name: 'rmdir /s /q go-carbon-storage folder' });
    }
    if (!isWindows) {
      carbonCommands.push({ command: `sudo mkdir -p ${join(carbonStoragePath, './whisper')}`, name: 'mkdir go-carbon-storage folder' });
      carbonCommands.push({ command: `sudo chmod -R 777 ${carbonStoragePath}`, name: 'chmod go-carbon-storage folder' });
    } else carbonCommands.push({ command: `mkdir "${join(carbonStoragePath, './whisper')}"`, name: 'mkdir go-carbon-storage folder' });
    commands.splice(1, 0, ...carbonCommands);

    for (let i = 0; i < commands.length; i += 1) {
      const commandInfo = commands[i];
      try {
        console.log(`Running command ${commandInfo.name}`);
        execSync(commandInfo.command, { stdio: argv.debug ? 'inherit' : 'ignore' });
      } catch (error) {
        console.log(`Command ${commandInfo.name} errored`, error);
        console.log('Stopping setup');
        process.exit(1);
      }
    }

    console.log('Pre setup done!\r\nWaiting for Grafana to start...\r\n');
    await sleep(30 * 1000);

    await this.SetupServiceInfoDashboard();
    switch (argv.grafanaType) {
      case 'private':
        await this.SetupAdminUtilsServerStatsDashboard();
        await this.SetupStatsDashboard();
        await this.SetupServerStatsDashboard();
        break;
      case 'mmo':
        await this.SetupAdminUtilsServerStatsDashboard();
        await this.SetupStatsDashboard();
        break;
      default:
        break;
    }
    console.log('Setup done!');
  }
}
GrafanaInitializer.Start();
