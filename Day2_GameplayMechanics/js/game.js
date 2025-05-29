/**
 * Main game class for FutureskillsArtifact
 */

class Game {
    constructor() {
        // Get the canvas and its context
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
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
        this.isExitingStage = false; // Flag to prevent multiple completions
        
        // Debug mode
        this.debugMode = false;
        
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
        this.hudElement = document.getElementById('hud');
        this.timerElement = document.getElementById('timer');
        this.artifactsElement = document.getElementById('artifacts');
        this.healthElement = document.getElementById('health');
        this.stageElement = document.querySelector('.stage-indicator');
        
        // Initialize audio
        if (typeof audioManager !== 'undefined') {
            // Init will be called on first user interaction
            this.hasAudio = true;
        } else {
            this.hasAudio = false;
        }
        
        // Register event handlers
        window.addEventListener('keydown', (e) => {
            // Handle ESC key for pause/menu
            if (e.key === 'Escape') {
                this.togglePause();
                e.preventDefault();
            }
            
            // Toggle debug mode with F1 key
            if (e.key === 'F1') {
                this.toggleDebugMode();
                e.preventDefault();
            }
            
            // Initialize audio on first user interaction
            if (this.hasAudio && !audioManager.initialized) {
                audioManager.init();
            }
        });
        
        // Initialize game
        this.init();
        
        this.animationFrameId = null;
    }
    
    init() {
        // Reset exit flag
        this.isExitingStage = false;
        
        // Create maze for the current stage
        this.maze = new Maze(this.width, this.height, this.cellSize, this.stage);
        
        // Create player
        this.player = new Player(this.maze, this.cellSize);
        
        // Create artifacts
        this.artifacts = [];
        this.artifactsCollected = 0;
        
        // Add the artifacts based on the stage
        const artifactTypes = ['ai', 'cybersecurity', 'machine-learning'];
        for (let i = 0; i < this.totalArtifacts; i++) {
            this.artifacts.push(new Artifact(this.maze, this.cellSize, artifactTypes[i]));
        }
        
        // Generate obstacles (more with higher difficulty)
        const obstacleCount = 2 + this.stage * 2; // 4, 6, 8 for stages 1, 2, 3
        this.obstacleManager.generateObstacles(this.maze, this.cellSize, obstacleCount, this.stage);
        
        // Reset timer for the stage
        this.timer = 120;
        
        // Update HUD
        this.updateHUD();
        
        // Start the game loop
        this.running = true;
        this.lastTime = performance.now();
        if (!this.animationFrameId) {
            this.animationFrameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
        }
    }
    
    togglePause() {
        this.paused = !this.paused;
        if (this.paused) {
            this.renderPauseMenu();
        }
    }
    
