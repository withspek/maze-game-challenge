/**
 * Utility functions for FutureskillsArtifact game
 */

// Random number generator between min and max (inclusive)
const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Random float between min and max
const getRandomFloat = (min, max) => {
    return Math.random() * (max - min) + min;
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

// Get HSL color string from hue value
const getHSLColor = (hue, saturation = 100, lightness = 50) => {
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
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

// Generate a gradient texture
const generateGradientTexture = (ctx, width, height, color1, color2, vertical = true) => {
    const gradient = vertical 
        ? ctx.createLinearGradient(0, 0, 0, height)
        : ctx.createLinearGradient(0, 0, width, 0);
    
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
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

// Calculate distance between two points
const calculateDistance = (x1, y1, x2, y2) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

// Lerp (linear interpolation) between two values
const lerp = (start, end, amt) => {
    return (1 - amt) * start + amt * end;
};

// Save game state to localStorage
const saveGameState = (state) => {
    try {
        localStorage.setItem('futureskillsArtifact', JSON.stringify(state));
        return true;
    } catch (e) {
        console.error('Failed to save game state:', e);
        return false;
    }
};

// Load game state from localStorage
const loadGameState = () => {
    try {
        const state = localStorage.getItem('futureskillsArtifact');
        return state ? JSON.parse(state) : null;
    } catch (e) {
        console.error('Failed to load game state:', e);
        return null;
    }
};

// Create particles at a position
const createParticles = (count, x, y, color, size = 5, life = 30, speed = 2) => {
    const particles = [];
    
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = {
            x: Math.cos(angle) * speed * Math.random(),
            y: Math.sin(angle) * speed * Math.random()
        };
        
        particles.push({
            x,
            y,
            size: size * Math.random(),
            color,
            velocity,
            life: Math.max(10, life * Math.random()),
            maxLife: life,
            alpha: 1
        });
    }
    
    return particles;
}; 