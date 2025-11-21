module.exports = async (sock, sender, args, msg, { safeSendMessage, sendReaction, formatText, config }) => {
    const start = Date.now();
    await safeSendMessage(sender, { text: '🏓 *Pong!*' });
    const latency = Date.now() - start;
    
    const pingMsg = `${formatText('🏓 PING RESULTS', 'bold')}\n\n` +
                   `⚡ *Latency:* ${latency}ms\n` +
                   `💻 *Platform:* ${process.platform}\n` +
                   `📊 *Memory:* ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB\n` +
                   `🐢 *Bot:* ${config.BOT_NAME}`;
    
    await safeSendMessage(sender, { text: pingMsg });
    await sendReaction(msg, '⚡');
};