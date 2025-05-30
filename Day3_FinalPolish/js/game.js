/**
 * Main Game controller class
 * responsinble for rendering the game and updating the game state
 */
class Game {
	constructor() {
		this.canvas = document.getElementById("gameCanvas");
		this.ctx = this.canvas.getContext("2d");

		// Game configuration
		this.width = this.canvas.width;
		this.height = this.canvas.height;
		this.cellSize = 40;
		this.difficulty = 1;

		// Debug mode
		this.debugMode = false;
		this.showShortestPath = false;
		this.showAllArtifacts = true;
		this.showObstacles = true;
		this.targetArtifactIndex = -1;

		// Game state
		this.running = false;
		this.paused = false;
		this.gameOver = false;
		this.win = false;
		this.stage = 1;
		this.maxStage = 3;
		this.timer = 180; // 3 minutes per stage
		this.artifactsCollected = 0;
		this.totalArtifacts = 3;
		this.isExitingStage = false; // Flag to prevent multiple completions

		// Stage themes
		this.themes = {
			1: {
				name: "Colorful Rwanda",
				wallColor: "#00A0D5", // Rwanda blue
				floorColor: "#001122",
				floorDetailColor: "#20603D", // Rwanda green
				backgroundColor: "#000022",
				particleColors: ["#00A0D5", "#E5BE01", "#20603D"], // Rwanda flag colors
			},
			2: {
				name: "Digital Sky",
				wallColor: "#00ccff",
				floorColor: "#001133",
				floorDetailColor: "#003366",
				backgroundColor: "#000033",
				particleColors: ["#00ccff", "#0099ff", "#66ffff"],
			},
			3: {
				name: "Future Campus",
				wallColor: "#00ff99",
				floorColor: "#002211",
				floorDetailColor: "#004422",
				backgroundColor: "#001100",
				particleColors: ["#00ff99", "#33cc66", "#66ffcc"],
			},
		};

		this.currentTheme = this.themes[1];

		// Camera/viewport (for scrolling if maze is larger than screen)
		this.cameraX = 0;
		this.cameraY = 0;

		// Game objects
		this.maze = null;
		this.player = null;
		this.artifacts = [];
		this.obstacleManager = new ObstacleManager();

		// Time tracking
		this.lastTime = 0;
		this.timeElapsed = 0;
		this.frameCount = 0;

		// UI
		this.hudElement = document.getElementById("hud");
		this.timerElement = document.getElementById("timer");
		this.artifactsElement = document.getElementById("artifacts");
		this.healthElement = document.getElementById("health");
		this.stageElement = document.querySelector(".stage-indicator");

		// Performance optimization
		this.offscreenCanvas = document.createElement("canvas");
		this.offscreenCanvas.width = this.width;
		this.offscreenCanvas.height = this.height;
		this.offscreenCtx = this.offscreenCanvas.getContext("2d");

		// Background effects
		this.backgroundParticles = [];
		this.generateBackgroundParticles();

		if (typeof audioManager !== "undefined") {
			// Init will be called on first user interaction
			this.hasAudio = true;
		} else {
			this.hasAudio = false;
		}

		// Track keys for special combinations
		this.activeKeys = {};

		this.animationFrameId = null;

		this.stageSkills = {
			1: ["ai", "cybersecurity", "machine-learning"],
			2: ["cloud", "data-science", "iot"],
			3: ["blockchain", "robotics", "quantum-computing"],
		};

		window.addEventListener("keydown", (e) => {
			this.activeKeys[e.key] = true;

			// Debug victory trigger with V key when in debug mode
			if (e.key === "v" && this.debugMode) {
				console.log("Victory screen triggered manually");
				this.stage = this.maxStage; // Set to final stage
				this.artifactsCollected = this.totalArtifacts; // Set artifacts collected
				this.isExitingStage = true;
				this.completeStage();
				e.preventDefault();
			}

			// Debug combination: Ctrl+Alt+3 to force final stage completion
			if (
				this.activeKeys.Control &&
				this.activeKeys.Alt &&
				this.activeKeys["3"]
			) {
				console.log("Cheat code activated: Victory screen");
				this.stage = this.maxStage;
				this.artifactsCollected = this.totalArtifacts;
				this.isExitingStage = true;
				this.completeStage();
				e.preventDefault();
			}

			// Handle ESC key for pause/menu
			if (e.key === "Escape" && this.running) {
				this.togglePause();
				e.preventDefault();
			}

			// Toggle debug mode with F1 key
			if (e.key === "F1") {
				this.toggleDebugMode();
				e.preventDefault();
			}

			// Toggle shortest path with F2 key
			if (e.key === "F2" && this.debugMode) {
				this.toggleShortestPath();
				e.preventDefault();
			}

			// Cycle through artifacts with F3 key
			if (e.key === "F3" && this.debugMode && this.showShortestPath) {
				this.cycleTargetArtifact();
				e.preventDefault();
			}

			// Toggle artifact visibility with F4 key
			if (e.key === "F4" && this.debugMode) {
				this.showAllArtifacts = !this.showAllArtifacts;
				console.log(
					`Show all artifacts: ${this.showAllArtifacts ? "ON" : "OFF"}`,
				);
				e.preventDefault();
			}

			// Toggle obstacle visibility with F5 key
			if (e.key === "F5" && this.debugMode) {
				this.showObstacles = !this.showObstacles;
				console.log(`Show obstacles: ${this.showObstacles ? "ON" : "OFF"}`);
				e.preventDefault();
			}

			if (this.hasAudio && !audioManager.initialized) {
				audioManager.init();
			}
		});

		window.addEventListener("keyup", (e) => {
			delete this.activeKeys[e.key];
		});
		
		window.addEventListener("beforeunload", () => {
			// Only save if the game is actually running (not game over, not paused, not completed)
			if (this.running && !this.gameOver && !this.win) {
				this.saveGameState(false);
			}
		});

		this.menuSystem = new MenuSystem(this);
	}

