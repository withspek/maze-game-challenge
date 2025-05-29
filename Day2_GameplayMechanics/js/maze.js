/**
 * Maze generator using Kruskal's Algorithm
 */
class Maze {
  constructor(width, height, cellSize, difficulty = 1) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.difficulty = difficulty;

    // Calculate grid dimensions
    this.cols = Math.floor(width / cellSize);
    this.rows = Math.floor(height / cellSize);

    // Grid representation (2D array)
    this.grid = [];

    // Exit position
    this.exit = { x: 0, y: 0 };

    // Initialize the grid
    this.initializeGrid();

    // Generate the maze using Depth-First Search algorithm
    this.generateMaze();

    // Add some loops/cycles to make multiple paths (based on difficulty)
    this.addLoops(difficulty);
    
    // Create exit position - far from start
    this.createExitPosition();
  }

  initializeGrid() {
    // Initialize the grid with walls
    for (let y = 0; y < this.rows; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.cols; x++) {
        this.grid[y][x] = {
          x,
          y,
          walls: [true, true, true, true], // [top, right, bottom, left]
          visited: false,
        };
      }
    }
  }

  generateMaze() {
    // Disjoint-set (Union-Find) structure
    const parent = new Map();

    const find = (cell) => {
      if (parent.get(cell) !== cell) {
        parent.set(cell, find(parent.get(cell)));
      }
      return parent.get(cell);
    };

    const union = (a, b) => {
      const rootA = find(a);
      const rootB = find(b);
      if (rootA !== rootB) {
        parent.set(rootB, rootA);
        return true;
      }
      return false;
    };

    // Initialize sets
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cellKey = `${x},${y}`;
        parent.set(cellKey, cellKey);
      }
    }

    // Create all possible edges (walls between adjacent cells)
    const edges = [];
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (x < this.cols - 1) {
          edges.push({ x1: x, y1: y, x2: x + 1, y2: y }); // right neighbor
        }
        if (y < this.rows - 1) {
          edges.push({ x1: x, y1: y, x2: x, y2: y + 1 }); // bottom neighbor
        }
      }
    }

    // Shuffle edges randomly
    for (let i = edges.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [edges[i], edges[j]] = [edges[j], edges[i]];
    }

    // Kruskal's algorithm
    for (const edge of edges) {
      const aKey = `${edge.x1},${edge.y1}`;
      const bKey = `${edge.x2},${edge.y2}`;
      if (union(aKey, bKey)) {
        this.removeWall({ x: edge.x1, y: edge.y1 }, { x: edge.x2, y: edge.y2 });
      }
    }
  }

  getUnvisitedNeighbors(x, y) {
    const neighbors = [];

    // Check top neighbor
    if (y > 0 && !this.grid[y - 1][x].visited) {
      neighbors.push({ x, y: y - 1, direction: 0 });
    }

    // Check right neighbor
    if (x < this.cols - 1 && !this.grid[y][x + 1].visited) {
      neighbors.push({ x: x + 1, y, direction: 1 });
    }

    // Check bottom neighbor
    if (y < this.rows - 1 && !this.grid[y + 1][x].visited) {
      neighbors.push({ x, y: y + 1, direction: 2 });
    }

    // Check left neighbor
    if (x > 0 && !this.grid[y][x - 1].visited) {
      neighbors.push({ x: x - 1, y, direction: 3 });
    }

    return neighbors;
  }

  removeWall(cell1, cell2) {
    // Calculate the direction between the cells
    const dx = cell2.x - cell1.x;
    const dy = cell2.y - cell1.y;

    if (dx === 1) {
      // Cell2 is to the right of cell1
      this.grid[cell1.y][cell1.x].walls[1] = false; // Remove right wall of cell1
      this.grid[cell2.y][cell2.x].walls[3] = false; // Remove left wall of cell2
    } else if (dx === -1) {
      // Cell2 is to the left of cell1
      this.grid[cell1.y][cell1.x].walls[3] = false; // Remove left wall of cell1
      this.grid[cell2.y][cell2.x].walls[1] = false; // Remove right wall of cell2
    } else if (dy === 1) {
      // Cell2 is below cell1
      this.grid[cell1.y][cell1.x].walls[2] = false; // Remove bottom wall of cell1
      this.grid[cell2.y][cell2.x].walls[0] = false; // Remove top wall of cell2
    } else if (dy === -1) {
      // Cell2 is above cell1
      this.grid[cell1.y][cell1.x].walls[0] = false; // Remove top wall of cell1
      this.grid[cell2.y][cell2.x].walls[2] = false; // Remove bottom wall of cell2
    }
  }

  addLoops(difficulty) {
    // Add random loops to create multiple paths
    const numLoops = Math.floor(this.cols * this.rows * 0.05 * difficulty);

    for (let i = 0; i < numLoops; i++) {
      const x = getRandomInt(1, this.cols - 2);
      const y = getRandomInt(1, this.rows - 2);

      // Randomly remove a wall
      const wallIndex = getRandomInt(0, 3);
      this.grid[y][x].walls[wallIndex] = false;

      // Remove the corresponding wall from the adjacent cell
      if (wallIndex === 0 && y > 0) {
        // Top
        this.grid[y - 1][x].walls[2] = false;
      } else if (wallIndex === 1 && x < this.cols - 1) {
        // Right
        this.grid[y][x + 1].walls[3] = false;
      } else if (wallIndex === 2 && y < this.rows - 1) {
        // Bottom
        this.grid[y + 1][x].walls[0] = false;
      } else if (wallIndex === 3 && x > 0) {
        // Left
        this.grid[y - 1][x].walls[1] = false;
      }
    }
  }

  getRandomEmptyCell() {
    // Find a random cell that has at least one open path
    let x, y;
    let attempts = 0;

    do {
      x = getRandomInt(0, this.cols - 1);
      y = getRandomInt(0, this.rows - 1);
      attempts++;

      // Prevent infinite loop
      if (attempts > 100) {
        return { x: 1, y: 1 };
      }
    } while (this.grid[y][x].walls.every((wall) => wall));

    return { x, y };
  }

  isWall(x, y, direction) {
    // Convert game coordinates to grid coordinates
    const gridX = Math.floor(x / this.cellSize);
    const gridY = Math.floor(y / this.cellSize);

    // Check if the coordinates are valid
    if (gridX < 0 || gridX >= this.cols || gridY < 0 || gridY >= this.rows) {
      return true;
    }

    return this.grid[gridY][gridX].walls[direction];
  }

  createExitPosition() {
    // Place exit far away from the start (0,0)
    // Try to place it in the opposite corner or a far edge
    const farX = Math.floor(this.cols * 0.8) + getRandomInt(0, Math.floor(this.cols * 0.2) - 1);
    const farY = Math.floor(this.rows * 0.8) + getRandomInt(0, Math.floor(this.rows * 0.2) - 1);
    
    // Make sure it's within bounds
    this.exit.x = Math.min(farX, this.cols - 1);
    this.exit.y = Math.min(farY, this.rows - 1);
  }
  
  isExitPosition(x, y) {
    // Check if the given grid position is the exit
    const gridX = Math.floor(x / this.cellSize);
    const gridY = Math.floor(y / this.cellSize);
    return gridX === this.exit.x && gridY === this.exit.y;
  }

  render(ctx) {
    // Draw the maze walls
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    
    // Render each cell
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cell = this.grid[y][x];
        const cellX = x * this.cellSize;
        const cellY = y * this.cellSize;
        
        // Draw cell walls
        if (cell.walls[0]) { // Top wall
          ctx.beginPath();
          ctx.moveTo(cellX, cellY);
          ctx.lineTo(cellX + this.cellSize, cellY);
          ctx.stroke();
        }
        
        if (cell.walls[1]) { // Right wall
          ctx.beginPath();
          ctx.moveTo(cellX + this.cellSize, cellY);
          ctx.lineTo(cellX + this.cellSize, cellY + this.cellSize);
          ctx.stroke();
        }
        
        if (cell.walls[2]) { // Bottom wall
          ctx.beginPath();
          ctx.moveTo(cellX, cellY + this.cellSize);
          ctx.lineTo(cellX + this.cellSize, cellY + this.cellSize);
          ctx.stroke();
        }
        
        if (cell.walls[3]) { // Left wall
          ctx.beginPath();
          ctx.moveTo(cellX, cellY);
          ctx.lineTo(cellX, cellY + this.cellSize);
          ctx.stroke();
        }
      }
    }
    
    // Draw exit
    const exitX = this.exit.x * this.cellSize;
    const exitY = this.exit.y * this.cellSize;
    
    // Draw exit marker (portal-like circle)
    const gradient = ctx.createRadialGradient(
      exitX + this.cellSize / 2,
      exitY + this.cellSize / 2,
      2,
      exitX + this.cellSize / 2,
      exitY + this.cellSize / 2,
      this.cellSize / 2
    );
    
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(0.4, '#00FFAA');
    gradient.addColorStop(1, '#007755');
    
    // Add glow effect
    ctx.shadowColor = '#00FFAA';
    ctx.shadowBlur = 15;
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(
      exitX + this.cellSize / 2,
      exitY + this.cellSize / 2,
      this.cellSize / 3,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Add pulsing effect by adding another smaller circle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    
    // Use time-based animation for the pulse
    const pulseSize = (Math.sin(Date.now() / 200) + 1) * 5 + 3;
    
    ctx.arc(
      exitX + this.cellSize / 2,
      exitY + this.cellSize / 2,
      pulseSize,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Draw "EXIT" text that floats up and down
    const textY = exitY - 10 + Math.sin(Date.now() / 500) * 5;
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00FFAA';
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 8;
    ctx.fillText('EXIT', exitX + this.cellSize / 2, textY);
    
    // Reset shadow
    ctx.shadowBlur = 0;
  }
}
