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
            
            // Initialize audio on first user interaction
            if (this.hasAudio && !audioManager.initialized) {
                audioManager.init();
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
        if (this.paused) {
            // Render pause menu
            this.renderPauseMenu();
            
            // Continue game loop
            requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
            return;
        }
        
        // If game is over but we're still animating the death
        if (this.gameOver && this.player && this.player.isDead) {
            // Update only particles for death animation
            this.player.updateParticles();
            
            // Render the game for death animation
            this.render();
            
            // Continue the game loop
            requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
            return;
        }
        
        // If game is completely over, stop updating
        if (this.gameOver) {
            return;
        }
        
        // If a popup is showing, don't update the game
        if (typeof popupManager !== 'undefined' && popupManager.isPopupVisible()) {
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
                
                // Play game over sound
                if (this.hasAudio) {
                    audioManager.playGameOverSound();
                }
                
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
            
            // Play game over sound
            if (this.hasAudio) {
                audioManager.playGameOverSound();
            }
            
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
        this.ctx.fillText('Refresh the page to try again', this.width / 2, this.height / 2 + 80);
        
        // Save stats to localStorage
        this.saveGameStats();
        
        // Stop the game loop but keep the game over screen visible
        this.running = false;
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
                this.init();
            });
        } else {
            // Player completed all stages
            this.gameOver = true;
            this.win = true;
            
            // Play victory sound
            if (this.hasAudio) {
                audioManager.playCompleteLevelSound();
            }
            
            this.renderVictory();
            
            // Save stats to localStorage
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
        this.ctx.fillText('STAGE ' + this.stage + ' COMPLETE!', this.width / 2, this.height / 2 - 40);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '18px "Courier New", monospace';
        this.ctx.fillText('Preparing next stage...', this.width / 2, this.height / 2 + 20);
        
        // Display stage stats
        this.ctx.font = '16px "Courier New", monospace';
        this.ctx.fillText('Time remaining: ' + this.timer + ' seconds', this.width / 2, this.height / 2 + 60);
        this.ctx.fillText('Health: ' + this.player.health + '%', this.width / 2, this.height / 2 + 85);
        
        // Proceed to next stage after a longer delay (increased from 3000ms to 6000ms)
        setTimeout(callback, 6000);
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
        // Update timer display
        this.timerElement.textContent = `Time: ${this.timer}`;
        
        // Update artifacts counter
        this.artifactsElement.textContent = `Artifacts: ${this.artifactsCollected}/${this.totalArtifacts}`;
        
        // Update stage indicator
        if (this.stageElement) {
            this.stageElement.textContent = `Stage: ${this.stage}/${this.maxStage}`;
        }
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    const game = new Game();
}); 