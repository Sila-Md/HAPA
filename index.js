const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason,
    jidNormalizedUser,
    Browsers,
    makeCacheableSignalKeyStore,
    requestPairingCode
} = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const express = require('express');
const crypto = require('crypto');
const readline = require('readline');

// Setup readline for pairing code
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (text) => new Promise((resolve) => rl.question(text, resolve));

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
let retryCount = 0;
const maxRetries = 10;
let phoneNumber = config.BOT_OWNER?.split('@')[0]?.replace('255', '0') || "255612491554";

// Check if we're on Heroku
const isHeroku = process.env.NODE_ENV === 'production' || 
                 process.env.DYNO || 
                 process.env.HEROKU_APP_NAME;

// Logger
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

// Show banner
function showBanner() {
    console.log('\n' + '═'.repeat(60));
    console.log(chalk.blue.bold('╭━━【 𝐒𝐈𝐋𝐀 𝐀𝐈 𝐁𝐎𝐓 】━━━━━━━━╮'));
    console.log(chalk.cyan('│ 🤖 Professional WhatsApp Bot'));
    console.log(chalk.yellow('│ 👑 Owner: +255 61 249 1554'));
    console.log(chalk.magenta(`│ 🚀 Version: 7.0.0`));
    console.log(chalk.green(`│ 🌐 Host: ${isHeroku ? 'Heroku' : 'Local'}`));
    console.log(chalk.blue('╰━━━━━━━━━━━━━━━━━━━━╯'));
    console.log('═'.repeat(60));
}

// ==================== SESSION MANAGEMENT ====================
async function setupSessionFromID(sessionID) {
    try {
        const sessionPath = './sessions';
        
        // Clean up existing session
        if (fs.existsSync(sessionPath)) {
            try {
                fs.rmSync(sessionPath, { recursive: true });
                log('🗑️  Cleaned old session directory', 'info');
            } catch (e) {}
        }
        
        // Create new session directory
        fs.mkdirSync(sessionPath, { recursive: true });
        
        // Remove prefix if exists
        let cleanSession = sessionID;
        if (sessionID.startsWith('FAIZAN-AI~')) {
            cleanSession = sessionID.substring(10);
            log('📝 Removed FAIZAN-AI~ prefix', 'info');
        }
        
        // Try to decode as base64 JSON
        try {
            const decoded = Buffer.from(cleanSession, 'base64').toString('utf-8');
            const sessionData = JSON.parse(decoded);
            
            // Save to creds.json
            const credsFile = path.join(sessionPath, 'creds.json');
            fs.writeFileSync(credsFile, JSON.stringify(sessionData, null, 2));
            
            log('✅ Session created from ID', 'success');
            return true;
            
        } catch (error) {
            // If not valid base64 JSON
            log('⚠️ Session ID invalid, will use pairing code', 'warning');
            
            // Create empty session for pairing
            const credsData = {
                noiseKey: { private: { type: 'Buffer', data: [] }, public: { type: 'Buffer', data: [] } },
                signedIdentityKey: { private: { type: 'Buffer', data: [] }, public: { type: 'Buffer', data: [] } },
                signedPreKey: { keyPair: { private: { type: 'Buffer', data: [] }, public: { type: 'Buffer', data: [] } } },
                registrationId: 0,
                advSecretKey: crypto.randomBytes(32).toString('base64'),
                processedHistoryMessages: [],
                nextPreKeyId: 1,
                firstUnuploadedPreKeyId: 1,
                accountSettings: { unarchiveChats: false }
            };
            
            const credsFile = path.join(sessionPath, 'creds.json');
            fs.writeFileSync(credsFile, JSON.stringify(credsData, null, 2));
            
            return false;
        }
        
    } catch (error) {
        log(`❌ Session setup error: ${error.message}`, 'error');
        return false;
    }
}

