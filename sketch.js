let vehicles = [];
let target;
let obstacles = [];
let leader;
let follow = true;
let behavior = 'follow';
let wanders=[];
let bullets=[];
let  enemies = [];

// Define a constant for the distance behind the leader
const distanceBehindLeader = 100;

function setup() {
  createCanvas(windowWidth, windowHeight);

  // Create 8 vehicles at random positions
  for (let i = 0; i < 8; i++) {
    vehicles.push(new Vehicle(random(width), random(height)));
  }

  
  // Create an obstacle in the middle of the screen
  // a circle with a radius of 100px
  obstacles.push(new Obstacle(width / 2, height / 2, 100));
  let sliderRayon = createSlider(30, 200, 100, 1);

  let sliderDistanceCercle = createSlider(10, 300, 100, 1);
  
  let sliderVariationAngleSurCercle = createSlider(0, 0.8, 0.3, 0.01);
  // Create enemies at a fixed position
  fixedEnemyPosition = createVector(50, height / 2); 
  
  
}

function draw() {
  background(0);

  // Do not set the target to the mouse position
   target = createVector(mouseX, mouseY);

  // Draw the target that follows the mouse
  fill(255, 0, 0);
  noStroke();
  circle(target.x, target.y, 32);

  // Draw obstacles
  obstacles.forEach(o => {
    o.show();
  });
  //pour creer des wanders tout on respectant avoid obstacle et les borders
  wanders.forEach(w => {
    let wanderForce = w.wander();
    let avoidForce = w.avoid(obstacles);
    avoidForce.mult(2);
    w.applyForce(avoidForce);

    // Ajoute la vérification des limites avant d'appliquer la force de l'errance
   let t= w.checkBoundaries(); 
       t.mult(2);
    w.applyForce(wanderForce);
    w.applyForce(t)
    w.update();
    w.show();
    w.edges();
});
   // Iterate over bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update();
    // Check if the bullet still exists before calling show
    if (bullets[i]) {
      bullets[i].show();
    }
  }

 // Draw enemies
 enemies.forEach(enemy => {
  enemy.update();
  enemy.show();
  enemy.edges();
});
 


  // Apply behaviors and update/draw vehicles
  if (follow) {
    vehicles.forEach((v, index) => {
      let leader = vehicles[0];
      if (index == 0) {
        // Case of the leader
        // Use the leader as the point to follow
        v.applyBehaviors(target, obstacles, vehicles, 0);
        // Draw a circle around the leader
        if (Vehicle.debug) {
          noFill();
          stroke(0, 0, 255); // Blue color
          ellipse(leader.pos.x, leader.pos.y, 2 * distanceBehindLeader);
        }
      } else {
        let vehiclePrecedent = vehicles[index - 1];
        // Others follow a point behind the leader
        let pointDerriereLeader;
        // Calculate the desired position behind the leader
        pointDerriereLeader = leader.vel.copy();
        pointDerriereLeader.normalize();
        pointDerriereLeader.mult(-distanceBehindLeader);

        pointDerriereLeader.add(leader.pos);
        // Draw it
        fill("green");
        circle(pointDerriereLeader.x, pointDerriereLeader.y, 20);

       
        // Add the behavior to follow the leader
        if (behavior === 'sneak') {
          // Change the behavior to sneak
          v.applyBehaviors(vehiclePrecedent.pos, obstacles, vehicles, 40);
        } else {
          // Default behavior
          if (dist(v.pos.x, v.pos.y, leader.pos.x, leader.pos.y) < distanceBehindLeader) {
            // If the vehicle is within the circle around the leader, apply separation behavior
            let avoidanceForce = p5.Vector.sub(v.pos, leader.pos);
            avoidanceForce.setMag(1); // Adjust magnitude for desired strength
            avoidanceForce.mult(2); // Adjust multiplier for desired strength
            v.applyForce(avoidanceForce);
          } else {
            // If outside the circle, follow the point behind the leader
            v.applyBehaviors(pointDerriereLeader, obstacles, vehicles, 0);
            
          }
        }
      }

      v.update();
      v.show();
      v.edges();
    });
  }
}

function mousePressed() {
  // Add an obstacle of random size at the mouse position
  let obstacleSize = random(20, 50);
  let obstacle = new Obstacle(mouseX, mouseY, obstacleSize);
  obstacles.push(obstacle);
}

