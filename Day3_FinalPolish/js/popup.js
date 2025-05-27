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
                title: 'AI Artifact: Rwanda\'s Digital Future',
                content: [
                    'Rwanda is investing in AI education through partnerships with Carnegie Mellon University Africa to develop local AI expertise.',
                    'The Rwanda AI Center promotes research and development of AI solutions for local challenges in agriculture, healthcare, and education.',
                    'Rwanda\'s digital transformation strategy includes AI adoption to improve government services and economic efficiency.',
                    'AI-powered drones are already being used in Rwanda for medical deliveries to remote areas, saving lives across the country.'
                ]
            },
            'cybersecurity': {
                title: 'Cybersecurity Artifact: Rwanda\'s Digital Shield',
                content: [
                    'Rwanda has established the National Cyber Security Authority (NCSA) to protect its growing digital infrastructure.',
                    'Rwanda hosts regular cybersecurity training programs to build local talent and strengthen its digital defense capabilities.',
                    'The Rwanda Information Society Authority (RISA) works to implement security standards across government digital systems.',
                    'As Rwanda\'s digital economy grows, cybersecurity professionals are becoming increasingly important to protect digital assets.'
                ]
            },
            'machine-learning': {
                title: 'Machine Learning Artifact: Rwanda\'s Data Revolution',
                content: [
                    'Rwanda is using machine learning to optimize agricultural practices, helping farmers improve crop yields and sustainability.',
                    'The African Institute for Mathematical Sciences (AIMS) in Rwanda trains students in advanced machine learning techniques.',
                    'Rwanda\'s health system is beginning to implement machine learning for better disease prediction and resource allocation.',
                    'Machine learning is helping Rwanda analyze large datasets to make data-driven policy decisions for economic development.'
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
        
        // Display all facts instead of just one random fact
        this.content.innerHTML = ''; // Clear previous content
        
        // Create a list of facts
        const factsList = document.createElement('ul');
        factsList.style.textAlign = 'left';
        factsList.style.paddingLeft = '20px';
        
        content.content.forEach(fact => {
            const listItem = document.createElement('li');
            listItem.textContent = fact;
            listItem.style.margin = '10px 0';
            factsList.appendChild(listItem);
        });
        
        this.content.appendChild(factsList);
        
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