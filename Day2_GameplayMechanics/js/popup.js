/**
 * Popup system
 * Handles educational popups after collecting artifacts
 */
class PopupManager {
	constructor() {
		this.container = document.getElementById("popup-container");
		this.title = document.getElementById("popup-title");
		this.content = document.getElementById("popup-content");
		this.button = document.getElementById("popup-button");

		// State
		this.isVisible = false;
		this.callback = null;

		this.educationalContent = {
			ai: {
				title: "AI Artifact",
				content: [
					"Artificial Intelligence mimics human thinking by recognizing patterns in data. Just like how you learn to recognize faces, AI learns to identify patterns in images, text, or numbers.",
					"Machine learning is AI's way of improving through practice. When you show an AI thousands of photos labeled 'cat' or 'dog', it learns the differences and can classify new photos correctly.",
					"Neural networks are inspired by how brain cells connect. Multiple layers of artificial 'neurons' process information, with each layer learning increasingly complex features from simple to sophisticated.",
					"AI algorithms make decisions by calculating probabilities. They evaluate multiple options and choose the one most likely to achieve the desired outcome based on their training data.",
				],
			},
			cybersecurity: {
				title: "Cybersecurity Artifact",
				content: [
					"Cybersecurity works like a castle's defense system with multiple protective layers. Firewalls act as walls, antivirus as guards, and encryption as secret codes that only authorized people can read.",
					"Authentication verifies identity through something you know (password), something you have (phone), or something you are (fingerprint). Multi-factor authentication combines these for stronger security.",
					"Encryption transforms readable information into scrambled code using mathematical algorithms. Only those with the correct 'key' can unscramble and read the original message.",
					"Threat detection uses pattern recognition to identify suspicious behavior. Just like how you notice when someone acts unusually, security systems flag activities that don't match normal patterns.",
				],
			},
			"machine-learning": {
				title: "Machine Learning Artifact",
				content: [
					"Supervised learning teaches algorithms using labeled examples, like showing a child pictures of animals with their names. The algorithm learns to predict labels for new, unseen data.",
					"Unsupervised learning finds hidden patterns in data without labels, similar to organizing a messy room by grouping similar items together without being told what categories to use.",
					"Reinforcement learning trains algorithms through trial and error with rewards and penalties, like teaching someone to play chess by giving points for good moves and deducting for bad ones.",
					"Feature engineering involves selecting and transforming the most important characteristics of data, like choosing which measurements of a plant (height, leaf color, stem thickness) best predict its species.",
				],
			},
		};

		this.init();
	}

	init() {
		this.button.addEventListener("click", () => {
			this.hide();

			// Call the callback function if it exists
			if (typeof this.callback === "function") {
				this.callback();
			}
		});
	}

	show(artifactType, callback = null) {
		if (this.isVisible) {
			return;
		}

		// Set callback function
		this.callback = callback;

		// Get content for the artifact type
		const content = this.educationalContent[artifactType];

		if (!content) {
			console.error(
				`No educational content found for artifact type: ${artifactType}`,
			);
			return;
		}

		// Set title and content
		this.title.textContent = content.title;

		// Randomly select one fact from the content array
		const randomFact =
			content.content[Math.floor(Math.random() * content.content.length)];
		this.content.textContent = randomFact;

		this.container.style.display = "block";
		this.isVisible = true;

		// entrance animation
		this.container.style.opacity = "0";
		this.container.style.transform = "translate(-50%, -60%)";

		// Apply animation
		setTimeout(() => {
			this.container.style.transition = "opacity 0.3s, transform 0.3s";
			this.container.style.opacity = "1";
			this.container.style.transform = "translate(-50%, -50%)";
		}, 10);
	}

	hide() {
		if (!this.isVisible) {
			return;
		}

		// Apply exit animation
		this.container.style.opacity = "0";
		this.container.style.transform = "translate(-50%, -40%)";

		// Hide after animation completes
		setTimeout(() => {
			this.container.style.display = "none";
			this.isVisible = false;

			// Reset transform for next time
			this.container.style.transform = "translate(-50%, -60%)";
		}, 300);
	}

	isPopupVisible() {
		return this.isVisible;
	}

	// Add a new educational content
	addEducationalContent(artifactType, title, content) {
		this.educationalContent[artifactType] = {
			title,
			content: Array.isArray(content) ? content : [content],
		};
	}
}

const popupManager = new PopupManager();
