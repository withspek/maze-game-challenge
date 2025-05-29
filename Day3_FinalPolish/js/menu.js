/**
 * Menu system
 * Handles main menu, settings, statistics and loading screens
 */

class MenuSystem {
	constructor(gameInstance) {
		// Reference to the game instance
		this.game = gameInstance;

		// Menu elements
		this.menuScreen = document.getElementById("menu-screen");
		this.startButton = document.getElementById("start-button");
		this.continueButton = document.getElementById("continue-button");
		this.settingsButton = document.getElementById("settings-button");
		this.statsButton = document.getElementById("stats-button");
		this.settingsContainer = document.getElementById("settings-container");
		this.muteButton = document.getElementById("mute-button");
		this.difficultySelect = document.getElementById("difficulty-select");
		this.debugButton = document.getElementById("debug-button");
		this.statsContainer = document.getElementById("stats-container");
		this.statsContent = document.getElementById("stats-content");
		this.statsCloseButton = document.getElementById("stats-close");

		// Create loading screen if it doesn't exist
		this.loadingScreen = document.getElementById("loading-screen");
		if (!this.loadingScreen) {
			this.createLoadingScreen();
		} else {
			this.loadingBar = document.getElementById("loading-bar");
		}

		// Settings
		this.settings = {
			muted: false,
			difficulty: 1, // 1 = normal, 2 = hard
			debugMode: false, // Debug mode setting
		};

		// Stars for decoration - these are now in the HTML directly
		this.stars = document.querySelectorAll(".menu-star");

		// Initialize
		this.setupEventListeners();
		this.loadSettings();
		this.updateStatsDisplay();
		this.checkForSavedGame();

		// Apply the new design to the menu screen
		this.applyMenuDesign();

		// Show menu screen immediately
		this.showMenuScreen();
		this.animateStars();

		// Check if we're in development mode
		this.checkDevelopmentMode();
	}

	applyMenuDesign() {
		// Apply gradient background
		this.menuScreen.style.background =
			"linear-gradient(to bottom, #7FFFD4, #2E8B57)";

		// Update menu title and add subtitle
		const menuTitle = document.getElementById("menu-title");
		menuTitle.innerHTML =
			'FutureskillsArti<span style="color: #00AA00;">★</span>act';
		menuTitle.style.color = "#FFFFFF";
		menuTitle.style.textShadow = "0 0 10px #00AA00, 0 0 20px #00AA00";
		menuTitle.style.fontWeight = "bold";
		menuTitle.style.fontSize = "42px";

		// Check if subtitle already exists and remove it if it does
		const existingSubtitle = document.querySelector(".menu-subtitle");
		if (existingSubtitle) {
			existingSubtitle.remove();
		}

		// Create subtitle
		const subtitle = document.createElement("div");
		subtitle.innerHTML = "RFSF National SKILLS Competition 2025";
		subtitle.style.color = "#FFFFFF";
		subtitle.style.fontSize = "18px";
		subtitle.style.marginBottom = "30px";
		subtitle.style.textShadow = "0 0 5px #008800";
		subtitle.classList.add("menu-subtitle");
		menuTitle.after(subtitle);

		// Check if progress bar already exists and remove it if it does
		const existingProgressBar = document.querySelector(".menu-progress-bar");
		if (existingProgressBar) {
			existingProgressBar.remove();
		}

		// Create progress bar
		const progressBar = document.createElement("div");
		progressBar.style.width = "300px";
		progressBar.style.height = "10px";
		progressBar.style.display = "flex";
		progressBar.style.marginBottom = "40px";
		progressBar.classList.add("menu-progress-bar");
		progressBar.innerHTML = `
            <div style="flex: 1; height: 100%; background-color: #0088FF; margin-right: 2px;"></div>
            <div style="flex: 1; height: 100%; background-color: #FFCC00; margin-right: 2px;"></div>
            <div style="flex: 1; height: 100%; background-color: #00AA00;"></div>
        `;
		subtitle.after(progressBar);

		// Update start button to match design
		this.startButton.textContent = "Press ENTER to start";
		this.startButton.style.backgroundColor = "transparent";
		this.startButton.style.color = "#FFFFFF";
		this.startButton.style.border = "none";
		this.startButton.style.fontSize = "24px";
		this.startButton.style.textShadow = "0 0 10px #00AA00";
		this.startButton.style.animation = "pulse 1.5s infinite";
		this.startButton.style.cursor = "pointer";
		this.startButton.style.width = "auto";

		// Hide other buttons to match the design
		this.continueButton.style.display = "none";
		this.settingsButton.style.display = "none";
		this.statsButton.style.display = "none";

		// Check if controls info already exists and remove it if it does
		const existingControlsInfo = document.querySelector(".menu-controls-info");
		if (existingControlsInfo) {
			existingControlsInfo.remove();
		}

		// Add controls info
		const controlsInfo = document.createElement("div");
		controlsInfo.style.position = "absolute";
		controlsInfo.style.bottom = "80px";
		controlsInfo.style.left = "0";
		controlsInfo.style.width = "100%";
		controlsInfo.style.textAlign = "center";
		controlsInfo.style.color = "#FFFFFF";
		controlsInfo.style.fontSize = "16px";
		controlsInfo.classList.add("menu-controls-info");
		controlsInfo.innerHTML = `
            <div style="margin-bottom: 5px;">Controls:</div>
            <div>Arrow keys - Move</div>
            <div>Spacebar - Jump</div>
            <div>ESC - Pause</div>
        `;
		this.menuScreen.appendChild(controlsInfo);
	}

