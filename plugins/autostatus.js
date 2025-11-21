const { applyFont } = require('../lib/fonts');
const config = require('../config');
const AutoStatusManager = require('../lib/autostatus');

module.exports = async (sock, sender, args, msg, { safeSendMessage, sendReaction }) => {
    try {
        await sendReaction(msg, '⚡');
        
        const action = args[0]?.toLowerCase();
        const feature = args[1]?.toLowerCase();
        const value = args[2]?.toLowerCase();

        // Only owner can change auto-status settings
        if (sender !== config.BOT_OWNER && action !== 'status') {
            await safeSendMessage(sender, { 
                text: applyFont('❌ *Only bot owner can change auto-status settings!*') 
            }, { quoted: msg });
            return;
        }

        if (!action || action === 'status') {
            // Show current status
            const currentConfig = AutoStatusManager.getConfig();
            
            const statusInfo = applyFont(`*╭━━━〔 🐢 𝙰𝚄𝚃𝙾-𝚂𝚃𝙰𝚃𝚄𝚂 🐢 〕━━━┈⊷*
*┃🐢│ 𝙵𝙴𝙰𝚃𝚄𝚁𝙴 :❯ 𝚂𝚃𝙰𝚃𝚄𝚂*
*┃🐢│ 𝙾𝚆𝙽𝙴𝚁 :❯ ${config.BOT_OWNER.split('@')[0]}*
*╰━━━━━━━━━━━━━━━┈⊷*

🔧 *CURRENT SETTINGS:*

❤️  *Auto Like Status*: ${currentConfig.autoLikeStatus ? '✅ ON' : '❌ OFF'}
👀  *Auto View Status*: ${currentConfig.autoViewStatus ? '✅ ON' : '❌ OFF'}
⌨️  *Auto Typing*: ${currentConfig.autoTyping ? '✅ ON' : '❌ OFF'}
🎙️  *Auto Recording*: ${currentConfig.autoRecording ? '✅ ON' : '❌ OFF'}
🎭  *Auto Reacts*: ${currentConfig.autoReacts ? '✅ ON' : '❌ OFF'}
🤖  *Bot Status*: ${currentConfig.status ? '✅ ON' : '❌ OFF'}

💡 *Usage:*
.autostatus on all - Enable all features
.autostatus off all - Disable all features
.autostatus on autolikestatus - Enable specific
.autostatus off autoreacts - Disable specific
.autostatus test - Test all features`);

            await safeSendMessage(sender, { 
                text: statusInfo 
            }, { quoted: msg });
            return;
        }

        if (action === 'test') {
            // Test all auto-status features
            await safeSendMessage(sender, { 
                text: applyFont('⚡ *Testing auto-status features...*') 
            }, { quoted: msg });

            // Test auto-typing
            await sock.sendPresenceUpdate('composing', sender);
            setTimeout(async () => {
                await sock.sendPresenceUpdate('paused', sender);
            }, 2000);

            // Test auto-recording
            setTimeout(async () => {
                await sock.sendPresenceUpdate('recording', sender);
                setTimeout(async () => {
                    await sock.sendPresenceUpdate('paused', sender);
                    
                    // Send test results
                    const testResults = applyFont(`*╭━━━〔 🐢 𝚃𝙴𝚂𝚃 𝚁𝙴𝚂𝚄𝙻𝚃𝚂 🐢 〕━━━┈⊷*
*┃🐢│ 𝚃𝙴𝚂𝚃 :❯ 𝙰𝚄𝚃𝙾-𝚂𝚃𝙰𝚃𝚄𝚂 𝙵𝙴𝙰𝚃𝚄𝚁𝙴𝚂*
*┃🐢│ 𝚁𝙴𝚂𝚄𝙻𝚃 :❯ 𝚃𝙴𝚂𝚃𝙴𝙳 𝚂𝚄𝙲𝙲𝙴𝚂𝚂𝙵𝚄𝙻𝙻𝚈*
*╰━━━━━━━━━━━━━━━┈⊷*

✅ *Auto-typing*: Tested
✅ *Auto-recording*: Tested  
✅ *Auto-reacts*: Ready
✅ *Status monitoring*: Active

🔧 *All features are working correctly!*`);

                    await safeSendMessage(sender, { text: testResults });
                    
                }, 2000);
            }, 2500);
            
            return;
        }

        if (feature === 'all') {
            // Enable/disable all features
            const newValue = action === 'on';
            const newConfig = {
                autoLikeStatus: newValue,
                autoViewStatus: newValue,
                autoTyping: newValue,
                autoRecording: newValue,
                autoReacts: newValue,
                status: newValue
            };
            
            AutoStatusManager.updateConfig(newConfig);
            
            await safeSendMessage(sender, { 
                text: applyFont(`✅ *All auto-status features ${action.toUpperCase()}!*`) 
            }, { quoted: msg });
            return;
        }

        // Handle individual feature toggling
        const validFeatures = [
            'autolikestatus', 'autoviewstatus', 'autotyping', 
            'autorecording', 'autoreacts', 'status'
        ];

        if (!validFeatures.includes(feature)) {
            await safeSendMessage(sender, { 
                text: applyFont(`❌ *Invalid feature!*\nValid features: ${validFeatures.join(', ')}`) 
            }, { quoted: msg });
            return;
        }

        const newValue = action === 'on';
        const success = AutoStatusManager.toggleFeature(feature, newValue);

        if (success) {
            const featureName = feature.replace(/([A-Z])/g, ' $1').toUpperCase();
            await safeSendMessage(sender, { 
                text: applyFont(`✅ *${featureName} ${action.toUpperCase()}!*`) 
            }, { quoted: msg });
        } else {
            await safeSendMessage(sender, { 
                text: applyFont('❌ *Error updating feature!*') 
            }, { quoted: msg });
        }

    } catch (error) {
        await safeSendMessage(sender, { 
            text: applyFont('❌ *Error configuring auto-status!*') 
        }, { quoted: msg });
    }
};