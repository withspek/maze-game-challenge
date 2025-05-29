/**
 * Obstacles system
 * Handles traps, hazards, and other obstacles in the maze
 */

class Obstacle {
	constructor(x, y, type, cellSize, difficulty = 1) {
		this.x = x;
		this.y = y;
		this.type = type;
		this.cellSize = cellSize;
		this.difficulty = difficulty;

		// Set size based on cell size
		this.width = cellSize * 0.8;
		this.height = cellSize * 0.8;

		// Animation properties
		this.frameCount = 0;
		this.active = true;

		this.setupObstacleType();
	}

	setupObstacleType() {
		switch (this.type) {
			case "laser":
				this.color = "#ff0000";
				this.damageAmount = 20;
				this.pulseRate = 0.1;
				this.laserAngle = Math.random() * Math.PI;
				this.laserLength = this.cellSize * 2;
				break;

			case "spike":
				this.color = "#ff9900";
				this.damageAmount = 15;
				this.spikesOut = false;
				this.cycleTime = 120; // Frames for one complete cycle
				this.cyclePosition = Math.floor(Math.random() * this.cycleTime); // Random start position
				break;

			case "slowField":
				this.color = "#00ffaa";
				this.slowFactor = 0.5; // Player moves at 50% speed in field
				this.fieldRadius = this.cellSize * 1.2;
				this.damageAmount = 0; // No damage, just slows
				break;

			default:
				this.color = "#ff00ff";
				this.damageAmount = 10;
		}
	}

	update() {
		this.frameCount++;

		switch (this.type) {
			case "laser":
				// Rotate laser
				this.laserAngle += this.pulseRate;
				if (this.laserAngle > Math.PI * 2) {
					this.laserAngle -= Math.PI * 2;
				}
				break;

			case "spike": {
				// Cycle spikes in and out
				this.cyclePosition = (this.cyclePosition + 1) % this.cycleTime;

				// Spikes are out for 1/3 of the cycle
				const threshold = this.cycleTime / 3;
				this.spikesOut = this.cyclePosition < threshold;
				break;
			}

			case "slowField":
				// Pulsate the field
				this.fieldRadius =
					this.cellSize * (1.1 + Math.sin(this.frameCount * 0.05) * 0.2);
				break;
		}
	}

	checkCollision(playerBox) {
		let collides = false;

		switch (this.type) {
			case "laser": {
				// Check if the laser line intersects with the player box
				const laserEndX = this.x + Math.cos(this.laserAngle) * this.laserLength;
				const laserEndY = this.y + Math.sin(this.laserAngle) * this.laserLength;

				collides = this.lineRectIntersection(
					this.x,
					this.y,
					laserEndX,
					laserEndY,
					playerBox.x,
					playerBox.y,
					playerBox.width,
					playerBox.height,
				);
				break;
			}

			case "spike":
				// Only collides if spikes are out
				if (this.spikesOut) {
					const obstacleBox = this.getCollisionBox();
					collides = checkCollision(obstacleBox, playerBox);
				}
				break;

			case "slowField": {
				// Check if player is within the circular field
				const playerCenterX = playerBox.x + playerBox.width / 2;
				const playerCenterY = playerBox.y + playerBox.height / 2;

				const distance = calculateDistance(
					this.x,
					this.y,
					playerCenterX,
					playerCenterY,
				);
				collides = distance < this.fieldRadius;
				break;
			}

			default: {
				const obstacleBox = this.getCollisionBox();
				collides = checkCollision(obstacleBox, playerBox);
			}
		}

		return collides;
	}

	getCollisionBox() {
		return {
			x: this.x - this.width / 2,
			y: this.y - this.height / 2,
			width: this.width,
			height: this.height,
		};
	}

