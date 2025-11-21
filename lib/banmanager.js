const fs = require('fs');
const path = require('path');

// Ban data storage
const banFile = path.join(__dirname, '../data/bans.json');
const dataDir = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize ban file
if (!fs.existsSync(banFile)) {
    fs.writeFileSync(banFile, JSON.stringify({ bannedUsers: [], banReasons: {} }, null, 2));
}

const BanManager = {
    // Read ban data
    readBanData() {
        try {
            return JSON.parse(fs.readFileSync(banFile, 'utf8'));
        } catch (error) {
            return { bannedUsers: [], banReasons: {} };
        }
    },

    // Write ban data
    writeBanData(data) {
        try {
            fs.writeFileSync(banFile, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            return false;
        }
    },

    // Ban a user
    banUser(userJid, reason = 'No reason provided', bannedBy) {
        const data = this.readBanData();
        
        if (!data.bannedUsers.includes(userJid)) {
            data.bannedUsers.push(userJid);
            data.banReasons[userJid] = {
                reason: reason,
                bannedBy: bannedBy,
                bannedAt: new Date().toISOString(),
                expiresAt: null // Permanent ban
            };
            
            return this.writeBanData(data);
        }
        return false;
    },

    // Temporary ban
    tempBanUser(userJid, durationHours, reason = 'No reason provided', bannedBy) {
        const data = this.readBanData();
        
        if (!data.bannedUsers.includes(userJid)) {
            data.bannedUsers.push(userJid);
            data.banReasons[userJid] = {
                reason: reason,
                bannedBy: bannedBy,
                bannedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + (durationHours * 60 * 60 * 1000)).toISOString()
            };
            
            return this.writeBanData(data);
        }
        return false;
    },

    // Unban user
    unbanUser(userJid) {
        const data = this.readBanData();
        const index = data.bannedUsers.indexOf(userJid);
        
        if (index > -1) {
            data.bannedUsers.splice(index, 1);
            delete data.banReasons[userJid];
            return this.writeBanData(data);
        }
        return false;
    },

    // Check if user is banned
    isBanned(userJid) {
        const data = this.readBanData();
        
        if (data.bannedUsers.includes(userJid)) {
            const banInfo = data.banReasons[userJid];
            
            // Check if temporary ban has expired
            if (banInfo.expiresAt && new Date(banInfo.expiresAt) < new Date()) {
                this.unbanUser(userJid);
                return false;
            }
            
            return banInfo;
        }
        return false;
    },

    // Get all banned users
    getBannedUsers() {
        const data = this.readBanData();
        return data.bannedUsers.map(jid => ({
            jid: jid,
            ...data.banReasons[jid]
        }));
    },

    // Clean expired bans
    cleanExpiredBans() {
        const data = this.readBanData();
        let cleaned = false;
        
        for (let i = data.bannedUsers.length - 1; i >= 0; i--) {
            const jid = data.bannedUsers[i];
            const banInfo = data.banReasons[jid];
            
            if (banInfo.expiresAt && new Date(banInfo.expiresAt) < new Date()) {
                data.bannedUsers.splice(i, 1);
                delete data.banReasons[jid];
                cleaned = true;
            }
        }
        
        if (cleaned) {
            this.writeBanData(data);
        }
        
        return cleaned;
    }
};

// Auto-clean expired bans every hour
setInterval(() => {
    BanManager.cleanExpiredBans();
}, 60 * 60 * 1000);

module.exports = BanManager;