	startNewGame() {
		this.stage = 1;
		this.gameOver = false;
		this.win = false;
		this.isExitingStage = false;
		this.initStage(true);
		
		this.backgroundParticles = [];
		this._victoryRendered = false;
		
		this.saveGameState(false);
		
		this.running = true;
		this.lastTime = performance.now();
		
		// Ensure only one animation frame is running
		if (this.animationFrameId) {
			cancelAnimationFrame(this.animationFrameId);
		}
		this.animationFrameId = requestAnimationFrame((timestamp) =>
			this.gameLoop(timestamp),
		);
	}

	loadSavedGame() {
		const savedState = this.loadGameState();
		if (savedState) {
			// Set stage and difficulty from saved state
			this.stage = savedState.stage || 1;
			this.difficulty = savedState.difficulty || this.difficulty;
			this.isExitingStage = false;
			
			// Store timer value to use after initialization
			const savedTimer = savedState.timeRemaining;
			
			// Initialize the stage first (preserve timer)
			this.initStage(true, true);
			
			// Create player and restore health
			this.player = new Player(this.maze, this.cellSize);
			if (savedState.health) {
				this.player.health = savedState.health;
			}
			
			// Restore artifacts collected
			if (typeof savedState.artifacts === 'number') {
				this.artifactsCollected = Math.min(savedState.artifacts, this.totalArtifacts);
				
				// Mark the appropriate number of artifacts as collected
				for (let i = 0; i < this.artifactsCollected && i < this.artifacts.length; i++) {
					this.artifacts[i].collected = true;
				}
			}
			if (typeof savedTimer === 'number') {
				this.timer = savedTimer;
			}
			
			this.updateHUD();
			
			// Start game
			this.running = true;
			this.lastTime = performance.now();
			if (this.animationFrameId) {
				cancelAnimationFrame(this.animationFrameId);
			}
			this.animationFrameId = requestAnimationFrame((timestamp) =>
				this.gameLoop(timestamp),
			);
			
			console.log('Game state restored successfully', savedState);
		} else {
			this.startNewGame();
		}
	}

	initStage(isNewGame = false, preserveTimer = false) {
		try {
			// Reset exit flag
			this.isExitingStage = false;

			this.currentTheme = this.themes[this.stage];

			// Scale difficulty based on stage and settings
			const stageDifficulty = this.stage * this.difficulty;

			this.maze = new Maze(
				this.width,
				this.height,
				this.cellSize,
				stageDifficulty,
			);

			if (!this.player || isNewGame) {
				this.player = new Player(this.maze, this.cellSize);
			} else {
				// Store reference to the new maze
				this.player.maze = this.maze;

				// Move existing player to a new starting position
				const startCell = this.maze.getRandomEmptyCell();
				this.player.x = (startCell.x + 0.5) * this.cellSize;
				this.player.y = (startCell.y + 0.5) * this.cellSize;

				// Reset velocity to prevent wall clipping on stage transition
				this.player.vx = 0;
				this.player.vy = 0;

				// Heal player slightly between stages
				this.player.heal(20);

				// Reset death state if needed
				this.player.isDead = false;

				// Clear any active effects or particles
				this.player.particles = [];
				if (this.player.effects) {
					this.player.effects.damaged.active = false;
					if (this.player.effects.slow) {
						this.player.effects.slow.active = false;
					}
				}
			}

			// Create artifacts
			const skills = this.stageSkills[this.stage] || this.stageSkills[1];
			this.totalArtifacts = skills.length;
			this.artifacts = [];
			this.artifactsCollected = 0;
			for (let i = 0; i < skills.length; i++) {
				this.artifacts.push(new Artifact(this.maze, this.cellSize, skills[i]));
			}

			// Generate obstacles (more with higher difficulty and stage)
			const obstacleCount = 2 + stageDifficulty * 2; // Increase more per stage
			this.obstacleManager.generateObstacles(
				this.maze,
				this.cellSize,
				obstacleCount,
				stageDifficulty,
			);

			// Reset timer based on difficulty (less time on higher difficulty)
			// Only reset timer if not preserving existing timer
			if (!preserveTimer) {
				this.timer = Math.max(60, 180 - (this.difficulty - 1) * 20);
			}
			this.generateBackgroundParticles();
			this.updateHUD();

			if (this.stageElement) {
				this.stageElement.textContent = `Stage: ${this.stage}/${this.maxStage} - ${this.currentTheme.name}`;
			}

		} catch (error) {
			console.error("Error initializing stage:", error);
			// Fallback to a basic setup if initialization fails
			this.maze = new Maze(this.width, this.height, this.cellSize, 1);
			this.player = new Player(this.maze, this.cellSize);
			this.artifacts = [];
			this.timer = 120;
			this.updateHUD();
		}
	}

	togglePause() {
		this.paused = !this.paused;
		if (this.paused) {
			// Show pause menu
			this.renderPauseMenu();
			if (this.animationFrameId) {
				cancelAnimationFrame(this.animationFrameId);
				this.animationFrameId = null;
			}
		} else {
			// Resume game
			this.lastTime = performance.now();
			if (!this.animationFrameId) {
				this.animationFrameId = requestAnimationFrame((timestamp) =>
					this.gameLoop(timestamp),
				);
			}
		}
	}