	animateStars() {
		// Animate stars with subtle rotation and pulsing
		this.stars.forEach((star, index) => {
			const rotateAmount = Math.random() * 20 - 10; // -10 to 10 degrees
			star.style.transform = `rotate(${rotateAmount}deg)`;

			// Different animation timing for each star
			setTimeout(() => {
				if (star.style.opacity === "1" || !star.style.opacity) {
					star.style.opacity = "0.7";
				} else {
					star.style.opacity = "1";
				}
			}, index * 500);
		});

		// Continue animation
		setTimeout(() => this.animateStars(), 2000);
	}

	setupEventListeners() {
		// Start button
		this.startButton.addEventListener("click", () => {
			this.startGame();
		});

		// Continue button
		this.continueButton.addEventListener("click", () => {
			this.continueGame();
		});

		// Add keyboard support for ENTER key
		document.addEventListener("keydown", (e) => {
			if (e.key === "Enter" && this.menuScreen.style.display !== "none") {
				this.startGame();
			}
		});
	}

	startGame() {
		// Initialize audio if available right away
		if (typeof audioManager !== "undefined" && !audioManager.initialized) {
			try {
				audioManager.init();
			} catch (e) {
				console.error("Failed to initialize audio:", e);
				// Continue even if audio fails
			}
		}

		try {
			// Hide menu screen
			this.hideMenuScreen();

			// Start new game with current settings
			if (this.game) {
				this.game.difficulty = this.settings.difficulty;
				this.game.startNewGame();
			} else {
				console.error("Game instance not available");
				this.handleLoadingError();
			}
		} catch (error) {
			console.error("Error starting game:", error);
			this.handleLoadingError();
		}
	}

	continueGame() {
		// Initialize audio if available right away
		if (typeof audioManager !== "undefined" && !audioManager.initialized) {
			try {
				audioManager.init();
			} catch (e) {
				console.error("Failed to initialize audio:", e);
				// Continue even if audio fails
			}
		}

		try {
			// Hide menu screen
			this.hideMenuScreen();

			// Continue game with saved state
			if (this.game) {
				this.game.loadSavedGame();
			} else {
				console.error("Game instance not available");
				this.handleLoadingError();
			}
		} catch (error) {
			console.error("Error continuing game:", error);
			this.handleLoadingError();
		}
	}

	toggleSettings() {
		if (
			this.settingsContainer.style.display === "none" ||
			!this.settingsContainer.style.display
		) {
			this.settingsContainer.style.display = "block";
		} else {
			this.settingsContainer.style.display = "none";
		}
	}

