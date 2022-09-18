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
    transports: [new transports.File({ filename: "push.log" }, new transports.Console())],
})

class ManageStats {
    groupedStats
    message
    users
    constructor(statsUsers) {
        this.groupedStats = {}
        this.message = "----------------------------------------------------------------"
        this.users = statsUsers
    }

    async handleUsers() {
        for (let i = 0; i < users.length; i++) {
            try {
                const user = users[i]
                user.token = await getLoginInfo(user)
                const shouldContinue = new Date().getMinutes() % user.shards.length === 0
                if (user.type === 'mmo' && shouldContinue) continue
                for (let y = 0; y < user.shards.length; y++) {
                    const shard = user.shards[y]
                    await getStats(user, shard, message)
                }
            } catch (error) {
                logger.error(error)
            }
        }

        try {
            const unfilteredUsers = await apiFunc.getUsers();
            const users = unfilteredUsers.filter(u => u.active === 10000)
            const roomsObjects = await apiFunc.getRoomsObjects()
            const modifiedRoomsObjects = modifyRoomObjects(roomsObjects)
            const serverStats = handleServerStats(users, modifiedRoomsObjects)


            ManageStats.reportStats({ stats: groupedStats, serverStats })
            message+=Object.keys(groupedStats) > 0 ? 'Pushed stats AND serverStats to graphite\r\n' : 'Pushed serverStats to graphite\r\n';
        } catch (e) {
            if (Object.keys(groupedStats).length > 0) {
                ManageStats.reportStats({ stats: groupedStats })
                message+='Pushed stats to graphite\r\n'
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
        if (stats) await processStats(userinfo, shard, stats)
    }

    async processStats(userinfo, shard, stats) {
        const me = await apiFunc.getUserinfo(userinfo)
        if (!me.error) stats.power = me.power || 0
        stats.leaderboard = await addLeaderboardData(userinfo)
        pushStats(userinfo, stats, shard)
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
        groupedStats[userinfo.username] = userinfo.type === 'mmo' ? { [shard]: stats } : { shard: stats }
        message += `${userinfo.type}: Added stats object for ${userinfo.username} in ${shard}\r\n`
    }
}

const groupedUsers = statsUsers.reduce((group, user) => {
    const { type } = user;
    group[type] = group[type] ?? [];
    group[type].push(user);
    return group;
  }, {});


cron.schedule('*/15 * * * * *', async () => {
    new ManageStats(groupedUsers.private).handleUsers()
})
cron.schedule('* * * * *', async () => {
    new ManageStats(groupedUsers.mmo).handleUsers()
})