	gameLoop(timestamp) {
		this.animationFrameId = null; // clear before possibly setting again
		const deltaTime = timestamp - this.lastTime;
		this.lastTime = timestamp;

		// if game is paused, don't update
		if (this.paused) {
			this.renderPauseMenu();
			return;
		}

		// if game is over but player won, continue animation for particles
		if (this.gameOver && this.win) {
			this.frameCount++;

			this.ctx.clearRect(0, 0, this.width, this.height);
			this.updateBackgroundParticles();

			if (!this._victoryRendered) {
				this.renderVictory();
			} else {
				// Just update the particles animation without redrawing everything
				this.createVictoryBackground();
				this.drawCertificate(this.currentTheme);
			}

			// Continue game loop for particle animations
			this.animationFrameId = requestAnimationFrame((timestamp) =>
				this.gameLoop(timestamp),
			);
			return;
		}

		// if game is over (and not victory), we need to render the game over screen just once
		// and then stop the game loop from continuing further updates
		if (this.gameOver) {
			// if player is dead, animate death particles before showing game over screen
			if (this.player?.isDead) {
				this.player.updateParticles();
				this.render();
				this.animationFrameId = requestAnimationFrame((timestamp) =>
					this.gameLoop(timestamp),
				);
			}
			return;
		}

		// If a popup is showing, don't update the game
		if (typeof popupManager !== "undefined" && popupManager.isPopupVisible()) {
			this.animationFrameId = requestAnimationFrame((timestamp) =>
				this.gameLoop(timestamp),
			);
			return;
		}

		// Update frame counter
		this.frameCount++;

		// Update timer (every second)
		this.timeElapsed += deltaTime;
		if (this.timeElapsed >= 1000) {
			this.timer--;
			this.timeElapsed -= 1000;
			this.updateHUD();

			// Check for time out
			if (this.timer <= 0) {
				this.gameOver = true;
				this.win = false;
				this.running = false;
				
				// Clear any saved game state
				this.clearGameState();

				// Play game over sound
				if (this.hasAudio) {
					audioManager.playGameOverSound();
				}

				// Render game over screen immediately
				this.renderGameOver();
				return;
			}
		}
		this.update();
		this.render();
		if (this.running) {
			this.animationFrameId = requestAnimationFrame((timestamp) =>
				this.gameLoop(timestamp),
			);
		}
	}

	update() {
		this.player.update();

		if (this.player.isDead && !this.gameOver) {
			// Set game over state
			this.gameOver = true;
			this.win = false;
			this.running = false;
			
			// Clear any saved game state
			this.clearGameState();

			// Play game over sound
			if (this.hasAudio) {
				audioManager.playGameOverSound();
			}

			// Render game over screen after a short delay for death animation
			setTimeout(() => {
				console.log("Rendering game over screen...");
				this.renderGameOver();
			}, 1500);

			return;
		}

		for (const artifact of this.artifacts) {
			artifact.update();
		}
		this.obstacleManager.update();
		this.updateBackgroundParticles();

		// Check for collisions with artifacts
		for (const artifact of this.artifacts) {
			if (
				!artifact.collected &&
				checkCollision(
					this.player.getCollisionBox(),
					artifact.getCollisionBox(),
				)
			) {
				if (artifact.collect()) {
					this.artifactsCollected++;
					this.updateHUD();

					// Play collection sound
					if (this.hasAudio) {
						audioManager.playCollectSound();
					}

					// Show educational popup
					if (typeof popupManager !== "undefined") {
						// Show popup with artifact type and continue the game when closed
						popupManager.show(artifact.type, () => {
							// Continue the game after popup is closed
							// No auto completion when all artifacts are collected
						});
					}
				}
			}
		}

		// Check if player has reached the exit after collecting all artifacts
		if (
			this.artifactsCollected >= this.totalArtifacts &&
			!this.isExitingStage
		) {
			// Get player grid position
			const playerGridX = Math.floor(this.player.x / this.cellSize);
			const playerGridY = Math.floor(this.player.y / this.cellSize);

			// Log player and exit positions for debugging
			if (this.debugMode) {
				console.log(
					`Player at grid: (${playerGridX}, ${playerGridY}), Exit at: (${this.maze.exit.x}, ${this.maze.exit.y})`,
				);
			}

			// Check if player is at the exit - using both isExitPosition and direct position check
			const directExitCheck =
				playerGridX === this.maze.exit.x && playerGridY === this.maze.exit.y;
			const mazeExitCheck = this.maze.isExitPosition(
				this.player.x,
				this.player.y,
			);

			if (mazeExitCheck || directExitCheck) {
				console.log("Exit reached! Completing stage...");
				this.isExitingStage = true;
				this.completeStage();
			}

			// a failsafe for stage 3 - if player is very close to exit position
			if (this.stage === this.maxStage) {
				const distToExit = Math.sqrt(
					(playerGridX - this.maze.exit.x) ** 2 +
						(playerGridY - this.maze.exit.y) ** 2,
				);

				if (distToExit < 1.5) {
					// If player is within 1.5 cells of exit
					console.log("Close to exit on final stage! Triggering completion...");
					this.isExitingStage = true;
					this.completeStage();
				}
			}
		}

		// Check for collisions with obstacles
		const obstacle = this.obstacleManager.checkCollisions(this.player);
		if (obstacle && !this.player.isDead) {
			// Apply effects based on obstacle type
			switch (obstacle.type) {
				case "laser":
				case "spike":
					// Damage player
					this.player.takeDamage(obstacle.damageAmount);
					break;

				case "slowField":
					// Apply slow effect
					this.player.applySlowEffect(obstacle.slowFactor, 60); // Slow for 1 second
					break;
			}
		}

		this.updateCamera();
		if (this.debugMode && this.showShortestPath) {
			this.updateShortestPath();
		}
	}

	generateBackgroundParticles() {
		this.backgroundParticles = [];

		const colors = this.currentTheme
			? this.currentTheme.particleColors
			: ["#00ffff", "#0099ff", "#66ffff"];

		const particleCount = 50;
		for (let i = 0; i < particleCount; i++) {
			this.backgroundParticles.push({
				x: Math.random() * this.width,
				y: Math.random() * this.height,
				size: 0.5 + Math.random() * 1.5,
				speed: 0.2 + Math.random() * 0.3,
				color: colors[Math.floor(Math.random() * colors.length)],
				angle: Math.random() * Math.PI * 2,
			});
		}
	}

