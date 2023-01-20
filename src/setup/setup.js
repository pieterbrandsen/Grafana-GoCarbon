const fs = require('fs');
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
    .replace('SERVER_PORT=21025', `SERVER_CONFIG=${serverPort}`)
    .replace("COMPOSE_PROJECT_NAME=screeps-grafana", `COMPOSE_PROJECT_NAME=screeps-grafana-${grafanaPort}`);

    fs.writeFileSync(envFile, exampleEnvText);
    console.log('Env file created');
}

async function UpdateDockerComposeFile(argv) {
    const dockerComposeFile = join(__dirname, '../../docker-compose.yml');
    if (fs.existsSync(dockerComposeFile) && !argv.force) return console.log('Docker-compose file already exists, use --force to overwrite it');
    const relayPort = argv.relayPort || 2003;
    const disablePushGateway = argv.disablePushGateway === "true";
    const disableWhisperFolderExport = argv.disableWhisperFolderExport === "true";

    const exampleDockerComposeFile = join(__dirname, '../../docker-compose.example.yml');
    let exampleDockerComposeText = fs.readFileSync(exampleDockerComposeFile, 'utf8');
    exampleDockerComposeText = exampleDockerComposeText
    .replace('3000:3000', `${grafanaPort}:3000`)
    .replace('http://localhost:21025/web', `http://localhost:${serverPort}/web`)
    .replace('2003:2003', `${relayPort}:2003`)
    .replace("SERVER_PORT: 21025", `SERVER_PORT: ${serverPort}`)
    if (disablePushGateway) exampleDockerComposeText = exampleDockerComposeText.replace("DISABLE_PUSHGATEWAY: \"false\"", `DISABLE_PUSHGATEWAY: \"${disablePushGateway}\"`)
    if (disableWhisperFolderExport) exampleDockerComposeText = exampleDockerComposeText.replace("- ./whisper:", "- whisper_data:");
    fs.writeFileSync(dockerComposeFile, exampleDockerComposeText);
    console.log('Docker-compose file created');
}

module.exports = async function Setup(argv) {
    grafanaPort = argv.grafanaPort || await getPort({ portRange: [3000, 4000] });
    serverPort = argv.serverPort || 21025;
    UpdateEnvFile(argv);
    await UpdateDockerComposeFile(argv)
}
