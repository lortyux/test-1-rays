
let walls = [];
let particle;
let rectangleSize = 40; // Size of the rectangle (blue cube)
let rectanglePos; // Position of the rectangle (blue cube)
let isDragging = false; // Flag to track if the rectangle is being dragged

let wallCount = 5;
let rayCount = 1; // Number of rays (smaller values recommended)
let useMaze = true; // Toggle between random walls and maze layout
let mazeGridSize = 15; // Number of cells in the maze grid
let mazeSizeFactor = 0.8; // Size of the maze as a proportion of the window (0 to 1)

let speed = 2; // Control the speed of the particle

let start, end; // Start and End points
let gameStarted = false; // Game start flag
let winMessageShown = false; // Flag to show win message only once

function setup() {
  createCanvas(windowWidth, windowHeight);

  if (useMaze) {
    createMaze(mazeGridSize, mazeSizeFactor);
  } else {
    for (let i = 0; i < wallCount; i++) {
      let x1 = random(width);
      let x2 = random(width);
      let y1 = random(height);
      let y2 = random(height);
      walls[i] = new Boundary(x1, y1, x2, y2);
    }
  }

  particle = new Particle();
  rectanglePos = createVector(start.x, start.y); // Initialize rectangle position at the start point
}

function draw() {
  background(0);

  // Show the maze walls
  for (let wall of walls) {
    wall.show();
  }

  // Show Start and End points
  fill(0, 255, 0); // Green for start
  noStroke();
  ellipse(start.x, start.y, 20, 20);
  fill(255, 0, 0); // Red for end
  ellipse(end.x, end.y, 20, 20);

  // Draw the rectangle (cube) using CubeBoundary
  let cubeBoundary = new CubeBoundary(rectanglePos.x - rectangleSize / 2, rectanglePos.y - rectangleSize / 2, rectangleSize, rectangleSize);
  cubeBoundary.show();  // Draw the boundary of the cube

  // Check for winning condition
  if (gameStarted && !winMessageShown) {
    let distToEnd = dist(rectanglePos.x, rectanglePos.y, end.x, end.y);
    if (distToEnd < rectangleSize / 2) {
      winMessageShown = true;
      setTimeout(() => {
        alert("You Win!"); // Display win message
      }, 500);
    }
  }

  // Update and show the particle
  particle.update();
  particle.show();
  particle.look(walls, cubeBoundary); // Now pass cubeBoundary for ray-casting
}

function mousePressed() {
  let cubeBoundary = new CubeBoundary(rectanglePos.x - rectangleSize / 2, rectanglePos.y - rectangleSize / 2, rectangleSize, rectangleSize);
  
  // Check if the mouse is inside the cube (bounding box check)
  if (
    mouseX > rectanglePos.x - rectangleSize / 2 &&
    mouseX < rectanglePos.x + rectangleSize / 2 &&
    mouseY > rectanglePos.y - rectangleSize / 2 &&
    mouseY < rectanglePos.y + rectangleSize / 2
  ) {
    isDragging = true; // Start dragging the cube
    if (!gameStarted) {
      gameStarted = true; // Start the game once the cube is clicked
    }
  }
}

function mouseReleased() {
  isDragging = false; // Stop dragging the cube when mouse is released
}

function mouseDragged() {
  if (isDragging) {
    rectanglePos.x = mouseX; // Update cube's position to follow the mouse
    rectanglePos.y = mouseY;
  }
}

