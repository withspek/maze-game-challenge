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
            },
            'cloud': {
                title: 'Cloud Computing Artifact: Rwanda\'s Digital Infrastructure',
                content: [
                    'Rwanda is investing in cloud infrastructure to support e-government and digital services.',
                    'Cloud computing enables Rwandan startups and businesses to scale quickly and efficiently.',
                    'The government promotes cloud adoption for secure data storage and disaster recovery.',
                    'Cloud-based platforms are helping Rwandan schools and universities deliver online education.'
                ]
            },
            'data-science': {
                title: 'Data Science Artifact: Rwanda\'s Insight Revolution',
                content: [
                    'Rwanda is building data science capacity to drive evidence-based policy making.',
                    'Data science is used in Rwanda to analyze health, education, and economic data for better outcomes.',
                    'The Rwanda Data Portal provides open data for researchers and entrepreneurs.',
                    'Data-driven insights are helping Rwanda optimize public transportation and urban planning.'
                ]
            },
            'iot': {
                title: 'IoT Artifact: Rwanda\'s Connected Future',
                content: [
                    'Rwanda is piloting IoT solutions for smart agriculture and livestock monitoring.',
                    'IoT devices are being used to monitor air and water quality in Rwandan cities.',
                    'Smart sensors help Rwandan farmers track soil moisture and improve crop yields.',
                    'IoT is enabling Rwanda to develop smart city infrastructure for improved public services.'
                ]
            },
            'blockchain': {
                title: 'Blockchain Artifact: Rwanda\'s Trust Technology',
                content: [
                    'Rwanda is exploring blockchain for secure land registration and supply chain transparency.',
                    'Blockchain technology is being used to track minerals and ensure ethical sourcing in Rwanda.',
                    'The government is studying blockchain for digital identity and secure voting systems.',
                    'Rwanda\'s tech community is piloting blockchain for financial inclusion and remittances.'
                ]
            },
            'robotics': {
                title: 'Robotics Artifact: Rwanda\'s Automation Leap',
                content: [
                    'Rwanda is introducing robotics in education to inspire the next generation of engineers.',
                    'Robotics competitions are held in Rwanda to foster innovation and teamwork among students.',
                    'Rwandan hospitals are exploring robotics for medical procedures and logistics.',
                    'Robotics is helping Rwanda automate manufacturing and agricultural processes.'
                ]
            },
            'quantum-computing': {
                title: 'Quantum Computing Artifact: Rwanda\'s Quantum Leap',
                content: [
                    'Rwanda is investing in advanced computing research, including quantum technologies.',
                    'Quantum computing could help Rwanda solve complex problems in logistics and cryptography.',
                    'Rwandan universities are partnering internationally to build quantum computing expertise.',
                    'Quantum technologies are seen as a future driver for Rwanda\'s digital transformation.'
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