	updateBackgroundParticles() {
		// Skip updating if there are too many particles (lag prevention)
		if (this.backgroundParticles.length > 200) {
			// Remove excess particles
			this.backgroundParticles.splice(0, this.backgroundParticles.length - 100);
		}

		// Process each particle
		for (let i = this.backgroundParticles.length - 1; i >= 0; i--) {
			const particle = this.backgroundParticles[i];

			// Victory screen particles have gravity and life
			if (particle.gravity) {
				// Update celebratory particle
				particle.x += Math.cos(particle.angle) * particle.speed;
				particle.y += Math.sin(particle.angle) * particle.speed;
				particle.speed += particle.gravity;
				particle.life--;

				// Update rotation if the particle has it
				if (particle.rotation) {
					particle.rotationAngle = (particle.rotationAngle || 0) + particle.rotation;
				}

				// Fade out particles near end of life
				if (particle.life < 30) {
					particle.alpha = Math.max(0, (particle.life / 30));
				}

				// Remove dead particles or those that have fallen below the screen
				if (particle.life <= 0 || particle.y > this.height + 50) {
					this.backgroundParticles.splice(i, 1);
				}
			} else {
				// Regular background particles
				particle.x += Math.cos(particle.angle) * particle.speed;
				particle.y += Math.sin(particle.angle) * particle.speed;

				// Wrap around screen
				if (particle.x < 0) particle.x = this.width;
				if (particle.x > this.width) particle.x = 0;
				if (particle.y < 0) particle.y = this.height;
				if (particle.y > this.height) particle.y = 0;

				// Occasionally change direction (less frequently)
				if (Math.random() < 0.005) {
					particle.angle = Math.random() * Math.PI * 2;
				}
			}
		}
	}

	updateCamera() {
		const targetX = this.player.x - this.width / 2;
		const targetY = this.player.y - this.height / 2;

		// Smoothly move camera toward target
		this.cameraX += (targetX - this.cameraX) * 0.1;
		this.cameraY += (targetY - this.cameraY) * 0.1;

		// Clamp camera to maze bounds
		this.cameraX = Math.max(
			0,
			Math.min(this.cameraX, this.maze.cols * this.cellSize - this.width),
		);
		this.cameraY = Math.max(
			0,
			Math.min(this.cameraY, this.maze.rows * this.cellSize - this.height),
		);
	}

	render() {
		this.ctx.fillStyle = this.currentTheme
			? this.currentTheme.backgroundColor
			: "#000022";
		this.ctx.fillRect(0, 0, this.width, this.height);

		this.ctx.save();

		this.ctx.translate(-this.cameraX, -this.cameraY);

		this.maze.render(this.ctx, this.currentTheme);

		this.obstacleManager.render(this.ctx);

		for (const artifact of this.artifacts) {
			artifact.render(this.ctx);
		}

		if (this.artifactsCollected >= this.totalArtifacts) {
			this.renderExitIndicator();
		}

		this.player.render(this.ctx);

		this.ctx.restore();

		this.renderTimerBar();

		if (this.debugMode) {
			this.renderDebugInfo();
		}
	}

	renderTimerBar() {
		const barWidth = this.width;
		const barHeight = 5;
		const progress = this.timer / 180;

		// Draw background
		this.ctx.fillStyle = "#333";
		this.ctx.fillRect(0, 0, barWidth, barHeight);

		// Draw progress
		this.ctx.fillStyle =
			progress > 0.5 ? "#00ff00" : progress > 0.25 ? "#ffff00" : "#ff0000";
		this.ctx.fillRect(0, 0, barWidth * progress, barHeight);
	}

	renderPauseMenu() {
		// Darken the screen
		this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
		this.ctx.fillRect(0, 0, this.width, this.height);

		// Draw pause menu
		this.ctx.fillStyle = "#ffffff";
		this.ctx.font = 'bold 36px "Courier New", monospace';
		this.ctx.textAlign = "center";
		this.ctx.fillText("PAUSED", this.width / 2, this.height / 2 - 60);

		this.ctx.font = '18px "Courier New", monospace';
		this.ctx.fillText("Press ESC to resume", this.width / 2, this.height / 2);
		this.ctx.fillText(
			"Press M to return to main menu",
			this.width / 2,
			this.height / 2 + 30,
		);

		// Show controls
		this.ctx.font = '16px "Courier New", monospace';
		this.ctx.fillText("Controls:", this.width / 2, this.height / 2 + 70);
		this.ctx.fillText("Arrow Keys: Move", this.width / 2, this.height / 2 + 95);
		this.ctx.fillText("Spacebar: Jump", this.width / 2, this.height / 2 + 120);
		this.ctx.fillText(
			"ESC: Pause/Resume",
			this.width / 2,
			this.height / 2 + 145,
		);

		const menuHandler = (e) => {
			if (e.key === "m" || e.key === "M") {
				this.returnToMenu();
				window.removeEventListener("keydown", menuHandler);
			}
		};

		window.addEventListener("keydown", menuHandler);
	}

	returnToMenu() {
		this.running = false;
		this.paused = false;
		
		// Clear game state if the game is over (failure case)
		if (this.gameOver && !this.win) {
			this.clearGameState();
		}
		
		this.gameOver = false;
		if (this.animationFrameId) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}

		if (this.player) {
			this.player.isDead = false;
		}