// ==================== SHOW PAIRING CODE ====================
async function showPairingCode(sock) {
    try {
        let inputPhoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        
        // Format for Tanzania
        if (inputPhoneNumber.startsWith('0')) {
            inputPhoneNumber = '255' + inputPhoneNumber.substring(1);
        } else if (!inputPhoneNumber.startsWith('255')) {
            inputPhoneNumber = '255' + inputPhoneNumber;
        }
        
        console.log('\n' + '═'.repeat(60));
        console.log(chalk.cyan('📱 Phone Number: +' + inputPhoneNumber));
        
        const code = await sock.requestPairingCode(inputPhoneNumber);
        const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;
        
        console.log(chalk.green.bold('🔑 PAIRING CODE:'));
        console.log(chalk.white.bgBlack.bold(`    ${formattedCode}    `));
        console.log('═'.repeat(60));
        console.log(chalk.yellow('📌 INSTRUCTIONS:'));
        console.log(chalk.yellow('1. Open WhatsApp → Settings → Linked Devices'));
        console.log(chalk.yellow('2. Tap "Link a Device"'));
        console.log(chalk.yellow('3. Enter the code above'));
        console.log('═'.repeat(60));
        console.log(chalk.cyan('⏳ Code valid for 30 seconds'));
        console.log('═'.repeat(60));
        
        return formattedCode;
        
    } catch (error) {
        console.log(chalk.red('❌ Failed to get pairing code:'), error.message);
        return null;
    }
}

// Utility Functions
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
    showBanner();
    
    // Get session ID from environment or config
    const sessionID = process.env.SESSION_ID || config.SESSION_ID;
    const hasSessionID = sessionID && sessionID.trim() !== '';
    
    if (hasSessionID) {
        log(`🔑 Session ID detected (${sessionID.length} chars)`, 'info');
    } else {
        log('⚠️ No session ID found, using pairing code', 'warning');
    }
    
    // Setup session
    let usePairing = false;
    
    if (hasSessionID) {
        const sessionValid = await setupSessionFromID(sessionID);
        usePairing = !sessionValid;
        
        if (usePairing) {
            log('⚠️ Switching to pairing code method', 'warning');
        }
    } else {
        usePairing = true;
    }

    const sessionPath = './sessions';
    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }

    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const { version } = await fetchLatestBaileysVersion();

        sock = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, P({ level: "fatal" }).child({ level: "fatal" })),
            },
            logger: P({ level: 'silent' }),
            printQRInTerminal: false, // NO QR CODE
            browser: Browsers.ubuntu('Chrome'),
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            retryRequestDelayMs: 1000,
            maxMsgRetryCount: 3,
        });

        sock.ev.on('creds.update', saveCreds);

        // Request pairing code if needed
        if (usePairing && sock && !sock.authState.creds.registered) {
            setTimeout(async () => {
                await showPairingCode(sock);
            }, 3000);
        }

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect } = update;
            
            if (connection === 'close') {
                isConnected = false;
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                
                if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                    log('❌ Logged out from WhatsApp!', 'error');
                    
                    // Clean session
                    if (fs.existsSync('./sessions')) {
                        fs.rmSync('./sessions', { recursive: true });
                        log('🗑️  Cleaned expired session', 'info');
                    }
                    
                    process.exit(1);
                }
                
                retryCount++;
                if (retryCount < maxRetries) {
                    const delayTime = Math.min(3000 * retryCount, 10000);
                    log(`🔄 Reconnecting... (${retryCount}/${maxRetries})`, 'info');
                    setTimeout(() => startBot(), delayTime);
                } else {
                    log('❌ Max retries reached!', 'error');
                    process.exit(1);
                }
            }

            if (connection === 'open') {
                isConnected = true;
                retryCount = 0;
                
                log('✅ Connected successfully! ALL PLUGINS READY!', 'success');
                
                // Get bot info
                const botNumber = sock.user?.id || 'Unknown';
                const botName = sock.user?.name || config.BOT_NAME;
                
                console.log('\n' + '═'.repeat(60));
                console.log(chalk.green.bold('╭━━【 𝐁𝐎𝐓 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃 】━━━━━━━━╮'));
                console.log(chalk.cyan(`│ 📱 Number: ${botNumber}`));
                console.log(chalk.cyan(`│ 🤖 Name: ${botName}`));
                console.log(chalk.cyan(`│ 🔐 Auth: ${hasSessionID && !usePairing ? 'Session ID' : 'Pairing Code'}`));
                console.log(chalk.green('╰━━━━━━━━━━━━━━━━━━━━╯'));
                console.log('═'.repeat(60));
                
                // Send connection success message
                try {
                    sock.sendMessage(config.BOT_OWNER, {
                        text: `*╭━━━〔 🐢 𝙎𝙄𝙇𝘼 𝙈𝘿 🐢 〕━━━┈⊷*\n*┃🐢│ ✅ 𝘽𝙊𝙏 𝘾𝙊𝙉𝙉𝙀𝘾𝙏𝙀𝘿 𝙎𝙐𝘾𝘾𝙀𝙎𝙎𝙁𝙐𝙇𝙇𝙔!*\n*┃🐢│*\n*┃🐢│ 🤖 𝙉𝙖𝙢𝙚: ${config.BOT_NAME}*\n*┃🐢│ 🔐 𝘼𝙪𝙩𝙝: ${hasSessionID && !usePairing ? 'Session ID' : 'Pairing Code'}*\n*┃🐢│ 📍 𝙃𝙤𝙨𝙩: ${isHeroku ? 'Heroku' : 'Local'}*\n*┃🐢│*\n*┃🐢│ ⏰ 𝙏𝙞𝙢𝙚: ${new Date().toLocaleString()}*\n*╰━━━━━━━━━━━━━━━┈⊷*`
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

                console.log('\n' + '═'.repeat(60));
                console.log(chalk.blue.bold('╭━━【 𝐒𝐘𝐒𝐓𝐄𝐌 𝐑𝐄𝐀𝐃𝐘 】━━━━━━━━╮'));
                console.log(chalk.cyan(`│ 📱 Type ${config.PREFIX}menu to start`));
                console.log(chalk.magenta('│ 🔵 All Plugins Active'));
                console.log(chalk.green('│ ⚡ Auto Features: ON'));
                console.log(chalk.yellow('│ 📚 Commands: READY'));
                console.log(chalk.blue('╰━━━━━━━━━━━━━━━━━━━━╯'));
                console.log('═'.repeat(60));
            }
        });

    } catch (error) {
        log(`Bot start error: ${error.message}`, 'error');
        setTimeout(() => startBot(), 5000);
    }
};

