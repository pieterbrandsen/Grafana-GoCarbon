# An service to launch an easy to use high performant graphite + grafana service

## Requirements

- Docker-Compose
- NPM

## Installation

### Setup

1. Check out `src/users.js` for setup instructions

Only 1 host per type is supported at the moment. So if you set it in the `src/users.js` file, it will always use first found host per type.

### Running

To get only datasource and serviceInfo dashboard run this:

```bash
npm install
npm run start
```

Run commands to get other dashboards:

1. `npm run start-mmo` For International mmo dashboard.
2. `npm run start-private` To get performance server dashboards.

## Usage

Go to `http://localhost:3000` and login with `admin` and `password`.

If the mod [screepsmod-server-stats](https://github.com/The-International-Screeps-Bot/screepsmod-server-stats) is installed on the private server then all server information will be available

### Delete data

```bash
node src/deletePath direct.path.to.delete
```

This removes all data for the chosen path

## FAQ

1. To update password/username for the admin user, you need to update `conf/grafana.env`, delete the volume of the grafana container and restart.
2. Its possible to start using `npx` instead of `npm run` but you need to install using `npm i - g screeps-grafana` and then `npx screeps-grafana` with possible `mmo` or `private` options.
