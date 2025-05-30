// Random number generator between min and max (inclusive)
const getRandomInt = (min, max) => {
	const lmin = Math.ceil(min);
	const lmax = Math.floor(max);
	return Math.floor(Math.random() * (lmax - lmin + 1)) + lmin;
};

const drawRoundedRect = (
	ctx,
	x,
	y,
	width,
	height,
	radius,
	fill = true,
	stroke = false,
) => {
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

const checkCollision = (rect1, rect2) => {
	return (
		rect1.x < rect2.x + rect2.width &&
		rect1.x + rect1.width > rect2.x &&
		rect1.y < rect2.y + rect2.height &&
		rect1.y + rect1.height > rect2.y
	);
};

const calculateDistance = (x1, y1, x2, y2) => {
	const dx = x2 - x1;
	const dy = y2 - y1;
	return Math.sqrt(dx * dx + dy * dy);
};

// These functions have been moved to the Game class
// and are kept here only for backward compatibility
// with any code that might still be using them
const saveGameState = (state) => {
	console.warn('saveGameState in utils.js is deprecated. Use game.saveGameState() instead.');
	if (window.gameInstance) {
		window.gameInstance.saveGameState(state.completed);
		return true;
	}
	return false;
};

const loadGameState = () => {
	console.warn('loadGameState in utils.js is deprecated. Use game.loadGameState() instead.');
	if (window.gameInstance) {
		return window.gameInstance.loadGameState();
	}
	return null;
};

const isValidCollisionBox = (box) => {
	return (
		box &&
		typeof box.x === "number" &&
		typeof box.y === "number" &&
		typeof box.width === "number" &&
		typeof box.height === "number" &&
		box.width > 0 &&
		box.height > 0
	);
};
