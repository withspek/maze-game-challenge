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
			cloud: {
				title: "Cloud Computing Artifact",
				content: [
					"Cloud computing delivers computing resources over the internet like utilities deliver electricity. Instead of owning servers, you rent computing power, storage, and software when needed.",
					"Scalability in cloud computing works like an accordion - resources automatically expand during high demand and contract when demand decreases, ensuring optimal performance and cost efficiency.",
					"Virtualization creates multiple virtual computers within one physical machine, like dividing a large apartment into smaller units. Each virtual machine operates independently with its own operating system.",
					"Cloud service models include Infrastructure (IaaS - rent the hardware), Platform (PaaS - rent the development environment), and Software (SaaS - rent the complete application).",
				],
			},
			"data-science": {
				title: "Data Science Artifact",
				content: [
					"Data science follows a systematic process: collect data like ingredients, clean it like washing vegetables, analyze it like following a recipe, and present insights like serving a finished dish.",
					"Statistical analysis reveals relationships and trends in data through mathematical techniques. Correlation shows if variables move together, while regression predicts one variable based on others.",
					"Data visualization transforms numbers into visual stories using charts, graphs, and maps. Good visualizations make complex patterns immediately understandable, like turning a spreadsheet into a clear picture.",
					"Hypothesis testing uses statistical methods to determine if observed patterns are real or just random chance, similar to conducting controlled experiments to prove or disprove theories.",
				],
			},
			iot: {
				title: "IoT Artifact",
				content: [
					"Internet of Things (IoT) connects everyday objects to the internet, giving them the ability to collect and share data. Think of it as adding a voice to previously silent objects.",
					"Sensors are IoT's 'senses' that detect changes in the environment like temperature, motion, or light. They convert physical phenomena into digital data that computers can process and analyze.",
					"IoT networks use various communication protocols like WiFi, Bluetooth, or cellular to transmit data. The choice depends on factors like distance, power consumption, and data volume requirements.",
					"Edge computing processes IoT data locally on devices rather than sending everything to distant servers, reducing delays and improving response times for time-critical applications.",
				],
			},
			blockchain: {
				title: "Blockchain Artifact",
				content: [
					"Blockchain creates an unchangeable digital ledger by linking records together like chains. Each new 'block' contains a mathematical fingerprint of the previous block, making tampering detectable.",
					"Decentralization distributes data across multiple computers instead of storing it in one central location. This removes single points of failure and reduces the risk of manipulation or censorship.",
					"Consensus mechanisms ensure all participants agree on the blockchain's current state. Like a group vote, the majority opinion determines which version of the ledger is considered valid.",
					"Smart contracts are self-executing agreements with terms written in code. They automatically enforce rules and execute transactions when predetermined conditions are met, eliminating intermediaries.",
				],
			},
			robotics: {
				title: "Robotics Artifact",
				content: [
					"Robotics combines mechanical engineering (the body), electrical engineering (the nervous system), and computer science (the brain) to create machines that can perform tasks autonomously.",
					"Robotic sensors provide environmental awareness through cameras (vision), microphones (hearing), and touch sensors (feeling). This sensory input helps robots understand and navigate their surroundings.",
					"Actuators are robotic 'muscles' that convert electrical signals into physical movement. Motors, hydraulics, and pneumatics power different types of motion depending on strength and precision requirements.",
					"Robot programming involves breaking complex tasks into simple, sequential steps that machines can execute. Algorithms control decision-making, movement planning, and responses to environmental changes.",
				],
			},
			"quantum-computing": {
				title: "Quantum Computing Artifact",
				content: [
					"Quantum computing uses quantum mechanical properties to process information differently than classical computers. While classical bits are either 0 or 1, quantum bits (qubits) can exist in multiple states simultaneously.",
					"Superposition allows qubits to be in multiple states at once, like a spinning coin that's both heads and tails until it lands. This enables quantum computers to explore many solutions simultaneously.",
					"Quantum entanglement creates mysterious connections between qubits where measuring one instantly affects another, regardless of distance. This property enables powerful parallel processing capabilities.",
					"Quantum algorithms solve specific problems exponentially faster than classical methods by leveraging quantum properties. However, they require specialized programming approaches and are limited to certain problem types.",
				],
			},
		};

		this.init();
	}

	init() {
		// Set up continue button event listener
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

		this.container.style.opacity = "0";
		this.container.style.transform = "translate(-50%, -40%)";

		setTimeout(() => {
			this.container.style.display = "none";
			this.isVisible = false;

			this.container.style.transform = "translate(-50%, -60%)";
		}, 300);
	}

	isPopupVisible() {
		return this.isVisible;
	}

	addEducationalContent(artifactType, title, content) {
		this.educationalContent[artifactType] = {
			title,
			content: Array.isArray(content) ? content : [content],
		};
	}
}

const popupManager = new PopupManager();
