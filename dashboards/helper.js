const fs = require('fs');
const { join } = require('path');
const dashboardFileNames = [
    'serviceInfo',
    'stats',
    'serverStats',
    'adminUtilsServerStats'
];

function setupDashboard(dashboard) {
    delete dashboard.id;
    delete dashboard.uid;
    for (let i = 0; i < dashboard.templating.list.length; i += 1) {
        const datasource = dashboard.templating.list[i].datasource
        if (!datasource) continue
        delete datasource.type;
        delete datasource.uid;
    }

    for (let i = 0; i < dashboard.panels.length; i += 1) {
        const panel = dashboard.panels[i];
        if (panel.panels) {
            for (let y = 0; y < panel.panels.length; y += 1) {
                const subPanel = panel.panels[y];
                delete subPanel.datasource.uid;
                delete subPanel.datasource.type;
            }
        }
        else if (panel.type !== 'row') {
            delete panel.datasource.uid;
            delete panel.datasource.type;
        }
    }
    return { dashboard: dashboard, overwrite: true };
}

module.exports = function GetDashboards() {
    const setupDashboards = {};
    for (let i = 0; i < dashboardFileNames.length; i += 1) {
        try {
            const filePath = join(__dirname, `../dashboards/${dashboardFileNames[i]}.json`);
            const rawDashboard = fs.readFileSync(filePath);
            const json = JSON.parse(rawDashboard);
            setupDashboards[dashboardFileNames[i]] = setupDashboard(json);
        } catch (error) {
            console.log(error)
        }
    }
    return setupDashboards;
}

