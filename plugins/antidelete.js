const { applyFont } = require('../lib/fonts');
const config = require('../config');

module.exports = async (sock, sender, args, msg, { safeSendMessage, sendReaction }) => {
    try {
        await sendReaction(msg, '🚫');
        
        const action = args[0]?.toLowerCase();

        if (!action) {
            // Show current status
            const status = config.ANTI_DELETE ? '✅ 𝙴𝙽𝙰𝙱𝙻𝙴𝙳' : '❌ 𝙳𝙸𝚂𝙰𝙱𝙻𝙴𝙳';
            
            await safeSendMessage(sender, { 
                text: applyFont(`*╭━━━〔 🐢 𝙰𝙽𝚃𝙸-𝙳𝙴𝙻𝙴𝚃𝙴 🐢 〕━━━┈⊷*
*┃🐢│ 𝚂𝚃𝙰𝚃𝚄𝚂 :❯ ${status}*
*┃🐢│ 𝙵𝙴𝙰𝚃𝚄𝚁𝙴 :❯ 𝙳𝙴𝚃𝙴𝙲𝚃𝚂 𝙳𝙴𝙻𝙴𝚃𝙴𝙳 𝙼𝙴𝚂𝚂𝙰𝙶𝙴𝚂*
*╰━━━━━━━━━━━━━━━┈⊷*

💡 *Usage:*
.antidelete on - Enable anti-delete
.antidelete off - Disable anti-delete

🔧 *What it does:*
• Detects when someone deletes messages
• Shows what was deleted
• Works in groups and private chats
• Captures text, images, videos, audio`) 
            }, { quoted: msg });
            return;
        }

        // Only owner can change anti-delete settings
        if (sender !== config.BOT_OWNER) {
            await safeSendMessage(sender, { 
                text: applyFont('❌ *Only bot owner can change anti-delete settings!*') 
            }, { quoted: msg });
            return;
        }

        switch (action) {
            case 'on':
            case 'enable':
                config.ANTI_DELETE = true;
                await safeSendMessage(sender, { 
                    text: applyFont('✅ *Anti-delete enabled!*\nI will now detect deleted messages.') 
                }, { quoted: msg });
                break;

            case 'off':
            case 'disable':
                config.ANTI_DELETE = false;
                await safeSendMessage(sender, { 
                    text: applyFont('❌ *Anti-delete disabled!*\nDeleted messages will not be detected.') 
                }, { quoted: msg });
                break;

            case 'test':
                // Test anti-delete feature
                const testMsg = applyFont(`*╭━━━〔 🐢 𝙰𝙽𝚃𝙸-𝙳𝙴𝙻𝙴𝚃𝙴 𝚃𝙴𝚂𝚃 🐢 〕━━━┈⊷*
*┃🐢│ 𝚂𝚃𝙰𝚃𝚄𝚂 :❯ 𝚃𝙴𝚂𝚃𝙸𝙽𝙶 𝙵𝙴𝙰𝚃𝚄𝚁𝙴*
*┃🐢│ 𝚁𝙴𝚂𝚄𝙻𝚃 :❯ 𝚆𝙾𝚁𝙺𝙸𝙽𝙶 ✅*
*╰━━━━━━━━━━━━━━━┈⊷*

🔧 *Anti-delete is active and monitoring!*
👀 *Try deleting a message to test it.*`);

                // Send test message
                await safeSendMessage(sender, { text: testMsg }, { quoted: msg });
                
                // Don't auto-delete the test message - let user test manually
                await safeSendMessage(sender, { 
                    text: applyFont('💡 *Now try deleting any message to see if anti-delete works!*') 
                });
                break;

            default:
                await safeSendMessage(sender, { 
                    text: applyFont('❌ *Invalid action!*\nUse: on, off, or test') 
                }, { quoted: msg });
        }

    } catch (error) {
        console.error('Antidelete command error:', error);
        await safeSendMessage(sender, { 
            text: applyFont('❌ *Error configuring anti-delete!*') 
        }, { quoted: msg });
    }
};