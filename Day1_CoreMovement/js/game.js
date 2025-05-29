/**
 * Main game class for FutureskillsArtifact
 */

class Game {
  constructor() {
    // Get the canvas and its context
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    // Game configuration
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.cellSize = 40; // Size of each maze cell

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

    // Register event handlers
    window.addEventListener("keydown", (e) => {
      // Handle ESC key for pause/menu
      if (e.key === "Escape") {
        this.togglePause();
        e.preventDefault();
      }
    });

    // Initialize game
    this.init();
  }

  init() {
    // Create maze for the current stage
    this.maze = new Maze(this.width, this.height, this.cellSize, this.stage);

    // Create player
    this.player = new Player(this.maze, this.cellSize);

    // Create artifacts
    this.artifacts = [];
    this.artifactsCollected = 0;

    // Add the artifacts based on the stage
    const artifactTypes = ["ai", "cybersecurity", "machine-learning"];
    for (let i = 0; i < this.totalArtifacts; i++) {
      this.artifacts.push(
        new Artifact(this.maze, this.cellSize, artifactTypes[i])
      );
    }

    // Reset timer for the stage
    this.timer = 120;

    // Update HUD
    this.updateHUD();

    // Start the game loop
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
  }

  togglePause() {
    this.paused = !this.paused;

    if (this.paused) {
      // Show pause menu
      this.renderPauseMenu();
    } else {
      // Resume game
      this.lastTime = performance.now();
      requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
  }

  gameLoop(timestamp) {
    // Calculate time delta
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    // If game is paused, don't update
    if (this.paused || this.gameOver) {
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
        this.renderGameOver();
        return;
      }
    }

    // Update game objects
    this.update();

    // Render the game
    this.render();

    // Continue the game loop
    if (this.running) {
      requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
  }

  update() {
    // Update player
    this.player.update();

    // Update artifacts
    for (const artifact of this.artifacts) {
      artifact.update();
    }

    // Check for collisions with artifacts
    for (const artifact of this.artifacts) {
      if (
        !artifact.collected &&
        checkCollision(
          this.player.getCollisionBox(),
          artifact.getCollisionBox()
        )
      ) {
        if (artifact.collect()) {
          this.artifactsCollected++;
          this.updateHUD();

          // Play collection sound
          generateTone(880, 200, 0.3, "sine");
          setTimeout(() => {
            generateTone(1320, 200, 0.3, "sine");
          }, 200);

          // Check if all artifacts are collected
          if (this.artifactsCollected >= this.totalArtifacts) {
            this.completeStage();
          }
        }
      }
    }

    // Update camera to follow player
    this.updateCamera();
  }

  updateCamera() {
    // Center camera on player with bounds checking
    const targetX = this.player.x - this.width / 2;
    const targetY = this.player.y - this.height / 2;

    // Smoothly move camera toward target
    this.cameraX += (targetX - this.cameraX) * 0.1;
    this.cameraY += (targetY - this.cameraY) * 0.1;

    // Clamp camera to maze bounds
    this.cameraX = Math.max(
      0,
      Math.min(this.cameraX, this.maze.cols * this.cellSize - this.width)
    );
    this.cameraY = Math.max(
      0,
      Math.min(this.cameraY, this.maze.rows * this.cellSize - this.height)
    );
  }

  render() {
    // Clear the canvas
    this.ctx.fillStyle = "#000022";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Save context state
    this.ctx.save();

    // Apply camera transform
    this.ctx.translate(-this.cameraX, -this.cameraY);

    // Render maze
    this.maze.render(this.ctx);

    // Render artifacts
    for (const artifact of this.artifacts) {
      artifact.render(this.ctx);
    }

    // Render player
    this.player.render(this.ctx);

    // Restore context state
    this.ctx.restore();

    // Render timer as a progress bar
    this.renderTimerBar();
  }

  renderTimerBar() {
    const barWidth = this.width;
    const barHeight = 5;
    const progress = this.timer / 120; // Percentage of time remaining

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
    this.ctx.fillText("PAUSED", this.width / 2, this.height / 2 - 40);

    this.ctx.font = '18px "Courier New", monospace';
    this.ctx.fillText(
      "Press ESC to resume",
      this.width / 2,
      this.height / 2 + 20
    );
  }

  renderGameOver() {
    // Darken the screen
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw game over message
    this.ctx.fillStyle = "#ff0000";
    this.ctx.font = 'bold 36px "Courier New", monospace';
    this.ctx.textAlign = "center";
    this.ctx.fillText("TIME'S UP!", this.width / 2, this.height / 2 - 40);

    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = '18px "Courier New", monospace';
    this.ctx.fillText(
      "Artifacts collected: " + this.artifactsCollected,
      this.width / 2,
      this.height / 2 + 20
    );
    this.ctx.fillText(
      "Refresh the page to try again",
      this.width / 2,
      this.height / 2 + 60
    );
  }

  completeStage() {
    if (this.stage < this.maxStage) {
      // Proceed to next stage
      this.stage++;
      this.init();
    } else {
      // Player completed all stages
      this.gameOver = true;
      this.win = true;
      this.renderVictory();
    }
  }

  renderVictory() {
    // Darken the screen
    this.ctx.fillStyle = "rgba(0, 0, 30, 0.8)";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw victory message
    this.ctx.fillStyle = "#00ffff";
    this.ctx.font = 'bold 36px "Courier New", monospace';
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "FINAL CERTIFICATION",
      this.width / 2,
      this.height / 2 - 80
    );

    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = '24px "Courier New", monospace';
    this.ctx.fillText("Congratulations!", this.width / 2, this.height / 2 - 30);

    this.ctx.font = '18px "Courier New", monospace';
    this.ctx.fillText(
      "You have collected all Future Skills Artifacts",
      this.width / 2,
      this.height / 2 + 20
    );
    this.ctx.fillText(
      "and completed your training.",
      this.width / 2,
      this.height / 2 + 50
    );

    // Create a certificate-like border
    this.ctx.strokeStyle = "#00ffff";
    this.ctx.lineWidth = 5;
    this.ctx.strokeRect(
      this.width * 0.2,
      this.height * 0.2,
      this.width * 0.6,
      this.height * 0.6
    );
  }

  updateHUD() {
    // Update timer display
    this.timerElement.textContent = `Time: ${this.timer}`;

    // Update artifacts counter
    this.artifactsElement.textContent = `Artifacts: ${this.artifactsCollected}/${this.totalArtifacts}`;
  }
}

// Start the game when the page loads
window.addEventListener("load", () => {
  const game = new Game();
});
