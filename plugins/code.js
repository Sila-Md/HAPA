const config = require('../config');
const { applyFont } = require('../lib/fonts');

module.exports = async (sock, sender, args, msg, { safeSendMessage, sendReaction }) => {
    try {
        await sendReaction(msg, '🔗');
        
        const pairingCode = await sock.requestPairingCode(sender.replace('@s.whatsapp.net', ''));
        const formattedCode = pairingCode.match(/.{1,4}/g)?.join('-') || pairingCode;

        const codeMessage = applyFont(`*╭━━━〔 🐢 𝙿𝙰𝙸𝚁𝙸𝙽𝙶 𝙲𝙾𝙳𝙴 🐢 〕━━━┈⊷*
*┃🐢│ 𝚈𝙾𝚄𝚁 𝙲𝙾𝙳𝙴 :❯*
*┃🐢│*
*┃🐢│ ${formattedCode}*
*┃🐢│*
*┃🐢│ 𝙴𝚇𝙿𝙸𝚁𝙴𝚂 :❯ 𝟺𝟻 𝚂𝙴𝙲𝙾𝙽𝙳𝚂*
*╰━━━━━━━━━━━━━━━┈⊷*

📱 *How to connect:*
1️⃣ Click on three dots (⋮)
2️⃣ Tap *Linked Devices*
3️⃣ Select *Link with phone number*
4️⃣ Enter the code above

💡 *Note: Use a secondary account*`);

        await safeSendMessage(sender, { text: codeMessage }, { quoted: msg });
        
        // Auto delete after 45 seconds
        setTimeout(async () => {
            try {
                await safeSendMessage(sender, { 
                    text: applyFont('⏰ *Pairing code has expired!*\nUse .code to generate a new one.') 
                });
            } catch (error) {
                // Silent fail
            }
        }, 45000);

    } catch (error) {
        await safeSendMessage(sender, { 
            text: applyFont('❌ *Error generating pairing code!*\nPlease try again later.') 
        }, { quoted: msg });
    }
};