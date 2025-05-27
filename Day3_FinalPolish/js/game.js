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
    this.difficulty = 1; // Default difficulty (can be changed in settings)

    // Debug mode
    this.debugMode = false;
    this.showShortestPath = false;
    this.showAllArtifacts = true; // Show all artifacts in debug mode by default
    this.showObstacles = true; // Show obstacle boundaries in debug mode by default
    this.targetArtifactIndex = -1; // Index of artifact to find path to

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

    // Current theme (set based on stage)
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

    // User interface
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

    // Initialize audio
    if (typeof audioManager !== "undefined") {
      // Init will be called on first user interaction
      this.hasAudio = true;
    } else {
      this.hasAudio = false;
    }

    // Register event handlers
    window.addEventListener("keydown", (e) => {
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
          `Show all artifacts: ${this.showAllArtifacts ? "ON" : "OFF"}`
        );
        e.preventDefault();
      }

      // Toggle obstacle visibility with F5 key
      if (e.key === "F5" && this.debugMode) {
        this.showObstacles = !this.showObstacles;
        console.log(`Show obstacles: ${this.showObstacles ? "ON" : "OFF"}`);
        e.preventDefault();
      }

      // Initialize audio on first user interaction
      if (this.hasAudio && !audioManager.initialized) {
        audioManager.init();
      }
    });

    // Create menu system
    this.menuSystem = new MenuSystem(this);
  }

  startNewGame() {
    // Reset game state
    this.stage = 1;
    this.gameOver = false;
    this.win = false;

    // Initialize first stage
    this.initStage(true);

    // Start the game loop
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
  }

  loadSavedGame() {
    // Load saved game state
    const savedState = loadGameState();

    if (savedState) {
      // Restore game state from saved data
      this.stage = savedState.stage || 1;

      // First create the maze
      this.initStage(true);

      // Then create the player with the maze
      this.player = new Player(this.maze, this.cellSize);

      if (savedState.health) {
        this.player.health = savedState.health;
      }

      // Start the game loop
      this.running = true;
      this.lastTime = performance.now();
      requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    } else {
      // If no saved game, start a new one
      this.startNewGame();
    }
  }

  initStage(isNewGame = false) {
    try {
      // Set the current theme based on stage
      this.currentTheme = this.themes[this.stage];
      console.log(
        `Initializing stage ${this.stage} with theme "${this.currentTheme.name}"`
      );

      // Scale difficulty based on stage and settings
      const stageDifficulty = this.stage * this.difficulty;

      // Create maze for the current stage
      this.maze = new Maze(
        this.width,
        this.height,
        this.cellSize,
        stageDifficulty
      );

      // Create player if not exists or if this is a new game
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
      this.artifacts = [];
      this.artifactsCollected = 0;

      // Add the artifacts based on the stage
      const artifactTypes = ["ai", "cybersecurity", "machine-learning"];
      for (let i = 0; i < this.totalArtifacts; i++) {
        this.artifacts.push(
          new Artifact(this.maze, this.cellSize, artifactTypes[i])
        );
      }

      // Generate obstacles (more with higher difficulty)
      const obstacleCount = 2 + stageDifficulty; // More obstacles with higher difficulty
      this.obstacleManager.generateObstacles(
        this.maze,
        this.cellSize,
        obstacleCount,
        stageDifficulty
      );

      // Reset timer based on difficulty (less time on higher difficulty)
      this.timer = Math.max(60, 120 - (this.difficulty - 1) * 20);

      // Regenerate background particles with theme colors
      this.generateBackgroundParticles();

      // Update HUD
      this.updateHUD();

      // Update stage indicator with theme name
      if (this.stageElement) {
        this.stageElement.textContent = `Stage: ${this.stage}/${this.maxStage} - ${this.currentTheme.name}`;
      }

      console.log("Stage initialized successfully: ", this.stage);
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
    if (this.paused) {
      // Render pause menu
      this.renderPauseMenu();

      // Continue game loop
      requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
      return;
    }

    // If game is over, we need to render the game over screen just once
    // and then stop the game loop from continuing further updates
    if (this.gameOver) {
      // If player is dead, animate death particles before showing game over screen
      if (this.player && this.player.isDead) {
        // Update only particles for death animation
        this.player.updateParticles();

        // Render the game for death animation
        this.render();

        // Continue the game loop only for death animation
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
      }
      return;
    }

    // If a popup is showing, don't update the game
    if (typeof popupManager !== "undefined" && popupManager.isPopupVisible()) {
      requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
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

        // Play game over sound
        if (this.hasAudio) {
          audioManager.playGameOverSound();
        }

        // Render game over screen immediately
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

    // Check if player has died
    if (this.player.isDead && !this.gameOver) {
      // Set game over state
      this.gameOver = true;
      this.win = false;
      this.running = false;

      // Play game over sound
      if (this.hasAudio) {
        audioManager.playGameOverSound();
      }

      // Show game over screen after a short delay for death animation
      setTimeout(() => {
        this.renderGameOver();
      }, 1500);

      return;
    }

    // Update artifacts
    for (const artifact of this.artifacts) {
      artifact.update();
    }

    // Update obstacles
    this.obstacleManager.update();

    // Update background particles
    this.updateBackgroundParticles();

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
          if (this.hasAudio) {
            audioManager.playCollectSound();
          } else {
            generateTone(880, 200, 0.3, "sine");
            setTimeout(() => {
              generateTone(1320, 200, 0.3, "sine");
            }, 200);
          }

          // Show educational popup
          if (typeof popupManager !== "undefined") {
            // Show popup with artifact type and continue the game when closed
            popupManager.show(artifact.type, () => {
              // Check if all artifacts are collected after popup is closed
              if (this.artifactsCollected >= this.totalArtifacts) {
                this.completeStage();
              }
            });
          } else {
            // No popup manager, just check completion
            if (this.artifactsCollected >= this.totalArtifacts) {
              this.completeStage();
            }
          }
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

    // Update camera to follow player
    this.updateCamera();

    // Update shortest path if debug mode is active
    if (this.debugMode && this.showShortestPath) {
      this.updateShortestPath();
    }
  }

  generateBackgroundParticles() {
    // Clear existing particles
    this.backgroundParticles = [];

    // Use theme colors for particles
    const colors = this.currentTheme
      ? this.currentTheme.particleColors
      : ["#00ffff", "#0099ff", "#66ffff"];

    // Create background particles
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

        // Remove dead particles
        if (particle.life <= 0 || particle.y > this.height) {
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

        // Occasionally change direction
        if (Math.random() < 0.01) {
          particle.angle = Math.random() * Math.PI * 2;
        }
      }
    }
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
    // Clear the canvas with theme background color
    this.ctx.fillStyle = this.currentTheme
      ? this.currentTheme.backgroundColor
      : "#000022";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Render background particles
    this.renderBackgroundParticles();

    // Save context state
    this.ctx.save();

    // Apply camera transform
    this.ctx.translate(-this.cameraX, -this.cameraY);

    // Render maze
    this.maze.render(this.ctx, this.currentTheme);

    // Render obstacles
    this.obstacleManager.render(this.ctx);

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

    // Render debug information if debug mode is active
    if (this.debugMode) {
      this.renderDebugInfo();
    }
  }

  renderBackgroundParticles() {
    // Render all background particles
    for (const particle of this.backgroundParticles) {
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
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
    this.ctx.fillText("PAUSED", this.width / 2, this.height / 2 - 60);

    this.ctx.font = '18px "Courier New", monospace';
    this.ctx.fillText("Press ESC to resume", this.width / 2, this.height / 2);
    this.ctx.fillText(
      "Press M to return to main menu",
      this.width / 2,
      this.height / 2 + 30
    );

    // Show controls
    this.ctx.font = '16px "Courier New", monospace';
    this.ctx.fillText("Controls:", this.width / 2, this.height / 2 + 70);
    this.ctx.fillText("Arrow Keys: Move", this.width / 2, this.height / 2 + 95);
    this.ctx.fillText("Spacebar: Jump", this.width / 2, this.height / 2 + 120);
    this.ctx.fillText(
      "ESC: Pause/Resume",
      this.width / 2,
      this.height / 2 + 145
    );

    // Add event listener for M key to return to menu
    const menuHandler = (e) => {
      if (e.key === "m" || e.key === "M") {
        this.returnToMenu();
        window.removeEventListener("keydown", menuHandler);
      }
    };

    window.addEventListener("keydown", menuHandler);
  }

  returnToMenu() {
    // Stop the game
    this.running = false;
    this.paused = false;

    // Save current game state
    this.saveGameState();

    // Show menu
    this.menuSystem.showMenuScreen();
    this.menuSystem.checkForSavedGame();
  }

  renderGameOver() {
    // Darken the screen
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw game over message
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
      "Stage: " + this.stage + " / " + this.maxStage,
      this.width / 2,
      this.height / 2 - 20
    );
    this.ctx.fillText(
      "Artifacts collected: " +
        this.artifactsCollected +
        " / " +
        this.totalArtifacts,
      this.width / 2,
      this.height / 2 + 10
    );

    if (this.player) {
      this.ctx.fillText(
        "Health: " + this.player.health + "%",
        this.width / 2,
        this.height / 2 + 40
      );
    }

    // Draw button to return to menu
    this.ctx.fillStyle = "#005f8f";
    const buttonWidth = 200;
    const buttonHeight = 40;
    const buttonX = this.width / 2 - buttonWidth / 2;
    const buttonY = this.height / 2 + 80;

    // Draw button
    this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

    // Draw button text
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = '16px "Courier New", monospace';
    this.ctx.fillText(
      "Return to Main Menu",
      this.width / 2,
      buttonY + buttonHeight / 2 + 5
    );

    // Save stats to localStorage
    this.saveGameState();

    // Remove any existing click handlers before adding new ones
    this.canvas.removeEventListener("click", this._gameOverClickHandler);

    // Define and store the click handler function
    this._gameOverClickHandler = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (
        x >= buttonX &&
        x <= buttonX + buttonWidth &&
        y >= buttonY &&
        y <= buttonY + buttonHeight
      ) {
        this.returnToMenu();
        this.canvas.removeEventListener("click", this._gameOverClickHandler);
      }
    };

    // Add the click handler
    this.canvas.addEventListener("click", this._gameOverClickHandler);
  }

  completeStage() {
    if (this.stage < this.maxStage) {
      // Play completion sound
      if (this.hasAudio) {
        audioManager.playCompleteLevelSound();
      }

      // Show stage completion message
      this.renderStageComplete(() => {
        // Proceed to next stage after delay
        this.stage++;

        // Initialize new stage with clean state
        this.initStage(false);

        // Force a redraw to ensure new theme is fully applied
        this.render();

        // Ensure game continues running
        this.running = true;

        // Log successful stage transition
        console.log(
          `Transitioned to stage ${this.stage} with theme "${this.currentTheme.name}"`
        );
      });
    } else {
      // Player completed all stages
      this.gameOver = true;
      this.win = true;
      this.running = false;

      // Play victory sound
      if (this.hasAudio) {
        audioManager.playCompleteLevelSound();
      }

      this.renderVictory();

      // Save stats to localStorage
      this.saveGameState();
    }
  }

  renderStageComplete(callback) {
    // Darken the screen
    this.ctx.fillStyle = "rgba(0, 20, 40, 0.8)";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw completion message
    this.ctx.fillStyle = "#00ffff";
    this.ctx.font = 'bold 36px "Courier New", monospace';
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "STAGE " + this.stage + " COMPLETE!",
      this.width / 2,
      this.height / 2 - 80
    );

    // Display theme name and next theme
    const nextTheme = this.themes[this.stage + 1];
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = '20px "Courier New", monospace';
    this.ctx.fillText(
      `Theme: ${this.currentTheme.name}`,
      this.width / 2,
      this.height / 2 - 120
    );

    if (nextTheme) {
      this.ctx.fillText(
        `Next: ${nextTheme.name}`,
        this.width / 2,
        this.height / 2 - 40
      );
    }

    // Display stage stats
    this.ctx.font = '16px "Courier New", monospace';
    this.ctx.fillText(
      "Time remaining: " + this.timer + " seconds",
      this.width / 2,
      this.height / 2
    );
    this.ctx.fillText(
      "Health: " + this.player.health + "%",
      this.width / 2,
      this.height / 2 + 25
    );

    // Create a loading bar
    const barWidth = 300;
    const barHeight = 20;
    const barX = this.width / 2 - barWidth / 2;
    const barY = this.height / 2 + 60;

    // Draw loading bar background
    this.ctx.fillStyle = "#333";
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    // Animate loading bar
    let progress = 0;
    const loadingInterval = setInterval(() => {
      progress += 2;

      // Draw loading bar progress
      this.ctx.fillStyle = "#00ffff";
      this.ctx.fillRect(barX, barY, barWidth * (progress / 100), barHeight);

      if (progress >= 100) {
        clearInterval(loadingInterval);

        // Wait a moment before proceeding
        setTimeout(callback, 500);
      }
    }, 30);

    // Save the current state
    this.saveGameState();
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
      this.height / 2 - 120
    );

    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = '24px "Courier New", monospace';
    this.ctx.fillText("Congratulations!", this.width / 2, this.height / 2 - 80);

    this.ctx.font = '18px "Courier New", monospace';
    this.ctx.fillText(
      "You have collected all Future Skills Artifacts",
      this.width / 2,
      this.height / 2 - 40
    );
    this.ctx.fillText(
      "and completed your training.",
      this.width / 2,
      this.height / 2 - 10
    );

    // Create a certificate-like border with Rwanda flag colors
    const certWidth = this.width * 0.6;
    const certHeight = this.height * 0.6;
    const certX = this.width * 0.2;
    const certY = this.height * 0.2;

    // Draw certificate background
    const gradient = this.ctx.createLinearGradient(
      certX,
      certY,
      certX + certWidth,
      certY + certHeight
    );
    gradient.addColorStop(0, "rgba(0, 30, 60, 0.9)");
    gradient.addColorStop(1, "rgba(0, 50, 90, 0.9)");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(certX, certY, certWidth, certHeight);

    // Rwanda flag colors for border
    const rwandaBlue = "#00A0D5";
    const rwandaYellow = "#E5BE01";
    const rwandaGreen = "#20603D";

    // Draw Rwanda-colored border
    this.ctx.lineWidth = 10;

    // Blue section (top)
    this.ctx.strokeStyle = rwandaBlue;
    this.ctx.beginPath();
    this.ctx.moveTo(certX, certY);
    this.ctx.lineTo(certX + certWidth, certY);
    this.ctx.stroke();

    // Yellow section (right)
    this.ctx.strokeStyle = rwandaYellow;
    this.ctx.beginPath();
    this.ctx.moveTo(certX + certWidth, certY);
    this.ctx.lineTo(certX + certWidth, certY + certHeight);
    this.ctx.stroke();

    // Green section (bottom)
    this.ctx.strokeStyle = rwandaGreen;
    this.ctx.beginPath();
    this.ctx.moveTo(certX + certWidth, certY + certHeight);
    this.ctx.lineTo(certX, certY + certHeight);
    this.ctx.stroke();

    // Blue section (left, completing the border)
    this.ctx.strokeStyle = rwandaBlue;
    this.ctx.beginPath();
    this.ctx.moveTo(certX, certY + certHeight);
    this.ctx.lineTo(certX, certY);
    this.ctx.stroke();

    // Add certificate details
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = 'bold 16px "Courier New", monospace';
    this.ctx.fillText(
      "Certificate of Completion",
      this.width / 2,
      this.height / 2 + 30
    );
    this.ctx.fillText(
      "Future Skills Mastery Program",
      this.width / 2,
      this.height / 2 + 55
    );

    // Add Rwanda-specific text
    this.ctx.fillStyle = "#E5BE01"; // Rwanda yellow
    this.ctx.font = 'italic 16px "Courier New", monospace';
    this.ctx.fillText(
      "Rwanda Digital Transformation Initiative",
      this.width / 2,
      this.height / 2 + 80
    );

    // Display completion stats
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = '14px "Courier New", monospace';
    this.ctx.fillText(
      "Time remaining: " + this.timer + " seconds",
      this.width / 2,
      this.height / 2 + 110
    );
    this.ctx.fillText(
      "Final health: " + this.player.health + "%",
      this.width / 2,
      this.height / 2 + 130
    );
    this.ctx.fillText(
      new Date().toLocaleDateString(),
      this.width / 2,
      this.height / 2 + 150
    );

    // Add celebratory particles
    if (this.frameCount % 10 === 0) {
      this.createCelebratoryParticles();
    }

    // Draw button to return to menu
    this.ctx.fillStyle = "#005f8f";
    const buttonWidth = 200;
    const buttonHeight = 40;
    const buttonX = this.width / 2 - buttonWidth / 2;
    const buttonY = this.height * 0.8 + 20;

    // Draw button
    this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

    // Draw button text
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = '16px "Courier New", monospace';
    this.ctx.fillText(
      "Return to Main Menu",
      this.width / 2,
      buttonY + buttonHeight / 2 + 5
    );

    // Add click handler for the button
    const clickHandler = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (
        x >= buttonX &&
        x <= buttonX + buttonWidth &&
        y >= buttonY &&
        y <= buttonY + buttonHeight
      ) {
        this.returnToMenu();
        this.canvas.removeEventListener("click", clickHandler);
      }
    };

    this.canvas.addEventListener("click", clickHandler);
  }

  // New method to create celebratory particles for the victory screen
  createCelebratoryParticles() {
    // Rwanda flag colors
    const colors = [
      "#00A0D5", // Blue
      "#E5BE01", // Yellow
      "#20603D", // Green
      "#FFFFFF", // White
    ];

    // Create particles from random positions at the top of the screen
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * this.width;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 3 + Math.random() * 5;
      const speed = 1 + Math.random() * 3;

      this.backgroundParticles.push({
        x: x,
        y: 0,
        size: size,
        speed: speed,
        color: color,
        angle: Math.PI / 2 + (Math.random() * 0.5 - 0.25), // Mostly downward
        gravity: 0.05 + Math.random() * 0.05,
        life: 100 + Math.random() * 50,
      });
    }
  }

  saveGameState() {
    // Save game statistics to localStorage
    const stats = {
      completed: this.win,
      stage: this.stage,
      artifacts: this.artifactsCollected,
      timeRemaining: this.timer,
      health: this.player ? this.player.health : 100,
      timestamp: Date.now(),
    };

    // Save stats using the utility function
    saveGameState(stats);
  }

  updateHUD() {
    // Update timer display
    this.timerElement.textContent = `Time: ${this.timer}`;

    // Update artifacts counter
    this.artifactsElement.textContent = `Artifacts: ${this.artifactsCollected}/${this.totalArtifacts}`;

    // Update health indicator
    if (this.healthElement && this.player) {
      this.healthElement.textContent = `Health: ${this.player.health}%`;
    }

    // Update stage indicator
    if (this.stageElement) {
      this.stageElement.textContent = `Stage: ${this.stage}/${this.maxStage}`;
    }
  }

  // Toggle debug mode
  toggleDebugMode() {
    this.debugMode = !this.debugMode;

    // Also toggle player debug if available
    if (this.player && this.player.debug) {
      this.player.debug.enabled = this.debugMode;
    }

    if (this.debugMode) {
      // Show help message when debug mode is activated
      console.log("Debug Mode Activated!");
      console.log("F1: Toggle Debug Mode");
      console.log("F2: Toggle Shortest Path");
      console.log("F3: Cycle Target Artifact");
      console.log("F4: Toggle All Artifacts");
      console.log("F5: Toggle Obstacles");
      console.log("B: Toggle Player Debug Details");

      // Show debug help message on screen
      this.showDebugHelp();
    } else {
      // Clear shortest path when exiting debug mode
      this.showShortestPath = false;
      this.targetArtifactIndex = -1;
      if (this.maze) {
        this.maze.shortestPath = [];
      }
    }

    console.log(`Debug mode: ${this.debugMode ? "ON" : "OFF"}`);
  }

  // Show debug help message
  showDebugHelp() {
    const helpText = [
      "DEBUG MODE ACTIVATED",
      "",
      "Keyboard Controls:",
      "F1: Toggle Debug Mode",
      "F2: Toggle Shortest Path",
      "F3: Cycle Target Artifact",
      "F4: Toggle All Artifacts",
      "F5: Toggle Obstacles",
      "B: Toggle Player Debug Details",
      "",
      "This message will disappear in 3 seconds.",
    ];

    // Create overlay for help text
    const overlay = document.createElement("div");
    overlay.style.position = "absolute";
    overlay.style.top = "50%";
    overlay.style.left = "50%";
    overlay.style.transform = "translate(-50%, -50%)";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    overlay.style.color = "#00ff00";
    overlay.style.padding = "20px";
    overlay.style.borderRadius = "10px";
    overlay.style.fontFamily = "monospace";
    overlay.style.fontSize = "16px";
    overlay.style.textAlign = "center";
    overlay.style.zIndex = "1000";
    overlay.style.boxShadow = "0 0 20px rgba(0, 255, 0, 0.5)";

    // Add help text
    overlay.innerHTML = helpText.join("<br>");

    // Add to document
    document.body.appendChild(overlay);

    // Remove after 5 seconds
    setTimeout(() => {
      document.body.removeChild(overlay);
    }, 3000);
  }

  // Toggle shortest path display
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

    console.log(`Shortest path: ${this.showShortestPath ? "ON" : "OFF"}`);
  }

  // Cycle through artifacts to show path to
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

    console.log(
      `Target artifact: ${this.targetArtifactIndex + 1}/${
        this.artifacts.length
      }`
    );
  }

  // Update the shortest path to the current target artifact
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
          artifact.y
        );
      } else {
        this.maze.shortestPath = [];
      }
    }
  }

  // Render debug information
  renderDebugInfo() {
    // Set up the debug panel
    this.ctx.save();
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    this.ctx.fillRect(10, 10, 250, 210);
    this.ctx.fillStyle = "#00ff00";
    this.ctx.font = "12px monospace";

    // Display debug information
    let y = 30;
    this.ctx.fillText(`DEBUG MODE (F1 to toggle)`, 20, y);
    y += 20;
    this.ctx.fillText(
      `FPS: ${Math.round(1000 / (performance.now() - this.lastTime))}`,
      20,
      y
    );
    y += 20;
    this.ctx.fillText(
      `Player: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`,
      20,
      y
    );
    y += 20;
    this.ctx.fillText(
      `Grid: (${Math.floor(this.player.x / this.cellSize)}, ${Math.floor(
        this.player.y / this.cellSize
      )})`,
      20,
      y
    );
    y += 20;
    this.ctx.fillText(
      `Shortest Path: ${this.showShortestPath ? "ON (F2)" : "OFF (F2)"}`,
      20,
      y
    );

    if (this.showShortestPath) {
      y += 20;
      this.ctx.fillText(
        `Target Artifact: ${this.targetArtifactIndex + 1}/${
          this.artifacts.length
        } (F3)`,
        20,
        y
      );
    }

    // Show player debug status
    y += 20;
    this.ctx.fillText(
      `Player Debug: ${this.player.debug.enabled ? "ON (B)" : "OFF (B)"}`,
      20,
      y
    );

    // Show artifact visibility status
    y += 20;
    this.ctx.fillText(
      `Show Artifacts: ${this.showAllArtifacts ? "ON (F4)" : "OFF (F4)"}`,
      20,
      y
    );

    // Show obstacle visibility status
    y += 20;
    this.ctx.fillText(
      `Show Obstacles: ${this.showObstacles ? "ON (F5)" : "OFF (F5)"}`,
      20,
      y
    );

    // Render shortest path if active
    if (this.showShortestPath && this.maze) {
      this.maze.renderShortestPath(this.ctx);
    }

    // Render all artifact positions if enabled
    if (this.showAllArtifacts && this.maze && this.artifacts) {
      this.maze.renderArtifactPositions(this.ctx, this.artifacts);
    }

    // Render obstacle boundaries if enabled
    if (this.showObstacles && this.obstacleManager) {
      this.obstacleManager.renderDebug(this.ctx);
    }

    // Render grid overlay
    this.renderGridOverlay();

    this.ctx.restore();
  }

  // Render grid overlay for debugging
  renderGridOverlay() {
    this.ctx.save();
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
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
}

// Start the game when the page loads
window.addEventListener("load", () => {
  const game = new Game();

  // Create menu system instance
  window.menuSystem = game.menuSystem;
});
