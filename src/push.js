import cron from 'node-cron';
import graphite from 'graphite';
import { createLogger, format, transports } from 'winston';
import ApiFunc from './apiFunctions.js';
import users from './users.js';
import modifyRoomObjects from './modifyRoomObjects.js';
import handleServerStats from './handleServerStats.js';

const client = graphite.createClient('plaintext://relay:2003/');

const { combine, timestamp, prettyPrint } = format;

const logger = createLogger({
  format: combine(
    timestamp(),
    prettyPrint(),
  ),
  transports: [new transports.File({ filename: 'push.log' })],
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
    try {
      const unfilteredUsers = await ApiFunc.getUsers();
      const unfilteredActiveUsers = unfilteredUsers.filter((u) => u.active === 10000);
      const roomsObjects = await ApiFunc.getRoomsObjects();
      const modifiedRoomsObjects = modifyRoomObjects(roomsObjects);
      const serverStats = handleServerStats(unfilteredActiveUsers, modifiedRoomsObjects);

      ManageStats.reportStats({ stats: groupedStats, serverStats });
      this.message += Object.keys(groupedStats) > 0 ? 'Pushed private stats AND serverStats to graphite' : 'Pushed serverStats to graphite';
      logger.info(this.message);
      console.log(this.message);
    } catch (e) {
      if (Object.keys(groupedStats).length > 0) {
        ManageStats.reportStats({ stats: groupedStats });
        this.message += `Pushed ${type} stats to graphite`;
        logger.info(this.message);
        console.log(this.message);
      }
    }
  }

  static async getLoginInfo(userinfo) {
    if (userinfo.type !== 'mmo') {
      userinfo.token = await ApiFunc.getPrivateServerToken(userinfo.username, userinfo.password);
    }
    return userinfo.token;
  }

  static async addLeaderboardData(userinfo) {
    const leaderboard = await ApiFunc.getLeaderboard(userinfo);
    if (!leaderboard) return { rank: 0, score: 0 };
    const leaderboardList = leaderboard.list;
    if (leaderboardList.length === 0) return { rank: 0, score: 0 };
    const { rank, score } = leaderboardList.slice(-1)[0];
    return { rank, score };
  }

  async getStats(userinfo, shard) {
    try {
      await ManageStats.getLoginInfo(userinfo);
      const stats = await ApiFunc.getMemory(userinfo, shard);
      await this.processStats(userinfo, shard, stats);
      return 'success';
    } catch (error) {
      return error;
    }
  }

  async processStats(userinfo, shard, stats) {
    const me = await ApiFunc.getUserinfo(userinfo);
    if (!me || me.error) stats.power = me.power || 0;
    stats.leaderboard = await ManageStats.addLeaderboardData(userinfo);
    this.pushStats(userinfo, stats, shard);
  }

  static reportStats(stats) {
    try {
      client.write(stats, (err) => {
        if (err) logger.error(err);
      });
      return true;
    } catch (error) {
      return error;
    }
  }

  pushStats(userinfo, stats, shard) {
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

cron.schedule('*/30 * * * * *', async () => {
  console.log('\r\nCron event hit: ', new Date());
  if (groupedUsers.private) new ManageStats(groupedUsers.private).handleUsers('private');
  if (groupedUsers.mmo) new ManageStats(groupedUsers.mmo).handleUsers('mmo');
});
