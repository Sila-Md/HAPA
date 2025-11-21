const { applyFont } = require('../lib/fonts');
const config = require('../config');
const BanManager = require('../lib/banmanager');

module.exports = async (sock, sender, args, msg, { safeSendMessage, sendReaction }) => {
    try {
        await sendReaction(msg, '🚫');
        
        const action = args[0]?.toLowerCase();
        const target = args[1];
        const duration = args[2];
        const reason = args.slice(3).join(' ') || 'No reason provided';

        // Only owner and admins can use ban commands
        const isOwner = sender === config.BOT_OWNER;
        const isGroup = msg.key.remoteJid.endsWith('@g.us');
        
        if (!isOwner) {
            await safeSendMessage(sender, { 
                text: applyFont('❌ *Only bot owner can use ban commands!*') 
            }, { quoted: msg });
            return;
        }

        if (!action) {
            // Show ban help
            const banHelp = applyFont(`*╭━━━〔 🐢 𝙱𝙰𝙽 𝚂𝚈𝚂𝚃𝙴𝙼 🐢 〕━━━┈⊷*
*┃🐢│ 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 :❯ 𝙱𝙰𝙽 𝙼𝙰𝙽𝙰𝙶𝙴𝙼𝙴𝙽𝚃*
*┃🐢│ 𝙾𝚆𝙽𝙴𝚁 :❯ ${config.BOT_OWNER.split('@')[0]}*
*╰━━━━━━━━━━━━━━━┈⊷*

🔧 *BAN COMMANDS:*

.ban @user - Ban user permanently
.ban @user 24 - Temp ban for 24 hours
.ban @user 7 Spamming - Temp ban with reason
.unban @user - Unban user
.banlist - Show banned users
.banclean - Clean expired bans

💡 *How it works:*
• Banned users cannot use bot commands
• Works across all chats and groups
• Temporary bans auto-expire
• Only bot owner can manage bans`);

            await safeSendMessage(sender, { 
                text: banHelp 
            }, { quoted: msg });
            return;
        }

        if (action === 'banlist') {
            // Show banned users list
            const bannedUsers = BanManager.getBannedUsers();
            
            if (bannedUsers.length === 0) {
                await safeSendMessage(sender, { 
                    text: applyFont('✅ *No users are currently banned!*') 
                }, { quoted: msg });
                return;
            }

            let banList = applyFont(`*╭━━━〔 🐢 𝙱𝙰𝙽𝙽𝙴𝙳 𝚄𝚂𝙴𝚁𝚂 🐢 〕━━━┈⊷*\n`);
            
            bannedUsers.forEach((user, index) => {
                const userNumber = user.jid.split('@')[0];
                const banDate = new Date(user.bannedAt).toLocaleDateString();
                const expires = user.expiresAt ? 
                    `Expires: ${new Date(user.expiresAt).toLocaleString()}` : 
                    'Permanent';
                
                banList += `*┃${index + 1}│ @${userNumber}*\n`;
                banList += `*┃│ Reason: ${user.reason}*\n`;
                banList += `*┃│ Banned by: @${user.bannedBy?.split('@')[0] || 'System'}*\n`;
                banList += `*┃│ Date: ${banDate} | ${expires}*\n`;
                banList += `*┃│─────────────────*\n`;
            });
            
            banList += `*╰━━━━━━━━━━━━━━━┈⊷*\n`;
            banList += `📊 *Total: ${bannedUsers.length} banned users*`;

            await safeSendMessage(sender, { 
                text: banList 
            }, { quoted: msg });
            return;
        }

        if (action === 'banclean') {
            // Clean expired bans
            const cleaned = BanManager.cleanExpiredBans();
            
            await safeSendMessage(sender, { 
                text: applyFont(cleaned ? 
                    '✅ *Expired bans cleaned successfully!*' : 
                    'ℹ️ *No expired bans to clean!*'
                ) 
            }, { quoted: msg });
            return;
        }

        // Handle ban/unban actions
        let targetJid;
        
        if (msg.quoted) {
            targetJid = msg.quoted.sender;
        } else if (msg.mentionedJid && msg.mentionedJid.length > 0) {
            targetJid = msg.mentionedJid[0];
        } else if (action.startsWith('@')) {
            targetJid = action.replace('@', '') + '@s.whatsapp.net';
        } else {
            await safeSendMessage(sender, { 
                text: applyFont('❌ *Please mention a user or reply to their message!*') 
            }, { quoted: msg });
            return;
        }

        // Prevent self-ban and owner ban
        if (targetJid === sender) {
            await safeSendMessage(sender, { 
                text: applyFont('❌ *You cannot ban yourself!*') 
            }, { quoted: msg });
            return;
        }

        if (targetJid === config.BOT_OWNER) {
            await safeSendMessage(sender, { 
                text: applyFont('❌ *You cannot ban the bot owner!*') 
            }, { quoted: msg });
            return;
        }

        if (action === 'unban' || args[0] === 'unban') {
            // Unban user
            const success = BanManager.unbanUser(targetJid);
            
            const unbanMsg = applyFont(success ?
                `*╭━━━〔 🐢 𝚄𝙽𝙱𝙰𝙽𝙽𝙴𝙳 🐢 〕━━━┈⊷*
*┃🐢│ 𝚄𝚂𝙴𝚁 :❯ @${targetJid.split('@')[0]}*
*┃🐢│ 𝚂𝚃𝙰𝚃𝚄𝚂 :❯ 𝚄𝙽𝙱𝙰𝙽𝙽𝙴𝙳 𝚂𝚄𝙲𝙲𝙴𝚂𝚂𝙵𝚄𝙻𝙻𝚈*
*╰━━━━━━━━━━━━━━━┈⊷*` :
                '❌ *User is not banned!*'
            );
            
            await safeSendMessage(sender, { 
                text: unbanMsg 
            }, { quoted: msg });
            return;
        }

        // Ban user (action is either 'ban' or a mention)
        let banDuration = null;
        let banReason = reason;
        
        // Check if duration is provided
        if (!isNaN(parseInt(args[1]))) {
            banDuration = parseInt(args[1]);
            banReason = args.slice(2).join(' ') || 'No reason provided';
        }

        const banSuccess = banDuration ? 
            BanManager.tempBanUser(targetJid, banDuration, banReason, sender) :
            BanManager.banUser(targetJid, banReason, sender);

        if (banSuccess) {
            const banType = banDuration ? `Temporary (${banDuration}h)` : 'Permanent';
            const banMsg = applyFont(`*╭━━━〔 🐢 𝚄𝚂𝙴𝚁 𝙱𝙰𝙽𝙽𝙴𝙳 🐢 〕━━━┈⊷*
*┃🐢│ 𝚄𝚂𝙴𝚁 :❯ @${targetJid.split('@')[0]}*
*┃🐢│ 𝚃𝚈𝙿𝙴 :❯ ${banType}*
*┃🐢│ 𝚁𝙴𝙰𝚂𝙾𝙽 :❯ ${banReason}*
*┃🐢│ 𝙱𝙰𝙽𝙽𝙴𝙳 𝙱𝚈 :❯ @${sender.split('@')[0]}*
*╰━━━━━━━━━━━━━━━┈⊷*

🚫 *This user can no longer use bot commands!*`);

            await safeSendMessage(sender, { 
                text: banMsg 
            }, { quoted: msg });

            // Notify the banned user if in private chat
            try {
                const userNotifyMsg = applyFont(`*╭━━━〔 🐢 𝙱𝙰𝙽 𝙽𝙾𝚃𝙸𝙵𝙸𝙲𝙰𝚃𝙸𝙾𝙽 🐢 〕━━━┈⊷*
*┃🐢│ 𝚂𝚃𝙰𝚃𝚄𝚂 :❯ 𝚈𝙾𝚄 𝙷𝙰𝚅𝙴 𝙱𝙴𝙴𝙽 𝙱𝙰𝙽𝙽𝙴𝙳*
*┃🐢│ 𝚃𝚈𝙿𝙴 :❯ ${banType}*
*┃🐢│ 𝚁𝙴𝙰𝚂𝙾𝙽 :❯ ${banReason}*
*╰━━━━━━━━━━━━━━━┈⊷*

🚫 *You are banned from using ${config.BOT_NAME}*

💡 *Contact the bot owner to appeal:* 
@${config.BOT_OWNER.split('@')[0]}`);

                await safeSendMessage(targetJid, { 
                    text: userNotifyMsg 
                });
            } catch (error) {
                // Silent fail if cannot notify user
            }
            
        } else {
            await safeSendMessage(sender, { 
                text: applyFont('❌ *User is already banned!*') 
            }, { quoted: msg });
        }

    } catch (error) {
        await safeSendMessage(sender, { 
            text: applyFont('❌ *Error processing ban command!*') 
        }, { quoted: msg });
    }
};