// ==================== HEROKU WEB SERVER ====================
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));

// Serve HTML page
app.get('/', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🤖 ${config.BOT_NAME || 'SILA AI BOT'}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            
            body {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
            }
            
            .container {
                background: rgba(255, 255, 255, 0.95);
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                padding: 40px;
                max-width: 800px;
                width: 100%;
                animation: fadeIn 0.8s ease-out;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            
            .bot-icon {
                font-size: 60px;
                margin-bottom: 15px;
            }
            
            .title {
                color: #2d3748;
                font-size: 36px;
                font-weight: 800;
                margin-bottom: 10px;
                background: linear-gradient(45deg, #667eea, #764ba2);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            
            .subtitle {
                color: #4a5568;
                font-size: 18px;
                font-weight: 500;
            }
            
            .status-card {
                background: white;
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                border: 2px solid #e2e8f0;
            }
            
            .status-title {
                color: #2d3748;
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .status-badge {
                display: inline-block;
                padding: 8px 20px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 15px;
            }
            
            .online {
                background: #c6f6d5;
                color: #22543d;
            }
            
            .offline {
                background: #fed7d7;
                color: #742a2a;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-top: 20px;
            }
            
            .stat-box {
                background: #f7fafc;
                border-radius: 12px;
                padding: 15px;
                text-align: center;
                border: 1px solid #e2e8f0;
            }
            
            .stat-value {
                font-size: 24px;
                font-weight: 800;
                color: #4299e1;
                margin-bottom: 5px;
            }
            
            .stat-label {
                color: #4a5568;
                font-size: 12px;
                font-weight: 600;
            }
            
            .info-box {
                background: #f7fafc;
                border-radius: 12px;
                padding: 20px;
                margin-top: 20px;
                border-left: 4px solid #4299e1;
            }
            
            .info-title {
                color: #2d3748;
                font-size: 16px;
                font-weight: 700;
                margin-bottom: 10px;
            }
            
            .info-text {
                color: #4a5568;
                font-size: 14px;
                line-height: 1.6;
            }
            
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                color: #718096;
                font-size: 14px;
            }
            
            .btn {
                display: inline-block;
                background: linear-gradient(45deg, #667eea, #764ba2);
                color: white;
                padding: 12px 25px;
                border-radius: 25px;
                text-decoration: none;
                font-weight: 600;
                margin: 10px 5px;
                transition: transform 0.3s;
            }
            
            .btn:hover {
                transform: translateY(-2px);
            }
            
            @media (max-width: 768px) {
                .container {
                    padding: 20px;
                }
                
                .title {
                    font-size: 28px;
                }
                
                .stats-grid {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="bot-icon">🤖</div>
                <h1 class="title">${config.BOT_NAME || 'SILA AI BOT'}</h1>
                <p class="subtitle">Professional WhatsApp Bot System</p>
            </div>
            
            <div class="status-card">
                <h2 class="status-title">
                    <span>${isConnected ? '🟢' : '🔴'}</span> Bot Status
                </h2>
                <span class="status-badge ${isConnected ? 'online' : 'offline'}">
                    ${isConnected ? '✅ ONLINE & CONNECTED' : '⭕ OFFLINE'}
                </span>
                
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-value">${isHeroku ? 'Heroku' : 'Local'}</div>
                        <div class="stat-label">Host</div>
                    </div>
                    
                    <div class="stat-box">
                        <div class="stat-value">${process.env.SESSION_ID ? 'Session ID' : 'Pairing Code'}</div>
                        <div class="stat-label">Auth Method</div>
                    </div>
                    
                    <div class="stat-box">
                        <div class="stat-value">${pluginFiles.length}+</div>
                        <div class="stat-label">Plugins</div>
                    </div>
                    
                    <div class="stat-box">
                        <div class="stat-value">${retryCount}</div>
                        <div class="stat-label">Connections</div>
                    </div>
                </div>
            </div>
            
            <div class="info-box">
                <h3 class="info-title">📱 Bot Information</h3>
                <p class="info-text">
                    <strong>Owner:</strong> +255612491554<br>
                    <strong>Prefix:</strong> ${config.PREFIX || '.'}<br>
                    <strong>Features:</strong> Anti-Delete, Auto-Bio, Auto-Reply, Auto-Status<br>
                    <strong>Status:</strong> ${isConnected ? 'Connected to WhatsApp' : 'Not connected'}
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 25px;">
                <a href="/health" class="btn">API Health</a>
                <a href="/stats" class="btn">View Stats</a>
                <a href="https://wa.me/255612491554" class="btn" target="_blank">Contact</a>
            </div>
            
            <div class="footer">
                <p>© 2024 SILA AI BOT | Professional WhatsApp Bot</p>
                <p>All plugins active | Auto-restart enabled</p>
            </div>
        </div>
        
        <script>
            // Auto-refresh every 30 seconds
            setTimeout(() => {
                window.location.reload();
            }, 30000);
        </script>
    </body>
    </html>
    `;
    
    res.send(html);
});

// API endpoints
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        bot: config.BOT_NAME || 'SILA AI',
        connected: isConnected,
        plugins: pluginFiles.length,
        uptime: process.uptime(),
        memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        timestamp: new Date().toISOString()
    });
});

app.get('/stats', (req, res) => {
    res.json({
        bot_info: {
            name: config.BOT_NAME || 'SILA AI',
            owner: config.BOT_OWNER || '255612491554@s.whatsapp.net',
            prefix: config.PREFIX || '.',
            version: '7.0.0'
        },
        connection: {
            connected: isConnected,
            retry_count: retryCount,
            session_type: config.SESSION_ID ? 'SESSION_ID' : 'PAIRING_CODE'
        },
        system: {
            uptime: process.uptime(),
            memory_usage: process.memoryUsage(),
            node_version: process.version,
            platform: process.platform,
            heroku: isHeroku,
            plugins_count: pluginFiles.length
        }
    });
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
    if (rl) rl.close();
    if (sock) {
        try {
            sock.ws.close();
        } catch (e) {}
    }
    process.exit(0);
});

// Start the bot
startBot();
