# An service to launch an easy to use high performant graphite + grafana service

## Requirements

- Docker-Compose
- NPM

## Installation

### Setup

1. Check out `src/users.js` for setup instructions

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
