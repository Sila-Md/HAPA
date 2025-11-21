const { applyFont } = require('../lib/fonts');
const fs = require('fs');
const path = require('path');

// Store antilink settings
const antilinkFile = path.join(__dirname, '../data/antilink.json');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize antilink file
if (!fs.existsSync(antilinkFile)) {
    fs.writeFileSync(antilinkFile, '{}');
}

const readAntilinkData = () => {
    try {
        return JSON.parse(fs.readFileSync(antilinkFile, 'utf8'));
    } catch {
        return {};
    }
};

const writeAntilinkData = (data) => {
    try {
        fs.writeFileSync(antilinkFile, JSON.stringify(data, null, 2));
        return true;
    } catch {
        return false;
    }
};

module.exports = async (sock, sender, args, msg, { safeSendMessage, sendReaction }) => {
    try {
        await sendReaction(msg, '🚫');
        
        const action = args[0]?.toLowerCase();
        const antilinkData = readAntilinkData();

        if (!action) {
            // Show current status
            const currentSetting = antilinkData[sender];
            const status = currentSetting?.enabled ? '✅ 𝙴𝙽𝙰𝙱𝙻𝙴𝙳' : '❌ 𝙳𝙸𝚂𝙰𝙱𝙻𝙴𝙳';
            const actionType = currentSetting?.action || 'delete';

            await safeSendMessage(sender, { 
                text: applyFont(`*╭━━━〔 🐢 𝙰𝙽𝚃𝙸𝙻𝙸𝙽𝙺 🐢 〕━━━┈⊷*
*┃🐢│ 𝚂𝚃𝙰𝚃𝚄𝚂 :❯ ${status}*
*┃🐢│ 𝙰𝙲𝚃𝙸𝙾𝙽 :❯ ${actionType.toUpperCase()}*
*┃🐢│ 𝙶𝚁𝙾𝚄𝙿 :❯ ${sender}*
*╰━━━━━━━━━━━━━━━┈⊷*

💡 *Usage:*
.antilink on - Enable protection
.antilink off - Disable protection  
.antilink delete - Delete links
.antilink warn - Warn users
.antilink kick - Kick users`) 
            }, { quoted: msg });
            return;
        }

        switch (action) {
            case 'on':
                antilinkData[sender] = { enabled: true, action: 'delete' };
                writeAntilinkData(antilinkData);
                await safeSendMessage(sender, { 
                    text: applyFont('✅ *Antilink protection enabled!*\nLinks will be automatically deleted.') 
                }, { quoted: msg });
                break;

            case 'off':
                delete antilinkData[sender];
                writeAntilinkData(antilinkData);
                await safeSendMessage(sender, { 
                    text: applyFont('❌ *Antilink protection disabled!*') 
                }, { quoted: msg });
                break;

            case 'delete':
            case 'warn':
            case 'kick':
                if (antilinkData[sender]) {
                    antilinkData[sender].action = action;
                    writeAntilinkData(antilinkData);
                    await safeSendMessage(sender, { 
                        text: applyFont(`✅ *Antilink action set to: ${action.toUpperCase()}*`) 
                    }, { quoted: msg });
                } else {
                    await safeSendMessage(sender, { 
                        text: applyFont('❌ *Enable antilink first using: .antilink on*') 
                    }, { quoted: msg });
                }
                break;

            default:
                await safeSendMessage(sender, { 
                    text: applyFont('❌ *Invalid action!*\nUse: on, off, delete, warn, or kick') 
                }, { quoted: msg });
        }

    } catch (error) {
        await safeSendMessage(sender, { 
            text: applyFont('❌ *Error configuring antilink!*') 
        }, { quoted: msg });
    }
};

// Function to handle link detection (called from main index)
module.exports.handleLinkDetection = async (sock, msg, text) => {
    const antilinkData = readAntilinkData();
    const groupSettings = antilinkData[msg.key.remoteJid];
    
    if (!groupSettings?.enabled) return;

    const linkPatterns = [
        /chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/i,
        /whatsapp\.com\/channel\/[A-Za-z0-9]+/i,
        /wa\.me\/[A-Za-z0-9]+/i,
        /t\.me\/[A-Za-z0-9_]+/i,
        /https?:\/\/[^\s]+/i
    ];

    const hasLink = linkPatterns.some(pattern => pattern.test(text));
    
    if (hasLink) {
        try {
            const sender = msg.key.participant || msg.key.remoteJid;
            
            switch (groupSettings.action) {
                case 'delete':
                    await sock.sendMessage(msg.key.remoteJid, {
                        delete: {
                            remoteJid: msg.key.remoteJid,
                            fromMe: false,
                            id: msg.key.id,
                            participant: sender
                        }
                    });
                    break;

                case 'warn':
                    await sock.sendMessage(msg.key.remoteJid, {
                        text: applyFont(`⚠️ *LINK DETECTED!*\n@${sender.split('@')[0]}, posting links is not allowed!`),
                        mentions: [sender]
                    });
                    break;

                case 'kick':
                    await sock.groupParticipantsUpdate(msg.key.remoteJid, [sender], 'remove');
                    await sock.sendMessage(msg.key.remoteJid, {
                        text: applyFont(`🚫 *USER KICKED!*\n@${sender.split('@')[0]} was removed for posting links.`),
                        mentions: [sender]
                    });
                    break;
            }
        } catch (error) {
            console.log('Antilink error:', error.message);
        }
    }
};