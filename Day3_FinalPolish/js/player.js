/**
 *  Player class
 *  responsible for handling player movement and collision detection
 *  @param {Maze} maze - The maze object
 *  @param {number} cellSize - The size of the cells in the maze
 */
class Player {
	constructor(maze, cellSize) {
		const startCell = maze.getRandomEmptyCell();

		// Convert grid coordinates to pixel coordinates (center of the cell)
		this.x = (startCell.x + 0.5) * cellSize;
		this.y = (startCell.y + 0.5) * cellSize;

		this.width = cellSize * 0.6;
		this.height = cellSize * 0.6;

		this.speed = 3;
		this.maze = maze;
		this.cellSize = cellSize;

		this.vx = 0;
		this.vy = 0;
		this.isJumping = false;
		this.jumpHeight = 0;
		this.maxJumpHeight = 20;
		this.jumpSpeed = 2;
		this.gravity = 0.5;

		this.maxHealth = 100;
		this.health = this.maxHealth;
		this.invulnerable = false;
		this.invulnerableTimer = 0;
		this.invulnerableDuration = 60; // 1 second at 60 FPS
		this.isDead = false;

		this.effects = {
			slowed: {
				active: false,
				duration: 0,
				factor: 1,
			},
			damaged: {
				active: false,
				duration: 0,
			},
		};

		this.particles = [];
		this.particleTimer = 0;

		// Animation state
		this.frameCount = 0;
		this.pulseValue = 0;
s
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
			case "ArrowUp":
				this.keys.up = true;
				e.preventDefault();
				break;
			case "ArrowDown":
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
					// Play jump sound if audio manager is available
					if (typeof audioManager !== "undefined") {
						audioManager.playJumpSound();
					}
				}
				e.preventDefault();
				break;

