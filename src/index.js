import axios from 'axios';
import { execSync } from 'child_process';
import { join, dirname } from 'path';

import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import getDashboards from '../dashboards/helper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const grafanaEnv = join(__dirname, '../conf/.env.grafana');
dotenv.config({ path: grafanaEnv });
const isWindows = process.platform === 'win32';

function sleep(milliseconds) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

const grafanaApiUrl = `http://localhost:${process.env.GF_SERVER_HTTP_PORT}/api`;
console.log(`Grafana API URL: ${grafanaApiUrl}`);

const dashboards = getDashboards();
const login = {
  username: process.env.GF_SECURITY_ADMIN_USER,
  password: process.env.GF_SECURITY_ADMIN_PASSWORD,
};

class GrafanaInitializer {
  static async SetupDataSources() {
    try {
      await axios({
        url: `${grafanaApiUrl}/datasources`,
        method: 'post',
        auth: login,
        data: {
          name: 'Graphite',
          type: 'graphite',
          url: 'http://api:8080',
          access: 'proxy',
          isDefault: true,
        },
      });
    } catch (err) {
      if (err.response && err.response.data.message !== 'data source with the same name already exists') console.error('Graphite datasource creation error: ', err.response && err.response.data.message);
    }
  }

  static async SetupServiceInfoDashboard() {
    try {
      const dashboard = dashboards.serviceInfo;
      await axios({
        url: `${grafanaApiUrl}/dashboards/db`,
        method: 'post',
        auth: login,
        data: dashboard,
      });
    } catch (err) {
      console.error('Service info dashboard creation error: ', err.response && err.response.data.message);
    }
  }

  static async SetupStatsDashboard() {
    try {
      const dashboard = dashboards.stats;
      await axios({
        url: `${grafanaApiUrl}/dashboards/db`,
        method: 'post',
        auth: login,
        data: dashboard,
      });
    } catch (err) {
      console.log('Stats dashboard creation error: ', err.response && err.response.data.message);
    }
  }

  static async SetupServerStatsDashboard() {
    try {
      const dashboard = dashboards.serverStats;
      await axios({
        url: `${grafanaApiUrl}/dashboards/db`,
        method: 'post',
        auth: login,
        data: dashboard,
      });
    } catch (err) {
      console.log('Server-Stats dashboard creation error: ', err.response && err.response.data.message);
    }
  }

  static async Start() {
    const dockerComposePath = join(__dirname, '../docker-compose.yml');
    const commands = [
      `docker-compose -f ${dockerComposePath} down`,
      `docker-compose -f ${dockerComposePath} build --no-cache`,
      `docker-compose -f ${dockerComposePath} up -d`,
    ];
    if (!isWindows) commands.push('sudo chmod -R 777 whisper');

    for (let i = 0; i < commands.length; i += 1) {
      const command = commands[i];
      try {
        execSync(command);
      } catch (error) {
        console.log(`Command index ${i}`, error);
      }
    }

    await sleep(30 * 1000);
    console.log('Pre setup done!\r\n');

    await this.SetupDataSources();
    await this.SetupServiceInfoDashboard();
    switch (process.argv[2]) {
      case 'private':
        await this.SetupStatsDashboard();
        await this.SetupServerStatsDashboard();
        break;
      case 'mmo':
        await this.SetupStatsDashboard();
        break;
      default:
        break;
    }
    console.log('Setup done!');
  }
}
GrafanaInitializer.Start();
