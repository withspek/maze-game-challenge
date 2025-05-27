/**
 * Menu system for FutureskillsArtifact game
 * Handles main menu, settings, statistics and loading screens
 */

class MenuSystem {
    constructor(gameInstance) {
        // Reference to the game instance
        this.game = gameInstance;
        
        // Menu elements
        this.menuScreen = document.getElementById('menu-screen');
        this.startButton = document.getElementById('start-button');
        this.continueButton = document.getElementById('continue-button');
        this.settingsButton = document.getElementById('settings-button');
        this.statsButton = document.getElementById('stats-button');
        this.settingsContainer = document.getElementById('settings-container');
        this.muteButton = document.getElementById('mute-button');
        this.difficultySelect = document.getElementById('difficulty-select');
        this.debugButton = document.getElementById('debug-button');
        this.statsContainer = document.getElementById('stats-container');
        this.statsContent = document.getElementById('stats-content');
        this.statsCloseButton = document.getElementById('stats-close');
        
        // Create loading screen if it doesn't exist
        this.loadingScreen = document.getElementById('loading-screen');
        if (!this.loadingScreen) {
            this.createLoadingScreen();
        } else {
            this.loadingBar = document.getElementById('loading-bar');
        }
        
        // Settings
        this.settings = {
            muted: false,
            difficulty: 1, // 1 = normal, 2 = hard
            debugMode: false // Debug mode setting
        };
        
        // Stars for decoration
        this.stars = [];
        this.createStars();
        
        // Initialize
        this.setupEventListeners();
        this.loadSettings();
        this.updateStatsDisplay();
        this.checkForSavedGame();
        
        // Apply the new design to the menu screen
        this.applyMenuDesign();
        
        // Show menu screen and hide loading screen after a short delay
        setTimeout(() => {
            this.hideLoadingScreen();
            this.showMenuScreen();
            this.animateStars();
        }, 500);
        
        // Check if we're in development mode
        this.checkDevelopmentMode();
    }
    
    applyMenuDesign() {
        // Apply gradient background
        this.menuScreen.style.background = 'linear-gradient(to bottom, #7FFFD4, #2E8B57)';
        
        // Update menu title and add subtitle
        const menuTitle = document.getElementById('menu-title');
        menuTitle.innerHTML = 'FutureskillsArti<span style="color: #00AA00;">★</span>act';
        menuTitle.style.color = '#FFFFFF';
        menuTitle.style.textShadow = '0 0 10px #00AA00, 0 0 20px #00AA00';
        menuTitle.style.fontWeight = 'bold';
        menuTitle.style.fontSize = '42px';
        
        // Check if subtitle already exists and remove it if it does
        const existingSubtitle = document.querySelector('.menu-subtitle');
        if (existingSubtitle) {
            existingSubtitle.remove();
        }
        
        // Create subtitle
        const subtitle = document.createElement('div');
        subtitle.innerHTML = 'RFSF National SKILLS Competition 2025';
        subtitle.style.color = '#FFFFFF';
        subtitle.style.fontSize = '18px';
        subtitle.style.marginBottom = '30px';
        subtitle.style.textShadow = '0 0 5px #008800';
        subtitle.classList.add('menu-subtitle');
        menuTitle.after(subtitle);
        
        // Check if progress bar already exists and remove it if it does
        const existingProgressBar = document.querySelector('.menu-progress-bar');
        if (existingProgressBar) {
            existingProgressBar.remove();
        }
        
        // Create progress bar
        const progressBar = document.createElement('div');
        progressBar.style.width = '300px';
        progressBar.style.height = '10px';
        progressBar.style.display = 'flex';
        progressBar.style.marginBottom = '40px';
        progressBar.classList.add('menu-progress-bar');
        progressBar.innerHTML = `
            <div style="flex: 1; height: 100%; background-color: #0088FF; margin-right: 2px;"></div>
            <div style="flex: 1; height: 100%; background-color: #FFCC00; margin-right: 2px;"></div>
            <div style="flex: 1; height: 100%; background-color: #00AA00;"></div>
        `;
        subtitle.after(progressBar);
        
        // Update start button to match design
        this.startButton.textContent = 'Press ENTER to start';
        this.startButton.style.backgroundColor = 'transparent';
        this.startButton.style.color = '#FFFFFF';
        this.startButton.style.border = 'none';
        this.startButton.style.fontSize = '24px';
        this.startButton.style.textShadow = '0 0 10px #00AA00';
        this.startButton.style.animation = 'pulse 1.5s infinite';
        this.startButton.style.cursor = 'pointer';
        this.startButton.style.width = 'auto';
        
        // Hide other buttons to match the design
        this.continueButton.style.display = 'none';
        this.settingsButton.style.display = 'none';
        this.statsButton.style.display = 'none';
        
        // Check if controls info already exists and remove it if it does
        const existingControlsInfo = document.querySelector('.menu-controls-info');
        if (existingControlsInfo) {
            existingControlsInfo.remove();
        }
        
        // Add controls info
        const controlsInfo = document.createElement('div');
        controlsInfo.style.position = 'absolute';
        controlsInfo.style.bottom = '80px';
        controlsInfo.style.left = '0';
        controlsInfo.style.width = '100%';
        controlsInfo.style.textAlign = 'center';
        controlsInfo.style.color = '#FFFFFF';
        controlsInfo.style.fontSize = '16px';
        controlsInfo.classList.add('menu-controls-info');
        controlsInfo.innerHTML = `
            <div style="margin-bottom: 5px;">Controls:</div>
            <div>Arrow keys - Move</div>
            <div>Spacebar - Jump</div>
            <div>ESC - Pause</div>
        `;
        this.menuScreen.appendChild(controlsInfo);
    }
    