	// Helper function to check if a line intersects with a rectangle
	lineRectIntersection(x1, y1, x2, y2, rx, ry, rw, rh) {
		// Check if the line intersects with any of the rectangle's sides
		const left = this.lineLineIntersection(x1, y1, x2, y2, rx, ry, rx, ry + rh);
		const right = this.lineLineIntersection(
			x1,
			y1,
			x2,
			y2,
			rx + rw,
			ry,
			rx + rw,
			ry + rh,
		);
		const top = this.lineLineIntersection(x1, y1, x2, y2, rx, ry, rx + rw, ry);
		const bottom = this.lineLineIntersection(
			x1,
			y1,
			x2,
			y2,
			rx,
			ry + rh,
			rx + rw,
			ry + rh,
		);

		return left || right || top || bottom;
	}

	lineLineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
		// Calculate the direction of the lines
		const uA =
			((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) /
			((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));

		const uB =
			((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) /
			((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));

		// If uA and uB are between 0-1, lines are colliding
		return uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1;
	}

	render(ctx) {
		ctx.save();

		switch (this.type) {
			case "laser":
				this.renderLaser(ctx);
				break;

			case "spike":
				this.renderSpikes(ctx);
				break;

			case "slowField":
				this.renderSlowField(ctx);
				break;

			default:
				this.renderGenericObstacle(ctx);
		}

		ctx.restore();
	}

	renderLaser(ctx) {
		// Draw laser source
		ctx.fillStyle = "#990000";
		ctx.strokeStyle = "#ff0000";
		ctx.lineWidth = 2;

		ctx.beginPath();
		ctx.arc(this.x, this.y, this.cellSize * 0.2, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();

		// Draw laser beam
		const endX = this.x + Math.cos(this.laserAngle) * this.laserLength;
		const endY = this.y + Math.sin(this.laserAngle) * this.laserLength;

		ctx.strokeStyle = this.color;
		ctx.lineWidth = 3;
		ctx.setLineDash([5, 5]);
		ctx.globalAlpha = 0.7 + Math.sin(this.frameCount * 0.2) * 0.3;

		ctx.beginPath();
		ctx.moveTo(this.x, this.y);
		ctx.lineTo(endX, endY);
		ctx.stroke();

		// Draw glow
		ctx.lineWidth = 8;
		ctx.globalAlpha = 0.2;
		ctx.stroke();

		ctx.setLineDash([]);
	}

	renderSpikes(ctx) {
		const centerX = this.x;
		const centerY = this.y;
		const spikeSize = this.spikesOut ? this.width / 2 : this.width / 6;

		// Draw base
		ctx.fillStyle = "#553300";
		ctx.beginPath();
		ctx.arc(centerX, centerY, this.width / 4, 0, Math.PI * 2);
		ctx.fill();

		// Draw spikes
		ctx.fillStyle = this.color;

		const numSpikes = 8;
		const angleStep = (Math.PI * 2) / numSpikes;

		for (let i = 0; i < numSpikes; i++) {
			const angle = i * angleStep;

			ctx.save();
			ctx.translate(centerX, centerY);
			ctx.rotate(angle);

			// Draw triangle spike
			ctx.beginPath();
			ctx.moveTo(this.width / 6, 0);
			ctx.lineTo(this.width / 6 + spikeSize, -spikeSize / 3);
			ctx.lineTo(this.width / 6 + spikeSize, spikeSize / 3);
			ctx.closePath();
			ctx.fill();

			ctx.restore();
		}

		// Warning text if spikes are about to come out
		if (
			!this.spikesOut &&
			this.cyclePosition > this.cycleTime / 3 - 20 &&
			this.cyclePosition < this.cycleTime / 3
		) {
			ctx.fillStyle = "#ff0000";
			ctx.font = `${this.cellSize / 4}px Arial`;
			ctx.textAlign = "center";
			ctx.fillText("!", centerX, centerY + this.cellSize / 10);
		}
	}

	renderSlowField(ctx) {
		// Draw the slow field as a circular gradient
		const gradient = ctx.createRadialGradient(
			this.x,
			this.y,
			0,
			this.x,
			this.y,
			this.fieldRadius,
		);

		gradient.addColorStop(0, "rgba(0, 255, 170, 0.7)");
		gradient.addColorStop(0.7, "rgba(0, 255, 170, 0.3)");
		gradient.addColorStop(1, "rgba(0, 255, 170, 0)");

		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.fieldRadius, 0, Math.PI * 2);
		ctx.fill();

		// Draw the center orb
		ctx.fillStyle = "#00ffaa";
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.cellSize * 0.15, 0, Math.PI * 2);
		ctx.fill();

		// Draw pulsing rings
		const ringPhase = this.frameCount % 60;
		if (ringPhase < 30) {
			const ringRadius = (ringPhase / 30) * this.fieldRadius;

			ctx.strokeStyle = `rgba(0, 255, 170, ${1 - ringPhase / 30})`;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(this.x, this.y, ringRadius, 0, Math.PI * 2);
			ctx.stroke();
		}
	}

