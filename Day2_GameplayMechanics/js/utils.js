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

// Collision detection between two rectangles
const checkCollision = (rect1, rect2) => {
	return (
		rect1.x < rect2.x + rect2.width &&
		rect1.x + rect1.width > rect2.x &&
		rect1.y < rect2.y + rect2.height &&
		rect1.y + rect1.height > rect2.y
	);
};

const calculateDistance = (x1, y1, x2, y2) => {
	return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};

const saveGameState = (state) => {
	try {
		localStorage.setItem("futureskillsArtifact", JSON.stringify(state));
		return true;
	} catch (e) {
		console.error("Failed to save game state:", e);
		return false;
	}
};

const loadGameState = () => {
	try {
		const state = localStorage.getItem("futureskillsArtifact");
		return state ? JSON.parse(state) : null;
	} catch (e) {
		console.error("Failed to load game state:", e);
		return null;
	}
};

const createParticles = (
	count,
	x,
	y,
	color,
	size = 5,
	life = 30,
	speed = 2,
) => {
	const particles = [];

	for (let i = 0; i < count; i++) {
		const angle = Math.random() * Math.PI * 2;
		const velocity = {
			x: Math.cos(angle) * speed * Math.random(),
			y: Math.sin(angle) * speed * Math.random(),
		};

		particles.push({
			x,
			y,
			size: size * Math.random(),
			color,
			velocity,
			life: Math.max(10, life * Math.random()),
			maxLife: life,
			alpha: 1,
		});
	}

	return particles;
};
