# An service to launch an easy to use high performant graphite + grafana service

## Requirements

- Docker-Compose
- NPM

## Installation

### Setup

1. Check out `src/users.js` for setup instructions

Only 1 private serverStats host is supported at the moment. So if you set it in the `src/users.js` file, it will always use first found host.

### Running

To get only datasource and serviceInfo dashboard run this:

```bash
npm install
npm run start
```

Run commands to get other dashboards:

1. `npm run start-mmo` For International mmo dashboard.
2. `npm run start-private` To get performance server dashboards to use when admin-utils mod is installed.

## Usage

Go to `http://localhost:3000` and login with `admin` and `password`.

If the mod [screepsmod-server-stats](https://github.com/The-International-Screeps-Bot/screepsmod-server-stats) is installed on the private server that is referenced then all server information will be imported

### Delete data

```bash
node src/deletePath direct.path.to.delete
```

This removes all data for the chosen path

### Upgrade version

1. `docker-compose down`
2. Backup `src/users.js` and `.env.grafana`. If you would like to start fresh backup `whisper` and `logs` (if you want) folder as well.
3. Get latest changes
4. Copy all backuped files/folders to the folder
5. `npm install`
6. `npm run start`

## FAQ

1. To update password/username for the admin user, you need to update `conf/grafana.env`, delete the volume of the grafana container and restart.
2. Its possible to start using `npx` instead of `npm run` but you need to install using `npm i - g screeps-grafana` and then `npx screeps-grafana` with possible `mmo` or `private` options.
