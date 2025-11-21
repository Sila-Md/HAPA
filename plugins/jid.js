const { applyFont } = require('../lib/fonts');

module.exports = async (sock, sender, args, msg, { safeSendMessage, sendReaction }) => {
    const jidInfo = applyFont(`*╭━━━〔 🐢 𝙹𝙸𝙳 𝙸𝙽𝙵𝙾 🐢 〕━━━┈⊷*
*┃🐢│ 𝚈𝙾𝚄𝚁 𝙹𝙸𝙳 :❯ ${sender}*
*┃🐢│ 𝚄𝚂𝙴𝚁 :❯ ${sender.split('@')[0]}*
*┃🐢│ 𝚃𝙸𝙼𝙴 :❯ ${new Date().toLocaleString()}*
*╰━━━━━━━━━━━━━━━┈⊷*

💡 *Use this JID for bot configuration*`);
    
    await safeSendMessage(sender, { text: jidInfo });
    await sendReaction(msg, '🔍');
};