function keyPressed() {
  switch (key) {
    case "v":
      // Add a new vehicle at a random position
      vehicles.push(new Vehicle(random(width), random(height)));
      break;
    case "d":
      // Toggle debug mode for vehicle vectors
      Vehicle.debug = !Vehicle.debug;
      break;
    case "f":
      // Add 100 vehicles starting from the left edge going towards the target
      for (let i = 0; i < 100; i++) {
        vehicles.push(new Vehicle(0, random(height)));
      }
      break;
    case "e":
      // Toggle debug mode for vehicle vectors
      behavior = 'follow';
      break;
    case "s":
      // Change behavior to sneak
      behavior = 'sneak';
      break;
    case "w":
      // Change behavior to sneak
      
      W = new Vehicle(random(width), random(height));
      W.color = "blue"; // Set a different color for the leader
      wanders.push(W);
      break;
    case "k":
      // Assurez-vous que le premier véhicule est le leader
      for (let vehicle of vehicles) {
        vehicle.fire();
      }
      break;

    case "n":
      
       // Add a new enemy at the fixed position
      
       // Make sure there are at least 5 enemies
      while (enemies.length < 5) {
        enemies.push(new Enemy(fixedEnemyPosition.x, fixedEnemyPosition.y));
      }
      break;
       

  }
}
//classe responsable des balles de tire 
class Bullet {
  constructor(position, velocity) {
    this.pos = position.copy();
    this.vel = velocity.copy();
    this.speed = 5;
    this.lifetime = 100; // Adjust the lifetime duration as needed
  }

  update() {
    // Update the position of the bullet based on its velocity
    this.pos.add(p5.Vector.mult(this.vel, this.speed));

    // Decrease the lifetime of the bullet
    this.lifetime--;

    // Remove the bullet if its lifetime reaches zero
    if (this.lifetime <= 0) {
      bullets.splice(bullets.indexOf(this), 1);
    }

    // Check for collision with enemies
    for (let j = enemies.length - 1; j >= 0; j--) {
      // Check for collision between bullet and enemy
      if (dist(this.pos.x, this.pos.y, enemies[j].pos.x, enemies[j].pos.y) < 12) {
        // Remove both bullet and enemy when there's a collision
        bullets.splice(bullets.indexOf(this), 1);
        enemies.splice(j, 1);
        break; // Exit the loop since the bullet is removed
      }
    }
  }

  show() {
    // Display the bullet (e.g., a circle)
    fill(255);
    noStroke();
    circle(this.pos.x, this.pos.y, 5);
  }
}
//classe qui creer l'enemie
class Enemy {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D(); // Random initial velocity
    this.speed = 2; // Adjust speed as needed
  }

  update() {
    // Update the position of the enemy based on its velocity and speed
    this.pos.add(p5.Vector.mult(this.vel, this.speed));

    // Check boundaries and adjust velocity if needed
    const boundaryForce = this.checkBoundaries();
    this.vel.add(boundaryForce);

    // Add additional logic for enemy behavior if needed
  }

  show() {
    // Display the enemy as a blue circle
    fill(0, 0, 255); // Blue color
    noStroke();
    circle(this.pos.x, this.pos.y, 20); // Adjust size as needed
  }

  edges() {
    // Wrap around the screen edges if the enemy goes off-screen
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.y < 0) this.pos.y = height;
    if (this.pos.y > height) this.pos.y = 0;
  }

  // Method to prevent the enemy from going outside the canvas borders
  checkBoundaries() {
    // Buffer distance from the canvas borders
    const buffer = 25;

    // Initialize the desired velocity vector to null
    let desired = null;

    // Check if the enemy is too close to the left edge
    if (this.pos.x < buffer) {
      // Steer towards the right to stay within the canvas
      desired = createVector(this.speed, this.vel.y);
    }
    // Check if the enemy is too close to the right edge
    else if (this.pos.x > width - buffer) {
      // Steer towards the left to stay within the canvas
      desired = createVector(-this.speed, this.vel.y);
    }
    // Check if the enemy is too close to the top edge
    else if (this.pos.y < buffer) {
      // Steer downwards to stay within the canvas
      desired = createVector(this.vel.x, this.speed);
    }
    // Check if the enemy is too close to the bottom edge
    else if (this.pos.y > height - buffer) {
      // Steer upwards to stay within the canvas
      desired = createVector(this.vel.x, -this.speed);
    }

    // If any boundary condition is met, apply a steering force
    if (desired !== null) {
      // Normalize and scale the desired velocity
      desired.normalize();
      desired.mult(this.speed);

      // Calculate the steering force to reach the desired velocity
      const steer = p5.Vector.sub(desired, this.vel);
      steer.limit(0.1); // Adjust the limit as needed

      // Return the steering force to be applied
      return steer;
    } else {
      // If no boundary condition is met, return zero vector (no steering force needed)
      return createVector(0, 0);
    }
  }
}

