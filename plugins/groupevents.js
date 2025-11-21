const { isJidGroup } = require('@whiskeysockets/baileys');
const { applyFont } = require('../lib/fonts');
const config = require('../config');

const getContextInfo = (m) => {
    return {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
    };
};

module.exports = async (conn, update) => {
    try {
        const isGroup = isJidGroup(update.id);
        if (!isGroup || !config.WELCOME_MSG) return;

        const metadata = await conn.groupMetadata(update.id);
        const participants = update.participants;
        const groupName = metadata.subject;

        for (const num of participants) {
            const userName = num.split("@")[0];
            const timestamp = new Date().toLocaleString();

            if (update.action === "add") {
                const welcomeMsg = applyFont(`*╭━━━〔 🐢 𝚆𝙴𝙻𝙲𝙾𝙼𝙴 🐢 〕━━━┈⊷*
*┃🐢│ 𝚄𝚂𝙴𝚁 :❯ @${userName}*
*┃🐢│ 𝙶𝚁𝙾𝚄𝙿 :❯ ${groupName}*
*┃🐢│ 𝙼𝙴𝙼𝙱𝙴𝚁𝚂 :❯ ${metadata.participants.length}*
*┃🐢│ 𝚃𝙸𝙼𝙴 :❯ ${timestamp}*
*╰━━━━━━━━━━━━━━━┈⊷*

🎉 *Welcome to the group!*
📖 *Please read group rules*
🐢 *Enjoy your stay!*`);

                await conn.sendMessage(update.id, {
                    image: { url: config.BOT_IMAGES[0] },
                    caption: welcomeMsg,
                    mentions: [num],
                    contextInfo: getContextInfo({ sender: num }),
                });

            } else if (update.action === "remove") {
                const goodbyeMsg = applyFont(`*╭━━━〔 🐢 𝙶𝙾𝙾𝙳𝙱𝚈𝙴 🐢 〕━━━┈⊷*
*┃🐢│ 𝚄𝚂𝙴𝚁 :❯ @${userName}*
*┃🐢│ 𝙶𝚁𝙾𝚄𝙿 :❯ ${groupName}*
*┃🐢│ 𝚃𝙸𝙼𝙴 :❯ ${timestamp}*
*┃🐢│ 𝙼𝙴𝙼𝙱𝙴𝚁𝚂 :❯ ${metadata.participants.length}*
*╰━━━━━━━━━━━━━━━┈⊷*

👋 *Goodbye! We'll miss you!*`);

                await conn.sendMessage(update.id, {
                    image: { url: config.BOT_IMAGES[1] },
                    caption: goodbyeMsg,
                    mentions: [num],
                    contextInfo: getContextInfo({ sender: num }),
                });
            }
        }
    } catch (err) {
        console.error('Group event error:', err);
    }
};