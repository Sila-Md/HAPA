const axios = require('axios');
const config = require('../config');
const { applyFont } = require('../lib/fonts');

module.exports = async (sock, sender, args, msg, { safeSendMessage, sendReaction }) => {
    if (!args.length) {
        await safeSendMessage(sender, { 
            text: applyFont('❌ *Please ask a question!*\nExample: .ai what is AI?') 
        });
        return;
    }
    
    const question = args.join(' ');
    
    try {
        await sendReaction(msg, '🤖');
        await safeSendMessage(sender, { text: applyFont('🤖 *AI is thinking...*') });
        
        const response = await axios.get(`https://ai-api-key-699ac94e6fae.herokuapp.com/api/ask?q=${encodeURIComponent(question)}`, {
            timeout: 30000
        });
        
        if (response.data.answer) {
            const aiResponse = applyFont(`*╭━━━〔 🐢 𝙰𝙸 𝚁𝙴𝚂𝙿𝙾𝙽𝚂𝙴 🐢 〕━━━┈⊷*
*┃🐢│ 𝚀𝚄𝙴𝚂𝚃𝙸𝙾𝙽 :❯ ${question}*
*┃🐢│*
*┃🐢│ 𝙰𝙽𝚂𝚆𝙴𝚁 :❯*
*┃🐢│ ${response.data.answer}*
*╰━━━━━━━━━━━━━━━┈⊷*

🤖 *Powered by Sila MD AI*`);
            
            await safeSendMessage(sender, {
                image: { url: config.BOT_IMAGES[0] },
                caption: aiResponse
            });
            await sendReaction(msg, '🧠');
        } else {
            await safeSendMessage(sender, { 
                text: applyFont('❌ *No response from AI!*\nPlease try again.') 
            });
        }
    } catch (error) {
        await safeSendMessage(sender, { 
            text: applyFont('❌ *AI service error!*\nPlease try again later.') 
        });
    }
};