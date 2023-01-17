const fs = require('fs');
const { join } = require('path');
const minimist = require('minimist')
// const { getPort } = require('get-port-please');

const argv = minimist(process.argv.slice(2));
console.dir(argv);
let grafanaPort;
const serverPort = argv.serverPort || 21025;

function UpdateEnvFile() {
    const envFile = join(__dirname, '../../.env');
    if (fs.existsSync(envFile) && !argv.force) return console.log('Env file already exists, use --force to overwrite it');

    const exampleEnvFilePath = join(__dirname, '../../example.env');
    let exampleEnvText = fs.readFileSync(exampleEnvFilePath, 'utf8');
    exampleEnvText = exampleEnvText.replace('{{ grafanaPort }}', grafanaPort).replace('{{ serverPort }}', serverPort)
    fs.writeFileSync(envFile, exampleEnvText);
    console.log('Env file created');
}

async function UpdateDockerComposeFile() {
    const dockerComposeFile = join(__dirname, '../../docker-compose.yml');
    if (fs.existsSync(dockerComposeFile) && !argv.force) return console.log('Docker-compose file already exists, use --force to overwrite it');
    const relayPort = argv.relayPort || 2003;
    const disablePushGateway = argv.disablePushGateway === "true";
    const disableWhisperFolderExport = argv.disableWhisperFolderExport === "true";

    const exampleDockerComposeFile = join(__dirname, '../../docker-compose.example.yml');
    let exampleDockerComposeText = fs.readFileSync(exampleDockerComposeFile, 'utf8');
    exampleDockerComposeText = exampleDockerComposeText.replace('{{ grafanaPort }}', grafanaPort).replace('{{ serverPort }}', serverPort).replace('{{ relayPort }}', relayPort).replace("SERVER_PORT: 21025", `SERVER_PORT: ${serverPort}`);
    if (disablePushGateway) exampleDockerComposeText = exampleDockerComposeText.replace("DISABLE_PUSHGATEWAY: \"false\"", `DISABLE_PUSHGATEWAY: \"${disablePushGateway}\"`)
    if (disableWhisperFolderExport) exampleDockerComposeText = exampleDockerComposeText.replace("- ./whisper:/openmetric/data/whisper", "");
    fs.writeFileSync(dockerComposeFile, exampleDockerComposeText);
    console.log('Docker-compose file created');
}

module.exports = async function Setup() {
    grafanaPort = argv.grafanaPort || await getPort({ portRange: [3000, 4000] })
    UpdateEnvFile();
    await UpdateDockerComposeFile()
}
