const axios = require('axios').default
const { join } = require('path')
require('dotenv').config({ path: join(__dirname, '../conf', 'grafana.env') });
const fs = require('fs')
const dashboardHelper = require('../dashboards/helper.js')
const { login } = require('./config.js')
const { execSync } = require('child_process')
function sleep(milliseconds) {
     return new Promise(resolve => setTimeout(resolve, milliseconds))
}

const grafanaApiUrl = `http://localhost:${process.env.GF_SERVER_HTTP_PORT}/api`
console.log(`Grafana API URL: ${grafanaApiUrl}`)

const dashboards = dashboardHelper.getDashboards()
const includeAllDashboards = process.argv.length > 2 && process.argv[2] === 'all'

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
          'docker-compose --env-file ./conf/grafana.env down',
          'docker-compose --env-file ./conf/grafana.env build --no-cache',
          'docker-compose --env-file ./conf/grafana.env up -d'
     ]

     for (let i = 0; i < commands.length; i++) {
          try {
               execSync(commands[i])
          } catch (error) {
               console.log('Command index ' + i, error)
          }
     }

     await sleep(30 * 1000)
     console.log('Pre setup done!\r\n')

     await SetupDataSources()
     await SetupServiceInfoDashboard()
     if (includeAllDashboards) {
          await SetupStatsDashboard()
          await SetupServerStatsDashboard()
     }
     console.log('Setup done!')
})()