    createStars() {
        // Create star elements for decoration
        const starColors = ['#FFFF00', '#00FFFF', '#0088FF'];
        const starPositions = [
            { top: '40px', left: '480px', size: '30px', color: '#00AA00' },
            { top: '150px', right: '80px', size: '25px', color: '#FFFF00' },
            { top: '200px', left: '60px', size: '20px', color: '#0088FF' }
        ];
        
        starPositions.forEach((pos, index) => {
            const star = document.createElement('div');
            star.classList.add('menu-star');
            star.style.position = 'absolute';
            star.style.fontSize = pos.size;
            star.style.color = pos.color;
            star.style.top = pos.top;
            if (pos.left) star.style.left = pos.left;
            if (pos.right) star.style.right = pos.right;
            star.style.textShadow = `0 0 10px ${pos.color}`;
            star.innerHTML = '★';
            star.style.transform = 'rotate(0deg)';
            star.style.transition = 'transform 0.5s ease-in-out';
            this.menuScreen.appendChild(star);
            this.stars.push(star);
        });
    }
    
    animateStars() {
        // Animate stars with subtle rotation and pulsing
        this.stars.forEach((star, index) => {
            const rotateAmount = Math.random() * 20 - 10; // -10 to 10 degrees
            star.style.transform = `rotate(${rotateAmount}deg)`;
            
            // Different animation timing for each star
            setTimeout(() => {
                if (star.style.opacity === '1' || !star.style.opacity) {
                    star.style.opacity = '0.7';
                } else {
                    star.style.opacity = '1';
                }
            }, index * 500);
        });
        
        // Continue animation
        setTimeout(() => this.animateStars(), 2000);
    }
    