	renderGenericObstacle(ctx) {
		// Draw a generic hazard symbol
		ctx.fillStyle = this.color;
		ctx.strokeStyle = "#ffffff";
		ctx.lineWidth = 2;

		// Draw hazard triangle
		ctx.beginPath();
		ctx.moveTo(this.x, this.y - this.height / 2);
		ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2);
		ctx.lineTo(this.x - this.width / 2, this.y + this.height / 2);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();

		// Draw warning symbol
		ctx.fillStyle = "#000000";
		ctx.font = `bold ${this.cellSize / 2}px Arial`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText("!", this.x, this.y);
	}
}

class ObstacleManager {
	constructor() {
		this.obstacles = [];
	}

	generateObstacles(maze, cellSize, count, difficulty) {
		this.obstacles = [];

		// Get valid empty cells from the maze
		const emptyCells = [];
		for (let y = 0; y < maze.rows; y++) {
			for (let x = 0; x < maze.cols; x++) {
				// Don't place obstacles in the first few cells or near the exit (if it exists)
				const isSafeArea = x < 2 && y < 2;
				const isNearExit =
					maze.exit &&
					Math.abs(x - maze.exit.x) < 2 &&
					Math.abs(y - maze.exit.y) < 2;

				if (!isSafeArea && !isNearExit) {
					emptyCells.push({ x, y });
				}
			}
		}

		// Randomly shuffle the empty cells
		for (let i = emptyCells.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[emptyCells[i], emptyCells[j]] = [emptyCells[j], emptyCells[i]];
		}

		// Create obstacles
		const obstacleTypes = ["spike", "laser", "slowField"];

		for (let i = 0; i < Math.min(count, emptyCells.length); i++) {
			const cell = emptyCells[i];
			const type = obstacleTypes[i % obstacleTypes.length]; // Cycle through types

			// Create obstacle in center of cell
			const x = (cell.x + 0.5) * cellSize;
			const y = (cell.y + 0.5) * cellSize;

			this.obstacles.push(new Obstacle(x, y, type, cellSize, difficulty));
		}
	}

	update() {
		for (const obstacle of this.obstacles) {
			obstacle.update();
		}
	}

	checkCollisions(player) {
		for (const obstacle of this.obstacles) {
			if (
				obstacle.active &&
				obstacle.checkCollision(player.getCollisionBox())
			) {
				return obstacle;
			}
		}
		return null;
	}

	render(ctx) {
		for (const obstacle of this.obstacles) {
			obstacle.render(ctx);
		}
	}

	renderDebug(ctx) {
		ctx.save();

		for (const obstacle of this.obstacles) {
			const x = obstacle.x;
			const y = obstacle.y;

			// Draw bounding box
			ctx.strokeStyle = "#ff0000";
			ctx.lineWidth = 2;
			const box = obstacle.getCollisionBox();
			ctx.strokeRect(box.x, box.y, box.width, box.height);

			// Draw label above the obstacle
			ctx.fillStyle = "#ff0000";
			ctx.font = "12px monospace";
			ctx.textAlign = "center";
			ctx.fillText(obstacle.type, x, y - 15);

			// For damage-dealing obstacles, show damage amount
			if (obstacle.damageAmount > 0) {
				ctx.fillText(`-${obstacle.damageAmount}`, x, y - 30);
			}

			// For slow fields, show slow factor
			if (obstacle.type === "slowField") {
				ctx.fillText(`x${obstacle.slowFactor}`, x, y - 30);
			}
		}

		ctx.restore();
	}
}
