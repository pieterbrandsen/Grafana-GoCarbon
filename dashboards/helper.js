const fs = require('fs');
const { join } = require('path');

function transformDashboard(dashboard) {
  delete dashboard.id;
  delete dashboard.uid;
  for (let i = 0; i < dashboard.templating.list.length; i += 1) {
    const { datasource } = dashboard.templating.list[i];
    if (datasource) {
      delete datasource.type;
      delete datasource.uid;
    }
  }

  for (let i = 0; i < dashboard.panels.length; i += 1) {
    const panel = dashboard.panels[i];
    if (panel.panels) {
      for (let y = 0; y < panel.panels.length; y += 1) {
        const subPanel = panel.panels[y];
        delete subPanel.datasource.uid;
        delete subPanel.datasource.type;
      }
    } else if (panel.type !== 'row') {
      delete panel.datasource.uid;
      delete panel.datasource.type;
    }
  }
  return { dashboard, overwrite: true };
}

module.exports = function GetDashboards() {
  const setupDashboards = {};

  const dashboardPath = __dirname;
  const dashboardFileNames = fs.readdirSync(dashboardPath).filter((d) => d.endsWith('.json'));
  dashboardFileNames.forEach((name) => {
    try {
      const filePath = join(dashboardPath, `${name}`);
      const rawDashboardText = fs.readFileSync(filePath);
      setupDashboards[name] = transformDashboard(JSON.parse(rawDashboardText));
    } catch (error) {
      console.log(error);
    }
  });
  return setupDashboards;
};
