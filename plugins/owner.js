const { applyFont } = require('../lib/fonts');
const config = require('../config');

module.exports = async (sock, sender, args, msg, { safeSendMessage, sendReaction }) => {
    try {
        await sendReaction(msg, '👑');
        
        const ownerInfo = applyFont(`*╭━━━〔 🐢 𝙱𝙾𝚃 𝙾𝚆𝙽𝙴𝚁 🐢 〕━━━┈⊷*
*┃🐢│ 𝙽𝙰𝙼𝙴 :❯ 𝚂𝚒𝚛 𝚂𝚒𝚕𝚊*
*┃🐢│ 𝙿𝙷𝙾𝙽𝙴 :❯ +255612491554*
*┃🐢│ 𝙱𝙾𝚃 :❯ ${config.BOT_NAME}*
*┃🐢│ 𝙴𝙼𝙰𝙸𝙻 :❯ silatrix22@email.com*
*╰━━━━━━━━━━━━━━━┈⊷*

💬 *For any issues or inquiries, feel free to contact me!*
🔧 *I'm always here to help and improve the bot.*`);

        // Send contact card
        const vcard = `BEGIN:VCARD
VERSION:3.0
FN:Sir Sila
ORG:Sila MD Developer;
TEL;type=CELL;type=VOICE;waid=255612491554:+255612491554
EMAIL:silatrix22@email.com
END:VCARD`;

        await safeSendMessage(sender, {
            contacts: {
                displayName: 'SILA MD OWNER',
                contacts: [{ vcard }]
            }
        }, { quoted: msg });

        await safeSendMessage(sender, { 
            image: { url: config.BOT_IMAGES[0] },
            caption: ownerInfo
        }, { quoted: msg });

    } catch (error) {
        await safeSendMessage(sender, { 
            text: applyFont('❌ *Error fetching owner information!*') 
        }, { quoted: msg });
    }
};