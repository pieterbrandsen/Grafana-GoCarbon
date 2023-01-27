const fs = require('fs');
const fse = require('fs-extra');
const { join } = require('path');
function getPortMock() {
    return 3000;
}
const nodeVersion = process.versions.node;
const nodeVersionMajor = Number(nodeVersion.split('.')[0]);
const { getPort } = nodeVersionMajor >= 14 ? require('get-port-please') : { getPort: getPortMock };

let grafanaPort;
let serverPort;

function UpdateEnvFile(argv) {
    const envFile = join(__dirname, '../../.env');
    if (fs.existsSync(envFile) && !argv.force) return console.log('Env file already exists, use --force to overwrite it');

    const exampleEnvFilePath = join(__dirname, '../../example.env');
    let exampleEnvText = fs.readFileSync(exampleEnvFilePath, 'utf8');
    exampleEnvText = exampleEnvText
        .replace('GRAFANA_PORT=3000', `GRAFANA_PORT=${grafanaPort}`)
        .replace("COMPOSE_PROJECT_NAME=screeps-grafana", `COMPOSE_PROJECT_NAME=screeps-grafana-${grafanaPort}`)
        .replace("COMPOSE_FILE=./docker-compose.yml", `COMPOSE_FILE=${join(__dirname, '../../docker-compose.yml')}`);
    if (serverPort) exampleEnvText = exampleEnvText.replace("SERVER_PORT=21025", `SERVER_PORT=${serverPort}`);

    fs.writeFileSync(envFile, exampleEnvText);
    console.log('Env file created');
}

async function UpdateDockerComposeFile(argv) {
    const dockerComposeFile = join(__dirname, '../../docker-compose.yml');
    if (fs.existsSync(dockerComposeFile) && !argv.force) return console.log('Docker-compose file already exists, use --force to overwrite it');
    const relayPort = argv.relayPort || 2003;
    const disablePushGateway = argv.disablePushGateway;
    const disableWhisperFolderExport = argv.disableWhisperFolderExport;

    const exampleDockerComposeFile = join(__dirname, '../../docker-compose.example.yml');
    let exampleDockerComposeText = fs.readFileSync(exampleDockerComposeFile, 'utf8');
    exampleDockerComposeText = exampleDockerComposeText
        .replace('3000:3000', `${grafanaPort}:3000`)

    if (disablePushGateway) exampleDockerComposeText = exampleDockerComposeText.replace("DISABLE_PUSHGATEWAY: \"false\"", `DISABLE_PUSHGATEWAY: \"${disablePushGateway}\"`)
    if (disableWhisperFolderExport) exampleDockerComposeText = exampleDockerComposeText.replace("- ./whisper:", "- whisper_data:");
    if (relayPort) exampleDockerComposeText.replace('2003:2003', `${relayPort}:2003`);
    if (serverPort) {
        exampleDockerComposeText = exampleDockerComposeText
            .replace('http://localhost:21025/web', `http://localhost:${serverPort}/web`)
            .replace("SERVER_PORT: 21025", `SERVER_PORT: ${serverPort}`)
    }
    fs.writeFileSync(dockerComposeFile, exampleDockerComposeText);
    console.log('Docker-compose file created');
}

function UpdateUsersFile(argv) {
    const usersFile = join(__dirname, '../../users.json');
    if (fs.existsSync(usersFile) && !argv.force) return console.log('Users file already exists, use --force to overwrite it');

    const exampleUsersFilePath = join(__dirname, '../../users.example.json');
    const exampleUsersText = fs.readFileSync(exampleUsersFilePath, 'utf8');
    fs.writeFileSync(usersFile, exampleUsersText);
    console.log('Users file created');
}

function UpdateGrafanaConfigFolder(argv) {
    const grafanaConfigFolder = join(__dirname, '../../grafanaConfig');
    if (fs.existsSync(grafanaConfigFolder) && !argv.force) return console.log('Grafana config folder already exists, use --force to overwrite it');

    fse.copySync(join(__dirname, '../../grafanaConfig.example'), grafanaConfigFolder);
    console.log('Grafana config folder created');
}

module.exports = async function Setup(argv) {
    grafanaPort = argv.grafanaPort || await getPort({ portRange: [3000, 4000] });
    serverPort = argv.serverPort;
    UpdateEnvFile(argv);
    await UpdateDockerComposeFile(argv)
    UpdateUsersFile(argv);
    UpdateGrafanaConfigFolder(argv);
}
