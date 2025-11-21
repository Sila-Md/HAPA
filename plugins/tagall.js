const { applyFont } = require('../lib/fonts');

module.exports = async (sock, sender, args, msg, { safeSendMessage, sendReaction, config }) => {
    try {
        await sendReaction(msg, '📢');
        
        const groupMetadata = await sock.groupMetadata(sender);
        const participants = groupMetadata.participants;
        
        if (!participants || participants.length === 0) {
            await safeSendMessage(sender, { 
                text: applyFont('❌ *No participants found in this group!*') 
            }, { quoted: msg });
            return;
        }

        let messageText = applyFont(`*╭━━━〔 🐢 𝚃𝙰𝙶 𝙰𝙻𝙻 🐢 〕━━━┈⊷*
*┃🐢│ 𝙶𝚁𝙾𝚄𝙿 :❯ ${groupMetadata.subject}*
*┃🐢│ 𝙼𝙴𝙼𝙱𝙴𝚁𝚂 :❯ ${participants.length}*
*┃🐢│ 𝚃𝙰𝙶𝙶𝙴𝙳 :❯ 𝙰𝙻𝙻 𝙼𝙴𝙼𝙱𝙴𝚁𝚂*
*╰━━━━━━━━━━━━━━━┈⊷*

🔊 *𝙷𝙴𝙻𝙻𝙾 𝙴𝚅𝙴𝚁𝚈𝙾𝙽𝙴!* 🔊\n\n`);

        participants.forEach((participant, index) => {
            const number = participant.id.split('@')[0];
            messageText += `👤 @${number}\n`;
        });

        messageText += applyFont('\n*╰━━━━━━━━━━━━━━━┈⊷*\n🐢 *Powered by Sila MD*');

        await safeSendMessage(sender, {
            text: messageText,
            mentions: participants.map(p => p.id)
        }, { quoted: msg });

    } catch (error) {
        await safeSendMessage(sender, { 
            text: applyFont('❌ *Error tagging members!*\nMake sure I am admin in this group.') 
        }, { quoted: msg });
    }
};