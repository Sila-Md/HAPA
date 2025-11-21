const config = require('../config');
const { applyFont } = require('../lib/fonts');

module.exports = async (sock, sender, args, msg, { safeSendMessage, sendReaction }) => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    const aliveMsg = applyFont(`*╭━━━〔 🐢 𝚂𝙸𝙻𝙰 𝙼𝙳 🐢 〕━━━┈⊷*
*┃🐢│ 𝙱𝙾𝚃 𝚂𝚃𝙰𝚃𝚄𝚂 :❯ 𝙰𝙻𝙸𝚅𝙴 & 𝚁𝚄𝙽𝙽𝙸𝙽𝙶*
*┃🐢│ 𝚄𝙿𝚃𝙸𝙼𝙴 :❯ ${hours}h ${minutes}m ${seconds}s*
*┃🐢│ 𝙿𝙻𝙰𝚃𝙵𝙾𝚁𝙼 :❯ ${process.platform}*
*┃🐢│ 𝙼𝙴𝙼𝙾𝚁𝚈 :❯ ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB*
*╰━━━━━━━━━━━━━━━┈⊷*

💫 *All Systems Operational!*
🐢 *Powered by Sila Technology*`);
    
    // Use random bot image
    const randomImage = config.BOT_IMAGES[Math.floor(Math.random() * config.BOT_IMAGES.length)];
    
    await safeSendMessage(sender, { 
        image: { url: randomImage },
        caption: aliveMsg
    });
    await sendReaction(msg, '💚');
};