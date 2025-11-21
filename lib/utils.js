// Utility functions
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getRandomElement = (array) => {
    return array[Math.floor(Math.random() * array.length)];
};

const isUrl = (string) => {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
};

module.exports = {
    delay,
    formatBytes,
    getRandomElement,
    isUrl
};