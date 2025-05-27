/**
 * Game Artifacts
 */

class Artifact {
  constructor(maze, cellSize, type) {
    // Find a random position for the artifact
    const cell = maze.getRandomEmptyCell();

    // Convert grid coordinates to pixel coordinates (center of the cell)
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

    // Artifact-specific properties based on type
    this.setupArtifactType();
  }

  setupArtifactType() {
    switch (this.type) {
      case "ai":
        this.color = "#ff00ff"; // Magenta
        this.name = "AI Artifact";
        this.description =
          "Artificial Intelligence is revolutionizing how we process and analyze data.";
        this.shape = "cube";
        break;
      case "cybersecurity":
        this.color = "#ffff00"; // Yellow
        this.name = "Cybersecurity Artifact";
        this.description =
          "Cybersecurity protects systems, networks, and data from digital attacks.";
        this.shape = "shield";
        break;
      case "machine-learning":
        this.color = "#00ff00"; // Green
        this.name = "Machine Learning Artifact";
        this.description =
          "Machine Learning enables systems to learn and improve from experience.";
        this.shape = "sphere";
        break;
      default:
        this.color = "#00ffff"; // Cyan
        this.name = "Future Skills Artifact";
        this.description =
          "This artifact represents an essential future technology skill.";
        this.shape = "gem";
    }

    this.rwandaColors = {
      blue: "#00A0D5", // Sky blue
      yellow: "#E5BE01", // Yellow
      green: "#20603D", // Green
    };

    const colorKeys = Object.keys(this.rwandaColors);
    this.secondaryColor =
      this.rwandaColors[
        colorKeys[Math.floor(Math.random() * colorKeys.length)]
      ];
  }

  update() {
    if (this.collected) {
      return;
    }

    this.frameCount++;

    this.hoverOffset += 0.1 * this.hoverDir;
    if (Math.abs(this.hoverOffset) > 5) {
      this.hoverDir *= -1;
    }

    this.rotationAngle += 0.02;
    if (this.rotationAngle > Math.PI * 2) {
      this.rotationAngle -= Math.PI * 2;
    }

    this.glowIntensity = Math.sin(this.frameCount * 0.05) * 0.5 + 0.5;
  }

  getCollisionBox() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height,
    };
  }

  collect() {
    if (!this.collected) {
      this.collected = true;
      return true;
    }
    return false;
  }

  render(ctx) {
    if (this.collected) {
      return;
    }

    ctx.save();

    const glowSize = 10 * this.glowIntensity;
    const gradient = ctx.createRadialGradient(
      this.x,
      this.y + this.hoverOffset,
      this.width * 0.25,
      this.x,
      this.y + this.hoverOffset,
      this.width + glowSize
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(
      this.x,
      this.y + this.hoverOffset,
      this.width + glowSize,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.translate(this.x, this.y + this.hoverOffset);
    ctx.rotate(this.rotationAngle);

    switch (this.shape) {
      case "cube":
        this.drawCube(ctx);
        break;
      case "shield":
        this.drawShield(ctx);
        break;
      case "sphere":
        this.drawSphere(ctx);
        break;
      case "gem":
      default:
        this.drawGem(ctx);
    }

    ctx.restore();
  }

  drawCube(ctx) {
    const size = this.width * 0.7;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;

    // Front face
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.strokeRect(-size / 2, -size / 2, size, size);

    // 3D effect
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.beginPath();
    ctx.moveTo(-size / 2, -size / 2);
    ctx.lineTo(-size / 2 + size * 0.2, -size / 2 - size * 0.2);
    ctx.lineTo(size / 2 + size * 0.2, -size / 2 - size * 0.2);
    ctx.lineTo(size / 2, -size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right face
    ctx.beginPath();
    ctx.moveTo(size / 2, -size / 2);
    ctx.lineTo(size / 2 + size * 0.2, -size / 2 - size * 0.2);
    ctx.lineTo(size / 2 + size * 0.2, size / 2 - size * 0.2);
    ctx.lineTo(size / 2, size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  drawShield(ctx) {
    const size = this.width * 0.8;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;

    // Shield shape
    ctx.beginPath();
    ctx.moveTo(0, -size / 2);
    ctx.lineTo(size / 2, -size / 4);
    ctx.lineTo(size / 2, size / 3);
    ctx.lineTo(0, size / 2);
    ctx.lineTo(-size / 2, size / 3);
    ctx.lineTo(-size / 2, -size / 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Shield emblem
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.beginPath();
    ctx.moveTo(0, -size / 4);
    ctx.lineTo(size / 4, 0);
    ctx.lineTo(0, size / 4);
    ctx.lineTo(-size / 4, 0);
    ctx.closePath();
    ctx.fill();
  }

  drawSphere(ctx) {
    const radius = this.width * 0.5;

    // Create gradient for sphere effect
    const gradient = ctx.createRadialGradient(
      -radius * 0.3,
      -radius * 0.3,
      0,
      0,
      0,
      radius
    );
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.2, this.color);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.5)");

    ctx.fillStyle = gradient;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;

    // Draw sphere
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.beginPath();
    ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  drawGem(ctx) {
    const size = this.width * 0.8;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;

    // Gem shape
    ctx.beginPath();
    ctx.moveTo(0, -size / 2);
    ctx.lineTo(size / 2, 0);
    ctx.lineTo(0, size / 2);
    ctx.lineTo(-size / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Gem facets
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.beginPath();
    ctx.moveTo(0, -size / 2);
    ctx.lineTo(size / 4, -size / 4);
    ctx.lineTo(-size / 4, -size / 4);
    ctx.closePath();
    ctx.fill();
  }
}
