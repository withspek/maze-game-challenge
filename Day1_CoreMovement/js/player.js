class Player {
	constructor(maze, cellSize) {
		const startCell = maze.getRandomEmptyCell();

		this.x = (startCell.x + 0.5) * cellSize;
		this.y = (startCell.y + 0.5) * cellSize;

		this.width = cellSize * 0.6;
		this.height = cellSize * 0.6;

		this.speed = 2;
		this.maze = maze;
		this.cellSize = cellSize;

		this.vx = 0;
		this.vy = 0;
		this.isJumping = false;
		this.jumpHeight = 0;
		this.maxJumpHeight = 20;
		this.jumpSpeed = 2;
		this.gravity = 0.5;

		this.particles = [];
		this.particleTimer = 0;

		this.frameCount = 0;
		this.pulseValue = 0;

		this.rwandaColors = {
			blue: "#00A0D5", // Sky blue
			yellow: "#E5BE01", // Yellow
			green: "#20603D", // Green
		};

		this.debug = {
			enabled: false,
			lastPosition: { x: this.x, y: this.y },
			collisionChecks: [],
			stuckFrames: 0,
		};

		this.setupControls();
	}

	setupControls() {
		this.keys = {
			up: false,
			down: false,
			left: false,
			right: false,
			space: false,
		};

		window.addEventListener("keydown", (e) => {
			this.handleKeyDown(e);
		});

		window.addEventListener("keyup", (e) => {
			this.handleKeyUp(e);
		});
	}

	handleKeyDown(e) {
		switch (e.key) {
			case "ArrowUp" || "PageUp":
				this.keys.up = true;
				e.preventDefault();
				break;
			case "ArrowDown" || "PageDown":
				this.keys.down = true;
				e.preventDefault();
				break;
			case "ArrowLeft":
				this.keys.left = true;
				e.preventDefault();
				break;
			case "ArrowRight":
				this.keys.right = true;
				e.preventDefault();
				break;
			case " ": // Spacebar
				this.keys.space = true;
				if (!this.isJumping) {
					this.isJumping = true;
					generateTone(440, 100, 0.2, "square");
				}
				e.preventDefault();
				break;
			case "d": // Toggle debug mode
				this.debug.enabled = !this.debug.enabled;
				console.log(
					`Debug mode: ${this.debug.enabled ? "enabled" : "disabled"}`,
				);
				break;
		}
	}

	handleKeyUp(e) {
		switch (e.key) {
			case "ArrowUp":
				this.keys.up = false;
				break;
			case "ArrowDown":
				this.keys.down = false;
				break;
			case "ArrowLeft":
				this.keys.left = false;
				break;
			case "ArrowRight":
				this.keys.right = false;
				break;
			case " ": // Spacebar
				this.keys.space = false;
				break;
		}
	}

	update() {
		this.debug.collisionChecks = [];

		this.frameCount++;
		this.pulseValue = Math.sin(this.frameCount * 0.1) * 0.2 + 0.8;

		this.vx = 0;
		this.vy = 0;

		// Apply movement based on key states
		if (this.keys.up) {
			this.vy = -this.speed;
		}
		if (this.keys.down) {
			this.vy = this.speed;
		}
		if (this.keys.left) {
			this.vx = -this.speed;
		}
		if (this.keys.right) {
			this.vx = this.speed;
		}

		if (this.isJumping) {
			if (this.jumpHeight < this.maxJumpHeight && this.keys.space) {
				this.jumpHeight += this.jumpSpeed;
			} else {
				this.jumpHeight -= this.gravity;
				if (this.jumpHeight <= 0) {
					this.jumpHeight = 0;
					this.isJumping = false;
				}
			}
		}

		this.debug.lastPosition = { x: this.x, y: this.y };

		this.applyMovement();

		if (this.debug.enabled) {
			const hasMoved =
				this.x !== this.debug.lastPosition.x ||
				this.y !== this.debug.lastPosition.y;
			const hasInput =
				this.keys.up || this.keys.down || this.keys.left || this.keys.right;

			if (!hasMoved && hasInput) {
				this.debug.stuckFrames++;
			} else {
				this.debug.stuckFrames = 0;
			}
		}

		this.updateParticles();

		this.particleTimer++;
		if (this.particleTimer > 5 && (this.vx !== 0 || this.vy !== 0)) {
			this.createParticle();
			this.particleTimer = 0;
		}
	}

	applyMovement() {
		const currentCellX = Math.floor(this.x / this.cellSize);
		const currentCellY = Math.floor(this.y / this.cellSize);

		// Handle horizontal movement
		if (this.vx !== 0) {
			const nextX = this.x + this.vx;
			const nextCellX = Math.floor(nextX / this.cellSize);

			let canMove = true;

			// Check if we're crossing to a new cell horizontally
			if (nextCellX !== currentCellX) {
				// Direction: 1 = right, 3 = left
				const direction = this.vx > 0 ? 1 : 3;

				// Check if there's a wall in the current cell in the direction of movement
				const hasWall = this.maze.isWall(this.x, this.y, direction);

				// Store collision check for debugging
				if (this.debug.enabled) {
					this.debug.collisionChecks.push({
						x:
							this.vx > 0
								? (currentCellX + 1) * this.cellSize
								: currentCellX * this.cellSize,
						y: this.y,
						direction,
						collision: hasWall,
					});
				}

				if (hasWall) {
					canMove = false;

					// Set a safe distance from the wall (1/3 of player width)
					const safeDistance = this.width / 3;

					// Align to the edge of the current cell with safe distance
					if (this.vx > 0) {
						// Moving right, align to right edge of current cell
						this.x = (currentCellX + 1) * this.cellSize - safeDistance;
					} else {
						// Moving left, align to left edge of current cell
						this.x = currentCellX * this.cellSize + safeDistance;
					}
				}
			}

			if (canMove) {
				this.x = nextX;

				// Additional check: don't let player cross a cell boundary if there's a wall
				// This prevents diagonal movement through walls
				const afterMoveX = Math.floor(this.x / this.cellSize);
				if (afterMoveX !== currentCellX) {
					const direction = afterMoveX > currentCellX ? 1 : 3;
					if (
						this.maze.isWall(currentCellX * this.cellSize, this.y, direction)
					) {
						this.x =
							currentCellX * this.cellSize +
							(direction === 1
								? this.cellSize - this.width / 3
								: this.width / 3);
					}
				}
			}
		}

		// Handle vertical movement
		if (this.vy !== 0) {
			const nextY = this.y + this.vy;
			const nextCellY = Math.floor(nextY / this.cellSize);

			let canMove = true;

			// Check if we're crossing to a new cell vertically
			if (nextCellY !== currentCellY) {
				// Direction: 0 = top, 2 = bottom
				const direction = this.vy > 0 ? 2 : 0;

				// Check if there's a wall in the current cell in the direction of movement
				const hasWall = this.maze.isWall(this.x, this.y, direction);

				// Store collision check for debugging
				if (this.debug.enabled) {
					this.debug.collisionChecks.push({
						x: this.x,
						y:
							this.vy > 0
								? (currentCellY + 1) * this.cellSize
								: currentCellY * this.cellSize,
						direction,
						collision: hasWall,
					});
				}

				if (hasWall) {
					canMove = false;

					// Set a safe distance from the wall (1/3 of player height)
					const safeDistance = this.height / 3;

					// Align to the edge of the current cell with safe distance
					if (this.vy > 0) {
						// Moving down, align to bottom edge of current cell
						this.y = (currentCellY + 1) * this.cellSize - safeDistance;
					} else {
						// Moving up, align to top edge of current cell
						this.y = currentCellY * this.cellSize + safeDistance;
					}
				}
			}

			if (canMove) {
				this.y = nextY;

				// Additional check: don't let player cross a cell boundary if there's a wall
				// This prevents diagonal movement through walls
				const afterMoveY = Math.floor(this.y / this.cellSize);
				if (afterMoveY !== currentCellY) {
					const direction = afterMoveY > currentCellY ? 2 : 0;
					if (
						this.maze.isWall(this.x, currentCellY * this.cellSize, direction)
					) {
						this.y =
							currentCellY * this.cellSize +
							(direction === 2
								? this.cellSize - this.height / 3
								: this.height / 3);
					}
				}
			}
		}
	}

	createParticle() {
		// Create a motion trail particle with Rwanda flag colors
		const colors = [
			this.rwandaColors.blue,
			this.rwandaColors.yellow,
			this.rwandaColors.green,
		];

		const randomColor = colors[Math.floor(Math.random() * colors.length)];

		this.particles.push({
			x: this.x,
			y: this.y + this.jumpHeight,
			size: 3 + Math.random() * 2,
			life: 20,
			color: randomColor,
		});
	}

	updateParticles() {
		// Update and remove dead particles
		for (let i = this.particles.length - 1; i >= 0; i--) {
			const particle = this.particles[i];
			particle.life--;

			if (particle.life <= 0) {
				this.particles.splice(i, 1);
			}
		}
	}

	getCollisionBox() {
		// Return the player's collision box for hit detection
		return {
			x: this.x - this.width / 2,
			y: this.y - this.height / 2 + this.jumpHeight,
			width: this.width,
			height: this.height,
		};
	}

	render(ctx) {
		ctx.save();

		this.renderParticles(ctx);

		const pulseSize = this.width * this.pulseValue;

		ctx.save();

		ctx.fillStyle = this.rwandaColors.blue;
		drawRoundedRect(
			ctx,
			this.x - pulseSize / 2,
			this.y - pulseSize / 2 - this.jumpHeight,
			pulseSize,
			pulseSize,
			6,
			true,
			false,
		);

		// Draw yellow section (middle diagonal stripe)
		ctx.fillStyle = this.rwandaColors.yellow;
		ctx.beginPath();
		ctx.moveTo(
			this.x - pulseSize / 2,
			this.y - pulseSize / 2 - this.jumpHeight + pulseSize * 0.33,
		);
		ctx.lineTo(
			this.x + pulseSize / 2,
			this.y - pulseSize / 2 - this.jumpHeight,
		);
		ctx.lineTo(
			this.x + pulseSize / 2,
			this.y - pulseSize / 2 - this.jumpHeight + pulseSize * 0.66,
		);
		ctx.lineTo(
			this.x - pulseSize / 2,
			this.y - pulseSize / 2 - this.jumpHeight + pulseSize,
		);
		ctx.closePath();
		ctx.fill();

		// Draw green section (top)
		ctx.fillStyle = this.rwandaColors.green;
		ctx.beginPath();
		ctx.moveTo(
			this.x - pulseSize / 2,
			this.y - pulseSize / 2 - this.jumpHeight,
		);
		ctx.lineTo(
			this.x + pulseSize / 2,
			this.y - pulseSize / 2 - this.jumpHeight,
		);
		ctx.lineTo(
			this.x - pulseSize / 2,
			this.y - pulseSize / 2 - this.jumpHeight + pulseSize * 0.33,
		);
		ctx.closePath();
		ctx.fill();

		// Add white border
		ctx.strokeStyle = "#ffffff";
		ctx.lineWidth = 2;
		drawRoundedRect(
			ctx,
			this.x - pulseSize / 2,
			this.y - pulseSize / 2 - this.jumpHeight,
			pulseSize,
			pulseSize,
			6,
			false,
			true,
		);

		ctx.restore();

		if (this.debug.enabled) {
			this.renderDebug(ctx);
		}

		ctx.restore();
	}

	renderParticles(ctx) {
		for (const particle of this.particles) {
			ctx.globalAlpha = particle.life / 20; // Fade out as life decreases
			ctx.fillStyle = particle.color;
			ctx.beginPath();
			ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
			ctx.fill();
		}

		ctx.globalAlpha = 1;
	}

	renderDebug(ctx) {
		const box = this.getCollisionBox();
		ctx.strokeStyle = this.debug.stuckFrames > 5 ? "red" : "yellow";
		ctx.lineWidth = 1;
		ctx.strokeRect(box.x, box.y, box.width, box.height);

		for (const check of this.debug.collisionChecks) {
			ctx.fillStyle = check.collision ? "red" : "green";
			ctx.beginPath();
			ctx.arc(check.x, check.y, 3, 0, Math.PI * 2);
			ctx.fill();

			// Draw direction indicator
			ctx.strokeStyle = "white";
			ctx.beginPath();
			ctx.moveTo(check.x, check.y);

			let dx = 0;
			let dy = 0;
			switch (check.direction) {
				case 0:
					dy = -10;
					break; // up
				case 1:
					dx = 10;
					break; // right
				case 2:
					dy = 10;
					break; // down
				case 3:
					dx = -10;
					break; // left
			}

			ctx.lineTo(check.x + dx, check.y + dy);
			ctx.stroke();
		}

		// Draw grid cell indicators
		const gridX = Math.floor(this.x / this.cellSize);
		const gridY = Math.floor(this.y / this.cellSize);

		ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
		ctx.strokeRect(
			gridX * this.cellSize,
			gridY * this.cellSize,
			this.cellSize,
			this.cellSize,
		);

		ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
		ctx.fillRect(10, 10, 200, 120);

		ctx.fillStyle = "white";
		ctx.font = "12px monospace";
		ctx.textAlign = "left";

		const cellX = Math.floor(this.x / this.cellSize);
		const cellY = Math.floor(this.y / this.cellSize);
		const lines = [
			`Pos: (${this.x.toFixed(1)}, ${this.y.toFixed(1)})`,
			`Cell: (${cellX}, ${cellY})`,
			`Vel: (${this.vx}, ${this.vy})`,
			`Jump: ${this.jumpHeight.toFixed(1)} / ${this.maxJumpHeight}`,
			`Size: ${this.width.toFixed(1)} x ${this.height.toFixed(1)}`,
			`Stuck frames: ${this.debug.stuckFrames}`,
		];

		lines.forEach((line, i) => {
			ctx.fillText(line, 20, 30 + i * 15);
		});
	}
}
