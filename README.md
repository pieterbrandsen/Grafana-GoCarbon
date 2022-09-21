# An service to launch an easy to use high performant graphite + grafana service

## Requirements

- Docker-Compose
- NPM

## Installation

### Setup

For MMO change `password` to your `token`
Include the correct information per user and remove all current private users

### Running

Inside this folder

```bash
npm install
node index.js
```

## Usage

Go to `http://localhost:3000` and setup the dashboards you want

If the mod [screepsmod-server-stats](https://github.com/The-International-Screeps-Bot/screepsmod-server-stats) is installed on the private server then all server information will be available

### Delete data

```bash
node src/deletePath direct.path.to.delete
```

This removes all data for the chosen path
