const config = require('../config');
const { applyFont } = require('./fonts');

const bioMessages = [
    `🤖 ${config.BOT_NAME} - Active | Type ${config.PREFIX}menu`,
    `💫 Powered by Sila Tech | ${config.PREFIX}help`,
    `🚀 All Systems Operational | ${config.BOT_NAME}`,
    `🎯 ${config.PREFIX}alive to check status`,
    `🐢 Sila MD - Your WhatsApp Assistant`,
    `⚡ Fast & Responsive | ${config.BOT_NAME}`,
    `🔗 Use ${config.PREFIX}code for sub-bot`
];

const statusMessages = [
    `🌟 ${config.BOT_NAME} is online and ready!`,
    `💬 Message me with ${config.PREFIX}menu`,
    `🚀 Powered by Sila Technology`,
    `🐢 Sila MD - Always Active`,
    `⚡ Lightning fast responses`
];

let currentBioIndex = 0;
let currentStatusIndex = 0;

const updateAutoBio = async (sock) => {
    if (!sock || !config.AUTO_BIO) return;
    
    try {
        // Update bio
        const bio = applyFont(bioMessages[currentBioIndex]);
        await sock.updateProfileStatus(bio);
        
        // Update status (if available)
        try {
            const status = applyFont(statusMessages[currentStatusIndex]);
            await sock.updateProfileStatus(status);
        } catch (error) {
            // Status update might not be available in all versions
        }
        
        // Rotate indexes
        currentBioIndex = (currentBioIndex + 1) % bioMessages.length;
        currentStatusIndex = (currentStatusIndex + 1) % statusMessages.length;
        
        console.log(`✅ Auto-bio updated: ${bio}`);
    } catch (error) {
        console.log(`❌ Auto-bio error: ${error.message}`);
    }
};

module.exports = {
    updateAutoBio
};