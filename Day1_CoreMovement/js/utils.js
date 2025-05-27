/**
 * Utility functions for FutureskillsArtifact game
 */

// Random number generator between min and max (inclusive)
const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Color utilities
const generateNeonColor = () => {
    const neonColors = [
        '#ff00ff', // magenta
        '#00ffff', // cyan
        '#00ff00', // green
        '#ffff00', // yellow
        '#ff9900', // orange
        '#ff0099'  // pink
    ];
    return neonColors[getRandomInt(0, neonColors.length - 1)];
};

// Procedural texture generation
const generateNoiseTexture = (ctx, width, height, color = '#ffffff', alpha = 0.1) => {
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255;
        
        // Parse color to RGB
        const hexToRgb = (hex) => {
            const bigint = parseInt(hex.slice(1), 16);
            return {
                r: (bigint >> 16) & 255,
                g: (bigint >> 8) & 255,
                b: bigint & 255
            };
        };
        
        const rgb = hexToRgb(color);
        
        data[i] = rgb.r;
        data[i + 1] = rgb.g;
        data[i + 2] = rgb.b;
        data[i + 3] = value * alpha;
    }
    
    return imageData;
};

// Draw rounded rectangle
const drawRoundedRect = (ctx, x, y, width, height, radius, fill = true, stroke = false) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    
    if (fill) {
        ctx.fill();
    }
    
    if (stroke) {
        ctx.stroke();
    }
};

// Collision detection between two rectangles
const checkCollision = (rect1, rect2) => {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
};

// Simple audio generator
const generateTone = (frequency, duration, volume = 0.5, type = 'sine') => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.value = volume;
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    setTimeout(() => {
        oscillator.stop();
        audioContext.close();
    }, duration);
}; 