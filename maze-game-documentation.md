# Maze Game: FutureskillsArtifact Documentation

## Table of Contents
1. [Game Overview](#game-overview)
2. [Project Structure](#project-structure)
3. [HTML Structure](#html-structure)
4. [Game Architecture](#game-architecture)
5. [Maze Generation](#maze-generation)
6. [Player Movement](#player-movement)
7. [Artifacts](#artifacts)
8. [Utility Functions](#utility-functions)
9. [Game Flow](#game-flow)
10. [Implementation Steps](#implementation-steps)

## Game Overview

FutureskillsArtifact is a browser-based maze game where players navigate through procedurally generated mazes to collect artifacts. The game features:

- Multiple stages with increasing difficulty
- Collectible artifacts with different visual styles
- Timer-based gameplay
- Player movement with collision detection
- Particle effects and animations

## Project Structure

To recreate this game, you'll need the following files:

```
maze-game/
├── index.html       # Main HTML file
└── js/
    ├── utils.js     # Utility functions
    ├── maze.js      # Maze generation logic
    ├── player.js    # Player controls and rendering
    ├── artifacts.js # Collectible items
    └── game.js      # Main game controller
```

## HTML Structure

Create an `index.html` file with this structure:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FutureskillsArtifact</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background-color: #111;
        overflow: hidden;
        font-family: "Courier New", monospace;
      }

      canvas {
        border: 2px solid #333;
        background: #000;
      }

      #game-container {
        position: relative;
      }

      #hud {
        position: absolute;
        top: -30px;
        left: 5px;
        color: #0f0;
        font-size: 14px;
        text-shadow: 0 0 5px #0f0;
      }
    </style>
  </head>
  <body>
    <div id="game-container">
      <canvas id="gameCanvas" width="800" height="600"></canvas>
      <div id="hud">
        <div id="timer">Time: 120</div>
        <div id="artifacts">Artifacts: 0/3</div>
      </div>
    </div>

    <script src="js/utils.js"></script>
    <script src="js/maze.js"></script>
    <script src="js/player.js"></script>
    <script src="js/artifacts.js"></script>
    <script src="js/game.js"></script>
  </body>
</html>
```

## Game Architecture

### Game Class (game.js)

The `Game` class is the main controller that manages:
- Game initialization
- Game loop (update and render)
- Stage progression
- Timer and HUD updates
- Camera/viewport handling
- Game state (paused, game over, win)

Key properties:
- `canvas` and `ctx`: Canvas and rendering context
- `maze`, `player`, `artifacts`: Game objects
- `stage`, `timer`, `artifactsCollected`: Game state tracking
- `running`, `paused`, `gameOver`, `win`: Game flow control

## Maze Generation

### Maze Class (maze.js)

The `Maze` class handles:
- Procedural maze generation using Kruskal's algorithm
- Grid representation with walls
- Collision detection
- Rendering of maze walls and floor

Implementation details:
1. Create a grid of cells, each with 4 walls (top, right, bottom, left)
2. Use a disjoint-set (Union-Find) structure to merge cells
3. Remove walls between connected cells
4. Add random loops to create multiple paths based on difficulty

```javascript
class Maze {
  constructor(width, height, cellSize, difficulty = 1) {
    // Initialize properties
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.difficulty = difficulty;
    this.cols = Math.floor(width / cellSize);
    this.rows = Math.floor(height / cellSize);
    this.grid = [];
    
    // Create and generate maze
    this.initializeGrid();
    this.generateMaze();
    this.addLoops(difficulty);
  }
  
  // Methods:
  // - initializeGrid(): Create grid with walls
  // - generateMaze(): Apply Kruskal's algorithm
  // - removeWall(): Remove walls between cells
  // - addLoops(): Create multiple paths
  // - getRandomEmptyCell(): Find random accessible cells
  // - isWall(): Check if a position has a wall
  // - render(): Draw the maze
}
```

## Player Movement

### Player Class (player.js)

The `Player` class handles:
- Keyboard input
- Player movement with collision detection
- Jumping mechanics
- Particle effects
- Player rendering with animations

Implementation details:
1. Track keyboard state for movement keys
2. Handle collision detection against maze walls
3. Create particle effects during movement
4. Render player with visual effects

```javascript
class Player {
  constructor(maze, cellSize) {
    // Initialize properties
    const startCell = maze.getRandomEmptyCell();
    this.x = (startCell.x + 0.5) * cellSize;
    this.y = (startCell.y + 0.5) * cellSize;
    this.width = cellSize * 0.6;
    this.height = cellSize * 0.6;
    this.speed = 2;
    this.maze = maze;
    this.cellSize = cellSize;
    
    // Movement properties
    this.vx = 0;
    this.vy = 0;
    this.isJumping = false;
    this.jumpHeight = 0;
    this.maxJumpHeight = 20;
    this.jumpSpeed = 2;
    this.gravity = 0.5;
    
    // Visual effects
    this.particles = [];
    this.frameCount = 0;
    this.pulseValue = 0;
    
    // Setup controls
    this.setupControls();
  }
  
  // Methods:
  // - setupControls(): Initialize input handling
  // - handleKeyDown/Up(): Keyboard event handlers
  // - update(): Update player state and position
  // - applyMovement(): Handle movement with collision
  // - createParticle(): Add movement particles
  // - getCollisionBox(): Get collision area
  // - render(): Draw player and effects
}
```

Key player controls:
- Arrow keys: Move up, down, left, right
- Spacebar: Jump
- ESC: Pause game

## Artifacts

### Artifact Class (artifacts.js)

The `Artifact` class handles:
- Collectible items with different types
- Visual effects and animations
- Collision detection
- Collection state

Implementation details:
1. Place artifacts at random positions in the maze
2. Render different shapes based on artifact type
3. Apply visual effects (hover, rotation, glow)
4. Handle collection state

```javascript
class Artifact {
  constructor(maze, cellSize, type) {
    // Initialize properties
    const cell = maze.getRandomEmptyCell();
    this.x = (cell.x + 0.5) * cellSize;
    this.y = (cell.y + 0.5) * cellSize;
    this.width = cellSize * 0.4;
    this.height = cellSize * 0.4;
    this.collected = false;
    this.type = type;
    
    // Animation properties
    this.hoverOffset = 0;
    this.hoverDir = 1;
    this.rotationAngle = 0;
    this.glowIntensity = 0;
    this.frameCount = 0;
    
    // Setup based on type
    this.setupArtifactType();
  }
  
  // Methods:
  // - setupArtifactType(): Configure based on type
  // - update(): Update animations
  // - getCollisionBox(): Get collision area
  // - collect(): Mark as collected
  // - render(): Draw artifact with effects
  // - drawCube/Shield/Sphere/Gem(): Shape renderers
}
```

Artifact types:
- AI: Magenta cube
- Cybersecurity: Yellow shield
- Machine Learning: Green sphere
- Default: Cyan gem

## Utility Functions

### Utils (utils.js)

The utilities include:
- Random number generation
- Collision detection
- Drawing helpers
- Color generation
- Audio generation

```javascript
// Random integer between min and max (inclusive)
const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Collision detection between rectangles
const checkCollision = (rect1, rect2) => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};

// Draw rounded rectangle
const drawRoundedRect = (ctx, x, y, width, height, radius, fill, stroke) => {
  // Implementation details...
};

// Generate audio tone
const generateTone = (frequency, duration, volume, type) => {
  // Implementation details...
};
```

## Game Flow

The game flow is managed by the `Game` class:

1. Initialize game state and objects
2. Run game loop (update, render)
3. Check for collisions with artifacts
4. Update timer and check for time out
5. Handle stage completion
6. Show appropriate screens (pause, game over, victory)

Game stages:
- Each stage has a 2-minute timer
- Players need to collect all artifacts to complete a stage
- Difficulty increases with each stage
- After all stages are completed, show victory screen

## Implementation Steps

Follow these steps to recreate the game from scratch:

1. **Set up the HTML structure**
   - Create index.html with canvas and HUD elements
   - Add basic styling

2. **Create utility functions (utils.js)**
   - Implement helper functions for collision, drawing, etc.

3. **Implement maze generation (maze.js)**
   - Create grid structure
   - Implement Kruskal's algorithm
   - Add rendering methods

4. **Create player controls (player.js)**
   - Implement keyboard handling
   - Add movement with collision detection
   - Create rendering with effects

5. **Add collectible artifacts (artifacts.js)**
   - Implement different artifact types
   - Add animations and effects
   - Create collection mechanics

6. **Build main game controller (game.js)**
   - Implement game loop
   - Manage game state
   - Create stage progression
   - Add UI screens (pause, game over, victory)

7. **Refine and test**
   - Adjust difficulty and pacing
   - Fine-tune collision detection
   - Add audio feedback
   - Test across browsers

By following these steps and implementing each component, you'll create a complete maze game with procedural generation, player movement, collectibles, and multiple stages. 