function createMaze(gridSize, sizeFactor) {
  let mazeWidth = width * sizeFactor;
  let mazeHeight = height * sizeFactor;
  let cellWidth = mazeWidth / gridSize;
  let cellHeight = mazeHeight / gridSize;

  let grid = [];
  let stack = [];

  // Calculate maze offset for centering
  let xOffset = (width - mazeWidth) / 2;
  let yOffset = (height - mazeHeight) / 2;

  // Initialize grid
  for (let i = 0; i < gridSize; i++) {
    grid[i] = [];
    for (let j = 0; j < gridSize; j++) {
      grid[i][j] = {
        x: i,
        y: j,
        walls: [true, true, true, true], // Top, Right, Bottom, Left
        visited: false
      };
    }
  }

  // Recursive backtracking
  let current = grid[gridSize - 1][0]; // Start at bottom-left corner
  current.visited = true;
  stack.push(current);

  while (stack.length > 0) {
    let next = getUnvisitedNeighbor(current, grid, gridSize);

    if (next) {
      next.visited = true;

      // Remove walls between current and next
      removeWalls(current, next);

      // Push current to stack
      stack.push(current);

      // Move to next cell
      current = next;
    } else {
      // Backtrack
      current = stack.pop();
    }
  }

  // Create walls based on cell data
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      let cell = grid[i][j];
      let x = xOffset + cell.x * cellWidth;
      let y = yOffset + cell.y * cellHeight;

      // Only add internal walls
      if (cell.walls[0] && j > 0) walls.push(new Boundary(x, y, x + cellWidth, y)); // Top
      if (cell.walls[1] && i < gridSize - 1) walls.push(new Boundary(x + cellWidth, y, x + cellWidth, y + cellHeight)); // Right
      if (cell.walls[2] && j < gridSize - 1) walls.push(new Boundary(x + cellWidth, y + cellHeight, x, y + cellHeight)); // Bottom
      if (cell.walls[3] && i > 0) walls.push(new Boundary(x, y + cellHeight, x, y)); // Left
    }
  }

  // Define start and end points
  start = createVector(xOffset + cellWidth / 2, yOffset + mazeHeight - cellHeight / 2); // Bottom-left
  end = createVector(xOffset + mazeWidth - cellWidth / 2, yOffset + cellHeight / 2); // Top-right
}

function getUnvisitedNeighbor(cell, grid, gridSize) {
  let neighbors = [];
  let { x, y } = cell;

  if (y > 0 && !grid[x][y - 1].visited) neighbors.push(grid[x][y - 1]); // Top
  if (x < gridSize - 1 && !grid[x + 1][y].visited) neighbors.push(grid[x + 1][y]); // Right
  if (y < gridSize - 1 && !grid[x][y + 1].visited) neighbors.push(grid[x][y + 1]); // Bottom
  if (x > 0 && !grid[x - 1][y].visited) neighbors.push(grid[x - 1][y]); // Left

  if (neighbors.length > 0) {
    return random(neighbors);
  } else {
    return null;
  }
}

function removeWalls(current, next) {
  let x = current.x - next.x;
  let y = current.y - next.y;

  if (x === 1) {
    // Next is to the left
    current.walls[3] = false;
    next.walls[1] = false;
  } else if (x === -1) {
    // Next is to the right
    current.walls[1] = false;
    next.walls[3] = false;
  }

  if (y === 1) {
    // Next is above
    current.walls[0] = false;
    next.walls[2] = false;
  } else if (y === -1) {
    // Next is below
    current.walls[2] = false;
    next.walls[0] = false;
  }
}

///////////////////////////////////////////////Walls
class Boundary {
  constructor(x1, y1, x2, y2) {
    this.a = createVector(x1, y1);
    this.b = createVector(x2, y2);
  }

  show() {
    stroke(255); // Wall Color
    line(this.a.x, this.a.y, this.b.x, this.b.y);
  }

  // Cast ray against this boundary and return intersection point
  cast(ray) {
    let x1 = this.a.x;
    let y1 = this.a.y;
    let x2 = this.b.x;
    let y2 = this.b.y;

    let x3 = ray.pos.x;
    let y3 = ray.pos.y;
    let x4 = ray.pos.x + ray.dir.x;
    let y4 = ray.pos.y + ray.dir.y;

    let den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den === 0) {
      return null;
    }

    let t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    let u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;

    if (t > 0 && t < 1 && u > 0) {
      let pt = createVector(x1 + t * (x2 - x1), y1 + t * (y2 - y1));
      return pt;
    }
    return null;
  }
}

///////////////////////////////////////////CubeBoundary
class CubeBoundary {
  constructor(x, y, w, h) {
    this.topLeft = createVector(x, y);
    this.topRight = createVector(x + w, y);
    this.bottomLeft = createVector(x, y + h);
    this.bottomRight = createVector(x + w, y + h);
  }

