const axios = require('axios');
const config = require('../config');
const { applyFont } = require('../lib/fonts');

module.exports = async (sock, sender, args, msg, { safeSendMessage, sendReaction }) => {
    if (!args.length) {
        await safeSendMessage(sender, { 
            text: applyFont('❌ *Please provide YouTube URL!*\nExample: .video https://youtube.com/...') 
        });
        return;
    }
    
    const url = args[0];
    
    try {
        await sendReaction(msg, '📥');
        await safeSendMessage(sender, { text: applyFont('🎥 *Downloading video...*') });
        
        const response = await axios.get(`https://gtech-api-xtp1.onrender.com/api/video/yt?url=${encodeURIComponent(url)}`, {
            timeout: 30000
        });
        
        if (response.data.status && response.data.result) {
            const video = response.data.result;
            
            const videoInfo = applyFont(`*╭━━━〔 🐢 𝚅𝙸𝙳𝙴𝙾 𝙸𝙽𝙵𝙾 🐢 〕━━━┈⊷*
*┃🐢│ 𝚃𝙸𝚃𝙻𝙴 :❯ ${video.title}*
*┃🐢│ 𝙳𝚄𝚁𝙰𝚃𝙸𝙾𝙽 :❯ ${video.duration}*
*┃🐢│ 𝙲𝙷𝙰𝙽𝙽𝙴𝙻 :❯ ${video.channel}*
*╰━━━━━━━━━━━━━━━┈⊷*

🐢 *Powered by Sila MD*`);
            
            await safeSendMessage(sender, {
                image: { url: config.BOT_IMAGES[1] },
                caption: videoInfo
            });
            
            await safeSendMessage(sender, {
                video: { url: video.url },
                caption: applyFont(`🎥 *${video.title}*`)
            });
            
            await sendReaction(msg, '📹');
        } else {
            await safeSendMessage(sender, { 
                text: applyFont('❌ *Video not found!*\nPlease check the URL.') 
            });
        }
    } catch (error) {
        await safeSendMessage(sender, { 
            text: applyFont('❌ *Error downloading video!*\nPlease try again later.') 
        });
    }
};