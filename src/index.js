const axios = require('axios').default
const { join } = require('path')
const dashboardHelper = require('../dashboards/helper.js')
const { execSync } = require('child_process')

const grafanaEnv = 'conf/grafana.env'
require('dotenv').config({ path: join(__dirname,"../", grafanaEnv) });
const isWindows = process.platform === 'win32'

function sleep(milliseconds) {
     return new Promise(resolve => setTimeout(resolve, milliseconds))
}

const grafanaApiUrl = `http://localhost:${process.env.GF_SERVER_HTTP_PORT}/api`
console.log(`Grafana API URL: ${grafanaApiUrl}`)

const dashboards = dashboardHelper.getDashboards()
const login = {
     username: process.env.GF_SECURITY_ADMIN_USER,
     password: process.env.GF_SECURITY_ADMIN_PASSWORD,
}

async function SetupDataSources() {
     try {
          await axios({
               url: grafanaApiUrl + '/datasources',
               method: 'post',
               auth: login,
               data: {
                    name: 'Graphite',
                    type: 'graphite',
                    url: `http://api:8080`,
                    access: 'proxy',
                    isDefault: true,
               },
          })
     } catch (err) {
          if (err.response && err.response.data.message !== 'data source with the same name already exists') console.error('Graphite datasource creation error: ', err.response && err.response.data.message)
     }
}

async function SetupServiceInfoDashboard() {
     try {
          const dashboard = dashboards.serviceInfo
          await axios({
               url: grafanaApiUrl + '/dashboards/db',
               method: 'post',
               auth: login,
               data: dashboard,
          })
     } catch (err) {
          console.error("Service info dashboard creation error: ", err.response && err.response.data.message)
     }
}

async function SetupStatsDashboard() {
     try {
          const dashboard = dashboards.stats
          await axios({
               url: grafanaApiUrl + '/dashboards/db',
               method: 'post',
               auth: login,
               data: dashboard,
          })
     } catch (err) {
          console.log("Stats dashboard creation error: ", err.response && err.response.data.message)
     }
}

async function SetupServerStatsDashboard() {
     try {
          const dashboard = dashboards.serverStats
          await axios({
               url: grafanaApiUrl + '/dashboards/db',
               method: 'post',
               auth: login,
               data: dashboard,
          })
     } catch (err) {
          console.log("Server-Stats dashboard creation error: ", err.response && err.response.data.message)
     }
}

; (async function () {
     const commands = [
          `docker-compose --env-file ${grafanaEnv} down`,
          `docker-compose --env-file ${grafanaEnv} build --no-cache`,
          `docker-compose --env-file ${grafanaEnv} up -d`,
     ]
     if (!isWindows) commands.push(`chmod ugo+rwx whisper`)

     for (let i = 0; i < commands.length; i++) {
          const command = commands[i];
          try {
               execSync(command)
          } catch (error) {
               console.log('Command index ' + i, error)
          }
     }

     await sleep(30 * 1000)
     console.log('Pre setup done!\r\n')

     await SetupDataSources()
     await SetupServiceInfoDashboard()
     switch (process.argv[2]) {
          case "all":
               await SetupStatsDashboard()
               await SetupServerStatsDashboard() 
               break;
          case "mmo":
               await SetupStatsDashboard()
               break;
          default:
               break;
     }
     console.log('Setup done!')
})()
