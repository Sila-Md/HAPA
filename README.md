# 🐢 SILA-MD WhatsApp Bot

<div align="center">

![SILA-MD Banner](https://files.catbox.moe/jwmx1j.jpg)

### 🤖 Advanced WhatsApp Bot with Multi-Device Support

[![Termux](https://img.shields.io/badge/TERMUX-READY-green?style=for-the-badge&logo=android)](https://termux.com)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-Multi--Device-brightgreen?style=for-the-badge&logo=whatsapp)](https://whatsapp.com)

</div>

## ✨ Features

| Category | Features |
|----------|----------|
| **🤖 AI & Tools** | AI Chat, Flux AI Image, Code Generator |
| **🎵 Media** | Song Downloader, Video Downloader, YouTube Downloader |
| **👥 Group** | Auto Reply, Anti Link, Tag All, Group Management |
| **⚡ Utility** | Auto Status, Auto Bio, Anti Delete, Auto Reaction |
| **🎯 Fun** | Sticker Maker, Games, Quotes, Memes |

## 🚀 Quick Deploy

### Method 1: Termux (Android)

```bash
# Update packages
pkg update && pkg upgrade

# Install dependencies
pkg install nodejs git ffmpeg -y

# Clone repository
git clone https://github.com/Sila-Md/HAPA
cd HAPA

# Install node modules
npm install

# Start the bot
npm start
```

### Method 2: Replit Deployment

[![Run on Replit](https://replit.com/badge/github/Sila-Md/HAPA)](https://replit.com/github/Sila-Md/HAPA)

1. Click the button above
2. Wait for installation
3. Run `npm start`
4. Scan QR code

### Method 3: Heroku Deployment

[![Deploy on Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/Sila-Md/HAPA)

## ⚙️ Configuration

Edit `config.js` file:

```javascript
module.exports = {
    BOT_NAME: "🐢 SILA-MD",
    BOT_OWNER: "255xxxxxxxxxx@s.whatsapp.net",
    PREFIX: ".",
    SESSION_ID: "YOUR_SESSION_ID",
    ANTI_DELETE: true,
    // ... more settings
};
```

## 📱 Commands

| Command | Description |
|---------|-------------|
| `.menu` | Show all commands |
| `.ping` | Check bot speed |
| `.alive` | Bot status |
| `.ai` [question] | Ask AI anything |
| `.song` [title] | Download music |
| `.video` [url] | Download video |
| `.flux` [text] | Generate AI image |
| `.code` | Get pairing code |
| `.antilink` on/off | Toggle anti-link |

## 🛠️ Setup Guide

### Step-by-Step Termux Installation

1. **Install Termux** from F-Droid or Play Store
2. **Copy & paste these commands:**

```bash
# Step 1: Update system
pkg update && pkg upgrade -y

# Step 2: Install required packages
pkg install nodejs git ffmpeg -y

# Step 3: Clone bot repository
git clone https://github.com/Sila-Md/HAPA
cd HAPA

# Step 4: Install dependencies
npm install

# Step 5: Configure bot
nano config.js
# Edit BOT_OWNER with your number

# Step 6: Start bot
npm start
```

3. **Scan QR Code** when prompted
4. **Bot is ready!** 🎉

## 🔧 Advanced Features

- ✅ **Multi-Device Ready**
- ✅ **24/7 Uptime**
- ✅ **Plugin System**
- ✅ **Auto Backup**
- ✅ **Error Recovery**
- ✅ **Multi-Language**

## 🌟 Premium Features

- 🎨 **AI Image Generation**
- 🎵 **High Quality Audio**
- 📹 **4K Video Download**
- 🤖 **Advanced AI Chat**
- 🔒 **Enhanced Security**

## 📞 Support

- **Developer:** Sila Team
- **WhatsApp:** [Contact](https://wa.me/255000000000)
- **GitHub:** [Sila-Md/HAPA](https://github.com/Sila-Md/HAPA)

## ⚠️ Disclaimer

This bot is for educational purposes only. Users are responsible for their usage in compliance with WhatsApp Terms of Service.

---

<div align="center">

### ⭐ Don't forget to star the repository!

**Made with ❤️ by Sila Tech**

[![GitHub stars](https://img.shields.io/github/stars/Sila-Md/HAPA?style=social)](https://github.com/Sila-Md/HAPA/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Sila-Md/HAPA?style=social)](https://github.com/Sila-Md/HAPA/network/members)

</div>