    gameLoop(timestamp) {
        if (!this.running) {
            this.animationFrameId = null;
            return;
        }
        // Calculate time delta
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        if (this.paused) {
            this.renderPauseMenu();
        } else {
            // If game is over but we're still animating the death
            if (this.gameOver && this.player && this.player.isDead) {
                this.player.updateParticles();
                this.render();
            } else if (!this.gameOver) {
                if (typeof popupManager !== 'undefined' && popupManager.isPopupVisible()) {
                    // Do nothing, just skip update/render
                } else {
                    // Normal update/render
                    this.frameCount++;
                    this.timeElapsed += deltaTime;
                    if (this.timeElapsed >= 1000) {
                        this.timer--;
                        this.timeElapsed -= 1000;
                        this.updateHUD();
                        if (this.timer <= 0) {
                            this.gameOver = true;
                            this.win = false;
                            if (this.hasAudio) {
                                audioManager.playGameOverSound();
                            }
                            this.renderGameOver();
                            this.running = false;
                            this.animationFrameId = null;
                            return;
                        }
                    }
                    this.update();
                    this.render();
                }
            }
        }
        this.animationFrameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
    
    update() {
        // Update player
        this.player.update();
        
        // Check if player has died
        if (this.player.isDead && !this.gameOver) {
            // Set game over state
            this.gameOver = true;
            this.win = false;
            
            // Play game over sound
            if (this.hasAudio) {
                audioManager.playGameOverSound();
            }
            
            // Ensure we stop running to prevent further updates
            this.running = false;
            
            // Show game over screen after a short delay for death animation
            setTimeout(() => {
                this.renderGameOver();
            }, 1000);
            
            return;
        }
        
        // Update artifacts
        for (const artifact of this.artifacts) {
            artifact.update();
        }
        
        // Update obstacles
        this.obstacleManager.update();
        
        // Check for collisions with artifacts
        for (const artifact of this.artifacts) {
            if (!artifact.collected && checkCollision(this.player.getCollisionBox(), artifact.getCollisionBox())) {
                if (artifact.collect()) {
                    this.artifactsCollected++;
                    this.updateHUD();
                    
                    // Play collection sound
                    if (this.hasAudio) {
                        audioManager.playCollectSound();
                    } else {
                        generateTone(880, 200, 0.3, 'sine');
                        setTimeout(() => {
                            generateTone(1320, 200, 0.3, 'sine');
                        }, 200);
                    }
                    
                    // Show educational popup
                    if (typeof popupManager !== 'undefined') {
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
            // Check if player is at the exit
            if (this.maze.isExitPosition(this.player.x, this.player.y)) {
                // Set flag to prevent multiple completions
                this.isExitingStage = true;
                
                // Complete the stage
                this.completeStage();
            }
        }
        
        // Check for collisions with obstacles
        const obstacle = this.obstacleManager.checkCollisions(this.player);
        if (obstacle && !this.player.isDead) {
            // Apply effects based on obstacle type
            switch (obstacle.type) {
                case 'laser':
                case 'spike':
                    // Damage player
                    this.player.takeDamage(obstacle.damageAmount);
                    break;
                    
                case 'slowField':
                    // Apply slow effect
                    this.player.applySlowEffect(obstacle.slowFactor, 60); // Slow for 1 second
                    break;
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
        this.cameraX = Math.max(0, Math.min(this.cameraX, this.maze.cols * this.cellSize - this.width));
        this.cameraY = Math.max(0, Math.min(this.cameraY, this.maze.rows * this.cellSize - this.height));
    }
    
    render() {
        // Clear the canvas
        this.ctx.fillStyle = '#000022';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Save context state
        this.ctx.save();
        
        // Apply camera transform
        this.ctx.translate(-this.cameraX, -this.cameraY);
        
        // Render maze
        this.maze.render(this.ctx);
        
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
        
        // If debug mode is on, render debug visuals
        if (this.debugMode) {
            // Render obstacle debug info
            this.obstacleManager.renderDebug(this.ctx);
        }
        
        // Restore context state
        this.ctx.restore();
        
        // Render timer as a progress bar
        this.renderTimerBar();
        
        // Render debug overlay if debug mode is enabled
        if (this.debugMode) {
            this.renderDebugInfo();
        }
    }
    
    renderTimerBar() {
        const barWidth = this.width;
        const barHeight = 5;
        const progress = this.timer / 120; // Percentage of time remaining
        
        // Draw background
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, 0, barWidth, barHeight);
        
        // Draw progress
        this.ctx.fillStyle = progress > 0.5 ? '#00ff00' : progress > 0.25 ? '#ffff00' : '#ff0000';
        this.ctx.fillRect(0, 0, barWidth * progress, barHeight);
    }
    
    renderPauseMenu() {
        // Darken the screen
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw pause menu
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 36px "Courier New", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.width / 2, this.height / 2 - 40);
        
        this.ctx.font = '18px "Courier New", monospace';
        this.ctx.fillText('Press ESC to resume', this.width / 2, this.height / 2 + 20);
        
        // Show controls
        this.ctx.font = '16px "Courier New", monospace';
        this.ctx.fillText('Controls:', this.width / 2, this.height / 2 + 60);
        this.ctx.fillText('Arrow Keys: Move', this.width / 2, this.height / 2 + 85);
        this.ctx.fillText('Spacebar: Jump', this.width / 2, this.height / 2 + 110);
        this.ctx.fillText('ESC: Pause/Resume', this.width / 2, this.height / 2 + 135);
    }
    
    renderGameOver() {
        // Darken the screen
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw game over message
        this.ctx.fillStyle = '#ff0000';
        this.ctx.font = 'bold 36px "Courier New", monospace';
        this.ctx.textAlign = 'center';
        
        if (this.player.isDead || this.player.health <= 0) {
            this.ctx.fillText('YOU DIED!', this.width / 2, this.height / 2 - 40);
        } else {
            this.ctx.fillText('TIME\'S UP!', this.width / 2, this.height / 2 - 40);
        }
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '18px "Courier New", monospace';
        this.ctx.fillText('Stage: ' + this.stage + ' / ' + this.maxStage, this.width / 2, this.height / 2 + 10);
        this.ctx.fillText('Artifacts collected: ' + this.artifactsCollected + ' / ' + this.totalArtifacts, this.width / 2, this.height / 2 + 40);
        
        // Draw restart button
        this.ctx.fillStyle = '#005f8f';
        const buttonWidth = 200;
        const buttonHeight = 40;
        const buttonX = this.width / 2 - buttonWidth / 2;
        const buttonY = this.height / 2 + 80;
        
        // Draw button with highlight effect
        this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px "Courier New", monospace';
        this.ctx.fillText('Restart Game', this.width / 2, buttonY + buttonHeight / 2 + 5);
        
        // Save stats to localStorage
        this.saveGameStats();
        
        // Remove existing event listener to prevent duplicates
        if (this._gameOverClickHandler) {
            this.canvas.removeEventListener("click", this._gameOverClickHandler);
            this._gameOverClickHandler = null;
        }
        
        // Create a clean closure for the event handler
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
                console.log("Restart button clicked");
                
                // Clean up the event listener first
                this.canvas.removeEventListener("click", this._gameOverClickHandler);
                this._gameOverClickHandler = null;
                
                // Call the restart function
                this.restartGame();
            }
        };
        
        // Add the event listener
        this.canvas.addEventListener("click", this._gameOverClickHandler);
        
        // Stop the game loop but keep the game over screen visible
        this.running = false;
    }
    
    restartGame() {
        console.log("Restarting game...");
        this.running = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Reset game state
        this.stage = 1;
        this.gameOver = false;
        this.win = false;
        this.isExitingStage = false;
        this.artifactsCollected = 0;
        this.timer = 120;
        
        // Reset player state if it exists
        if (this.player) {
            this.player.isDead = false;
            this.player.health = 100;
        }
        
        // Clean up event handlers
        if (this._gameOverClickHandler) {
            this.canvas.removeEventListener("click", this._gameOverClickHandler);
            this._gameOverClickHandler = null;
        }
        
        // Reinitialize the game with fresh state
        this.init();
        
        // Start running the game again
        this.running = true;
        this.lastTime = performance.now();
        if (!this.animationFrameId) {
            this.animationFrameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
        }
    }
    
    completeStage() {
        if (this.stage < this.maxStage) {
            // Play completion sound
            if (this.hasAudio) {
                audioManager.playCompleteLevelSound();
            }
            
            this.renderStageComplete(() => {
                // Proceed to next stage after delay
                this.stage++;
                
                // Re-initialize with new stage
                this.init();
                
                // Resume running
                this.running = true;
            });
        } else {
            // Player has completed all stages
            this.gameOver = true;
            this.win = true;
            
            if (this.hasAudio) {
                audioManager.playCompleteLevelSound();
            }
            
            this.renderVictory();
            
            // Save game stats
            this.saveGameStats();
        }
    }
    
    renderStageComplete(callback) {
        // Darken the screen
        this.ctx.fillStyle = 'rgba(0, 20, 40, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw completion message
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 36px "Courier New", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('STAGE ' + this.stage + ' COMPLETE!', this.width / 2, this.height / 2 - 60);
        
        this.ctx.font = '16px "Courier New", monospace';
        this.ctx.fillText('All artifacts collected and exit reached!', this.width / 2, this.height / 2 - 20);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '18px "Courier New", monospace';
        this.ctx.fillText('Time remaining: ' + this.timer + ' seconds', this.width / 2, this.height / 2 + 10);
        this.ctx.fillText('Health: ' + this.player.health + '%', this.width / 2, this.height / 2 + 35);
        
        const barWidth = 300;
        const barHeight = 20;
        const barX = this.width / 2 - barWidth / 2;
        const barY = this.height / 2 + 70;
        
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Animate loading bar
        let progress = 0;
        const loadingInterval = setInterval(() => {
            progress += 2;
            
            // Draw loading bar progress
            this.ctx.fillStyle = '#00ffff';
            this.ctx.fillRect(barX, barY, barWidth * (progress / 100), barHeight);
            
            if (progress >= 100) {
                clearInterval(loadingInterval);
                
                // Wait a moment before proceeding
                setTimeout(callback, 500);
            }
        }, 30);
        
        // Save game stats
        this.saveGameStats();
    }
    
    renderVictory() {
        // Darken the screen
        this.ctx.fillStyle = 'rgba(0, 0, 30, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw victory message
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = 'bold 36px "Courier New", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('FINAL CERTIFICATION', this.width / 2, this.height / 2 - 80);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px "Courier New", monospace';
        this.ctx.fillText('Congratulations!', this.width / 2, this.height / 2 - 30);
        
        this.ctx.font = '18px "Courier New", monospace';
        this.ctx.fillText('You have collected all Future Skills Artifacts', this.width / 2, this.height / 2 + 20);
        this.ctx.fillText('and completed your training.', this.width / 2, this.height / 2 + 50);
        
        // Create a certificate-like border
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 5;
        this.ctx.strokeRect(this.width * 0.2, this.height * 0.2, this.width * 0.6, this.height * 0.6);
        
        // Display completion stats
        this.ctx.font = '16px "Courier New", monospace';
        this.ctx.fillText('Time remaining: ' + this.timer + ' seconds', this.width / 2, this.height / 2 + 90);
        this.ctx.fillText('Final health: ' + this.player.health + '%', this.width / 2, this.height / 2 + 115);
    }
    
    saveGameStats() {
        // Save game statistics to localStorage
        const stats = {
            completed: this.win,
            stage: this.stage,
            artifacts: this.artifactsCollected,
            timeRemaining: this.timer,
            health: this.player.health,
            timestamp: Date.now()
        };
        
        // Save stats using the utility function
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
        if (this.healthElement && this.player) {
            this.healthElement.textContent = `Health: ${this.player.health}%`;
        }
        
        // Update stage indicator
        if (this.stageElement) {
            this.stageElement.textContent = `Stage: ${this.stage}/${this.maxStage}`;
        }
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
    
    // Add a toggle debug mode function
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        console.log(`Debug mode: ${this.debugMode ? "ON" : "OFF"}`);
        
        if (this.debugMode) {
            // Show debug instructions
            this.showDebugHelp();
        }
    }
    
    // Show debug help overlay
    showDebugHelp() {
        const helpText = [
            "DEBUG MODE ACTIVATED",
            "",
            "Keyboard Controls:",
            "F1: Toggle Debug Mode",
            "ESC: Pause Game",
            "",
            "Debug information will be shown in the top-right corner.",
            "",
            "This message will disappear in 3 seconds."
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
    
    // Add debug info rendering
    renderDebugInfo() {
        // Draw debug info panel in the top-right corner
        this.ctx.save();
        
        // Draw semi-transparent background
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        this.ctx.fillRect(this.width - 270, 10, 260, 180);
        
        // Add border
        this.ctx.strokeStyle = "#00ff00";
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(this.width - 270, 10, 260, 180);
        
        // Set text style
        this.ctx.fillStyle = "#00ff00";
        this.ctx.font = "12px monospace";
        
        // Display debug information
        let y = 30;
        let x = this.width - 260;
        
        // Game information
        this.ctx.fillText(`DEBUG MODE (F1 to toggle)`, x, y);
        y += 20;
        
        // FPS counter
        const fps = Math.round(1000 / (performance.now() - this.lastTime));
        this.ctx.fillText(`FPS: ${fps}`, x, y);
        y += 20;
        
        // Player position
        this.ctx.fillText(
            `Player: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})`,
            x, y
        );
        y += 20;
        
        // Grid position
        this.ctx.fillText(
            `Grid: (${Math.floor(this.player.x / this.cellSize)}, ${Math.floor(this.player.y / this.cellSize)})`,
            x, y
        );
        y += 20;
        
        // Exit position
        if (this.maze.exit) {
            this.ctx.fillText(
                `Exit: (${this.maze.exit.x}, ${this.maze.exit.y})`,
                x, y
            );
        }
        y += 20;
        
        // Draw a separator line
        this.ctx.beginPath();
        this.ctx.moveTo(x - 10, y);
        this.ctx.lineTo(x + 240, y);
        this.ctx.stroke();
        y += 20;
        
        // Game state
        this.ctx.fillText(`Stage: ${this.stage}/${this.maxStage}`, x, y);
        y += 20;
        
        this.ctx.fillText(`Health: ${this.player.health}%`, x, y);
        y += 20;
        
        this.ctx.fillText(`Time: ${Math.ceil(this.timer)}s`, x, y);
        y += 20;
        
        this.ctx.fillText(`Artifacts: ${this.artifactsCollected}/${this.totalArtifacts}`, x, y);
        
        this.ctx.restore();
        
        // Render grid overlay with reduced opacity
        this.renderGridOverlay();
    }
    
    // Add grid overlay rendering
    renderGridOverlay() {
        this.ctx.save();
        
        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        this.ctx.lineWidth = 0.5;
        
        // Draw vertical lines
        for (let x = 0; x <= this.width; x += this.cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
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
window.addEventListener('load', () => {
    const game = new Game();
}); 