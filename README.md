# An service to launch an easy to use high performant graphite + grafana service

! UNTIL FURTHER NOTICE EVERY RESTART OF THE COMPLETE CONTAINER WILL RESULT IN A LOSS OF ALL DATA !
Solution is to stop and delete push-stats container, `docker-compose rebuild` and `docker-compose up -d`

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
