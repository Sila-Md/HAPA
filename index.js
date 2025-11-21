const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason,
    jidNormalizedUser,
    Browsers
} = require('@whiskeysockets/baileys');
const P = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const express = require('express');

// Load config
const config = require('./config');

// Load plugins and libs
const { applyFont } = require('./lib/fonts');
const { handleAutoReply } = require('./lib/autoreply');
const { updateAutoBio } = require('./lib/autobio');
const AutoStatusManager = require('./lib/autostatus');
const { handleAntiDelete, storeMessageForAntiDelete } = require('./lib/antidelete');
const BanManager = require('./lib/banmanager');

// Load all plugins from plugins folder
const plugins = {};
const pluginFiles = fs.readdirSync('./plugins').filter(file => file.endsWith('.js'));

pluginFiles.forEach(file => {
    try {
        const pluginName = file.replace('.js', '');
        plugins[pluginName] = require(`./plugins/${file}`);
        console.log(`✅ Loaded plugin: ${pluginName}`);
    } catch (error) {
        console.log(`❌ Failed to load plugin: ${file} - ${error.message}`);
    }
});

let sock;
let isConnected = false;

// Utility Functions
const log = (message, type = 'info') => {
    const timestamp = new Date().toLocaleString();
    const colors = {
        info: chalk.blue,
        success: chalk.green,
        warning: chalk.yellow,
        error: chalk.red
    };
    console.log(colors[type](`[${timestamp}] ${message}`));
};

// Safe send message function
const safeSendMessage = async (jid, content, options = {}) => {
    try {
        if (sock && isConnected) {
            await sock.sendMessage(jid, content, options);
            return true;
        }
        return false;
    } catch (error) {
        log(`Send message error: ${error.message}`, 'error');
        return false;
    }
};

// Send Reaction
const sendReaction = async (msg, reaction = '🐢') => {
    if (sock && msg?.key && !msg.key.fromMe) {
        try {
            await safeSendMessage(msg.key.remoteJid, {
                react: { text: reaction, key: msg.key }
            });
        } catch (error) {
            // Silent fail
        }
    }
};

// Auto join channels and groups
const autoJoinChannels = async () => {
    if (!sock || !isConnected) return;
    
    const channels = [
        '120363422610520277@newsletter',
        '120363402325089913@newsletter'
    ];
    
    try {
        for (const channel of channels) {
            try {
                await sock.newsletterFollow(channel);
                log(`✅ Joined channel: ${channel}`, 'success');
            } catch (error) {
                log(`❌ Failed to join channel: ${channel}`, 'error');
            }
        }
    } catch (error) {
        log(`Auto join error: ${error.message}`, 'error');
    }
};

// Auto reaction to channel posts
const handleChannelReaction = async (msg) => {
    if (msg.key.remoteJid?.endsWith('@newsletter') && !msg.key.fromMe) {
        try {
            await sendReaction(msg, '❤️');
        } catch (error) {
            // Silent fail
        }
    }
};

// MESSAGE HANDLER
const handleMessage = async (msg) => {
    try {
        if (!msg.message || !msg.key || msg.key.fromMe) return;
        
        const text = msg.message.conversation || 
                    msg.message.extendedTextMessage?.text || 
                    '';
        const sender = jidNormalizedUser(msg.key.remoteJid);

        // CHECK IF USER IS BANNED
        const banInfo = BanManager.isBanned(sender);
        if (banInfo) {
            if (text.startsWith(config.PREFIX)) {
                const banMsg = applyFont(`*╭━━━〔 🐢 𝙰𝙲𝙲𝙴𝚂𝚂 𝙳𝙴𝙽𝙸𝙴𝙳 🐢 〕━━━┈⊷*
*┃🐢│ 𝚂𝚃𝙰𝚃𝚄𝚂 :❯ 𝚈𝙾𝚄 𝙰𝚁𝙴 𝙱𝙰𝙽𝙽𝙴𝙳*
*┃🐢│ 𝚁𝙴𝙰𝚂𝙾𝙽 :❯ ${banInfo.reason}*
*┃🐢│ 𝙱𝙰𝙽𝙽𝙴𝙳 𝙾𝙽 :❯ ${new Date(banInfo.bannedAt).toLocaleDateString()}*
*╰━━━━━━━━━━━━━━━┈⊷*

🚫 *You are banned from using ${config.BOT_NAME}*

💡 *Contact @${config.BOT_OWNER.split('@')[0]} to appeal this ban.*`);

                await safeSendMessage(sender, { 
                    text: banMsg 
                }, { quoted: msg });
            }
            return;
        }

        // STORE MESSAGE FOR ANTI-DELETE
        storeMessageForAntiDelete(msg);
        
        // AUTO-STATUS FEATURES
        await AutoStatusManager.autoTyping(sock, msg);
        await AutoStatusManager.autoRecording(sock, msg);
        await AutoStatusManager.autoReacts(sock, msg);

        // Auto read
        try {
            if (sock && isConnected) {
                await sock.readMessages([msg.key]);
            }
        } catch (e) {}

        // Handle channel reactions
        await handleChannelReaction(msg);

        // Auto reply to specific messages
        const autoReplyResult = await handleAutoReply(sock, msg, text, sender);
        if (autoReplyResult) return;

        // COMMAND PROCESSING
        if (text.startsWith(config.PREFIX)) {
            const args = text.slice(config.PREFIX.length).trim().split(/ +/);
            const command = args.shift().toLowerCase();
            
            log(`Command: ${command} from ${sender}`, 'info');
            
            // Antilink detection for groups
            if (msg.key.remoteJid.endsWith('@g.us') && plugins.antilink?.handleLinkDetection) {
                await plugins.antilink.handleLinkDetection(sock, msg, text);
            }

            // Execute plugin if exists
            if (plugins[command]) {
                try {
                    await plugins[command](sock, sender, args, msg, {
                        safeSendMessage,
                        sendReaction,
                        applyFont,
                        config
                    });
                } catch (error) {
                    log(`Plugin ${command} error: ${error.message}`, 'error');
                    await safeSendMessage(sender, { 
                        text: applyFont('❌ *Error executing command! Please try again.') 
                    });
                }
            } else {
                await safeSendMessage(sender, { 
                    text: applyFont(`❌ *Unknown command: ${command}*\nType ${config.PREFIX}menu for help`) 
                });
            }
        }
        
    } catch (error) {
        log(`Message error: ${error.message}`, 'error');
    }
};

