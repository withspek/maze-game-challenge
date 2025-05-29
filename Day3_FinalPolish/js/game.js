/**
 * Main game class for FutureskillsArtifact
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
      3: ["blockchain", "robotics", "quantum-computing"]
    };

    window.addEventListener("keydown", (e) => {
      // Track key press
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
      if (this.activeKeys["Control"] && this.activeKeys["Alt"] && this.activeKeys["3"]) {
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

      if (this.hasAudio && !audioManager.initialized) {
        audioManager.init();
      }
    });
    
    // Track key releases
    window.addEventListener("keyup", (e) => {
      delete this.activeKeys[e.key];
    });

    this.menuSystem = new MenuSystem(this);
  }

  startNewGame() {
    this.stage = 1;
    this.gameOver = false;
    this.win = false;
    this.isExitingStage = false;
    this.initStage(true);
    this.running = true;
    this.lastTime = performance.now();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animationFrameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
  }

  loadSavedGame() {
    const savedState = loadGameState();
    if (savedState) {
      this.stage = savedState.stage || 1;
      this.isExitingStage = false;
      this.initStage(true);
      this.player = new Player(this.maze, this.cellSize);
      if (savedState.health) {
        this.player.health = savedState.health;
      }
      this.running = true;
      this.lastTime = performance.now();
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      this.animationFrameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    } else {
      this.startNewGame();
    }
  }

  initStage(isNewGame = false) {
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
        stageDifficulty
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
        this.artifacts.push(
          new Artifact(this.maze, this.cellSize, skills[i])
        );
      }

      // Generate obstacles (more with higher difficulty and stage)
      const obstacleCount = 2 + stageDifficulty * 2; // Increase more per stage
      this.obstacleManager.generateObstacles(
        this.maze,
        this.cellSize,
        obstacleCount,
        stageDifficulty
      );

      // Reset timer based on difficulty (less time on higher difficulty)
      this.timer = Math.max(60, 180 - (this.difficulty - 1) * 20);

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
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    } else {
      // Resume game
      this.lastTime = performance.now();
      if (!this.animationFrameId) {
        this.animationFrameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
      }
    }
  }

  gameLoop(timestamp) {
    this.animationFrameId = null; // Clear before possibly setting again
    // Calculate time delta
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    // If game is paused, don't update
    if (this.paused) {
      // Render pause menu
      this.renderPauseMenu();
      // Do not continue the game loop while paused
      return;
    }

    // If game is over but player won, continue animation for particles
    if (this.gameOver && this.win) {
      // Update frame counter
      this.frameCount++;
      
      // Update background particles for victory celebration
      this.updateBackgroundParticles();
      
      // Re-render victory screen with updated particles but at a reduced rate
      // Only re-render every few frames to reduce CPU usage
      if (this.frameCount % 3 === 0) {
        this.renderVictory();
      }
      
      // Continue game loop for particle animations
      this.animationFrameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
      return;
    }
    
    // If game is over (and not victory), we need to render the game over screen just once
    // and then stop the game loop from continuing further updates
    if (this.gameOver) {
      // If player is dead, animate death particles before showing game over screen
      if (this.player && this.player.isDead) {
        // Update only particles for death animation
        this.player.updateParticles();

        // Render the game for death animation
        this.render();

        // Continue the game loop only for death animation
        this.animationFrameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
      }
      return;
    }

    // If a popup is showing, don't update the game
    if (typeof popupManager !== "undefined" && popupManager.isPopupVisible()) {
      this.animationFrameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
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
      this.animationFrameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
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

      // Render game over screen after a short delay for death animation
      setTimeout(() => {
        console.log("Rendering game over screen...");
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
              // Continue the game after popup is closed
              // No auto completion when all artifacts are collected
            });
          }
        }
      }
    }
    
    // Check if player has reached the exit after collecting all artifacts
    if (this.artifactsCollected >= this.totalArtifacts && !this.isExitingStage) {
      // Get player grid position
      const playerGridX = Math.floor(this.player.x / this.cellSize);
      const playerGridY = Math.floor(this.player.y / this.cellSize);
      
      // Log player and exit positions for debugging
      if (this.debugMode) {
        console.log(`Player at grid: (${playerGridX}, ${playerGridY}), Exit at: (${this.maze.exit.x}, ${this.maze.exit.y})`);
      }
      
      // Check if player is at the exit - using both isExitPosition and direct position check
      const directExitCheck = (playerGridX === this.maze.exit.x && playerGridY === this.maze.exit.y);
      const mazeExitCheck = this.maze.isExitPosition(this.player.x, this.player.y);
      
      if (mazeExitCheck || directExitCheck) {
        console.log("Exit reached! Completing stage...");
        // Set flag to prevent multiple completions
        this.isExitingStage = true;
        
        // Complete the stage
        this.completeStage();
      }
      
      // Add a failsafe for stage 3 - if player is very close to exit position
      if (this.stage === this.maxStage) {
        const distToExit = Math.sqrt(
          Math.pow((playerGridX - this.maze.exit.x), 2) + 
          Math.pow((playerGridY - this.maze.exit.y), 2)
        );
        
        if (distToExit < 1.5) { // If player is within 1.5 cells of exit
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
        
        // Simplified alpha handling - no twinkle
        if (particle.life < 30) {
          // Fade out particles as they near the end of their life
          particle.alpha = (particle.alpha || 1) * 0.95;
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
        if (Math.random() < 0.005) { // Reduced from 0.01
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
    
    // Add exit indicator when all artifacts are collected
    if (this.artifactsCollected >= this.totalArtifacts) {
      this.renderExitIndicator();
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
    // Simple loop to avoid excessive operations
    for (let i = 0; i < this.backgroundParticles.length; i++) {
      const particle = this.backgroundParticles[i];
      this.ctx.save();
      
      // Set particle color with alpha if specified
      if (particle.alpha !== undefined) {
        if (particle.alpha < 0.05) {
          // Skip nearly invisible particles
          this.ctx.restore();
          continue;
        }
        
        // Handle hex colors by converting to RGBA
        if (particle.color.startsWith('#')) {
          const r = parseInt(particle.color.slice(1, 3), 16);
          const g = parseInt(particle.color.slice(3, 5), 16);
          const b = parseInt(particle.color.slice(5, 7), 16);
          this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${particle.alpha})`;
        } else {
          this.ctx.fillStyle = particle.color;
          this.ctx.globalAlpha = particle.alpha;
        }
      } else {
        this.ctx.fillStyle = particle.color;
      }
      
      // Apply translation to particle position
      this.ctx.translate(particle.x, particle.y);
      
      // Apply rotation if present
      if (particle.rotationAngle) {
        this.ctx.rotate(particle.rotationAngle);
      }
      
      // Draw particle according to its shape
      if (particle.shape === 'rect') {
        // Draw rectangle for confetti-like particles
        this.ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
      } else {
        // Default to circle for regular particles
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      this.ctx.restore();
    }
  }

  renderTimerBar() {
    const barWidth = this.width;
    const barHeight = 5;
    const progress = this.timer / 180; // Percentage of time remaining

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
    this.gameOver = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    // Make sure we properly clean up the game state
    if (this.player) {
      this.player.isDead = false;
    }
    
    // Save game state
    this.saveGameState();
    
    // Return to menu
    if (this.menuSystem) {
      this.menuSystem.showMenuScreen();
      this.menuSystem.checkForSavedGame();
    } else {
      console.error("Menu system not available");
      // As a fallback, reload the page
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
      buttonY + buttonHeight / 2 + 5
    );
    
    this.saveGameState();

    // First remove any existing event listener to prevent duplicates
    if (this._gameOverClickHandler) {
      this.canvas.removeEventListener("click", this._gameOverClickHandler);
      this._gameOverClickHandler = null;
    }

    // Create a new click handler
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
        console.log("Return button clicked");
        
        // Clean up the event listener
        this.canvas.removeEventListener("click", this._gameOverClickHandler);
        this._gameOverClickHandler = null;
        
        // Return to menu
        this.returnToMenu();
      }
    };

    // Add the click event listener
    this.canvas.addEventListener("click", this._gameOverClickHandler);
  }

  completeStage() {
    console.log(`Completing stage ${this.stage} of ${this.maxStage}`);
    
    if (this.stage < this.maxStage) {
      if (this.hasAudio) {
        audioManager.playCompleteLevelSound();
      }

      this.renderStageComplete(() => {
        // Proceed to next stage after delay
        this.stage++;
        console.log(`Moving to next stage: ${this.stage}`);

        // Initialize new stage with clean state
        this.initStage(false);
        this.render();
        this.running = true;
      });
    } else {
      // Final stage completion - show victory screen
      console.log("Final stage completed! Showing victory screen.");
      
      // Immediately stop the game loop to prevent further updates
      this.running = false;
      
      // Set game over and win flags
      this.gameOver = true;
      this.win = true;
      
      // Clear existing particles to reduce lag
      this.backgroundParticles = [];

      if (this.hasAudio) {
        audioManager.playCompleteLevelSound();
      }
      
      // Ensure the player object is saved before resetting anything
      const playerHealth = this.player ? this.player.health : 100;
      const timeRemaining = this.timer;
      
      // Save game state with victory flag
      this.saveGameState();
      
      // Clear any existing timeouts to prevent issues
      if (this._victoryTimeout) {
        clearTimeout(this._victoryTimeout);
      }
      
      // Use setTimeout with a short delay to ensure clean rendering
      this._victoryTimeout = setTimeout(() => {
        // Create a minimal set of initial celebration particles
        for (let i = 0; i < 10; i++) {
          this.createCelebratoryParticles();
        }
        
        // Force the theme to be the final stage theme
        this.currentTheme = this.themes[3];
        
        // Restore player health and time for display
        this.player = this.player || { health: playerHealth };
        this.timer = timeRemaining;
        
        // Render the victory screen once
        this.renderVictory();
        
        // Start game loop again just for particle effects
        this.animationFrameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
      }, 100);
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

    this.ctx.font = '16px "Courier New", monospace';
    this.ctx.fillText(
      "All artifacts collected and exit reached!",
      this.width / 2,
      this.height / 2 - 40
    );
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

    const barWidth = 300;
    const barHeight = 20;
    const barX = this.width / 2 - barWidth / 2;
    const barY = this.height / 2 + 60;

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

    this.saveGameState();
  }

  renderVictory() {
    console.log("Rendering victory screen");
    this._victoryRendered = true; // Flag to prevent duplicate rendering
    
    // Use the theme colors for background and effects
    const theme = this.themes[3]; // Stage 3 theme (Future Campus)
    
    // Create a solid background to prevent transparency issues
    this.ctx.fillStyle = "#001100"; // Solid background color matching theme
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Create a darker background gradient with theme colors (less transparent)
    const bgGradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
    bgGradient.addColorStop(0, "rgba(0, 17, 0, 1.0)"); // Fully opaque
    bgGradient.addColorStop(1, "rgba(0, 34, 17, 1.0)"); // Fully opaque
    this.ctx.fillStyle = bgGradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Title with glow effect
    this.ctx.save();
    this.ctx.fillStyle = theme.wallColor; // Using the theme's wall color (#00ff99)
    this.ctx.shadowColor = theme.wallColor;
    this.ctx.shadowBlur = 15;
    this.ctx.font = 'bold 42px "Courier New", monospace';
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "FINAL CERTIFICATION",
      this.width / 2,
      this.height / 2 - 130
    );
    this.ctx.restore();

    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = 'bold 28px "Courier New", monospace';
    this.ctx.fillText("Congratulations!", this.width / 2, this.height / 2 - 80);

    this.ctx.font = '20px "Courier New", monospace';
    this.ctx.fillText(
      "You have mastered all Future Skills Artifacts",
      this.width / 2,
      this.height / 2 - 40
    );
    this.ctx.fillText(
      "and completed your digital transformation journey.",
      this.width / 2,
      this.height / 2 - 10
    );

    const certWidth = this.width * 0.6;
    const certHeight = this.height * 0.6;
    const certX = this.width * 0.2;
    const certY = this.height * 0.2;

    // Create certificate background with theme colors (fully opaque)
    const gradient = this.ctx.createLinearGradient(
      certX,
      certY,
      certX + certWidth,
      certY + certHeight
    );
    gradient.addColorStop(0, "rgba(0, 34, 17, 1.0)"); // Fully opaque
    gradient.addColorStop(1, "rgba(0, 68, 34, 1.0)"); // Fully opaque
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(certX, certY, certWidth, certHeight);

    // Rwanda flag colors for border
    const rwandaBlue = "#00A0D5";
    const rwandaYellow = "#E5BE01";
    const rwandaGreen = "#20603D";

    // Theme colors for additional accents
    const themeColor1 = theme.wallColor; // #00ff99
    const themeColor2 = theme.particleColors[1]; // #33cc66
    const themeColor3 = theme.particleColors[2]; // #66ffcc

    this.ctx.lineWidth = 10;

    // Blue section (top)
    this.ctx.strokeStyle = rwandaBlue;
    this.ctx.beginPath();
    this.ctx.moveTo(certX, certY);
    this.ctx.lineTo(certX + certWidth, certY);
    this.ctx.stroke();

    this.ctx.strokeStyle = rwandaYellow;
    this.ctx.beginPath();
    this.ctx.moveTo(certX + certWidth, certY);
    this.ctx.lineTo(certX + certWidth, certY + certHeight);
    this.ctx.stroke();

    this.ctx.strokeStyle = rwandaGreen;
    this.ctx.beginPath();
    this.ctx.moveTo(certX + certWidth, certY + certHeight);
    this.ctx.lineTo(certX, certY + certHeight);
    this.ctx.stroke();

    this.ctx.strokeStyle = themeColor1; // Using theme color for left border
    this.ctx.beginPath();
    this.ctx.moveTo(certX, certY + certHeight);
    this.ctx.lineTo(certX, certY);
    this.ctx.stroke();

    // Add a decorative pattern to the certificate (less intensive)
    this.ctx.save();
    this.ctx.strokeStyle = `rgba(${parseInt(themeColor1.slice(1, 3), 16)}, ${parseInt(themeColor1.slice(3, 5), 16)}, ${parseInt(themeColor1.slice(5, 7), 16)}, 0.3)`;
    this.ctx.lineWidth = 2;
    
    // Create a grid pattern (with fewer lines)
    const gridSize = 60; // Increased grid size to reduce number of lines
    for (let x = certX; x <= certX + certWidth; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, certY);
      this.ctx.lineTo(x, certY + certHeight);
      this.ctx.stroke();
    }
    
    for (let y = certY; y <= certY + certHeight; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(certX, y);
      this.ctx.lineTo(certX + certWidth, y);
      this.ctx.stroke();
    }
    this.ctx.restore();

    // Certificate title with shadow effect
    this.ctx.save();
    this.ctx.fillStyle = "#ffffff";
    this.ctx.shadowColor = themeColor1;
    this.ctx.shadowBlur = 10;
    this.ctx.font = 'bold 18px "Courier New", monospace';
    this.ctx.fillText(
      "Certificate of Digital Mastery",
      this.width / 2,
      this.height / 2 + 30
    );
    this.ctx.restore();
    
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = 'bold 16px "Courier New", monospace';
    this.ctx.fillText(
      "Future Skills Mastery Program",
      this.width / 2,
      this.height / 2 + 55
    );

    this.ctx.fillStyle = rwandaYellow; // Rwanda yellow
    this.ctx.font = 'italic 16px "Courier New", monospace';
    this.ctx.fillText(
      "Rwanda Digital Transformation Initiative",
      this.width / 2,
      this.height / 2 + 80
    );
    
    // Custom achievement message
    this.ctx.save();
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = '14px "Courier New", monospace';
    this.ctx.textAlign = "center";
    
    const messageY = this.height / 2 + 110;
    const messageLines = [
      "This certifies that you have successfully",
      "demonstrated proficiency in essential digital skills including",
      "Artificial Intelligence, Cybersecurity, and Machine Learning.",
      "Your journey through the digital landscape has prepared you",
      "to contribute to Rwanda's technological advancement and",
      "to become a leader in the digital transformation era."
    ];
    
    // Draw message box with solid background
    const messageWidth = certWidth * 0.9;
    const messageHeight = messageLines.length * 18 + 20;
    const messageX = this.width / 2 - messageWidth / 2;
    
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; // More opaque
    this.ctx.fillRect(messageX, messageY - 15, messageWidth, messageHeight);
    
    // Draw message border with theme color
    this.ctx.strokeStyle = themeColor3;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(messageX, messageY - 15, messageWidth, messageHeight);
    
    // Draw message text
    this.ctx.fillStyle = "#ffffff";
    for (let i = 0; i < messageLines.length; i++) {
      this.ctx.fillText(
        messageLines[i],
        this.width / 2,
        messageY + i * 18
      );
    }
    this.ctx.restore();

    // Player stats with theme-colored highlights
    const statsY = messageY + messageHeight + 15;
    
    this.ctx.save();
    this.ctx.fillStyle = themeColor3; // Using third theme color
    this.ctx.font = 'bold 14px "Courier New", monospace';
    this.ctx.fillText(
      "ACHIEVEMENT STATISTICS",
      this.width / 2,
      statsY
    );
    this.ctx.restore();
    
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = '14px "Courier New", monospace';
    this.ctx.fillText(
      "Time remaining: " + this.timer + " seconds",
      this.width / 2,
      statsY + 20
    );
    this.ctx.fillText(
      "Final health: " + this.player.health + "%",
      this.width / 2,
      statsY + 40
    );
    this.ctx.fillText(
      "Certified on: " + new Date().toLocaleDateString(),
      this.width / 2,
      statsY + 60
    );

    // Only generate particles less frequently to reduce lag
    if (this.frameCount % 15 === 0) { // Reduced from 5 to 15
      this.createCelebratoryParticles();
    }

    // Draw button to return to menu with theme colors
    const buttonGradient = this.ctx.createLinearGradient(0, 0, 0, 40);
    buttonGradient.addColorStop(0, themeColor2);
    buttonGradient.addColorStop(1, rwandaGreen);
    
    this.ctx.fillStyle = buttonGradient;
    const buttonWidth = 220;
    const buttonHeight = 45;
    const buttonX = this.width / 2 - buttonWidth / 2;
    const buttonY = this.height * 0.8 + 20;

    // Draw button with rounded corners
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 8);
    this.ctx.fill();
    
    // Add glow effect to button
    this.ctx.shadowColor = themeColor1;
    this.ctx.shadowBlur = 15;
    this.ctx.fill();
    this.ctx.restore();

    // Draw button text
    this.ctx.fillStyle = "#ffffff";
    this.ctx.font = 'bold 16px "Courier New", monospace';
    this.ctx.fillText(
      "Return to Main Menu",
      this.width / 2,
      buttonY + buttonHeight / 2 + 5
    );

    // Remove any existing click handler first to prevent duplicates
    if (this._victoryClickHandler) {
      this.canvas.removeEventListener("click", this._victoryClickHandler);
    }

    // Create new click handler and store reference to it
    this._victoryClickHandler = (e) => {
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
        this.canvas.removeEventListener("click", this._victoryClickHandler);
        this._victoryClickHandler = null;
      }
    };

    this.canvas.addEventListener("click", this._victoryClickHandler);
  }

  createCelebratoryParticles() {
    // Use theme colors from stage 3 for the particles
    const theme = this.themes[3]; // Stage 3 theme (Future Campus)
    
    // Base colors
    const colors = [
      theme.wallColor,           // #00ff99 - Primary theme color
      theme.particleColors[1],   // #33cc66 - Secondary theme color
      theme.particleColors[2],   // #66ffcc - Tertiary theme color
      "#E5BE01",                 // Rwanda yellow
    ];

    // Reduce particle count to prevent lag
    const particleCount = 5; // Reduced from 10 to 5
    
    // Create celebratory particles (fewer and simpler)
    for (let i = 0; i < particleCount; i++) {
      // Random starting position across the entire width
      const x = Math.random() * this.width;
      // Random color from the theme colors
      const color = colors[Math.floor(Math.random() * colors.length)];
      // Simpler particle properties
      const size = 2 + Math.random() * 4;
      const speed = 1 + Math.random() * 3;
      const horizontalSpread = Math.random() * 0.6 - 0.3; // Reduced spread

      // Add particle with simpler properties
      this.backgroundParticles.push({
        x: x,
        y: -10, // Start above the screen
        size: size,
        speed: speed,
        color: color,
        // Angle with mostly downward direction but some horizontal spread
        angle: Math.PI / 2 + horizontalSpread,
        gravity: 0.05 + Math.random() * 0.05, // Simplified gravity
        life: 100 + Math.random() * 80, // Reduced max life
        // Simplify properties - only use rotation or twinkle, not both
        rotation: Math.random() < 0.3 ? 0.03 : 0,
        alpha: 0.8,
      });
    }
    
    // Add special large confetti pieces less frequently
    if (Math.random() < 0.1) { // Reduced from 0.2 to 0.1
      const specialColor = colors[Math.floor(Math.random() * 3)];
      const specialSize = 6 + Math.random() * 8; // Slightly smaller
      
      this.backgroundParticles.push({
        x: Math.random() * this.width,
        y: -20,
        size: specialSize,
        speed: 0.5 + Math.random() * 2,
        color: specialColor,
        angle: Math.PI / 2 + (Math.random() * 0.3 - 0.15), // Reduced spread
        gravity: 0.03 + Math.random() * 0.03, // Simplified
        life: 150 + Math.random() * 80, // Reduced max life
        shape: 'rect',
        alpha: 0.9,
      });
    }
    
    // Limit the maximum number of particles to prevent lag
    const maxParticles = 50;
    if (this.backgroundParticles.length > maxParticles) {
      // Remove oldest particles when we exceed the limit
      this.backgroundParticles.splice(0, this.backgroundParticles.length - maxParticles);
    }
  }

  saveGameState() {
    const stats = {
      completed: this.win,
      stage: this.stage,
      artifacts: this.artifactsCollected,
      timeRemaining: this.timer,
      health: this.player ? this.player.health : 100,
      timestamp: Date.now(),
    };

    saveGameState(stats);
  }

  updateHUD() {
    if (this.timerElement) {
      this.timerElement.textContent = `Time: ${Math.ceil(this.timer)}`;
    }
    if (this.artifactsElement) {
      this.artifactsElement.textContent = `Artifacts: ${this.artifactsCollected}/${this.totalArtifacts}`;
      
      // Add exit instruction when all artifacts are collected
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

    if (this.player && this.player.debug) {
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

      this.showDebugHelp();
    } else {
      this.showShortestPath = false;
      this.targetArtifactIndex = -1;
      if (this.maze) {
        this.maze.shortestPath = [];
      }
    }

    console.log(`Debug mode: ${this.debugMode ? "ON" : "OFF"}`);
  }

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

    overlay.innerHTML = helpText.join("<br>");

    document.body.appendChild(overlay);

    setTimeout(() => {
      document.body.removeChild(overlay);
    }, 3000);
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

  renderDebugInfo() {
    // Create a semi-transparent background for debug info at the top right
    this.ctx.save();
    
    // Draw main debug panel in the top-right corner
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    this.ctx.fillRect(this.width - 270, 10, 260, 250);
    
    // Add border for better visibility
    this.ctx.strokeStyle = "#00ff00";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(this.width - 270, 10, 260, 250);
    
    this.ctx.fillStyle = "#00ff00";
    this.ctx.font = "12px monospace";

    // Display debug information with improved positioning
    let y = 30;
    let x = this.width - 260;
    
    this.ctx.fillText(`DEBUG MODE (F1 to toggle)`, x, y);
    y += 20;
    this.ctx.fillText(
      `FPS: ${Math.round(1000 / (performance.now() - this.lastTime))}`,
      x, y
    );
    y += 20;
    this.ctx.fillText(
      `Player: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`,
      x, y
    );
    y += 20;
    this.ctx.fillText(
      `Grid: (${Math.floor(this.player.x / this.cellSize)}, ${Math.floor(
        this.player.y / this.cellSize
      )})`,
      x, y
    );
    y += 20;
    this.ctx.fillText(
      `Exit: (${this.maze.exit.x}, ${this.maze.exit.y})`,
      x, y
    );
    y += 20;
    this.ctx.fillText(
      `Shortest Path: ${this.showShortestPath ? "ON (F2)" : "OFF (F2)"}`,
      x, y
    );

    if (this.showShortestPath) {
      y += 20;
      this.ctx.fillText(
        `Target Artifact: ${this.targetArtifactIndex + 1}/${
          this.artifacts.length
        } (F3)`,
        x, y
      );
    }

    // Show player debug status
    y += 20;
    this.ctx.fillText(
      `Player Debug: ${this.player.debug.enabled ? "ON (B)" : "OFF (B)"}`,
      x, y
    );
    
    // Show obstacles information 
    y += 20;
    this.ctx.fillText(
      `Show Obstacles: ${this.showObstacles ? "ON (F5)" : "OFF (F5)"}`,
      x, y
    );
    
    // Show artifacts visibility status
    y += 20;
    this.ctx.fillText(
      `Show All Artifacts: ${this.showAllArtifacts ? "ON (F4)" : "OFF (F4)"}`,
      x, y
    );
    
    // Draw a line separator
    y += 15;
    this.ctx.beginPath();
    this.ctx.moveTo(x - 10, y);
    this.ctx.lineTo(x + 240, y);
    this.ctx.stroke();
    
    // Additional game state info
    y += 20;
    this.ctx.fillText(
      `Stage: ${this.stage}/${this.maxStage}`,
      x, y
    );
    
    y += 20;
    this.ctx.fillText(
      `Health: ${this.player.health}%`,
      x, y
    );

    // Draw visualization features only if they're enabled
    if (this.showShortestPath && this.maze) {
      this.maze.renderShortestPath(this.ctx);
    }

    if (this.showAllArtifacts && this.maze && this.artifacts) {
      this.maze.renderArtifactPositions(this.ctx, this.artifacts);
    }

    if (this.showObstacles && this.obstacleManager) {
      this.obstacleManager.renderDebug(this.ctx);
    }

    // Draw grid overlay with reduced opacity for better visibility
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

  // Add a new method to render the exit indicator
  renderExitIndicator() {
    // Calculate exit position in pixels
    const exitX = (this.maze.exit.x + 0.5) * this.cellSize;
    const exitY = (this.maze.exit.y + 0.5) * this.cellSize;
    
    // Get vector from player to exit
    const dx = exitX - this.player.x;
    const dy = exitY - this.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Only show indicator if the exit is not visible on screen
    const visibilityThreshold = this.width * 0.75;
    if (distance > visibilityThreshold) {
      // Normalize the direction vector
      const normalizedDx = dx / distance;
      const normalizedDy = dy / distance;
      
      // Calculate a point along the edge of the screen in the direction of the exit
      const indicatorDistance = 150; // Distance from player to indicator
      let indicatorX = this.player.x + normalizedDx * indicatorDistance;
      let indicatorY = this.player.y + normalizedDy * indicatorDistance;
      
      // Draw pulsing arrow pointing toward exit
      const pulseScale = 0.8 + 0.2 * Math.sin(Date.now() / 200);
      const arrowSize = 15 * pulseScale;
      
      // Save context for arrow drawing
      this.ctx.save();
      
      // Move to indicator position and rotate toward exit
      this.ctx.translate(indicatorX, indicatorY);
      this.ctx.rotate(Math.atan2(dy, dx));
      
      // Draw arrow
      this.ctx.fillStyle = "#00ff00";
      this.ctx.beginPath();
      this.ctx.moveTo(arrowSize, 0);
      this.ctx.lineTo(-arrowSize/2, arrowSize/2);
      this.ctx.lineTo(-arrowSize/2, -arrowSize/2);
      this.ctx.closePath();
      this.ctx.fill();
      
      // Draw glow effect
      this.ctx.shadowColor = "#00ff00";
      this.ctx.shadowBlur = 10;
      this.ctx.fill();
      
      // Restore context
      this.ctx.restore();
      
      // Draw "EXIT" text near the arrow
      this.ctx.save();
      this.ctx.fillStyle = "#00ff00";
      this.ctx.font = 'bold 12px "Courier New", monospace';
      this.ctx.textAlign = "center";
      const textOffset = arrowSize + 15;
      const textX = this.player.x + normalizedDx * (indicatorDistance + textOffset);
      const textY = this.player.y + normalizedDy * (indicatorDistance + textOffset);
      this.ctx.fillText("EXIT", textX, textY);
      this.ctx.restore();
    }
  }
}

window.addEventListener("load", () => {
  const game = new Game();

  window.menuSystem = game.menuSystem;
});
