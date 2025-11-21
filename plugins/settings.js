const { applyFont } = require('../lib/fonts');
const config = require('../config');
const fs = require('fs');

module.exports = async (sock, sender, args, msg, { safeSendMessage, sendReaction }) => {
    try {
        await sendReaction(msg, '⚙️');
        
        const setting = args[0]?.toLowerCase();
        const value = args[1]?.toLowerCase();

        if (!setting) {
            // Show current settings
            const settingsInfo = applyFont(`*╭━━━〔 🐢 𝙱𝙾𝚃 𝚂𝙴𝚃𝚃𝙸𝙽𝙶𝚂 🐢 〕━━━┈⊷*
*┃🐢│ 𝙱𝙾𝚃 𝙽𝙰𝙼𝙴 :❯ ${config.BOT_NAME}*
*┃🐢│ 𝙿𝚁𝙴𝙵𝙸𝚇 :❯ ${config.PREFIX}*
*┃🐢│ 𝙾𝚆𝙽𝙴𝚁 :❯ ${config.BOT_OWNER.split('@')[0]}*
*┃🐢│ 𝙰𝚄𝚃𝙾𝚁𝙴𝙿𝙻𝚈 :❯ ${config.AUTO_REPLY ? '✅' : '❌'}*
*┃🐢│ 𝙰𝚄𝚃𝙾𝙱𝙸𝙾 :❯ ${config.AUTO_BIO ? '✅' : '❌'}*
*┃🐢│ 𝙰𝙽𝚃𝙸𝙳𝙴𝙻𝙴𝚃𝙴 :❯ ${config.ANTI_DELETE ? '✅' : '❌'}*
*┃🐢│ 𝚆𝙴𝙻𝙲𝙾𝙼𝙴 :❯ ${config.WELCOME_MSG ? '✅' : '❌'}*
*╰━━━━━━━━━━━━━━━┈⊷*

💡 *To change settings, contact the bot owner.*`);

            await safeSendMessage(sender, { 
                image: { url: config.BOT_IMAGES[0] },
                caption: settingsInfo
            }, { quoted: msg });
            return;
        }

        // Only owner can change settings
        if (sender !== config.BOT_OWNER) {
            await safeSendMessage(sender, { 
                text: applyFont('❌ *Only bot owner can change settings!*') 
            }, { quoted: msg });
            return;
        }

        let updated = false;
        let newValue;

        switch (setting) {
            case 'autoreply':
            case 'autobio':
            case 'antidelete':
            case 'welcome':
                newValue = value === 'on' || value === 'true';
                config[setting.toUpperCase()] = newValue;
                updated = true;
                break;

            case 'prefix':
                if (value && value.length === 1) {
                    config.PREFIX = value;
                    updated = true;
                } else {
                    await safeSendMessage(sender, { 
                        text: applyFont('❌ *Prefix must be a single character!*') 
                    }, { quoted: msg });
                    return;
                }
                break;

            case 'name':
                newValue = args.slice(1).join(' ');
                if (newValue) {
                    config.BOT_NAME = newValue;
                    updated = true;
                } else {
                    await safeSendMessage(sender, { 
                        text: applyFont('❌ *Please provide a bot name!*') 
                    }, { quoted: msg });
                    return;
                }
                break;

            default:
                await safeSendMessage(sender, { 
                    text: applyFont(`❌ *Invalid setting!*\nAvailable: autoreply, autobio, antidelete, welcome, prefix, name`) 
                }, { quoted: msg });
                return;
        }

        if (updated) {
            // Save to config file (you might want to implement proper config saving)
            await safeSendMessage(sender, { 
                text: applyFont(`✅ *Setting updated!*\n${setting}: ${newValue !== undefined ? newValue : 'updated'}`) 
            }, { quoted: msg });
        }

    } catch (error) {
        await safeSendMessage(sender, { 
            text: applyFont('❌ *Error accessing settings!*') 
        }, { quoted: msg });
    }
};