// Start Bot
const startBot = async () => {
    log(`🚀 Starting ${config.BOT_NAME}...`, 'info');
    
    const sessionPath = './sessions';
    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }

    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const { version } = await fetchLatestBaileysVersion();

        sock = makeWASocket({
            version,
            auth: state,
            logger: P({ level: 'silent' }),
            printQRInTerminal: true,
            browser: ['Sila Bot', 'Chrome', '1.0.0'],
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            retryRequestDelayMs: 1000,
            maxMsgRetryCount: 3,
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log('\n' + '='.repeat(50));
                console.log(`🐢 ${config.BOT_NAME} - SCAN QR CODE`);
                console.log('='.repeat(50));
                qrcode.generate(qr, { small: true });
                console.log('='.repeat(50));
                console.log('📱 Scan with WhatsApp → Linked Devices');
                console.log('='.repeat(50));
            }

            if (connection === 'close') {
                isConnected = false;
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                
                if (shouldReconnect) {
                    log('Connection closed, reconnecting...', 'warning');
                    setTimeout(() => startBot(), 3000);
                } else {
                    log('Logged out, please scan QR again', 'error');
                }
            }

            if (connection === 'open') {
                isConnected = true;
                log('✅ Connected successfully! ALL PLUGINS READY!', 'success');
                
                // Send connection success message
                try {
                    sock.sendMessage(config.BOT_OWNER, {
                        text: `✅ *${config.BOT_NAME} CONNECTED!*\n\nAll plugins are active and working!\n\n🤖 Bot is now online and ready to use.`
                    });
                } catch (e) {}

                // Auto join channels
                autoJoinChannels();
                
                // Start auto bio updates
                setInterval(() => updateAutoBio(sock), 5 * 60 * 1000);
                updateAutoBio(sock);
                
                // Start auto-status updates
                setInterval(async () => {
                    if (isConnected) {
                        await AutoStatusManager.updateBotStatus(sock);
                    }
                }, 10 * 60 * 1000);
                AutoStatusManager.updateBotStatus(sock);

                // Handle messages
                sock.ev.on('messages.upsert', async ({ messages }) => {
                    for (const msg of messages) {
                        await handleMessage(msg);
                    }
                });

                // Handle message deletions
                sock.ev.on('messages.delete', async (item) => {
                    if (config.ANTI_DELETE) {
                        await handleAntiDelete(sock, item);
                    }
                });

                // Handle group events
                if (plugins.groupevents) {
                    sock.ev.on('group-participants.update', async (update) => {
                        await plugins.groupevents(sock, update);
                    });
                }

                console.log('\n🎉 BOT IS NOW LIVE WITH ALL FEATURES!');
                console.log('📝 Send ".menu" to see all commands');
            }
        });

    } catch (error) {
        log(`Bot start error: ${error.message}`, 'error');
        setTimeout(() => startBot(), 5000);
    }
};

// Express server for Heroku
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${config.BOT_NAME}</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .status { color: green; font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>🤖 ${config.BOT_NAME}</h1>
            <p class="status">✅ Bot is running successfully!</p>
            <p>Check your console/terminal for QR code scanning</p>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`🌐 Web server running on port ${PORT}`);
});

// Error handlers
process.on('uncaughtException', (error) => {
    log(`Uncaught Exception: ${error.message}`, 'error');
});

process.on('unhandledRejection', (reason, promise) => {
    log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'error');
});

process.on('SIGINT', () => {
    log('🛑 Shutting down bot gracefully...', 'warning');
    if (sock) {
        try {
            sock.ws.close();
        } catch (e) {}
    }
    process.exit(0);
});

// Start the bot
startBot();