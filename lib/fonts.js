// Font formatting functions
const formatText = (text, style = 'normal') => {
    const fonts = {
        bold: (t) => `*${t}*`,
        italic: (t) => `_${t}_`,
        mono: (t) => '```' + t + '```',
        strike: (t) => `~${t}~`,
        fancy: (t) => {
            const fancyMap = {
                a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ғ', g: 'ɢ', h: 'ʜ', i: 'ɪ',
                j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ',
                s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ',
                A: 'ᴀ', B: 'ʙ', C: 'ᴄ', D: 'ᴅ', E: 'ᴇ', F: 'ғ', G: 'ɢ', H: 'ʜ', I: 'ɪ',
                J: 'ᴊ', K: 'ᴋ', L: 'ʟ', M: 'ᴍ', N: 'ɴ', O: 'ᴏ', P: 'ᴘ', Q: 'ǫ', R: 'ʀ',
                S: 'S', T: 'ᴛ', U: 'ᴜ', V: 'ᴠ', W: 'ᴡ', X: 'X', Y: 'ʏ', Z: 'ᴢ'
            };
            return t.split('').map(char => fancyMap[char] || char).join('');
        }
    };
    
    return fonts[style] ? fonts[style](text) : text;
};

// Apply fancy font to all text
const applyFont = (text) => {
    return formatText(text, 'fancy');
};

module.exports = {
    formatText,
    applyFont
};