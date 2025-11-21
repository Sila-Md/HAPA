const { applyFont } = require('../lib/fonts');

module.exports = async (sock, sender, args, msg, { safeSendMessage, sendReaction }) => {
    try {
        await sendReaction(msg, '🏷️');
        
        if (!msg.quoted && args.length === 0) {
            await safeSendMessage(sender, { 
                text: applyFont(`💡 *How to use tag command:*
                
1. *Tag specific user:*
   .tag @user

2. *Tag quoted message sender:*
   Reply to a message with .tag

3. *Tag with custom message:*
   .tag @user Hello!`) 
            }, { quoted: msg });
            return;
        }

        let mentionedJid = [];
        let tagMessage = args.join(' ') || 'You have been tagged!';

        if (msg.quoted) {
            // Tag quoted message sender
            mentionedJid = [msg.quoted.sender];
            const quotedNumber = msg.quoted.sender.split('@')[0];
            tagMessage = applyFont(`👤 *@${quotedNumber}* - ${tagMessage}`);
        } else if (msg.mentionedJid && msg.mentionedJid.length > 0) {
            // Tag mentioned users
            mentionedJid = msg.mentionedJid;
            tagMessage = applyFont(`🔔 *Tag Notification:*\n\n${tagMessage}`);
        } else {
            // Tag sender
            mentionedJid = [sender];
            const senderNumber = sender.split('@')[0];
            tagMessage = applyFont(`👤 *@${senderNumber}* - ${tagMessage}`);
        }

        const finalMessage = applyFont(`*╭━━━〔 🐢 𝚃𝙰𝙶 🐢 〕━━━┈⊷*
*┃🐢│ 𝚃𝙰𝙶𝙶𝙸𝙽𝙶 :❯ ${mentionedJid.length} 𝚄𝚂𝙴𝚁𝚂*
*╰━━━━━━━━━━━━━━━┈⊷*

${tagMessage}`);

        await safeSendMessage(sender, {
            text: finalMessage,
            mentions: mentionedJid
        }, { quoted: msg });

    } catch (error) {
        await safeSendMessage(sender, { 
            text: applyFont('❌ *Error tagging users!*') 
        }, { quoted: msg });
    }
};