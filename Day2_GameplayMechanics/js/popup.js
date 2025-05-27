/**
 * Popup system for FutureskillsArtifact game
 * Handles educational popups after collecting artifacts
 */

class PopupManager {
    constructor() {
        // Get DOM elements
        this.container = document.getElementById('popup-container');
        this.title = document.getElementById('popup-title');
        this.content = document.getElementById('popup-content');
        this.button = document.getElementById('popup-button');
        
        // State
        this.isVisible = false;
        this.callback = null;
        
        // Educational content for each artifact type
        this.educationalContent = {
            'ai': {
                title: 'AI Artifact',
                content: [
                    'Artificial Intelligence (AI) refers to computer systems that can perform tasks that typically require human intelligence.',
                    'Modern AI systems use techniques like deep learning to analyze vast amounts of data and make predictions or decisions.',
                    'AI applications include voice assistants, recommendation systems, autonomous vehicles, and medical diagnosis.',
                    'The field of AI continues to evolve rapidly, with new breakthroughs happening frequently.'
                ]
            },
            'cybersecurity': {
                title: 'Cybersecurity Artifact',
                content: [
                    'Cybersecurity is the practice of protecting systems, networks, and programs from digital attacks.',
                    'Common cyberattacks include malware, phishing, ransomware, and distributed denial-of-service (DDoS) attacks.',
                    'Key cybersecurity principles include confidentiality, integrity, and availability (the CIA triad).',
                    'As technology advances, cybersecurity professionals must constantly update their skills to combat new threats.'
                ]
            },
            'machine-learning': {
                title: 'Machine Learning Artifact',
                content: [
                    'Machine Learning is a subset of AI that enables systems to learn and improve from experience.',
                    'ML algorithms build mathematical models based on sample data (training data) to make predictions.',
                    'Types of ML include supervised learning, unsupervised learning, and reinforcement learning.',
                    'ML powers many modern technologies including image recognition, natural language processing, and predictive analytics.'
                ]
            }
        };
        
        // Initialize event listeners
        this.init();
    }
    
    init() {
        // Set up continue button event listener
        this.button.addEventListener('click', () => {
            this.hide();
            
            // Call the callback function if it exists
            if (typeof this.callback === 'function') {
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
            console.error(`No educational content found for artifact type: ${artifactType}`);
            return;
        }
        
        // Set title and content
        this.title.textContent = content.title;
        
        // Randomly select one fact from the content array
        const randomFact = content.content[Math.floor(Math.random() * content.content.length)];
        this.content.textContent = randomFact;
        
        // Show the popup
        this.container.style.display = 'block';
        this.isVisible = true;
        
        // Add entrance animation
        this.container.style.opacity = '0';
        this.container.style.transform = 'translate(-50%, -60%)';
        
        // Apply animation
        setTimeout(() => {
            this.container.style.transition = 'opacity 0.3s, transform 0.3s';
            this.container.style.opacity = '1';
            this.container.style.transform = 'translate(-50%, -50%)';
        }, 10);
    }
    
    hide() {
        if (!this.isVisible) {
            return;
        }
        
        // Apply exit animation
        this.container.style.opacity = '0';
        this.container.style.transform = 'translate(-50%, -40%)';
        
        // Hide after animation completes
        setTimeout(() => {
            this.container.style.display = 'none';
            this.isVisible = false;
            
            // Reset transform for next time
            this.container.style.transform = 'translate(-50%, -60%)';
        }, 300);
    }
    
    isPopupVisible() {
        return this.isVisible;
    }
    
    // Add a new educational content
    addEducationalContent(artifactType, title, content) {
        this.educationalContent[artifactType] = {
            title,
            content: Array.isArray(content) ? content : [content]
        };
    }
}

// Create singleton instance
const popupManager = new PopupManager(); 