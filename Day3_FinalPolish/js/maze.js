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

    // Shortest path for debug mode
    this.shortestPath = [];
    this.pathStart = null;
    this.pathEnd = null;
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
      return true; // Treat out-of-bounds as walls
    }

    // Validate direction is within range
    if (direction < 0 || direction > 3) {
      console.warn(`Invalid wall direction: ${direction}`);
      return true; // Treat invalid directions as walls for safety
    }

    try {
      // Access the grid cell and check the wall
      const cell = this.grid[gridY][gridX];

      // Ensure the cell and its walls property exist
      if (!cell || !cell.walls) {
        console.warn(`Invalid cell at ${gridX},${gridY}`);
        return true; // Treat invalid cells as walls for safety
      }

      return cell.walls[direction];
    } catch (error) {
      console.error(
        `Error checking wall at ${gridX},${gridY}, direction ${direction}:`,
        error
      );
      return true; // Treat errors as walls for safety
    }
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
    // Get grid position from pixel coordinates
    const gridX = Math.floor(x / this.cellSize);
    const gridY = Math.floor(y / this.cellSize);
    
    // Calculate distance from exit
    const distance = Math.sqrt(
      Math.pow(gridX - this.exit.x, 2) + 
      Math.pow(gridY - this.exit.y, 2)
    );
    
    // Check for exact match or close proximity (within 1 cell)
    const exactMatch = gridX === this.exit.x && gridY === this.exit.y;
    const closeProximity = distance < 1.2; // Within ~1.2 cells for diagonal approach
    
    // Log the check for debugging when the player is close
    if (distance < 2) {
      console.log(`Exit check: Player at (${gridX}, ${gridY}), Exit at (${this.exit.x}, ${this.exit.y}), Distance: ${distance.toFixed(2)}`);
      console.log(`Exit match? ${exactMatch || closeProximity ? "YES" : "NO"}`);
    }
    
    return exactMatch || closeProximity;
  }

  render(ctx, theme) {
    ctx.save();

    // Store theme reference for debugging
    this.theme = theme;

    // Set the wall color based on theme
    const wallColor = theme ? theme.wallColor : "#00ffff";
    const floorColor = theme ? theme.floorColor : "#001122";
    const floorDetailColor = theme ? theme.floorDetailColor : "#003366";

    ctx.strokeStyle = wallColor;
    ctx.lineWidth = 2;

    // Render each cell
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const cell = this.grid[y][x];
        const cellX = x * this.cellSize;
        const cellY = y * this.cellSize;

        // Draw cell floor
        ctx.fillStyle = floorColor;
        ctx.fillRect(cellX, cellY, this.cellSize, this.cellSize);

        // Add floor details (grid pattern)
        ctx.strokeStyle = floorDetailColor;
        ctx.lineWidth = 0.5;

        // Draw grid pattern on floor
        if ((x + y) % 2 === 0) {
          ctx.beginPath();
          ctx.moveTo(
            cellX + this.cellSize * 0.25,
            cellY + this.cellSize * 0.25
          );
          ctx.lineTo(
            cellX + this.cellSize * 0.75,
            cellY + this.cellSize * 0.75
          );
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(
            cellX + this.cellSize * 0.75,
            cellY + this.cellSize * 0.25
          );
          ctx.lineTo(
            cellX + this.cellSize * 0.25,
            cellY + this.cellSize * 0.75
          );
          ctx.stroke();
        }

        // Reset to wall color for drawing walls
        ctx.strokeStyle = wallColor;
        ctx.lineWidth = 2;

        // Draw walls
        if (cell.walls[0]) {
          // Top wall
          ctx.beginPath();
          ctx.moveTo(cellX, cellY);
          ctx.lineTo(cellX + this.cellSize, cellY);
          ctx.stroke();
        }

        if (cell.walls[1]) {
          // Right wall
          ctx.beginPath();
          ctx.moveTo(cellX + this.cellSize, cellY);
          ctx.lineTo(cellX + this.cellSize, cellY + this.cellSize);
          ctx.stroke();
        }

        if (cell.walls[2]) {
          // Bottom wall
          ctx.beginPath();
          ctx.moveTo(cellX, cellY + this.cellSize);
          ctx.lineTo(cellX + this.cellSize, cellY + this.cellSize);
          ctx.stroke();
        }

        if (cell.walls[3]) {
          // Left wall
          ctx.beginPath();
          ctx.moveTo(cellX, cellY);
          ctx.lineTo(cellX, cellY + this.cellSize);
          ctx.stroke();
        }

        // Add wall glow effect
        if (this.difficulty > 1) {
          ctx.shadowColor = wallColor;
          ctx.shadowBlur = 3;

          // Increase glow with difficulty
          if (this.difficulty >= 3) {
            ctx.shadowBlur = 5;
          }
        }
      }
    }
    
    // Draw exit
    const exitX = this.exit.x * this.cellSize;
    const exitY = this.exit.y * this.cellSize;
    
    // Create outer glow for exit
    const outerGlow = ctx.createRadialGradient(
      exitX + this.cellSize / 2,
      exitY + this.cellSize / 2,
      this.cellSize / 4,
      exitX + this.cellSize / 2,
      exitY + this.cellSize / 2,
      this.cellSize * 0.8
    );
    
    outerGlow.addColorStop(0, 'rgba(0, 255, 170, 0.3)');
    outerGlow.addColorStop(1, 'rgba(0, 255, 170, 0)');
    
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(
      exitX + this.cellSize / 2,
      exitY + this.cellSize / 2,
      this.cellSize * 0.8,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
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
    
    // Add swirling particles around exit
    this.renderExitParticles(ctx, exitX + this.cellSize / 2, exitY + this.cellSize / 2);
    
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

    ctx.restore();
  }
  
  // Add method to render particles around the exit
  renderExitParticles(ctx, x, y) {
    // Calculate time-based offset for particle animation
    const time = Date.now() / 1000;
    
    // Draw 8 particles circling around the exit
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + time;
      const radius = this.cellSize * 0.5;
      const particleX = x + Math.cos(angle) * radius;
      const particleY = y + Math.sin(angle) * radius;
      const particleSize = 2 + Math.sin(angle * 3) * 1;
      
      ctx.fillStyle = 'rgba(0, 255, 170, 0.7)';
      ctx.beginPath();
      ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Find the shortest path between two points using BFS
  findShortestPath(startX, startY, endX, endY) {
    // Convert game coordinates to grid coordinates
    startX = Math.floor(startX / this.cellSize);
    startY = Math.floor(startY / this.cellSize);
    endX = Math.floor(endX / this.cellSize);
    endY = Math.floor(endY / this.cellSize);

    // Check if coordinates are valid
    if (
      startX < 0 ||
      startX >= this.cols ||
      startY < 0 ||
      startY >= this.rows ||
      endX < 0 ||
      endX >= this.cols ||
      endY < 0 ||
      endY >= this.rows
    ) {
      return [];
    }

    // Save path start and end for debugging
    this.pathStart = { x: startX, y: startY };
    this.pathEnd = { x: endX, y: endY };

    // BFS algorithm
    const queue = [{ x: startX, y: startY, path: [] }];
    const visited = new Set();
    visited.add(`${startX},${startY}`);

    while (queue.length > 0) {
      const current = queue.shift();

      // Check if we reached the end
      if (current.x === endX && current.y === endY) {
        this.shortestPath = [...current.path, { x: current.x, y: current.y }];
        return this.shortestPath;
      }

      // Check all four directions
      const directions = [
        { dx: 0, dy: -1, wall: 0 }, // Top
        { dx: 1, dy: 0, wall: 1 }, // Right
        { dx: 0, dy: 1, wall: 2 }, // Bottom
        { dx: -1, dy: 0, wall: 3 }, // Left
      ];

      for (const dir of directions) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;
        const key = `${nx},${ny}`;

        // Check if the neighbor is valid and not visited
        if (
          nx >= 0 &&
          nx < this.cols &&
          ny >= 0 &&
          ny < this.rows &&
          !visited.has(key)
        ) {
          // Check if there's a wall between current cell and neighbor
          const hasWall = this.grid[current.y][current.x].walls[dir.wall];

          if (!hasWall) {
            // Add neighbor to queue
            visited.add(key);
            queue.push({
              x: nx,
              y: ny,
              path: [...current.path, { x: current.x, y: current.y }],
            });
          }
        }
      }
    }

    // No path found
    this.shortestPath = [];
    return [];
  }

  // Render the shortest path for debug mode
  renderShortestPath(ctx) {
    if (!this.shortestPath || this.shortestPath.length === 0) return;

    ctx.save();

    // Draw the path
    ctx.strokeStyle = "rgba(255, 255, 0, 0.7)";
    ctx.lineWidth = 5;
    ctx.beginPath();

    // Start at the first point
    const firstPoint = this.shortestPath[0];
    ctx.moveTo(
      (firstPoint.x + 0.5) * this.cellSize,
      (firstPoint.y + 0.5) * this.cellSize
    );

    // Draw lines to each subsequent point
    for (let i = 1; i < this.shortestPath.length; i++) {
      const point = this.shortestPath[i];
      ctx.lineTo(
        (point.x + 0.5) * this.cellSize,
        (point.y + 0.5) * this.cellSize
      );
    }

    ctx.stroke();

    // Draw start and end points
    if (this.pathStart) {
      ctx.fillStyle = "rgba(0, 255, 0, 0.7)";
      ctx.beginPath();
      ctx.arc(
        (this.pathStart.x + 0.5) * this.cellSize,
        (this.pathStart.y + 0.5) * this.cellSize,
        this.cellSize / 4,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    if (this.pathEnd) {
      ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
      ctx.beginPath();
      ctx.arc(
        (this.pathEnd.x + 0.5) * this.cellSize,
        (this.pathEnd.y + 0.5) * this.cellSize,
        this.cellSize / 4,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.restore();
  }

  // Render all artifact positions for debug mode
  renderArtifactPositions(ctx, artifacts) {
    if (!artifacts || artifacts.length === 0) return;

    ctx.save();

    // Draw each artifact position
    artifacts.forEach((artifact, index) => {
      if (!artifact.collected) {
        // Convert to grid coordinates
        const gridX = Math.floor(artifact.x / this.cellSize);
        const gridY = Math.floor(artifact.y / this.cellSize);

        // Draw artifact indicator
        ctx.fillStyle = "rgba(255, 0, 255, 0.4)";
        ctx.fillRect(
          gridX * this.cellSize,
          gridY * this.cellSize,
          this.cellSize,
          this.cellSize
        );

        // Draw artifact number
        ctx.fillStyle = "white";
        ctx.font = "bold 16px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          (index + 1).toString(),
          (gridX + 0.5) * this.cellSize,
          (gridY + 0.5) * this.cellSize
        );
      }
    });

    ctx.restore();
  }
}
