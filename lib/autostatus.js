const { applyFont } = require('./fonts');
const config = require('../config');

// Auto Status Configuration
let autoStatusConfig = {
    autoLikeStatus: true,
    autoViewStatus: true, 
    autoTyping: true,
    autoRecording: true,
    autoReacts: true,
    status: true
};

// Status messages for auto-reacts
const statusMessages = [
    "🌟", "🔥", "❤️", "👍", "🎉", "⚡", "💫", "🚀",
    "😊", "🤩", "👏", "💯", "🐢", "💖", "✨", "🙌"
];

// Track viewed statuses to avoid duplicates
const viewedStatuses = new Set();

const AutoStatusManager = {
    // Auto-like status updates
    async autoLikeStatus(sock, statusUpdate) {
        if (!autoStatusConfig.autoLikeStatus) return;
        
        try {
            const statusJid = statusUpdate.jid;
            const statusId = statusUpdate.messages[0]?.key?.id;
            
            if (!statusJid || !statusId) return;
            
            // Avoid duplicate likes
            const statusKey = `${statusJid}_${statusId}`;
            if (viewedStatuses.has(statusKey)) return;
            
            viewedStatuses.add(statusKey);
            
            // Send like reaction to status
            await sock.sendMessage(statusJid, {
                react: {
                    text: "❤️",
                    key: statusUpdate.messages[0].key
                }
            });
            
            console.log(`✅ Auto-liked status from: ${statusJid}`);
            
            // Cleanup old viewed statuses (keep only last 100)
            if (viewedStatuses.size > 100) {
                const firstKey = viewedStatuses.keys().next().value;
                viewedStatuses.delete(firstKey);
            }
            
        } catch (error) {
            console.log('Auto-like status error:', error.message);
        }
    },

    // Auto-view status updates
    async autoViewStatus(sock, statusUpdate) {
        if (!autoStatusConfig.autoViewStatus) return;
        
        try {
            const statusJid = statusUpdate.jid;
            const statusMessages = statusUpdate.messages;
            
            if (!statusJid || !statusMessages?.length) return;
            
            // Mark status as viewed
            for (const msg of statusMessages) {
                await sock.readMessages([msg.key]);
            }
            
            console.log(`✅ Auto-viewed status from: ${statusJid}`);
            
        } catch (error) {
            console.log('Auto-view status error:', error.message);
        }
    },

    // Auto-typing indicator in chats
    async autoTyping(sock, msg) {
        if (!autoStatusConfig.autoTyping) return;
        
        try {
            const chatJid = msg.key.remoteJid;
            
            // Don't auto-type in groups or for our own messages
            if (chatJid.endsWith('@g.us') || msg.key.fromMe) return;
            
            // Start typing
            await sock.sendPresenceUpdate('composing', chatJid);
            
            // Stop typing after random time (3-8 seconds)
            const typingTime = 3000 + Math.random() * 5000;
            setTimeout(async () => {
                try {
                    await sock.sendPresenceUpdate('paused', chatJid);
                } catch (error) {
                    // Silent fail
                }
            }, typingTime);
            
        } catch (error) {
            console.log('Auto-typing error:', error.message);
        }
    },

    // Auto-recording indicator in voice chats
    async autoRecording(sock, msg) {
        if (!autoStatusConfig.autoRecording) return;
        
        try {
            const chatJid = msg.key.remoteJid;
            
            // Only activate for voice messages or in specific conditions
            if (chatJid.endsWith('@g.us') || msg.key.fromMe) return;
            
            // Random chance to show recording (30%)
            if (Math.random() < 0.3) {
                await sock.sendPresenceUpdate('recording', chatJid);
                
                // Stop recording after 2-5 seconds
                const recordingTime = 2000 + Math.random() * 3000;
                setTimeout(async () => {
                    try {
                        await sock.sendPresenceUpdate('paused', chatJid);
                    } catch (error) {
                        // Silent fail
                    }
                }, recordingTime);
            }
            
        } catch (error) {
            console.log('Auto-recording error:', error.message);
        }
    },

    // Auto-reacts to messages
    async autoReacts(sock, msg) {
        if (!autoStatusConfig.autoReacts) return;
        
        try {
            const chatJid = msg.key.remoteJid;
            const messageText = msg.message?.conversation || 
                              msg.message?.extendedTextMessage?.text || '';
            
            // Don't react to our own messages or in large groups
            if (msg.key.fromMe || (chatJid.endsWith('@g.us') && Math.random() < 0.7)) return;
            
            // Random chance to react (40% in private, 15% in groups)
            const reactChance = chatJid.endsWith('@g.us') ? 0.15 : 0.4;
            if (Math.random() < reactChance) {
                const randomReaction = statusMessages[Math.floor(Math.random() * statusMessages.length)];
                
                await sock.sendMessage(chatJid, {
                    react: {
                        text: randomReaction,
                        key: msg.key
                    }
                });
                
                console.log(`✅ Auto-reacted with: ${randomReaction}`);
            }
            
        } catch (error) {
            console.log('Auto-reacts error:', error.message);
        }
    },

    // Update bot status automatically
    async updateBotStatus(sock) {
        if (!autoStatusConfig.status) return;
        
        try {
            const statusMessages = [
                `🤖 ${config.BOT_NAME} - Active | ${config.PREFIX}menu`,
                `💫 Powered by Sila Tech | ${config.PREFIX}help`,
                `🚀 All Systems Operational | ${config.BOT_NAME}`,
                `🎯 ${config.PREFIX}alive to check status`,
                `🐢 Sila MD - Your WhatsApp Assistant`,
                `⚡ Fast & Responsive | ${config.BOT_NAME}`,
                `🔗 Use ${config.PREFIX}code for sub-bot`,
                `🌟 ${config.PREFIX}autostatus to configure`
            ];
            
            const randomStatus = statusMessages[Math.floor(Math.random() * statusMessages.length)];
            const formattedStatus = applyFont(randomStatus);
            
            await sock.updateProfileStatus(formattedStatus);
            console.log(`✅ Auto-status updated: ${formattedStatus}`);
            
        } catch (error) {
            console.log('Auto-status update error:', error.message);
        }
    },

    // Get current configuration
    getConfig() {
        return { ...autoStatusConfig };
    },

    // Update configuration
    updateConfig(newConfig) {
        autoStatusConfig = { ...autoStatusConfig, ...newConfig };
        return autoStatusConfig;
    },

    // Toggle specific feature
    toggleFeature(feature, value) {
        if (autoStatusConfig.hasOwnProperty(feature)) {
            autoStatusConfig[feature] = value;
            return true;
        }
        return false;
    }
};

module.exports = AutoStatusManager;