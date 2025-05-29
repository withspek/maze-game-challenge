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

		// Game state
		this.running = false;
		this.paused = false;
		this.gameOver = false;
		this.win = false;
		this.stage = 1;
		this.maxStage = 3;
		this.timer = 120; // 2 minutes per stage
		this.artifactsCollected = 0;
		this.totalArtifacts = 3;

		// Camera/viewport (for scrolling if maze is larger than screen)
		this.cameraX = 0;
		this.cameraY = 0;

		// Game objects
		this.maze = null;
		this.player = null;
		this.artifacts = [];

		// Time tracking
		this.lastTime = 0;
		this.timeElapsed = 0;
		this.frameCount = 0;

		// User interface
		this.hudElement = document.getElementById("hud");
		this.timerElement = document.getElementById("timer");
		this.artifactsElement = document.getElementById("artifacts");

		window.addEventListener("keydown", (e) => {
			if (e.key === "Escape") {
				this.togglePause();
				e.preventDefault();
			}
		});

		this.init();
	}

	init() {
		this.maze = new Maze(this.width, this.height, this.cellSize, this.stage);

		this.player = new Player(this.maze, this.cellSize);

		this.artifacts = [];
		this.artifactsCollected = 0;

		const artifactTypes = ["ai", "cybersecurity", "machine-learning"];
		for (let i = 0; i < this.totalArtifacts; i++) {
			this.artifacts.push(
				new Artifact(this.maze, this.cellSize, artifactTypes[i]),
			);
		}

		this.timer = 120;

		this.updateHUD();

		this.running = true;
		this.lastTime = performance.now();
		requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
	}

	togglePause() {
		this.paused = !this.paused;

		if (this.paused) {
			this.renderPauseMenu();
		} else {
			this.lastTime = performance.now();
			requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
		}
	}

	gameLoop(timestamp) {
		const deltaTime = timestamp - this.lastTime;
		this.lastTime = timestamp;

		if (this.paused || this.gameOver) {
			return;
		}

		this.frameCount++;

		this.timeElapsed += deltaTime;
		if (this.timeElapsed >= 1000) {
			this.timer--;
			this.timeElapsed -= 1000;
			this.updateHUD();

			if (this.timer <= 0) {
				this.gameOver = true;
				this.win = false;
				this.renderGameOver();
				return;
			}
		}

		this.update();
		this.render();

		if (this.running) {
			requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
		}
	}

	update() {
		this.player.update();

		for (const artifact of this.artifacts) {
			artifact.update();
		}

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

					if (this.artifactsCollected >= this.totalArtifacts) {
						this.completeStage();
					}
				}
			}
		}

		this.updateCamera();
	}

	updateCamera() {
		const targetX = this.player.x - this.width / 2;
		const targetY = this.player.y - this.height / 2;

		this.cameraX += (targetX - this.cameraX) * 0.1;
		this.cameraY += (targetY - this.cameraY) * 0.1;

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
		this.ctx.fillStyle = "#000022";
		this.ctx.fillRect(0, 0, this.width, this.height);

		this.ctx.save();
		this.ctx.translate(-this.cameraX, -this.cameraY);

		this.maze.render(this.ctx);

		for (const artifact of this.artifacts) {
			artifact.render(this.ctx);
		}

		this.player.render(this.ctx);
		this.ctx.restore();
		this.renderTimerBar();
	}

	renderTimerBar() {
		const barWidth = this.width;
		const barHeight = 5;
		const progress = this.timer / 120;

		// background
		this.ctx.fillStyle = "#333";
		this.ctx.fillRect(0, 0, barWidth, barHeight);

		// progress
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
		this.ctx.fillText("PAUSED", this.width / 2, this.height / 2 - 40);

		this.ctx.font = '18px "Courier New", monospace';
		this.ctx.fillText(
			"Press ESC to resume",
			this.width / 2,
			this.height / 2 + 20,
		);
	}

	renderGameOver() {
		// darken the screen
		this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
		this.ctx.fillRect(0, 0, this.width, this.height);

		this.ctx.fillStyle = "#ff0000";
		this.ctx.font = 'bold 36px "Courier New", monospace';
		this.ctx.textAlign = "center";
		this.ctx.fillText("TIME'S UP!", this.width / 2, this.height / 2 - 40);

		this.ctx.fillStyle = "#ffffff";
		this.ctx.font = '18px "Courier New", monospace';
		this.ctx.fillText(
			`Artifacts collected: ${this.artifactsCollected}`,
			this.width / 2,
			this.height / 2 + 20,
		);
		this.ctx.fillText(
			"Refresh the page to try again",
			this.width / 2,
			this.height / 2 + 60,
		);
	}

	completeStage() {
		if (this.stage < this.maxStage) {
			this.stage++;
			this.init();
		} else {
			this.gameOver = true;
			this.win = true;
			this.renderVictory();
		}
	}

	renderVictory() {
		// darken the screen
		this.ctx.fillStyle = "rgba(0, 0, 30, 0.8)";
		this.ctx.fillRect(0, 0, this.width, this.height);

		// Draw victory message
		this.ctx.fillStyle = "#00ffff";
		this.ctx.font = 'bold 36px "Courier New", monospace';
		this.ctx.textAlign = "center";
		this.ctx.fillText(
			"FINAL CERTIFICATION",
			this.width / 2,
			this.height / 2 - 80,
		);

		this.ctx.fillStyle = "#ffffff";
		this.ctx.font = '24px "Courier New", monospace';
		this.ctx.fillText("Congratulations!", this.width / 2, this.height / 2 - 30);

		this.ctx.font = '18px "Courier New", monospace';
		this.ctx.fillText(
			"You have collected all Future Skills Artifacts",
			this.width / 2,
			this.height / 2 + 20,
		);
		this.ctx.fillText(
			"and completed your training.",
			this.width / 2,
			this.height / 2 + 50,
		);

		// Create a certificate-like border
		this.ctx.strokeStyle = "#00ffff";
		this.ctx.lineWidth = 5;
		this.ctx.strokeRect(
			this.width * 0.2,
			this.height * 0.2,
			this.width * 0.6,
			this.height * 0.6,
		);
	}

	updateHUD() {
		this.timerElement.textContent = `Time: ${this.timer}`;
		this.artifactsElement.textContent = `Artifacts: ${this.artifactsCollected}/${this.totalArtifacts}`;
	}
}

window.addEventListener("load", () => {
	const game = new Game();
});
