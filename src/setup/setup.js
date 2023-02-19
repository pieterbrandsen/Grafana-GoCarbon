const fs = require('fs');
const fse = require('fs-extra');
const { join } = require('path');
const { execSync } = require('child_process');

let argv;
const port = 10004;

function getPortMock() {
  return 3000;
}
const nodeVersion = process.versions.node;
const nodeVersionMajor = Number(nodeVersion.split('.')[0]);
const { getPort } = nodeVersionMajor >= 14 ? require('get-port-please') : { getPort: getPortMock };
const isWindows = process.platform === 'win32';
const regexEscape = isWindows ? "\r\n" : "\n";

let grafanaPort;
let serverPort;

function createRegexWithEscape(string) {
  return new RegExp(string.replace("\r\n", regexEscape));
}


function UpdateEnvFile() {
  const envFile = join(__dirname, '../../.env');
  if (fs.existsSync(envFile) && !argv.force) return console.log('Env file already exists, use --force to overwrite it');

  const exampleEnvFilePath = join(__dirname, '../../example.env');
  let exampleEnvText = fs.readFileSync(exampleEnvFilePath, 'utf8');
  exampleEnvText = exampleEnvText
    .replace('GRAFANA_PORT=3000', `GRAFANA_PORT=${grafanaPort}`)
    .replace('COMPOSE_PROJECT_NAME=screeps-grafana', `COMPOSE_PROJECT_NAME=screeps-grafana-${grafanaPort}`)
    .replace('COMPOSE_FILE=./docker-compose.yml', `COMPOSE_FILE=${join(__dirname, '../../docker-compose.yml')}`);
  if (serverPort) exampleEnvText = exampleEnvText.replace('SERVER_PORT=21025', `SERVER_PORT=${serverPort}`);

  fs.writeFileSync(envFile, exampleEnvText);
  console.log('Env file created');
}

async function UpdateDockerComposeFile() {
  const dockerComposeFile = join(__dirname, '../../docker-compose.yml');
  if (fs.existsSync(dockerComposeFile) && !argv.force) return console.log('Docker-compose file already exists, use --force to overwrite it');
  const { relayPort } = argv;
  const { disablePushGateway } = argv;

  const exampleDockerComposeFile = join(__dirname, '../../docker-compose.example.yml');
  let exampleDockerComposeText = fs.readFileSync(exampleDockerComposeFile, 'utf8');
  exampleDockerComposeText = exampleDockerComposeText
    .replace('3000:3000', `${grafanaPort}:3000`);

  if (disablePushGateway) exampleDockerComposeText = exampleDockerComposeText.replace('DISABLE_PUSHGATEWAY=false', `DISABLE_PUSHGATEWAY=${disablePushGateway}`);
  if (relayPort) exampleDockerComposeText = exampleDockerComposeText.replace('2003:2003', `${relayPort}:2003`);
  else {
    // 
    exampleDockerComposeText = exampleDockerComposeText.replace(createRegexWithEscape('ports:\r\n      - 2003:2003'), '');
  }
  if (serverPort) {
    exampleDockerComposeText = exampleDockerComposeText
      .replace('http://localhost:21025/web', `http://localhost:${serverPort}/web`)
      .replace('SERVER_PORT: 21025', `SERVER_PORT: ${serverPort}`);
  }
  if (argv.includePushStatusApi) exampleDockerComposeText = exampleDockerComposeText.replace('INCLUDE_PUSH_STATUS_API=false', `INCLUDE_PUSH_STATUS_API=true${regexEscape}     ports:${regexEscape}        - ${port}:${port}`);
  fs.writeFileSync(dockerComposeFile, exampleDockerComposeText);
  console.log('Docker-compose file created');
}

function UpdateUsersFile() {
  const usersFile = join(__dirname, '../../users.json');
  if (fs.existsSync(usersFile) && !argv.force) return console.log('Users file already exists, use --force to overwrite it');

  const exampleUsersFilePath = join(__dirname, '../../users.example.json');
  const exampleUsersText = fs.readFileSync(exampleUsersFilePath, 'utf8');
  fs.writeFileSync(usersFile, exampleUsersText);
  console.log('Users file created');
}