			case "d":
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
			case "w":
				this.keys.up = false;
				break;
			case "ArrowDown":
			case "s":
				this.keys.down = false;
				break;
			case "ArrowLeft":
			case "a":
				this.keys.left = false;
				break;
			case "ArrowRight":
			case "d":
				this.keys.right = false;
				break;
			case " ": // Spacebar
				this.keys.space = false;
				break;
		}
	}

	update() {
		// If player is dead, don't process movement or effects
		if (this.isDead) {
			// Just update particles for death animation
			this.updateParticles();
			return;
		}

		// Clear collision checks from previous frame
		this.debug.collisionChecks = [];

		this.frameCount++;
		this.pulseValue = Math.sin(this.frameCount * 0.1) * 0.2 + 0.8;
		this.updateEffects();

		// Reset velocity
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

		// Apply slow effect if active
		if (this.effects.slowed.active) {
			this.vx *= this.effects.slowed.factor;
			this.vy *= this.effects.slowed.factor;
		}

		// Handle jumping
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

		// Check if player is stuck (position hasn't changed despite input)
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

		// Create motion particles occasionally
		this.particleTimer++;
		if (this.particleTimer > 5 && (this.vx !== 0 || this.vy !== 0)) {
			this.createParticle();
			this.particleTimer = 0;
		}

		// Update invulnerability timer
		if (this.invulnerable) {
			this.invulnerableTimer--;
			if (this.invulnerableTimer <= 0) {
				this.invulnerable = false;
			}
		}
	}

	updateEffects() {
		// Update slow effect
		if (this.effects.slowed.active) {
			this.effects.slowed.duration--;
			if (this.effects.slowed.duration <= 0) {
				this.effects.slowed.active = false;
				this.effects.slowed.factor = 1;
			}
		}

		// Update damage effect
		if (this.effects.damaged.active) {
			this.effects.damaged.duration--;
			if (this.effects.damaged.duration <= 0) {
				this.effects.damaged.active = false;
			}
		}
	}

	applyMovement() {
		// Calculate current grid cell
		const currentCellX = Math.floor(this.x / this.cellSize);
		const currentCellY = Math.floor(this.y / this.cellSize);

		// Calculate the center of the player
		const playerCenterX = this.x;
		const playerCenterY = this.y - this.jumpHeight / 2;

		// Store position before movement for debugging
		if (this.debug.enabled) {
			this.debug.lastPosition = { x: this.x, y: this.y };
		}

		// Handle horizontal movement
		if (this.vx !== 0) {
			const nextX = this.x + this.vx;
			const nextCellX = Math.floor(nextX / this.cellSize);

			let canMove = true;

			// Check if we're crossing to a new cell horizontally
			if (nextCellX !== currentCellX) {
				// Determine exact cell boundary position
				const boundaryX =
					this.vx > 0
						? (currentCellX + 1) * this.cellSize
						: currentCellX * this.cellSize;

				// Direction: 1 = right, 3 = left
				const direction = this.vx > 0 ? 1 : 3;

				// Check multiple points along player's height to prevent corner issues
				const checkPoints = [
					{ x: this.x, y: this.y - this.height * 0.4 }, // Top
					{ x: this.x, y: this.y }, // Middle
					{ x: this.x, y: this.y + this.height * 0.4 }, // Bottom
				];

				for (const point of checkPoints) {
					// Check if there's a wall in the current cell in the direction of movement
					const hasWall = this.maze.isWall(point.x, point.y, direction);

					// Store collision check for debugging
					if (this.debug.enabled) {
						this.debug.collisionChecks.push({
							x: boundaryX,
							y: point.y,
							direction,
							collision: hasWall,
						});
					}

					if (hasWall) {
						canMove = false;
						break;
					}
				}

				if (!canMove) {
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

					// Stop horizontal velocity to prevent "sticking" to walls
					this.vx = 0;
				}
			}

			if (canMove) {
				this.x = nextX;
			}
		}

		// Re-calculate current cell after horizontal movement
		const updatedCellX = Math.floor(this.x / this.cellSize);
		const updatedCellY = Math.floor(this.y / this.cellSize);

		// Handle vertical movement
		if (this.vy !== 0) {
			const nextY = this.y + this.vy;
			const nextCellY = Math.floor(nextY / this.cellSize);

			let canMove = true;

			// Check if we're crossing to a new cell vertically
			if (nextCellY !== updatedCellY) {
				// Determine exact cell boundary position
				const boundaryY =
					this.vy > 0
						? (updatedCellY + 1) * this.cellSize
						: updatedCellY * this.cellSize;

				// Direction: 0 = top, 2 = bottom
				const direction = this.vy > 0 ? 2 : 0;

				// Check multiple points along player's width to prevent corner issues
				const checkPoints = [
					{ x: this.x - this.width * 0.4, y: this.y }, // Left
					{ x: this.x, y: this.y }, // Middle
					{ x: this.x + this.width * 0.4, y: this.y }, // Right
				];

				for (const point of checkPoints) {
					// Check if there's a wall in the current cell in the direction of movement
					const hasWall = this.maze.isWall(point.x, point.y, direction);

					// Store collision check for debugging
					if (this.debug.enabled) {
						this.debug.collisionChecks.push({
							x: point.x,
							y: boundaryY,
							direction,
							collision: hasWall,
						});
					}

					if (hasWall) {
						canMove = false;
						break;
					}
				}

				if (!canMove) {
					const safeDistance = this.height / 3;

					// Align to the edge of the current cell with safe distance
					if (this.vy > 0) {
						// Moving down, align to bottom edge of current cell
						this.y = (updatedCellY + 1) * this.cellSize - safeDistance;
					} else {
						// Moving up, align to top edge of current cell
						this.y = updatedCellY * this.cellSize + safeDistance;
					}

					// Stop vertical velocity to prevent "sticking" to walls
					this.vy = 0;
				}
			}

			if (canMove) {
				this.y = nextY;
			}
		}

		// Additional diagonal movement checks to prevent wall corner clipping
		const finalCellX = Math.floor(this.x / this.cellSize);
		const finalCellY = Math.floor(this.y / this.cellSize);

		// If we moved diagonally to a new cell
		if (finalCellX !== currentCellX && finalCellY !== currentCellY) {
			// Check if there are walls in the diagonal path
			const horizontalWall = this.maze.isWall(
				currentCellX * this.cellSize,
				finalCellY * this.cellSize,
				finalCellX > currentCellX ? 1 : 3,
			);

			const verticalWall = this.maze.isWall(
				finalCellX * this.cellSize,
				currentCellY * this.cellSize,
				finalCellY > currentCellY ? 2 : 0,
			);

			// If we have walls in both directions, we can't move diagonally
			if (horizontalWall && verticalWall) {
				// Move back to previous position
				this.x = currentCellX * this.cellSize + this.cellSize / 2;
				this.y = currentCellY * this.cellSize + this.cellSize / 2;
			}
		}
	}

	takeDamage(amount) {
		// Don't take damage if invulnerable or already dead
		if (this.invulnerable || this.isDead) {
			return false;
		}

		// Apply damage
		this.health = Math.max(0, this.health - amount);

		// Check if player died from this damage
		if (this.health <= 0) {
			this.isDead = true;
			// Create death effect particles
			this.createDeathParticles();
		}

		this.effects.damaged.active = true;
		this.effects.damaged.duration = 30; // Half second flash

		// Make player invulnerable briefly
		this.invulnerable = true;
		this.invulnerableTimer = this.invulnerableDuration;

		// Create damage particles
		for (let i = 0; i < 10; i++) {
			// Calculate random direction and speed
			const angle = Math.random() * Math.PI * 2;
			const speed = 1 + Math.random() * 3;

			this.particles.push({
				x: this.x,
				y: this.y - this.jumpHeight,
				size: 3 + Math.random() * 5,
				life: 30,
				maxLife: 30,
				color: "#ff0000",
				velocity: {
					x: Math.cos(angle) * speed,
					y: Math.sin(angle) * speed,
				},
				alpha: 1,
			});
		}

		// Play damage sound if audio manager is available
		if (typeof audioManager !== "undefined") {
			audioManager.playHitSound();
		}

		return true;
	}

	createDeathParticles() {
		const particleCount = 30;

		for (let i = 0; i < particleCount; i++) {
			// Calculate random direction and speed
			const angle = Math.random() * Math.PI * 2;
			const speed = 1 + Math.random() * 4;

			// Colors from Rwanda flag plus some red for damage
			const colors = [
				this.rwandaColors.blue,
				this.rwandaColors.yellow,
				this.rwandaColors.green,
				"#ff0000",
			];

			this.particles.push({
				x: this.x,
				y: this.y - this.jumpHeight,
				size: 5 + Math.random() * 5,
				life: 30 + Math.random() * 30,
				maxLife: 60,
				color: colors[Math.floor(Math.random() * colors.length)],
				velocity: {
					x: Math.cos(angle) * speed,
					y: Math.sin(angle) * speed,
				},
				alpha: 1,
			});
		}
	}

	applySlowEffect(factor, duration) {
		this.effects.slowed.active = true;
		this.effects.slowed.factor = factor;
		this.effects.slowed.duration = duration;
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
			maxLife: 20,
			color: randomColor,
			velocity: { x: 0, y: 0 },
			alpha: 1,
		});
	}

	updateParticles() {
		// Update and remove dead particles
		for (let i = this.particles.length - 1; i >= 0; i--) {
			const particle = this.particles[i];

			// Update position if it has velocity
			if (particle.velocity) {
				particle.x += particle.velocity.x;
				particle.y += particle.velocity.y;
			}

			// Update life and alpha
			particle.life--;
			particle.alpha = particle.life / (particle.maxLife || 20); // Default to 20 if maxLife not set

			if (particle.life <= 0) {
				this.particles.splice(i, 1);
			}
		}
	}

	getCollisionBox() {
		return {
			x: this.x - this.width / 2,
			y: this.y - this.height / 2 + this.jumpHeight,
			width: this.width,
			height: this.height,
		};
	}

	heal(amount) {
		this.health = Math.min(this.maxHealth, this.health + amount);
	}

	render(ctx) {
		ctx.save();

		// Draw particles first (behind player)
		this.renderParticles(ctx);

		// If player is dead, don't render the player sprite, just particles
		if (!this.isDead) {
			// Draw player shadow
			ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
			ctx.beginPath();
			ctx.ellipse(
				this.x,
				this.y + this.height / 4,
				this.width / 2,
				this.height / 4,
				0,
				0,
				Math.PI * 2,
			);
			ctx.fill();

			// Handle invulnerability flashing
			if (this.invulnerable && Math.floor(this.frameCount / 4) % 2 === 0) {
				ctx.globalAlpha = 0.6;
			}

			// pulse effect
			const pulseSize = this.width * this.pulseValue;
			ctx.save();

			// If damaged, override with red color
			if (this.effects.damaged.active) {
				ctx.fillStyle = "#ff0000";
				drawRoundedRect(
					ctx,
					this.x - pulseSize / 2,
					this.y - pulseSize / 2 - this.jumpHeight,
					pulseSize,
					pulseSize,
					5,
					true,
					false,
				);
			} else {
				// Draw blue section (bottom)
				ctx.fillStyle = this.rwandaColors.blue;
				drawRoundedRect(
					ctx,
					this.x - pulseSize / 2,
					this.y - pulseSize / 2 - this.jumpHeight,
					pulseSize,
					pulseSize,
					5,
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
			}

			ctx.strokeStyle = "#ffffff";
			ctx.lineWidth = 1;
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
			this.renderHealthBar(ctx);
		}

		// Render debug elements if enabled
		if (this.debug.enabled) {
			this.renderDebug(ctx);
		}

		ctx.restore();
	}

	renderHealthBar(ctx) {
		const barWidth = this.width * 1.2;
		const barHeight = 4;
		const barX = this.x - barWidth / 2;
		const barY = this.y - this.height - this.jumpHeight - 10;

		// Draw background
		ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
		ctx.fillRect(barX, barY, barWidth, barHeight);

		// Draw health
		const healthPercent = this.health / this.maxHealth;
		ctx.fillStyle =
			healthPercent > 0.6
				? "#00ff00"
				: healthPercent > 0.3
					? "#ffff00"
					: "#ff0000";
		ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

		// Draw border
		ctx.strokeStyle = "#ffffff";
		ctx.lineWidth = 1;
		ctx.strokeRect(barX, barY, barWidth, barHeight);
	}

	renderParticles(ctx) {
		for (const particle of this.particles) {
			ctx.globalAlpha = particle.alpha || particle.life / 20; // Use alpha if set, otherwise calculate from life
			ctx.fillStyle = particle.color;
			ctx.beginPath();
			ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
			ctx.fill();
		}

		ctx.globalAlpha = 1;
	}

	renderDebug(ctx) {
		// Only render debug info if enabled
		if (!this.debug.enabled) {
			return;
		}

		ctx.save();

		// Render collision box
		const box = this.getCollisionBox();
		ctx.strokeStyle = "#00ff00";
		ctx.lineWidth = 1;
		ctx.strokeRect(box.x, box.y, box.width, box.height);

		// Render current grid cell
		const cellX = Math.floor(this.x / this.cellSize);
		const cellY = Math.floor(this.y / this.cellSize);

		ctx.strokeStyle = "rgba(255, 255, 0, 0.5)";
		ctx.strokeRect(
			cellX * this.cellSize,
			cellY * this.cellSize,
			this.cellSize,
			this.cellSize,
		);

		// Render collision check points
		for (const check of this.debug.collisionChecks) {
			ctx.fillStyle = check.collision ? "red" : "green";
			ctx.beginPath();
			ctx.arc(check.x, check.y, 3, 0, Math.PI * 2);
			ctx.fill();

			// Label the direction
			ctx.fillStyle = "white";
			ctx.font = "10px monospace";
			ctx.textAlign = "center";
			ctx.fillText(check.direction.toString(), check.x, check.y - 10);
		}

		// Draw player velocity vector
		if (this.vx !== 0 || this.vy !== 0) {
			ctx.strokeStyle = "#00ffff";
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(this.x, this.y);
			ctx.lineTo(this.x + this.vx * 10, this.y + this.vy * 10);
			ctx.stroke();
		}

		// Draw nearest walls
		const directions = [
			{ dx: 0, dy: -1, dir: 0 }, // Top
			{ dx: 1, dy: 0, dir: 1 }, // Right
			{ dx: 0, dy: 1, dir: 2 }, // Bottom
			{ dx: -1, dy: 0, dir: 3 }, // Left
		];

		for (const dir of directions) {
			const hasWall = this.maze.isWall(this.x, this.y, dir.dir);

			if (hasWall) {
				ctx.strokeStyle = "red";
				ctx.lineWidth = 2;

				const wallX =
					cellX * this.cellSize + (dir.dx === 1 ? this.cellSize : 0);
				const wallY =
					cellY * this.cellSize + (dir.dy === 1 ? this.cellSize : 0);

				const wallLength = this.cellSize;

				ctx.beginPath();
				if (dir.dx === 0) {
					// Horizontal wall
					ctx.moveTo(cellX * this.cellSize, wallY);
					ctx.lineTo(cellX * this.cellSize + wallLength, wallY);
				} else {
					// Vertical wall
					ctx.moveTo(wallX, cellY * this.cellSize);
					ctx.lineTo(wallX, cellY * this.cellSize + wallLength);
				}
				ctx.stroke();
			}
		}

		ctx.restore();
	}
}