		if (this.menuSystem) {
			this.menuSystem.showMenuScreen();
			this.menuSystem.checkForSavedGame();
		} else {
			console.error("Menu system not available");
			window.location.reload();
		}
	}

	renderGameOver() {
		this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
		this.ctx.fillRect(0, 0, this.width, this.height);

		this.ctx.fillStyle = "#ff0000";
		this.ctx.font = 'bold 36px "Courier New", monospace';
		this.ctx.textAlign = "center";

		if (this.player && this.player.health <= 0) {
			this.ctx.fillText("YOU DIED!", this.width / 2, this.height / 2 - 60);
		} else {
			this.ctx.fillText("TIME'S UP!", this.width / 2, this.height / 2 - 60);
		}

		this.ctx.fillStyle = "#ffffff";
		this.ctx.font = '18px "Courier New", monospace';
		this.ctx.fillText(
			`Stage: ${this.stage} / ${this.maxStage}`,
			this.width / 2,
			this.height / 2 - 20,
		);
		this.ctx.fillText(
			`Artifacts collected: ${this.artifactsCollected} / ${this.totalArtifacts}`,
			this.width / 2,
			this.height / 2 + 10,
		);

		if (this.player) {
			this.ctx.fillText(
				`Health: ${this.player.health}%`,
				this.width / 2,
				this.height / 2 + 40,
			);
		}

		// Draw button
		this.ctx.fillStyle = "#005f8f";
		const buttonWidth = 200;
		const buttonHeight = 40;
		const buttonX = this.width / 2 - buttonWidth / 2;
		const buttonY = this.height / 2 + 80;

		this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

		this.ctx.fillStyle = "#ffffff";
		this.ctx.font = '16px "Courier New", monospace';
		this.ctx.fillText(
			"Return to Main Menu",
			this.width / 2,
			buttonY + buttonHeight / 2 + 5,
		);
		if (this._gameOverClickHandler) {
			this.canvas.removeEventListener("click", this._gameOverClickHandler);
			this._gameOverClickHandler = null;
		}

		this._gameOverClickHandler = (e) => {
			const rect = this.canvas.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			// Check if click is within button bounds
			if (
				x >= buttonX &&
				x <= buttonX + buttonWidth &&
				y >= buttonY &&
				y <= buttonY + buttonHeight
			) {
				this.canvas.removeEventListener("click", this._gameOverClickHandler);
				this._gameOverClickHandler = null;
				this.returnToMenu();
			}
		};
		this.canvas.addEventListener("click", this._gameOverClickHandler);
	}

	completeStage() {
		if (this.stage < this.maxStage) {
			if (this.hasAudio) {
				audioManager.playCompleteLevelSound();
			}
			this.performSmoothStageTransition(() => {
				// Proceed to next stage after transition
				this.stage++;

				this.initStage(false);
				this.render();
				this.running = true;
			});
		} else {
			this.running = false;
			this.gameOver = true;
			this.win = true;
			
			// Store important player data
			const playerHealth = this.player ? this.player.health : 100;
			const timeRemaining = this.timer;
			
			// Clear existing particles and create new celebration particles
			this.backgroundParticles = [];

			if (this.hasAudio) {
				audioManager.playCompleteLevelSound();
			}
			this.saveGameState(true);

			// Clear any existing timeout to prevent multiple calls
			if (this._victoryTimeout) {
				clearTimeout(this._victoryTimeout);
			}

			// Make sure the _victoryRendered flag is reset
			this._victoryRendered = false;
			
			// Ensure that we use theme 3 for the victory screen
			this.currentTheme = this.themes[3] || this.themes[this.stage];
			this._victoryTimeout = setTimeout(() => {
				// Restore player data that we need for the victory screen
				if (!this.player) {
					this.player = { health: playerHealth };
				} else {
					this.player.health = playerHealth;
				}
				this.timer = timeRemaining;
				
				if (!this.animationFrameId) {
					this.animationFrameId = requestAnimationFrame((timestamp) =>
						this.gameLoop(timestamp)
					);
				}
			}, 100);
		}
	}

	performSmoothStageTransition(callback) {
		let opacity = 0;
		const fadeStep = 0.05;
		
		const performFade = () => {
			this.ctx.fillStyle = `rgba(0, 20, 40, ${opacity})`;
			this.ctx.fillRect(0, 0, this.width, this.height);
			
			opacity += fadeStep;
			
			if (opacity < 1) {
				// Continue the fade effect
				requestAnimationFrame(performFade);
			} else {
				// Fade completed, show transition message
				this.ctx.fillStyle = "#00ffff";
				this.ctx.font = 'bold 24px "Courier New", monospace';
				this.ctx.textAlign = "center";
				this.ctx.fillText(
					`Stage ${this.stage} Complete!`,
					this.width / 2,
					this.height / 2 - 40
				);
				this.ctx.fillText(
					`Proceeding to Stage ${this.stage + 1}...`,
					this.width / 2,
					this.height / 2
				);
				
				// Wait a moment then fade back in with callback
				setTimeout(() => {
					callback();
					
					// Start fade-in for new stage
					let fadeInOpacity = 1;
					const fadeIn = () => {
						// Render the new stage first
						this.render();
						
						// Draw overlay with decreasing opacity
						this.ctx.fillStyle = `rgba(0, 20, 40, ${fadeInOpacity})`;
						this.ctx.fillRect(0, 0, this.width, this.height);
						
						fadeInOpacity -= fadeStep;
						
						if (fadeInOpacity > 0) {
							requestAnimationFrame(fadeIn);
						}
					};
					
					fadeIn();
				}, 1000);
			}
		};
		
		performFade();
	}

	saveGameState(completed = false) {
		const stats = {
			completed: completed || this.win,
			stage: this.stage,
			artifacts: this.artifactsCollected,
			totalArtifacts: this.totalArtifacts,
			timeRemaining: this.timer,
			health: this.player ? this.player.health : 100,
			timestamp: Date.now(),
			difficulty: this.difficulty
		};

		try {
			localStorage.setItem('futureskillsArtifact', JSON.stringify(stats));
		} catch (e) {
			console.error('Failed to save game state:', e);
		}
	}
	
	loadGameState() {
		try {
			const savedState = localStorage.getItem('futureskillsArtifact');
			if (savedState) {
				return JSON.parse(savedState);
			}
		} catch (e) {
			console.error('Failed to load game state:', e);
		}
		return null;
	}

	clearGameState() {
		try {
			localStorage.removeItem('futureskillsArtifact');
		} catch (e) {
			console.error('Failed to clear game state:', e);
		}
	}

	updateHUD() {
		if (this.timerElement) {
			this.timerElement.textContent = `Time: ${Math.ceil(this.timer)}`;
		}
		if (this.artifactsElement) {
			this.artifactsElement.textContent = `Artifacts: ${this.artifactsCollected}/${this.totalArtifacts}`;
			if (this.artifactsCollected >= this.totalArtifacts) {
				this.artifactsElement.textContent += " - Find the exit!";
				this.artifactsElement.style.color = "#00ff00";
			} else {
				this.artifactsElement.style.color = "";
			}
		}
		if (this.healthElement) {
			this.healthElement.textContent = `Health: ${this.player.health}%`;
		}
		if (this.stageElement) {
			this.stageElement.textContent = `Stage: ${this.stage}/${this.maxStage}`;
		}
	}

	toggleDebugMode() {
		this.debugMode = !this.debugMode;

		if (this.player?.debug) {
			this.player.debug.enabled = this.debugMode;
		}

		if (this.debugMode) {
			console.log("Debug Mode Activated!");
			console.log("F1: Toggle Debug Mode");
			console.log("F2: Toggle Shortest Path");
			console.log("F3: Cycle Target Artifact");
			console.log("F4: Toggle All Artifacts");
			console.log("F5: Toggle Obstacles");
			console.log("B: Toggle Player Debug Details");
		} else {
			this.showShortestPath = false;
			this.targetArtifactIndex = -1;
			if (this.maze) {
				this.maze.shortestPath = [];
			}
		}
	}

	toggleShortestPath() {
		if (!this.debugMode) return;

		this.showShortestPath = !this.showShortestPath;

		if (this.showShortestPath) {
			this.targetArtifactIndex = 0;
			this.updateShortestPath();
		} else {
			this.targetArtifactIndex = -1;
			if (this.maze) {
				this.maze.shortestPath = [];
			}
		}
	}

	cycleTargetArtifact() {
		if (
			!this.debugMode ||
			!this.showShortestPath ||
			!this.artifacts ||
			this.artifacts.length === 0
		)
			return;

		this.targetArtifactIndex =
			(this.targetArtifactIndex + 1) % this.artifacts.length;
		this.updateShortestPath();
	}

	updateShortestPath() {
		if (
			!this.debugMode ||
			!this.showShortestPath ||
			!this.player ||
			!this.maze ||
			!this.artifacts
		)
			return;

		if (
			this.targetArtifactIndex >= 0 &&
			this.targetArtifactIndex < this.artifacts.length
		) {
			const artifact = this.artifacts[this.targetArtifactIndex];
			if (!artifact.collected) {
				this.maze.findShortestPath(
					this.player.x,
					this.player.y,
					artifact.x,
					artifact.y,
				);
			} else {
				this.maze.shortestPath = [];
			}
		}
	}

	renderDebugInfo() {
		this.ctx.fillStyle = "#00ff00";
		this.ctx.font = "12px monospace";

		let y = 30;
		const x = 30;

		this.ctx.fillText("DEBUG MODE (F1 to toggle)", x, y);
		y += 20;
		this.ctx.fillText(
			`FPS: ${Math.round(1000 / (performance.now() - this.lastTime))}`,
			x,
			y,
		);
		y += 20;
		this.ctx.fillText(
			`Player: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`,
			x,
			y,
		);
		y += 20;
		this.ctx.fillText(
			`Grid: (${Math.floor(this.player.x / this.cellSize)}, ${Math.floor(
				this.player.y / this.cellSize,
			)})`,
			x,
			y,
		);
		y += 20;
		this.ctx.fillText(`Exit: (${this.maze.exit.x}, ${this.maze.exit.y})`, x, y);
		y += 20;
		this.ctx.fillText(
			`Shortest Path: ${this.showShortestPath ? "ON (F2)" : "OFF (F2)"}`,
			x,
			y,
		);

		if (this.showShortestPath) {
			y += 20;
			this.ctx.fillText(
				`Target Artifact: ${this.targetArtifactIndex + 1}/${
					this.artifacts.length
				} (F3)`,
				x,
				y,
			);
		}

		y += 20;
		this.ctx.fillText(
			`Player Debug: ${this.player.debug.enabled ? "ON (B)" : "OFF (B)"}`,
			x,
			y,
		);

		y += 15;
		this.ctx.beginPath();
		this.ctx.moveTo(x - 10, y);
		this.ctx.lineTo(x + 240, y);
		this.ctx.stroke();

		if (this.showShortestPath && this.maze) {
			this.maze.renderShortestPath(this.ctx);
		}

		if (this.showAllArtifacts && this.maze && this.artifacts) {
			this.maze.renderArtifactPositions(this.ctx, this.artifacts);
		}

		this.renderGridOverlay();

		this.ctx.restore();
	}

	renderGridOverlay() {
		this.ctx.save();
		this.ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
		this.ctx.lineWidth = 0.5;

		// Draw vertical grid lines
		for (let x = 0; x <= this.width; x += this.cellSize) {
			this.ctx.beginPath();
			this.ctx.moveTo(x, 0);
			this.ctx.lineTo(x, this.height);
			this.ctx.stroke();
		}

		// Draw horizontal grid lines
		for (let y = 0; y <= this.height; y += this.cellSize) {
			this.ctx.beginPath();
			this.ctx.moveTo(0, y);
			this.ctx.lineTo(this.width, y);
			this.ctx.stroke();
		}

		this.ctx.restore();
	}

	renderExitIndicator() {
		const exitX = (this.maze.exit.x + 0.5) * this.cellSize;
		const exitY = (this.maze.exit.y + 0.5) * this.cellSize;

		// Get vector from player to exit
		const dx = exitX - this.player.x;
		const dy = exitY - this.player.y;
		const distance = Math.sqrt(dx * dx + dy * dy);

		// Only show indicator if the exit is not visible on screen
		const visibilityThreshold = this.width * 0.75;
		if (distance > visibilityThreshold) {
			const normalizedDx = dx / distance;
			const normalizedDy = dy / distance;

			// Calculate a point along the edge of the screen in the direction of the exit
			const indicatorDistance = 150; // Distance from player to indicator
			const indicatorX = this.player.x + normalizedDx * indicatorDistance;
			const indicatorY = this.player.y + normalizedDy * indicatorDistance;

			const pulseScale = 0.8 + 0.2 * Math.sin(Date.now() / 200);
			const arrowSize = 15 * pulseScale;
			this.ctx.save();

			// Move to indicator position and rotate toward exit
			this.ctx.translate(indicatorX, indicatorY);
			this.ctx.rotate(Math.atan2(dy, dx));

			this.ctx.fillStyle = "#00ff00";
			this.ctx.beginPath();
			this.ctx.moveTo(arrowSize, 0);
			this.ctx.lineTo(-arrowSize / 2, arrowSize / 2);
			this.ctx.lineTo(-arrowSize / 2, -arrowSize / 2);
			this.ctx.closePath();
			this.ctx.fill();

			// Draw glow effect
			this.ctx.shadowColor = "#00ff00";
			this.ctx.shadowBlur = 10;
			this.ctx.fill();

			this.ctx.restore();

			this.ctx.save();
			this.ctx.fillStyle = "#00ff00";
			this.ctx.font = 'bold 12px "Courier New", monospace';
			this.ctx.textAlign = "center";
			const textOffset = arrowSize + 15;
			const textX =
				this.player.x + normalizedDx * (indicatorDistance + textOffset);
			const textY =
				this.player.y + normalizedDy * (indicatorDistance + textOffset);
			this.ctx.fillText("EXIT", textX, textY);
			this.ctx.restore();
		}
	}

	renderVictory() {
		this.ctx.clearRect(0, 0, this.width, this.height);
		const theme = this.themes[3] || this.currentTheme;
		this.createVictoryBackground();
		this.drawCertificate(theme);
		this._victoryRendered = true;
	}

	createVictoryBackground() {
		const bgGradient = this.ctx.createRadialGradient(
			this.width / 2,
			this.height / 2,
			0,
			this.width / 2,
			this.height / 2,
			Math.max(this.width, this.height),
		);
		bgGradient.addColorStop(0, "#0a1a0a");
		bgGradient.addColorStop(0.7, "#001a0a");
		bgGradient.addColorStop(1, "#000f05");

		this.ctx.fillStyle = bgGradient;
		this.ctx.fillRect(0, 0, this.width, this.height);

		// subtle grid pattern
		this.ctx.save();
		this.ctx.strokeStyle = "rgba(0, 255, 153, 0.1)";
		this.ctx.lineWidth = 1;
		const gridSize = 50;

		for (let x = 0; x <= this.width; x += gridSize) {
			this.ctx.beginPath();
			this.ctx.moveTo(x, 0);
			this.ctx.lineTo(x, this.height);
			this.ctx.stroke();
		}
		for (let y = 0; y <= this.height; y += gridSize) {
			this.ctx.beginPath();
			this.ctx.moveTo(0, y);
			this.ctx.lineTo(this.width, y);
			this.ctx.stroke();
		}
		this.ctx.restore();
	}

	drawCertificate(theme) {
		const certWidth = Math.min(this.width * 0.8, 600);
		const certHeight = Math.min(this.height * 0.7, 450);
		const certX = (this.width - certWidth) / 2;
		const certY = (this.height - certHeight) / 2;

		// Certificate shadow for depth
		this.ctx.save();
		this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
		this.ctx.fillRect(certX + 8, certY + 8, certWidth, certHeight);
		this.ctx.restore();

		// Certificate background with elegant gradient
		const certGradient = this.ctx.createLinearGradient(
			certX,
			certY,
			certX,
			certY + certHeight,
		);
		certGradient.addColorStop(0, "#f8f9fa");
		certGradient.addColorStop(0.1, "#ffffff");
		certGradient.addColorStop(0.9, "#ffffff");
		certGradient.addColorStop(1, "#e9ecef");

		this.ctx.fillStyle = certGradient;
		this.ctx.fillRect(certX, certY, certWidth, certHeight);

		this.drawCertificateBorder(certX, certY, certWidth, certHeight);
		this.drawCertificateContent(certX, certY, certWidth, certHeight, theme);
		this.drawCertificateDecorations(certX, certY, certWidth, certHeight, theme);
	}

	drawCertificateBorder(x, y, width, height) {
		const borderWidth = 8;
		const rwandaColors = ["#00A0D5", "#E5BE01", "#20603D"];

		this.ctx.lineWidth = borderWidth;
		this.ctx.strokeStyle = "#2c3e50";
		this.ctx.strokeRect(x, y, width, height);

		// Inner decorative border with Rwanda colors
		const innerBorder = 20;
		this.ctx.lineWidth = 3;

		// Top border - Blue
		this.ctx.strokeStyle = rwandaColors[0];
		this.ctx.beginPath();
		this.ctx.moveTo(x + innerBorder, y + innerBorder);
		this.ctx.lineTo(x + width - innerBorder, y + innerBorder);
		this.ctx.stroke();

		// Right border - Yellow
		this.ctx.strokeStyle = rwandaColors[1];
		this.ctx.beginPath();
		this.ctx.moveTo(x + width - innerBorder, y + innerBorder);
		this.ctx.lineTo(x + width - innerBorder, y + height - innerBorder);
		this.ctx.stroke();

		// Bottom border - Green
		this.ctx.strokeStyle = rwandaColors[2];
		this.ctx.beginPath();
		this.ctx.moveTo(x + width - innerBorder, y + height - innerBorder);
		this.ctx.lineTo(x + innerBorder, y + height - innerBorder);
		this.ctx.stroke();

		// Left border - Blue
		this.ctx.strokeStyle = rwandaColors[0];
		this.ctx.beginPath();
		this.ctx.moveTo(x + innerBorder, y + height - innerBorder);
		this.ctx.lineTo(x + innerBorder, y + innerBorder);
		this.ctx.stroke();
	}

	drawCertificateContent(x, y, width, height, theme) {
		const centerX = x + width / 2;

		// Header emblem/logo area
		this.ctx.save();
		this.ctx.fillStyle = "#20603D";
		this.ctx.beginPath();
		this.ctx.arc(centerX, y + 60, 25, 0, Math.PI * 2);
		this.ctx.fill();

		this.ctx.fillStyle = "#ffffff";
		this.ctx.font = 'bold 20px "Arial", sans-serif';
		this.ctx.textAlign = "center";
		this.ctx.fillText("R", centerX, y + 67);
		this.ctx.restore();

		// Certificate title
		this.ctx.save();
		this.ctx.fillStyle = "#2c3e50";
		this.ctx.font = 'bold 24px "Georgia", serif';
		this.ctx.textAlign = "center";
		this.ctx.fillText("CERTIFICATE OF ACHIEVEMENT", centerX, y + 110);

		// Decorative line under title
		this.ctx.strokeStyle = "#E5BE01";
		this.ctx.lineWidth = 2;
		this.ctx.beginPath();
		this.ctx.moveTo(centerX - 100, y + 120);
		this.ctx.lineTo(centerX + 100, y + 120);
		this.ctx.stroke();
		this.ctx.restore();

		this.ctx.save();
		this.ctx.fillStyle = "#34495e";
		this.ctx.font = '16px "Georgia", serif';
		this.ctx.textAlign = "center";

		this.ctx.fillText("This is to certify that", centerX, y + 160);

		// Achievement title
		this.ctx.font = 'bold 20px "Georgia", serif';
		this.ctx.fillStyle = "#2c3e50";
		this.ctx.fillText("DIGITAL TRANSFORMATION MASTERY", centerX, y + 190);

		this.ctx.font = '16px "Georgia", serif';
		this.ctx.fillStyle = "#34495e";
		this.ctx.fillText("has been successfully completed", centerX, y + 220);

		// Program details
		this.ctx.font = 'italic 14px "Georgia", serif';
		this.ctx.fillStyle = "#7f8c8d";
		this.ctx.fillText("Future Skills Development Program", centerX, y + 250);
		this.ctx.fillText("Rwanda Digital Innovation Initiative", centerX, y + 270);

		// Date and signature area
		const dateStr = new Date().toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});

		this.ctx.font = '12px "Arial", sans-serif';
		this.ctx.fillStyle = "#2c3e50";
		this.ctx.fillText(`Certified on ${dateStr}`, centerX, y + height - 80);

		// Signature line
		this.ctx.strokeStyle = "#bdc3c7";
		this.ctx.lineWidth = 1;
		this.ctx.beginPath();
		this.ctx.moveTo(centerX - 80, y + height - 50);
		this.ctx.lineTo(centerX + 80, y + height - 50);
		this.ctx.stroke();

		this.ctx.fillText(
			"Dipl. Ing. Paul Umukunzi, Director General RTB",
			centerX,
			y + height - 35,
		);
		this.ctx.restore();
	}

	drawCertificateDecorations(x, y, width, height, theme) {
		const cornerSize = 30;

		this.ctx.save();
		this.ctx.strokeStyle = "#E5BE01";
		this.ctx.lineWidth = 2;

		// Top-left corner
		this.ctx.beginPath();
		this.ctx.moveTo(x + 40, y + 40);
		this.ctx.lineTo(x + 40 + cornerSize, y + 40);
		this.ctx.moveTo(x + 40, y + 40);
		this.ctx.lineTo(x + 40, y + 40 + cornerSize);
		this.ctx.stroke();

		// Top-right corner
		this.ctx.beginPath();
		this.ctx.moveTo(x + width - 40, y + 40);
		this.ctx.lineTo(x + width - 40 - cornerSize, y + 40);
		this.ctx.moveTo(x + width - 40, y + 40);
		this.ctx.lineTo(x + width - 40, y + 40 + cornerSize);
		this.ctx.stroke();

		// Bottom-left corner
		this.ctx.beginPath();
		this.ctx.moveTo(x + 40, y + height - 40);
		this.ctx.lineTo(x + 40 + cornerSize, y + height - 40);
		this.ctx.moveTo(x + 40, y + height - 40);
		this.ctx.lineTo(x + 40, y + height - 40 - cornerSize);
		this.ctx.stroke();

		// Bottom-right corner
		this.ctx.beginPath();
		this.ctx.moveTo(x + width - 40, y + height - 40);
		this.ctx.lineTo(x + width - 40 - cornerSize, y + height - 40);
		this.ctx.moveTo(x + width - 40, y + height - 40);
		this.ctx.lineTo(x + width - 40, y + height - 40 - cornerSize);
		this.ctx.stroke();

		this.ctx.restore();
	}
}

window.addEventListener("load", () => {
	const game = new Game();

	window.menuSystem = game.menuSystem;
});