    setupEventListeners() {
        // Start button
        this.startButton.addEventListener('click', () => {
            this.startGame();
        });
        
        // Continue button
        this.continueButton.addEventListener('click', () => {
            this.continueGame();
        });
        
        // Settings button
        this.settingsButton.addEventListener('click', () => {
            this.toggleSettings();
        });
        
        // Stats button
        this.statsButton.addEventListener('click', () => {
            this.showStats();
        });
        
        // Stats close button
        this.statsCloseButton.addEventListener('click', () => {
            this.hideStats();
        });
        
        // Mute button
        this.muteButton.addEventListener('click', () => {
            this.toggleMute();
        });
        
        // Difficulty select
        this.difficultySelect.addEventListener('change', () => {
            this.settings.difficulty = parseInt(this.difficultySelect.value);
            this.saveSettings();
        });
        
        // Debug button
        if (this.debugButton) {
            this.debugButton.addEventListener('click', () => {
                this.toggleDebugMode();
            });
        }
        
        // Add keyboard support for ENTER key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.menuScreen.style.display !== 'none') {
                this.startGame();
            }
        });
    }
    
    startGame() {
        // Show loading screen
        this.showLoadingScreen();
        
        // Initialize audio if available right away
        if (typeof audioManager !== 'undefined' && !audioManager.initialized) {
            try {
                audioManager.init();
                
                // Apply mute setting
                if (this.settings.muted) {
                    audioManager.toggleMute();
                }
            } catch (e) {
                console.error('Failed to initialize audio:', e);
                // Continue even if audio fails
            }
        }
        
        // Simulate loading process with a shorter timeout
        let progress = 0;
        const loadingInterval = setInterval(() => {
            progress += 10; // Increase speed
            this.updateLoadingProgress(progress);
            
            if (progress >= 100) {
                clearInterval(loadingInterval);
                
                try {
                    // Hide menus - do this BEFORE starting the game
                    this.hideMenuScreen();
                    
                    // Use setTimeout to ensure the UI updates before starting the game
                    setTimeout(() => {
                        // Start new game with current settings
                        if (this.game) {
                            this.game.difficulty = this.settings.difficulty;
                            this.game.startNewGame();
                            
                            // Hide loading screen after game has started
                            setTimeout(() => {
                                this.hideLoadingScreen();
                            }, 100);
                        } else {
                            console.error("Game instance not available");
                            this.handleLoadingError();
                        }
                    }, 50);
                } catch (error) {
                    console.error("Error starting game:", error);
                    this.handleLoadingError();
                }
            }
        }, 30); // Faster loading
    }
    
    continueGame() {
        // Show loading screen
        this.showLoadingScreen();
        
        // Initialize audio if available right away
        if (typeof audioManager !== 'undefined' && !audioManager.initialized) {
            try {
                audioManager.init();
                
                // Apply mute setting
                if (this.settings.muted) {
                    audioManager.toggleMute();
                }
            } catch (e) {
                console.error('Failed to initialize audio:', e);
                // Continue even if audio fails
            }
        }
        
        // Simulate loading process with a shorter timeout
        let progress = 0;
        const loadingInterval = setInterval(() => {
            progress += 10; // Increase speed
            this.updateLoadingProgress(progress);
            
            if (progress >= 100) {
                clearInterval(loadingInterval);
                
                try {
                    // Hide menus - do this BEFORE starting the game
                    this.hideMenuScreen();
                    
                    // Use setTimeout to ensure the UI updates before continuing the game
                    setTimeout(() => {
                        // Continue game with saved state
                        if (this.game) {
                            this.game.loadSavedGame();
                            
                            // Hide loading screen after game has loaded
                            setTimeout(() => {
                                this.hideLoadingScreen();
                            }, 100);
                        } else {
                            console.error("Game instance not available");
                            this.handleLoadingError();
                        }
                    }, 50);
                } catch (error) {
                    console.error("Error continuing game:", error);
                    this.handleLoadingError();
                }
            }
        }, 30); // Faster loading
    }
    
    toggleSettings() {
        if (this.settingsContainer.style.display === 'none' || !this.settingsContainer.style.display) {
            this.settingsContainer.style.display = 'block';
        } else {
            this.settingsContainer.style.display = 'none';
        }
    }
    
    toggleMute() {
        this.settings.muted = !this.settings.muted;
        
        // Update button text
        this.muteButton.textContent = this.settings.muted ? 'OFF' : 'ON';
        
        // Update audio manager if available
        if (typeof audioManager !== 'undefined' && audioManager.initialized) {
            audioManager.toggleMute();
        }
        
        // Save settings
        this.saveSettings();
    }
    
    showStats() {
        this.updateStatsDisplay();
        this.statsContainer.style.display = 'block';
    }
    
    hideStats() {
        this.statsContainer.style.display = 'none';
    }
    
    updateStatsDisplay() {
        // Get saved game stats
        const stats = loadGameState();
        
        if (!stats) {
            this.statsContent.innerHTML = 'No games completed yet.';
            return;
        }
        
        // Format date
        const date = new Date(stats.timestamp);
        const dateString = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        
        // Create stats HTML
        let statsHtml = `
            <div style="margin-bottom: 15px;">
                <div><strong>Last Game:</strong> ${dateString}</div>
                <div><strong>Game Completed:</strong> ${stats.completed ? 'Yes' : 'No'}</div>
                <div><strong>Stage Reached:</strong> ${stats.stage} / 3</div>
                <div><strong>Artifacts Collected:</strong> ${stats.artifacts}</div>
                <div><strong>Time Remaining:</strong> ${stats.timeRemaining} seconds</div>
                <div><strong>Final Health:</strong> ${stats.health}%</div>
            </div>
        `;
        
        this.statsContent.innerHTML = statsHtml;
    }
    
    showMenuScreen() {
        if (this.menuScreen) {
            this.menuScreen.style.display = 'flex';
        }
    }
    
    hideMenuScreen() {
        if (this.menuScreen) {
            this.menuScreen.style.display = 'none';
        }
    }
    
    showLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'flex';
            this.updateLoadingProgress(0); // Reset progress
        } else {
            // Create loading screen if it doesn't exist
            this.createLoadingScreen();
            this.showLoadingScreen();
        }
    }
    
    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'none';
        }
    }
    
    createLoadingScreen() {
        // Check if loading screen already exists
        this.loadingScreen = document.getElementById('loading-screen');
        if (!this.loadingScreen) {
            // Create loading screen elements
            this.loadingScreen = document.createElement('div');
            this.loadingScreen.id = 'loading-screen';
            this.loadingScreen.style.position = 'absolute';
            this.loadingScreen.style.top = '0';
            this.loadingScreen.style.left = '0';
            this.loadingScreen.style.width = '100%';
            this.loadingScreen.style.height = '100%';
            this.loadingScreen.style.background = 'linear-gradient(to bottom, #000022, #001133)';
            this.loadingScreen.style.display = 'flex';
            this.loadingScreen.style.flexDirection = 'column';
            this.loadingScreen.style.justifyContent = 'center';
            this.loadingScreen.style.alignItems = 'center';
            this.loadingScreen.style.zIndex = '300';
            
            const loadingText = document.createElement('div');
            loadingText.id = 'loading-text';
            loadingText.textContent = 'Generating Labyrinth...';
            loadingText.style.fontSize = '24px';
            loadingText.style.color = '#00ffff';
            loadingText.style.marginBottom = '20px';
            loadingText.style.animation = 'pulse 1.5s infinite';
            
            const loadingBarContainer = document.createElement('div');
            loadingBarContainer.id = 'loading-bar-container';
            loadingBarContainer.style.width = '300px';
            loadingBarContainer.style.height = '20px';
            loadingBarContainer.style.border = '2px solid #00ffff';
            loadingBarContainer.style.borderRadius = '10px';
            loadingBarContainer.style.overflow = 'hidden';
            loadingBarContainer.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.5)';
            
            this.loadingBar = document.createElement('div');
            this.loadingBar.id = 'loading-bar';
            this.loadingBar.style.width = '0%';
            this.loadingBar.style.height = '100%';
            this.loadingBar.style.backgroundColor = '#00ffff';
            this.loadingBar.style.transition = 'width 0.3s';
            
            loadingBarContainer.appendChild(this.loadingBar);
            this.loadingScreen.appendChild(loadingText);
            this.loadingScreen.appendChild(loadingBarContainer);
            
            document.getElementById('game-container').appendChild(this.loadingScreen);
        }
    }
    
    updateLoadingProgress(percent) {
        if (this.loadingBar) {
            this.loadingBar.style.width = percent + '%';
            console.log("Loading progress: " + percent + "%");
        } else {
            console.error("Loading bar element not found");
        }
    }
    
    saveSettings() {
        try {
            localStorage.setItem('futureskillsArtifact_settings', JSON.stringify(this.settings));
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    }
    
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('futureskillsArtifact_settings');
            if (savedSettings) {
                this.settings = JSON.parse(savedSettings);
                
                // Update UI to reflect loaded settings
                this.muteButton.textContent = this.settings.muted ? 'OFF' : 'ON';
                this.difficultySelect.value = this.settings.difficulty;
                
                // Update debug button if it exists
                if (this.debugButton) {
                    this.debugButton.textContent = this.settings.debugMode ? 'ON' : 'OFF';
                }
                
                // Update game instance if available
                if (this.game) {
                    this.game.debugMode = this.settings.debugMode || false;
                    this.game.difficulty = this.settings.difficulty || 1;
                }
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    }
    
    checkForSavedGame() {
        // Check if there's a saved game
        const savedState = loadGameState();
        
        if (savedState && !savedState.completed) {
            // Show continue button if there's a saved game in progress
            this.continueButton.style.display = 'inline-block';
        } else {
            this.continueButton.style.display = 'none';
        }
    }
    
    // Add a method to handle loading errors
    handleLoadingError() {
        // Hide loading screen and show menu again
        this.hideLoadingScreen();
        this.showMenuScreen();
        
        // Display an error message
        alert("There was an error loading the game. Please try again.");
    }
    
    toggleDebugMode() {
        this.settings.debugMode = !this.settings.debugMode;
        
        // Update button text
        if (this.debugButton) {
            this.debugButton.textContent = this.settings.debugMode ? 'ON' : 'OFF';
        }
        
        // Update game instance if available
        if (this.game) {
            this.game.debugMode = this.settings.debugMode;
        }
        
        // Save settings
        this.saveSettings();
        
        console.log(`Debug mode: ${this.settings.debugMode ? 'ON' : 'OFF'}`);
    }
    
    // Check if we're in development mode
    checkDevelopmentMode() {
        // Check if URL has a debug parameter
        const urlParams = new URLSearchParams(window.location.search);
        const debugParam = urlParams.get('debug');
        
        if (debugParam === 'true' || debugParam === '1') {
            this.settings.debugMode = true;
            if (this.debugButton) {
                this.debugButton.textContent = 'ON';
            }
            if (this.game) {
                this.game.debugMode = true;
            }
            console.log('Development mode activated via URL parameter');
        }
    }
}

// Initialize menu system when window loads
window.addEventListener('load', () => {
    // Menu system will be initialized by the Game class
    // which will pass itself as a reference
}); 