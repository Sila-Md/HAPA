const { applyFont } = require('./fonts');
const config = require('../config');

// Store deleted messages temporarily
const deletedMessages = new Map();

const handleAntiDelete = async (sock, item) => {
    if (!config.ANTI_DELETE || !item.keys || !item.keys[0]) return;
    
    const key = item.keys[0];
    const { remoteJid, fromMe, id } = key;
    
    // Don't handle our own deleted messages
    if (fromMe) return;
    
    try {
        // Try to get the deleted message from store
        let deletedContent = "🚫 *Someone deleted a message!*";
        let senderInfo = "👤 *Unknown User*";
        
        // Check if we have the message in our store
        if (deletedMessages.has(id)) {
            const storedMsg = deletedMessages.get(id);
            deletedContent = storedMsg.content;
            senderInfo = `👤 *@${storedMsg.sender.split('@')[0]}*`;
        }

        const antiDeleteMsg = applyFont(`*╭━━━〔 🐢 𝙰𝙽𝚃𝙸-𝙳𝙴𝙻𝙴𝚃𝙴 🐢 〕━━━┈⊷*
*┃🐢│ 𝚂𝚃𝙰𝚃𝚄𝚂 :❯ 𝙳𝙴𝙻𝙴𝚃𝙸𝙾𝙽 𝙳𝙴𝚃𝙴𝙲𝚃𝙴𝙳!*
*┃🐢│ ${senderInfo}*
*┃🐢│ 𝚃𝙸𝙼𝙴 :❯ ${new Date().toLocaleString()}*
*╰━━━━━━━━━━━━━━━┈⊷*

${deletedContent}

👀 *I can see everything! Don't try to hide!*`);

        // Send anti-delete message
        await sock.sendMessage(remoteJid, { 
            text: antiDeleteMsg 
        });

        console.log(`✅ Anti-delete triggered in: ${remoteJid}`);

        // Clean up stored message after use
        if (deletedMessages.has(id)) {
            deletedMessages.delete(id);
        }

    } catch (error) {
        console.log(`❌ Anti-delete error: ${error.message}`);
    }
};

// Store messages for anti-delete (call this when new messages arrive)
const storeMessageForAntiDelete = (msg) => {
    if (!config.ANTI_DELETE || !msg.key || msg.key.fromMe) return;
    
    try {
        const messageId = msg.key.id;
        const sender = msg.key.participant || msg.key.remoteJid;
        
        let content = "📄 *Message*";
        
        // Extract message content
        if (msg.message?.imageMessage) {
            content = "🖼️ *Image*";
        } else if (msg.message?.videoMessage) {
            content = "🎥 *Video*";
        } else if (msg.message?.audioMessage) {
            content = "🎵 *Audio*";
        } else if (msg.message?.stickerMessage) {
            content = "😊 *Sticker*";
        } else if (msg.message?.conversation) {
            content = `💬 *Text:* ${msg.message.conversation}`;
        } else if (msg.message?.extendedTextMessage?.text) {
            content = `💬 *Text:* ${msg.message.extendedTextMessage.text}`;
        }
        
        // Store the message
        deletedMessages.set(messageId, {
            content: content,
            sender: sender,
            timestamp: new Date()
        });
        
        // Auto-clean old messages (keep only last 1000 messages)
        if (deletedMessages.size > 1000) {
            const firstKey = deletedMessages.keys().next().value;
            deletedMessages.delete(firstKey);
        }
        
    } catch (error) {
        console.log('Error storing message for anti-delete:', error.message);
    }
};

module.exports = {
    handleAntiDelete,
    storeMessageForAntiDelete
};