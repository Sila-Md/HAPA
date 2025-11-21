const axios = require('axios');
const config = require('../config');
const { applyFont } = require('../lib/fonts');

module.exports = async (sock, sender, args, msg, { safeSendMessage, sendReaction }) => {
    if (!args.length) {
        await safeSendMessage(sender, { 
            text: applyFont('❌ *Please provide song title!*\nExample: .song baby shark') 
        });
        return;
    }
    
    const query = args.join(' ');
    
    try {
        await sendReaction(msg, '🔍');
        await safeSendMessage(sender, { text: applyFont('🎵 *Searching for song...*') });
        
        const response = await axios.get(`https://api.nekolabs.my.id/downloader/youtube/play/v1?q=${encodeURIComponent(query)}`, {
            timeout: 30000
        });
        
        if (response.data.status && response.data.result) {
            const song = response.data.result;
            
            const songInfo = applyFont(`*╭━━━〔 🐢 𝚂𝙾𝙽𝙶 𝙸𝙽𝙵𝙾 🐢 〕━━━┈⊷*
*┃🐢│ 𝚃𝙸𝚃𝙻𝙴 :❯ ${song.title}*
*┃🐢│ 𝙳𝚄𝚁𝙰𝚃𝙸𝙾𝙽 :❯ ${song.duration}*
*┃🐢│ 𝙲𝙷𝙰𝙽𝙽𝙴𝙻 :❯ ${song.channel}*
*╰━━━━━━━━━━━━━━━┈⊷*

🐢 *Powered by Sila MD*`);
            
            await safeSendMessage(sender, {
                image: { url: config.BOT_IMAGES[0] },
                caption: songInfo
            });
            
            await safeSendMessage(sender, {
                audio: { url: song.audio },
                mimetype: 'audio/mp4',
                fileName: `${song.title.replace(/[\\/:*?"<>|]/g, "").slice(0, 80)}.mp3`
            });
            
            await sendReaction(msg, '🎶');
        } else {
            await safeSendMessage(sender, { 
                text: applyFont('❌ *Song not found!*\nPlease try another title.') 
            });
        }
    } catch (error) {
        await safeSendMessage(sender, { 
            text: applyFont('❌ *Error downloading song!*\nPlease try again later.') 
        });
    }
};