const dotenv = require('dotenv')
const axios = require('axios');
const { execSync } = require('child_process');
const { join } = require('path');
const getDashboards = require('../../dashboards/helper.js');
const setup = require('./setup.js');
const fs = require('fs');

const isWindows = process.platform === 'win32';
let grafanaPort;
let grafanaApiUrl;
dotenv.config({ path: join(__dirname, '../../conf/.env.grafana') });

const { createLogger, format, transports } = require('winston');
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
const login = {
    username: process.env.GF_SECURITY_ADMIN_USER,
    password: process.env.GF_SECURITY_ADMIN_PASSWORD,
};

function handleError(type, err) {
    logger.error(`${type} dashboard error: `, err);
    console.error(`${type} dashboard error: `, err.message, err.stack);
}

class GrafanaInitializer {
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
            handleError("Service Info", err)
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
            handleError("Stats", err)
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
            handleError("Server-Stats", err)
        }
    }

    static async SetupAdminUtilsServerStatsDashboard() {
        try {
            const dashboard = dashboards.adminUtilsServerStats;
            await axios({
                url: `${grafanaApiUrl}/dashboards/db`,
                method: 'post',
                auth: login,
                data: dashboard,
            });
        } catch (err) {
            handleError("Admin-Utils-Server-Stats", err)
        }
    }

    static async Start() {
        await setup();
        dotenv.config({ path: join(__dirname, '../../.env') });

        grafanaPort = process.env.GRAFANA_PORT;
        grafanaApiUrl = `http://localhost:${grafanaPort}/api`
        console.log(`Grafana API URL: ${grafanaApiUrl}, serverPort: ${process.env.SERVER_PORT}`);

        const dockerComposePath = join(__dirname, '../../docker-compose.yml');
        const commands = [
            `docker-compose -f ${dockerComposePath} -p screeps-grafana-${grafanaPort} down --volumes --remove-orphans`,
            `docker-compose -f ${dockerComposePath} -p screeps-grafana-${grafanaPort} build --no-cache`,
            `docker-compose -f ${dockerComposePath} -p screeps-grafana-${grafanaPort} up -d`,
        ];
        const whisperPath = join(__dirname, '../../whisper');
        if (!isWindows && fs.existsSync(whisperPath)) commands.push(`sudo chmod -R 777 ${whisperPath}`);

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

        await this.SetupServiceInfoDashboard();
        await this.SetupAdminUtilsServerStatsDashboard();
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
