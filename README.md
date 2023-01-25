# An easy-to-use, high-performance Graphite + Grafana service

## Requirements

- Docker-Compose
- Node (any version)

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies

## Setup

1. Update all .example files and/or folders to match your needs. This step is not required if you are using the default setup.
2. Add your own Grafana variables in `grafanaConfig/.env.grafana`. This file will be updated after a volume reset.

### User Setup

1. Remove all users from the setup
2. Add users in the following format:

A. MMO:

```json
{
"username": "PandaMaster",
"type": "mmo",
"shards": ["shard0"],
"token": "TOKEN_FOR_THIS_USER!",
}
```

B. Private:

```json
{
"username": "W1N1",
"type": "private",
"shards": ["screeps"],
"password": "password",
}
```

If the private server is not hosted on localhost, add the host to the user:

```json
{
"username": "W1N1",
"type": "private",
"shards": ["screeps"],
"password": "password",
"host": "123.456.789",
}
```

If the segment of the stats is not memory, add it to the user:

```json
{
"username": "W1N1",
"type": "private",
"shards": ["screeps"],
"password": "password",
"host": "123.456.789",
"segment": 0,
}
```

Grafana Environment Variables
Add any env variables you want to modify. Currently, there is no URL for the documentation of all variables.

Run Commands

- `--grafanaPort`: port for Grafana to run on
- `--serverPort`: port for push-stats to look for a server on
- `--grafanaType`: type of Grafana to run (mmo or private). If not included, it will run a normal Grafana instance.
- `--relayPort`: port for relay to run on (default is 2003)
- `--disablePushGateway`: disable the push gateway
- `--disableWhisperFolderExport`: disable the export of the whisper folder
- `--force`: force the non .example config files to be overwritten.
- `--debug`: listen to setup Docker logs

## Usage

- npm run start:mmo for the International MMO dashboard.
- npm run start:private for performance server dashboards to use when the admin-utils mod and/or server-stats mod is installed.
- For custom run commands, check out package.json for instructions on how to run them.

Go to [localhost:3000](http://localhost:3000) and login with `admin` and `password`.

By default, stats are gathered from users every minute. If the mod [screepsmod-server-stats](https://github.com/The-International-Screeps-Bot/screepsmod-server-stats)
