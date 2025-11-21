module.exports = {
    // Bot Basic Configuration
    BOT_OWNER: "255612491554@s.whatsapp.net",
    BOT_NAME: "𝚂𝙸𝙻𝙰 𝙼𝙳",
    PREFIX: ".",
    
    // Session Configuration
    SESSION_ID: "", // Add your session ID if needed
    
    // Feature Toggles
    AUTO_REPLY: true,
    AUTO_BIO: true,
    AUTO_STATUS: true,
    ANTI_DELETE: true,
    WELCOME_MSG: true,
    AUTO_READ: true,
    
    // Channel & Group Links
    CHANNELS: [
        "https://whatsapp.com/channel/0029VbBPxQTJUM2WCZLB6j28",
        "https://whatsapp.com/channel/0029VbBG4gfISTkCpKxyMH02", 
        "https://whatsapp.com/channel/0029VbBmFT430LKO7Ch9C80X"
    ],
    
    GROUPS: [
        "https://chat.whatsapp.com/IdGNaKt80DEBqirc2ek4ks",
        "https://chat.whatsapp.com/C03aOCLQeRUH821jWqRPC6"
    ],
    
    // Bot Images
    BOT_IMAGES: [
        "https://files.catbox.moe/jwmx1j.jpg",
        "https://files.catbox.moe/dlvrav.jpg"
    ],
    
    // API Configuration
    API_TIMEOUT: 30000,
    MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
    
    // Server Configuration
    PORT: process.env.PORT || 3000,
    HOST: process.env.HOST || "0.0.0.0"
};