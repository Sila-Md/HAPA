const express = require('express');
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode');
const { useMultiFileAuthState, makeWASocket, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Store active sessions
let activeSessions = new Map();

// Website Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/qr', async (req, res) => {
    try {
        const sessionId = `session_${Date.now()}`;
        const sessionPath = path.join(__dirname, 'sessions', sessionId);
        
        if (!fs.existsSync(sessionPath)) {
            fs.mkdirSync(sessionPath, { recursive: true });
        }

        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version: version.version,
            auth: state,
            printQRInTerminal: false,
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { qr, connection } = update;
            
            if (qr) {
                const qrCode = await qrcode.toDataURL(qr);
                activeSessions.set(sessionId, { sock, qrCode, sessionPath });
            }

            if (connection === 'open') {
                console.log(`✅ Session ${sessionId} connected!`);
                // Clean up after successful connection
                setTimeout(() => {
                    activeSessions.delete(sessionId);
                }, 5000);
            }
        });

        // Send latest QR code
        setTimeout(() => {
            const session = activeSessions.get(sessionId);
            if (session && session.qrCode) {
                res.json({ 
                    success: true, 
                    qrCode: session.qrCode,
                    sessionId: sessionId
                });
            } else {
                res.json({ 
                    success: false, 
                    message: 'QR code not generated yet' 
                });
            }
        }, 2000);

    } catch (error) {
        res.json({ 
            success: false, 
            message: `Error: ${error.message}` 
        });
    }
});

app.get('/pair', async (req, res) => {
    try {
        const { number } = req.query;
        if (!number) {
            return res.json({ success: false, message: 'Phone number required' });
        }

        const sessionId = `pair_${Date.now()}`;
        const sessionPath = path.join(__dirname, 'sessions', sessionId);
        
        if (!fs.existsSync(sessionPath)) {
            fs.mkdirSync(sessionPath, { recursive: true });
        }

        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version: version.version,
            auth: state,
            printQRInTerminal: false,
        });

        sock.ev.on('creds.update', saveCreds);

        const pairingCode = await sock.requestPairingCode(number);
        const formattedCode = pairingCode.match(/.{1,4}/g)?.join('-');

        activeSessions.set(sessionId, { sock, sessionPath });

        res.json({
            success: true,
            pairingCode: formattedCode,
            sessionId: sessionId
        });

    } catch (error) {
        res.json({ 
            success: false, 
            message: `Error: ${error.message}` 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Sila MD Website running on port ${PORT}`);
    console.log(`🌐 Open http://localhost:${PORT} in your browser`);
});