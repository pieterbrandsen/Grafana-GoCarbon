import cron from 'node-cron';
import graphite from 'graphite';
import { createLogger, format, transports } from 'winston';
import ApiFunc from './apiFunctions.js';
import users from './users.js';
import * as dotenv from 'dotenv';
dotenv.config();
if (process.env.DISABLE_PUSHGATEWAY === 'true') {
  console.log("Pushgateway disabled");
  process.exit(0);
};
console.log("Pushgateway enabled");

const client = graphite.createClient('plaintext://relay:2003/');
const { combine, timestamp, prettyPrint } = format;
const logger = createLogger({
  format: combine(
    timestamp(),
    prettyPrint(),
  ),
  transports: [new transports.File({ filename: 'logs/push.log' })],
});

const cronLogger = createLogger({
  format: combine(
    timestamp(),
    prettyPrint(),
  ),
  transports: [new transports.File({ filename: 'logs/cron.log' })],
});

class ManageStats {
  groupedStats;

  message;

  constructor() {
    this.groupedStats = {};
    this.message = '----------------------------------------------------------------\r\n';
  }

  async handleUsers(type) {
    const getStatsFunctions = [];
    users.forEach((user) => {
      try {
        const shouldContinue = new Date().getMinutes() % user.shards.length !== 0;
        if (user.type === 'mmo' && shouldContinue) return;
        for (let y = 0; y < user.shards.length; y += 1) {
          const shard = user.shards[y];
          getStatsFunctions.push(this.getStats(user, shard, this.message));
        }
      } catch (error) {
        logger.error(error.message);
      }
    });
    await Promise.all(getStatsFunctions);

    const { groupedStats } = this;

    if (type === 'mmo') {
      if (Object.keys(groupedStats).length > 0) {
        ManageStats.reportStats({ stats: groupedStats });
        this.message += `Pushed ${type} stats to graphite`;
        console.log(this.message);
        logger.info(this.message);
      }
      return;
    }

    const privateUser = users.find((user) => user.type === 'private' && user.host);
    const host = privateUser ? privateUser.host : undefined;
    const serverStats = await ApiFunc.getServerStats(host);
    let adminUtilsServerStats = await ApiFunc.getAdminUtilsServerStats(host);
    if (adminUtilsServerStats) {
      try {
        const groupedAdminStatsUsers = {};
        adminUtilsServerStats.users.forEach(user => {
          groupedAdminStatsUsers[user.username] = user;
        })
        adminUtilsServerStats.users = groupedAdminStatsUsers;
      } catch (error) {
      }
    }

    ManageStats.reportStats({ stats: groupedStats, serverStats, adminUtilsServerStats });
    let statsPushed = "";
    if (Object.keys(groupedStats).length > 0) {
      statsPushed = `Pushed ${type} stats`;
    }
    if (serverStats) {
      statsPushed += statsPushed.length > 0 ? `, server stats` : "Pushed server stats";
    }
    if (adminUtilsServerStats) {
      statsPushed += statsPushed.length > 0 ? `, adminUtilsServerStats` : "Pushed server stats";
    }
    this.message += statsPushed.length > 0 ? `> ${statsPushed} to graphite` : '> Pushed no stats to graphite';
    logger.info(this.message);
    console.log(this.message);
  }

  static async getLoginInfo(userinfo) {
    if (userinfo.type !== 'mmo') {
      userinfo.token = await ApiFunc.getPrivateServerToken(userinfo);
    }
    return userinfo.token;
  }

  static async addLeaderboardData(userinfo) {
    try {
      const leaderboard = await ApiFunc.getLeaderboard(userinfo);
      if (!leaderboard) return { rank: 0, score: 0 };
      const leaderboardList = leaderboard.list;
      if (leaderboardList.length === 0) return { rank: 0, score: 0 };
      const { rank, score } = leaderboardList.slice(-1)[0];
      return { rank, score };
    } catch (error) {
      return { rank: 0, score: 0 };
    }
  }

  async getStats(userinfo, shard) {
    try {
      await ManageStats.getLoginInfo(userinfo);
      const stats = userinfo.segment === undefined ? await ApiFunc.getMemory(userinfo, shard) : await ApiFunc.getSegmentMemory(userinfo, shard);
      await this.processStats(userinfo, shard, stats);
      return 'success';
    } catch (error) {
      return error;
    }
  }

  async processStats(userinfo, shard, stats) {
    if (Object.keys(stats).length === 0) return;
    const me = await ApiFunc.getUserinfo(userinfo);
    if (me) stats.power = me.power || 0;
    stats.leaderboard = await ManageStats.addLeaderboardData(userinfo);
    this.pushStats(userinfo, stats, shard);
  }

  static reportStats(stats) {
    try {
      client.write(stats, {}, (err) => {
        if (err) logger.error(err);
      });
      return true;
    } catch (error) {
      return error;
    }
  }

  pushStats(userinfo, stats, shard) {
    if (Object.keys(stats).length === 0) return;
    this.groupedStats[userinfo.username] = userinfo.type === 'mmo' ? { [shard]: stats } : { shard: stats };
    this.message += `${userinfo.type}: Added stats object for ${userinfo.username} in ${shard}\r\n`;
  }
}

const groupedUsers = users.reduce((group, user) => {
  const { type } = user;
  // eslint-disable-next-line no-param-reassign
  group[type] = group[type] ?? [];
  group[type].push(user);
  return group;
}, {});

cron.schedule('* * * * *', async () => {
  const message = 'Cron event hit: ' + new Date();
  console.log("\r\n" + message);
  cronLogger.info(message);
  Object.keys(groupedUsers).forEach((type) => {
    new ManageStats(groupedUsers[type]).handleUsers(type);
  })
});
