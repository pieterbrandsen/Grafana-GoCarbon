const apiFunc = require('./apiFunctions.js')
const cron = require('node-cron')
require('dotenv').config({ path: `.env.grafana` })
const statsUsers = require('./users.js').users
const modifyRoomObjects = require('./modifyRoomObjects.js')
const handleServerStats = require('./handleServerStats.js')
var graphite = require('graphite')
var client = graphite.createClient('plaintext://relay:2003/')

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, prettyPrint } = format;

const logger = createLogger({
    format: combine(
        timestamp(),
        prettyPrint()
    ),
    transports: [new transports.File({ filename: "push.log" })],
})

class ManageStats {
    groupedStats
    message
    users
    constructor(statsUsers) {
        this.groupedStats = {}
        this.message = "----------------------------------------------------------------\r\n"
        this.users = statsUsers
    }

    async handleUsers(type) {
        for (let i = 0; i < this.users.length; i++) {
            try {
                const user = this.users[i]
                user.token = await this.getLoginInfo(user)
                const shouldContinue = new Date().getMinutes() % user.shards.length !== 0
                if (user.token && user.type === 'mmo' && shouldContinue) continue
                for (let y = 0; y < user.shards.length; y++) {
                    const shard = user.shards[y]
                    await this.getStats(user, shard, this.message)
                }
            } catch (error) {
                logger.error(error.message)
            }
        }
        const groupedStats = this.groupedStats
        
        if (type === "mmo") {
            if (Object.keys(groupedStats).length > 0) {
                ManageStats.reportStats({ stats: groupedStats })
                this.message+=`Pushed ${type} stats to graphite`
                console.log(this.message)
                logger.info(this.message)
            }
            return;
        }
        try {
            const unfilteredUsers = await apiFunc.getUsers();
            const users = unfilteredUsers.filter(u => u.active === 10000)
            const roomsObjects = await apiFunc.getRoomsObjects()
            const modifiedRoomsObjects = modifyRoomObjects(roomsObjects)
            const serverStats = handleServerStats(users, modifiedRoomsObjects)


            ManageStats.reportStats({ stats: groupedStats, serverStats })
            this.message+=Object.keys(groupedStats) > 0 ? 'Pushed private stats AND serverStats to graphite' : 'Pushed serverStats to graphite';
            logger.info(this.message)
            console.log(this.message)
        } catch (e) {
            if (Object.keys(groupedStats).length > 0) {
                ManageStats.reportStats({ stats: groupedStats })
                this.message+=`Pushed ${type} stats to graphite`
                logger.info(this.message)
                console.log(this.message)
            }
        }
    }

    async getLoginInfo(userinfo) {
        return userinfo.type === 'mmo'
            ? userinfo.token
            : await apiFunc.getPrivateServerToken(userinfo.username, userinfo.password)
    }

    async addLeaderboardData(userinfo) {
        const leaderboard = await apiFunc.getLeaderboard(userinfo)
        if (!leaderboard) return { rank: 0, score: 0 }
        const leaderboardList = leaderboard.list
        if (leaderboardList.length === 0) return { rank: 0, score: 0 }
        const { rank, score } = leaderboardList.slice(-1)[0]
        return { rank, score }
    }

    async getStats(userinfo, shard) {
        const stats = await apiFunc.getMemory(userinfo, shard)
        if (stats) await this.processStats(userinfo, shard, stats)
    }

    async processStats(userinfo, shard, stats) {
        const me = await apiFunc.getUserinfo(userinfo)
        if (!me.error) stats.power = me.power || 0
        stats.leaderboard = await this.addLeaderboardData(userinfo)
        this.pushStats(userinfo, stats, shard)
    }

    static reportStats(stats) {
        try {
            client.write(stats, function (err) {
                if (err) logger.error(err)
            })
        } catch (error) {
        }
    }

    pushStats(userinfo, stats, shard) {
        this.groupedStats[userinfo.username] = userinfo.type === 'mmo' ? { [shard]: stats } : { shard: stats }
        this.message += `${userinfo.type}: Added stats object for ${userinfo.username} in ${shard}\r\n`
    }
}

const groupedUsers = statsUsers.reduce((group, user) => {
    const { type } = user;
    group[type] = group[type] ?? [];
    group[type].push(user);
    return group;
  }, {});


cron.schedule('* * * * *', async () => {
    console.log("\r\nCron event hit: ", new Date())
    if (groupedUsers.private) new ManageStats(groupedUsers.private).handleUsers("private")
    if (groupedUsers.mmo) new ManageStats(groupedUsers.mmo).handleUsers("mmo")
})
