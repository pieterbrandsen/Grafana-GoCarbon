# An service to launch an easy to use high performant graphite + grafana service

## Requirements

- Docker-Compose
- Node (any version)

## Installation

- Clone this repo
- Run `npm install` to install dependencies

## Setup

- Update all .example files and/or folder to your needs, this is not needed if you use the default setup

You can add your own grafana variables in `grafanaConfig/.env.grafana`, after volume reset this is updated.

### Users setup

/* Setup:
Step 1: Remove all users below
Step 2: Add users like this:
A. MMO:

```json
{
"username": "PandaMaster",
"type": "mmo",
"shards": ["shard0"],
"token": "TOKEN_FOR_THIS_USER!",
},
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

Step 3: Add the host of the private server if its not localhost

```json
{
"username": "W1N1",
"type": "private",
"shards": ["screeps"],
"password": "password",
"host": "123.456.789",
}
```

Step 4. Add the segment of the stats if its not memory

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

### Grafana env variables

Add all env variables you want to modify, I don't have an url yet for the documentation of all variables.

### Run commands

- --grafanaPort, port for grafana to run on
- --serverPort, port for push-stats to look for a server on
- --grafanaType, type of grafana to run, can be `mmo` or `private`. If not included it will run a normal grafana instance
- --relayPort, port for relay to run on, default 2003
- --disablePushGateway, disable the push gateway
- --disableWhisperFolderExport, disable the export of whisper folder
- --force, force the non .example config files to be overwritten.
- --debug, listen to setup docker logs

## Usage

1. `npm run start:mmo` For International mmo dashboard.
2. `npm run start:mmo` For International mmo dashboard.
3. `npm run start:private` To get performance server dashboards to use when admin-utils mod and/or server-stats mod is installed.
4. For custom run commands check out package.json on how to run the commands.

Go to `http://localhost:3000` and login with `admin` and `password`.

By default stats are gathered from users every minute.

If the mod [screepsmod-server-stats](https://github.com/The-International-Screeps-Bot/screepsmod-server-stats) is installed on the private server that is referenced then all server information will be imported

### Update users

1. Update users
2. `npm run start` (or your preferred command)

This will rebuild the push-stats docker image and restart the service.

### Delete data

```bash
node src/deletePath --statsPath=direct.path.to.delete
```

This removes all files for the chosen path

## FAQ

1. To update password/username for the admin user, you need to update `grafanaConfig/.env.grafana`, delete the volume of the grafana container and restart.
2. Its possible to start using `npx` instead of `npm run` but you need to install using `npm i - g screeps-grafana` and then `npx screeps-grafana` with support for arguments.
