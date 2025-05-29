const getRandomInt = (min, max) => {
	const lmin = Math.ceil(min);
	const lmax = Math.floor(max);
	return Math.floor(Math.random() * (lmax - lmin + 1)) + lmin;
};

const generateNoiseTexture = (
	ctx,
	width,
	height,
	color = "#ffffff",
	alpha = 0.1,
) => {
	const imageData = ctx.createImageData(width, height);
	const data = imageData.data;

	for (let i = 0; i < data.length; i += 4) {
		const value = Math.random() * 255;

		const hexToRgb = (hex) => {
			const bigint = Number.parseInt(hex.slice(1), 16);
			return {
				r: (bigint >> 16) & 255,
				g: (bigint >> 8) & 255,
				b: bigint & 255,
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
