import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import minimist from 'minimist'
import getPort, { portNumbers } from 'get-port';

const argv = minimist(process.argv.slice(2));
console.dir(argv);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let grafanaPort;
const serverPort = argv.serverPort || 21025;
const relayPort = argv.relayPort || 2003;

function UpdateEnvFile() {
    const envFile = join(__dirname, '../.env');
    if (fs.existsSync(envFile) && !argv.force) return console.log('Env file already exists, use --force to overwrite it');
    
    const exampleEnvFilePath = join(__dirname, '../example.env');
    let exampleEnvText = fs.readFileSync(exampleEnvFilePath, 'utf8');
    exampleEnvText = exampleEnvText.replaceAll('{{ grafanaPort }}', grafanaPort).replaceAll('{{ serverPort }}', serverPort);
    fs.writeFileSync(envFile, exampleEnvText);
    console.log('Env file created');
}

async function UpdateDockerComposeFile() {
    const dockerComposeFile = join(__dirname, '../docker-compose.yml');
    if (fs.existsSync(dockerComposeFile) && !argv.force) return console.log('Docker-compose file already exists, use --force to overwrite it');

    const exampleDockerComposeFile = join(__dirname, '../docker-compose.example.yml');
    let exampleDockerComposeText = fs.readFileSync(exampleDockerComposeFile, 'utf8');
    exampleDockerComposeText = exampleDockerComposeText.replaceAll('{{ grafanaPort }}', grafanaPort).replaceAll('{{ serverPort }}', serverPort).replaceAll('{{ relayPort }}', relayPort);
    fs.writeFileSync(dockerComposeFile, exampleDockerComposeText);
    console.log('Docker-compose file created');
}

export default async function Setup() {
    grafanaPort = argv.grafanaPort || await getPort({ port: portNumbers(3000, 4000) })
    UpdateEnvFile();
    await UpdateDockerComposeFile()
}