  show() {
    fill(0, 0, 255, 150); // Blue fill with transparency for the cube
    noStroke(); // No stroke around the cube
    rect(this.topLeft.x, this.topLeft.y, rectangleSize, rectangleSize); // Draw filled rectangle

    stroke(0, 0, 255); // Blue outline for the cube
    rect(this.topLeft.x, this.topLeft.y, rectangleSize, rectangleSize); // Draw outline
  }

  // Return an array of all four edges of the cube (rectangle)
  getEdges() {
    return [
      new Boundary(this.topLeft.x, this.topLeft.y, this.topRight.x, this.topRight.y),
      new Boundary(this.topRight.x, this.topRight.y, this.bottomRight.x, this.bottomRight.y),
      new Boundary(this.bottomRight.x, this.bottomRight.y, this.bottomLeft.x, this.bottomLeft.y),
      new Boundary(this.bottomLeft.x, this.bottomLeft.y, this.topLeft.x, this.topLeft.y),
    ];
  }
}

///////////////////////////////////////////////////////Ray
class Ray {
  constructor(pos, angle) {
    this.pos = pos;
    this.angle = angle;
    this.dir = p5.Vector.fromAngle(angle);
  }

  cast(wall) {
    let x1 = wall.a.x;
    let y1 = wall.a.y;
    let x2 = wall.b.x;
    let y2 = wall.b.y;

    let x3 = this.pos.x;
    let y3 = this.pos.y;
    let x4 = this.pos.x + this.dir.x;
    let y4 = this.pos.y + this.dir.y;

    let den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den === 0) {
      return null;
    }

    let t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    let u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;

    if (t > 0 && t < 1 && u > 0) {
      let pt = createVector(x1 + t * (x2 - x1), y1 + t * (y2 - y1));
      return pt;
    }
    return null;
  }

  show() {
    stroke(255); // Ray color is white again
    line(this.pos.x, this.pos.y, this.pos.x + this.dir.x * 20, this.pos.y + this.dir.y * 20);
  }
}

///////////////////////////////////////////////////////Particles
class Particle {
  constructor() {
    this.pos = createVector(0, 0);
    this.rays = [];
    this.angle = 0;
    this.speed = speed; // Speed variable
    this.directionIndex = 0;

    for (let a = 0; a < 360; a += rayCount) {
      this.rays.push(new Ray(this.pos, radians(a)));
    }
  }

  update() {
    switch (this.directionIndex) {
      case 0: // Move Right
        this.pos.x += this.speed;
        if (this.pos.x > width) {
          this.pos.x = width;
          this.directionIndex = 1;
        }
        break;
      case 1: // Move Down
        this.pos.y += this.speed;
        if (this.pos.y > height) {
          this.pos.y = height;
          this.directionIndex = 2;
        }
        break;
      case 2: // Move Left
        this.pos.x -= this.speed;
        if (this.pos.x < 0) {
          this.pos.x = 0;
          this.directionIndex = 3;
        }
        break;
      case 3: // Move Up
        this.pos.y -= this.speed;
        if (this.pos.y < 0) {
          this.pos.y = 0;
          this.directionIndex = 0;
        }
        break;
    }
  }

  look(walls, cubeBoundary) {
    for (let ray of this.rays) {
      let closest = null;
      let record = Infinity;

      // Check walls
      for (let wall of walls) {
        const pt = ray.cast(wall);
        if (pt) {
          const d = p5.Vector.dist(this.pos, pt);
          if (d < record) {
            record = d;
            closest = pt;
          }
        }
      }

      // Check collision with cube boundaries
      let cubeEdges = cubeBoundary.getEdges();  // Get all edges of the cube boundary
      for (let edge of cubeEdges) {
        const pt = ray.cast(edge);  // Check for collision with each edge of the cube
        if (pt) {
          const d = p5.Vector.dist(this.pos, pt);
          if (d < record) {
            record = d;
            closest = pt;
          }
        }
      }

      // Draw ray
      if (closest) {
        stroke(255, 100); // Ray color
        line(this.pos.x, this.pos.y, closest.x, closest.y);
      }
    }
  }

  show() {
    fill(255, 0, 0);
    ellipse(this.pos.x, this.pos.y, 8, 8); // Show the particle (red dot)
  }
}

