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

    // Initialize the grid
    this.initializeGrid();

    // Generate the maze using Depth-First Search algorithm
    this.generateMaze();

    // Add some loops/cycles to make multiple paths (based on difficulty)
    this.addLoops(difficulty);
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

  render(ctx) {
    ctx.save();

    // Set the wall color
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 2;

    // Render each cell
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cell = this.grid[y][x];
        const cellX = x * this.cellSize;
        const cellY = y * this.cellSize;

        // Draw the walls
        if (cell.walls[0]) {
          // Top
          ctx.beginPath();
          ctx.moveTo(cellX, cellY);
          ctx.lineTo(cellX + this.cellSize, cellY);
          ctx.stroke();
        }

        if (cell.walls[1]) {
          // Right
          ctx.beginPath();
          ctx.moveTo(cellX + this.cellSize, cellY);
          ctx.lineTo(cellX + this.cellSize, cellY + this.cellSize);
          ctx.stroke();
        }

        if (cell.walls[2]) {
          // Bottom
          ctx.beginPath();
          ctx.moveTo(cellX, cellY + this.cellSize);
          ctx.lineTo(cellX + this.cellSize, cellY + this.cellSize);
          ctx.stroke();
        }

        if (cell.walls[3]) {
          // Left
          ctx.beginPath();
          ctx.moveTo(cellX, cellY);
          ctx.lineTo(cellX, cellY + this.cellSize);
          ctx.stroke();
        }

        // Draw floor pattern (subtle grid)
        ctx.fillStyle = "#001122";
        ctx.fillRect(
          cellX + 1,
          cellY + 1,
          this.cellSize - 2,
          this.cellSize - 2
        );

        // Add some subtle floor detail
        ctx.fillStyle = "#002233";
        ctx.fillRect(
          cellX + this.cellSize * 0.25,
          cellY + this.cellSize * 0.25,
          this.cellSize * 0.5,
          this.cellSize * 0.5
        );
      }
    }

    ctx.restore();
  }
}