function UpdateGrafanaConfigFolder() {
  const grafanaConfigFolder = join(__dirname, '../../grafanaConfig');
  if (fs.existsSync(grafanaConfigFolder) && !argv.force) return console.log('Grafana config folder already exists, use --force to overwrite it');

  fse.copySync(join(__dirname, '../../grafanaConfig.example'), grafanaConfigFolder);
  const grafanaIniFile = join(grafanaConfigFolder, './grafana/grafana.ini');
  let grafanaIniText = fs.readFileSync(grafanaIniFile, 'utf8');

  const { username } = argv;
  const { password } = argv;
  const { enableAnonymousAccess } = argv;
  if (username) grafanaIniText = grafanaIniText.replace(/admin_user = (.*)/, `admin_user = ${username}`);
  if (password) grafanaIniText = grafanaIniText.replace(/admin_password = (.*)/, `admin_password = ${password}`);
  grafanaIniText = grafanaIniText.replace(createRegexWithEscape("enable anonymous access\r\nenabled = (.*)"), `enable anonymous access${regexEscape}enabled = ${enableAnonymousAccess}`);
  fs.writeFileSync(grafanaIniFile, grafanaIniText);

  const storageSchemasFile = join(grafanaConfigFolder, './go-carbon/storage-schemas.conf');
  let storageSchemasText = fs.readFileSync(storageSchemasFile, 'utf8');
  const { defaultRetention } = argv;

  const regex = new RegExp();
  if (defaultRetention) storageSchemasText = storageSchemasText.replace(createRegexWithEscape(`pattern = .*\r\nretentions = (.*)`), `pattern = .*${regexEscape}retentions = ${defaultRetention}`);
  fs.writeFileSync(storageSchemasFile, storageSchemasText);

  console.log('Grafana config folder created');
}

module.exports = async function Setup(mArgv) {
  argv = mArgv || {};
  grafanaPort = argv.grafanaPort || await getPort({ portRange: [3000, 4000] });
  serverPort = argv.serverPort;
  UpdateEnvFile();
  await UpdateDockerComposeFile();
  UpdateUsersFile();
  UpdateGrafanaConfigFolder();
};
module.exports.commands = async function Commands(grafanaApiUrl) {
  const isWindows = process.platform === 'win32';
  console.log(`\r\nGrafana API URL: ${grafanaApiUrl}${serverPort ? `, serverPort: ${serverPort}` :
    ""}`);

  const commands = [
    { command: 'docker-compose down --volumes --remove-orphans', name: 'docker-compose down' },
    { command: 'docker-compose build --no-cache', name: 'docker-compose build' },
    { command: 'docker-compose up -d', name: 'docker-compose up' },
  ];

  const carbonStoragePath = join(__dirname, '../../go-carbon-storage');
  const carbonCommands = [];
  let carbonStorageExists = fs.existsSync(carbonStoragePath);
  if (carbonStorageExists && argv.deleteWhisper) {
    if (!isWindows) carbonCommands.push({ command: `rm -rf ${carbonStoragePath}`, name: 'rm -rf go-carbon-storage' });
    else carbonCommands.push({ command: `rmdir /s /q ${carbonStoragePath}`, name: 'rmdir /s /q go-carbon-storage' });
    carbonStorageExists = false;
  }

  if (!carbonStorageExists) {
    if (!isWindows) {
      carbonCommands.push({ command: `sudo mkdir -p ${join(carbonStoragePath, './whisper')}`, name: 'mkdir go-carbon-storage' });
      carbonCommands.push({ command: `sudo chmod -R 777 ${carbonStoragePath}`, name: 'chmod go-carbon-storage' });
    } else carbonCommands.push({ command: `mkdir "${join(carbonStoragePath, './whisper')}"`, name: 'mkdir go-carbon-storage' });
  } else if (!isWindows) carbonCommands.push({ command: `sudo chmod -R 777 ${carbonStoragePath}`, name: 'chmod go-carbon-storage' });

  const logsPath = join(__dirname, '../../logs');
  const logsCommands = [];
  let logsExist = fs.existsSync(logsPath);
  if (logsExist && argv.deleteLogs) {
    if (!isWindows) logsCommands.push({ command: `sudo rm -rf ${logsPath}`, name: 'rm -rf logs' });
    else logsCommands.push({ command: `rmdir /s /q ${logsPath}`, name: 'rmdir /s /q logs' });
    logsExist = false;
  }

  if (!logsExist) {
    if (!isWindows) {
      logsCommands.push({
        command: `sudo mkdir -p ${join(logsPath, './goCarbon')}`,
        name: 'mkdir logs/goCarbon',
      });
      logsCommands.push({
        command: `sudo chmod -R 777 ${join(logsPath, './goCarbon')}`,
        name: 'chmod logs/goCarbon',
      });
    }
  } else if (!isWindows) {
    logsCommands.push({
      command: `sudo chmod -R 777 ${join(logsPath, './goCarbon')}`,
      name: 'chmod logs/goCarbon',
    });
  }

  commands.splice(1, 0, ...carbonCommands);
  commands.splice(1 + carbonCommands.length, 0, ...logsCommands);
  console.log('\r\nExecuting start commands:');
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
};
