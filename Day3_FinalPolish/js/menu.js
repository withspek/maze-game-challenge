/**
 * Menu system
 * Handles main menu, settings, statistics and loading screens
 */

class MenuSystem {
	constructor(gameInstance) {
		this.game = gameInstance;

		this.menuScreen = document.getElementById("menu-screen");
		this.startButton = document.getElementById("start-button");
		this.continueButton = document.getElementById("continue-button");

		this.setupEventListeners();
		this.checkForSavedGame();

		this.showMenuScreen();
	}

	setupEventListeners() {
		this.startButton.addEventListener("click", () => {
			this.startGame();
		});

		this.continueButton.addEventListener("click", () => {
			this.continueGame();
		});

		document.addEventListener("keydown", (e) => {
			if (e.key === "Enter" && this.menuScreen.style.display !== "none") {
				this.startGame();
			}
		});
	}

	startGame() {
		if (typeof audioManager !== "undefined" && !audioManager.initialized) {
			try {
				audioManager.init();
			} catch (e) {
				console.error("Failed to initialize audio:", e);
			}
		}

		try {
			this.hideMenuScreen();

			if (this.game) {
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

	continueGame() {
		if (typeof audioManager !== "undefined" && !audioManager.initialized) {
			try {
				audioManager.init();
			} catch (e) {
				console.error("Failed to initialize audio:", e);
				// Continue even if audio fails
			}
		}

		try {
			this.hideMenuScreen();
			
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

	checkForSavedGame() {
		// Check if there's a saved game
		const savedState = this.game ? this.game.loadGameState() : null;

		if (savedState && !savedState.completed) {
			// Show continue button if there's a saved game in progress
			this.continueButton.style.display = "inline-block";
		} else {
			this.continueButton.style.display = "none";
		}
	}

	handleLoadingError() {
		this.showMenuScreen();
		alert("There was an error loading the game. Please try again.");
	}
}

window.addEventListener("load", () => {});
