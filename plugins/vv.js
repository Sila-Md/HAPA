const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { applyFont } = require('../lib/fonts');

module.exports = async (sock, sender, args, msg, { safeSendMessage, sendReaction }) => {
    try {
        if (!msg.quoted) {
            await safeSendMessage(sender, { 
                text: applyFont(`💡 *How to use view once:*
                
Reply to a view-once message with:
.vv - To reveal the content

Supported types:
📷 Photos
🎥 Videos
🎵 Audio`) 
            }, { quoted: msg });
            return;
        }

        await sendReaction(msg, '👀');

        const quotedMsg = msg.quoted;
        
        // Better way to detect message type
        let mtype;
        if (quotedMsg.message?.imageMessage) {
            mtype = "imageMessage";
        } else if (quotedMsg.message?.videoMessage) {
            mtype = "videoMessage";
        } else if (quotedMsg.message?.audioMessage) {
            mtype = "audioMessage";
        } else {
            await safeSendMessage(sender, { 
                text: applyFont('❌ *Please reply to a view-once photo, video, or audio message!*') 
            }, { quoted: msg });
            return;
        }

        let buffer;
        try {
            const mediaType = mtype.replace("Message", "");
            const stream = await downloadContentFromMessage(quotedMsg.message[mtype], mediaType);
            
            // Better buffer collection
            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            buffer = Buffer.concat(chunks);
            
        } catch (error) {
            console.error('VV download error:', error);
            // Fallback to regular download
            try {
                buffer = await quotedMsg.download();
            } catch (downloadError) {
                await safeSendMessage(sender, { 
                    text: applyFont('❌ *Failed to download the media!*\nThe view-once message may have expired or is corrupted.') 
                }, { quoted: msg });
                return;
            }
        }

        // Validate buffer
        if (!buffer || buffer.length === 0) {
            await safeSendMessage(sender, { 
                text: applyFont('❌ *Empty media received!*\nThe view-once message may have expired.') 
            }, { quoted: msg });
            return;
        }

        let messageContent = {};
        const caption = applyFont('🐢 *Revealed by Sila MD*');

        try {
            switch (mtype) {
                case "imageMessage":
                    messageContent = {
                        image: buffer,
                        caption: caption,
                        mimetype: quotedMsg.message.imageMessage?.mimetype || "image/jpeg"
                    };
                    break;
                    
                case "videoMessage":
                    messageContent = {
                        video: buffer,
                        caption: caption,
                        mimetype: quotedMsg.message.videoMessage?.mimetype || "video/mp4",
                        gifPlayback: quotedMsg.message.videoMessage?.gifPlayback || false
                    };
                    break;
                    
                case "audioMessage":
                    messageContent = {
                        audio: buffer,
                        mimetype: quotedMsg.message.audioMessage?.mimetype || "audio/mp4",
                        ptt: quotedMsg.message.audioMessage?.ptt || false
                    };
                    break;
            }

            // Send the revealed media
            await safeSendMessage(sender, messageContent, { quoted: msg });
            await sendReaction(msg, '✅');

        } catch (sendError) {
            console.error('VV send error:', sendError);
            await safeSendMessage(sender, { 
                text: applyFont('❌ *Error sending revealed media!*\nThe file might be too large or corrupted.') 
            }, { quoted: msg });
        }

    } catch (error) {
        console.error('VV command error:', error);
        await safeSendMessage(sender, { 
            text: applyFont('❌ *Error revealing view-once message!*\nMake sure you replied to a valid view-once message and try again.') 
        }, { quoted: msg });
    }
};