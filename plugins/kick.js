const { applyFont } = require('../lib/fonts');

module.exports = async (sock, sender, args, msg, { safeSendMessage, sendReaction }) => {
    try {
        await sendReaction(msg, '👢');
        
        if (!msg.quoted && !msg.mentionedJid) {
            await safeSendMessage(sender, { 
                text: applyFont(`💡 *How to use kick command:*
                
1. *Kick mentioned user:*
   .kick @user

2. *Kick quoted message sender:*
   Reply to a message with .kick

3. *Kick with reason:*
   .kick @user Spamming`) 
            }, { quoted: msg });
            return;
        }

        let usersToKick = [];
        let reason = args.join(' ') || 'No reason provided';

        if (msg.quoted) {
            usersToKick = [msg.quoted.sender];
        } else if (msg.mentionedJid) {
            usersToKick = msg.mentionedJid;
        }

        // Remove bot from kick list
        usersToKick = usersToKick.filter(jid => !jid.includes(sock.user.id));

        if (usersToKick.length === 0) {
            await safeSendMessage(sender, { 
                text: applyFont('❌ *No valid users to kick!*') 
            }, { quoted: msg });
            return;
        }

        let successCount = 0;
        let failCount = 0;

        for (const userJid of usersToKick) {
            try {
                await sock.groupParticipantsUpdate(sender, [userJid], 'remove');
                successCount++;
                
                // Send kick notification
                const kickMsg = applyFont(`*╭━━━〔 🐢 𝙺𝙸𝙲𝙺𝙴𝙳 🐢 〕━━━┈⊷*
*┃🐢│ 𝚄𝚂𝙴𝚁 :❯ @${userJid.split('@')[0]}*
*┃🐢│ 𝚁𝙴𝙰𝚂𝙾𝙽 :❯ ${reason}*
*┃🐢│ 𝙱𝚈 :❯ @${msg.key.participant?.split('@')[0] || 'Admin'}*
*╰━━━━━━━━━━━━━━━┈⊷*`);
                
                await safeSendMessage(sender, {
                    text: kickMsg,
                    mentions: [userJid, msg.key.participant || sender]
                });
                
            } catch (error) {
                failCount++;
                console.log(`Failed to kick ${userJid}:`, error.message);
            }
        }

        const resultMsg = applyFont(`*╭━━━〔 🐢 𝙺𝙸𝙲𝙺 𝚁𝙴𝚂𝚄𝙻𝚃 🐢 〕━━━┈⊷*
*┃🐢│ 𝚂𝚄𝙲𝙲𝙴𝚂𝚂 :❯ ${successCount} 𝚄𝚂𝙴𝚁𝚂*
*┃🐢│ 𝙵𝙰𝙸𝙻𝙴𝙳 :❯ ${failCount} 𝚄𝚂𝙴𝚁𝚂*
*┃🐢│ 𝚁𝙴𝙰𝚂𝙾𝙽 :❯ ${reason}*
*╰━━━━━━━━━━━━━━━┈⊷*`);

        await safeSendMessage(sender, { text: resultMsg }, { quoted: msg });

    } catch (error) {
        await safeSendMessage(sender, { 
            text: applyFont('❌ *Error kicking users!*\nMake sure I am admin and have permission.') 
        }, { quoted: msg });
    }
};