	toggleMute() {
		this.settings.muted = !this.settings.muted;

		// Update button text
		this.muteButton.textContent = this.settings.muted ? "OFF" : "ON";

		// Update audio manager if available
		if (typeof audioManager !== "undefined" && audioManager.initialized) {
			audioManager.toggleMute();
		}

		// Save settings
		this.saveSettings();
	}

	showStats() {
		this.updateStatsDisplay();
		this.statsContainer.style.display = "block";
	}

	hideStats() {
		this.statsContainer.style.display = "none";
	}

	updateStatsDisplay() {
		// Get saved game stats
		const stats = loadGameState();

		if (!stats) {
			this.statsContent.innerHTML = "No games completed yet.";
			return;
		}

		// Format date
		const date = new Date(stats.timestamp);
		const dateString = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

		const statsHtml = `
            <div style="margin-bottom: 15px;">
                <div><strong>Last Game:</strong> ${dateString}</div>
                <div><strong>Game Completed:</strong> ${stats.completed ? "Yes" : "No"}</div>
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
			this.menuScreen.style.display = "flex";
		}
	}

	hideMenuScreen() {
		if (this.menuScreen) {
			this.menuScreen.style.display = "none";
		}
	}

	showLoadingScreen() {
		console.log("Loading screen functionality has been removed");
	}

	hideLoadingScreen() {}

	createLoadingScreen() {
		console.log("Loading screen functionality has been removed");
	}

	updateLoadingProgress(percent) {}

	saveSettings() {
		try {
			localStorage.setItem(
				"futureskillsArtifact_settings",
				JSON.stringify(this.settings),
			);
		} catch (e) {
			console.error("Failed to save settings:", e);
		}
	}

	loadSettings() {
		try {
			const savedSettings = localStorage.getItem(
				"futureskillsArtifact_settings",
			);
			if (savedSettings) {
				this.settings = JSON.parse(savedSettings);

				// Update UI to reflect loaded settings
				this.muteButton.textContent = this.settings.muted ? "OFF" : "ON";
				this.difficultySelect.value = this.settings.difficulty;

				// Update debug button if it exists
				if (this.debugButton) {
					this.debugButton.textContent = this.settings.debugMode ? "ON" : "OFF";
				}

				// Update game instance if available
				if (this.game) {
					this.game.debugMode = this.settings.debugMode || false;
					this.game.difficulty = this.settings.difficulty || 1;
				}
			}
		} catch (e) {
			console.error("Failed to load settings:", e);
		}
	}

	checkForSavedGame() {
		// Check if there's a saved game
		const savedState = loadGameState();

		if (savedState && !savedState.completed) {
			// Show continue button if there's a saved game in progress
			this.continueButton.style.display = "inline-block";
		} else {
			this.continueButton.style.display = "none";
		}
	}

	// Add a method to handle loading errors
	handleLoadingError() {
		// Show menu again
		this.showMenuScreen();

		// Display an error message
		alert("There was an error loading the game. Please try again.");
	}

	toggleDebugMode() {
		this.settings.debugMode = !this.settings.debugMode;

		// Update button text
		if (this.debugButton) {
			this.debugButton.textContent = this.settings.debugMode ? "ON" : "OFF";
		}

		// Update game instance if available
		if (this.game) {
			this.game.debugMode = this.settings.debugMode;
		}

		// Save settings
		this.saveSettings();

		console.log(`Debug mode: ${this.settings.debugMode ? "ON" : "OFF"}`);
	}

	// Check if we're in development mode
	checkDevelopmentMode() {
		// Check if URL has a debug parameter
		const urlParams = new URLSearchParams(window.location.search);
		const debugParam = urlParams.get("debug");

		if (debugParam === "true" || debugParam === "1") {
			this.settings.debugMode = true;
			if (this.debugButton) {
				this.debugButton.textContent = "ON";
			}
			if (this.game) {
				this.game.debugMode = true;
			}
			console.log("Development mode activated via URL parameter");
		}
	}
}

window.addEventListener("load", () => {
	// Menu system will be initialized by the Game class
	// which will pass itself as a reference
});
