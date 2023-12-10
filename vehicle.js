/*
  Calcule la projection orthogonale du point a sur le vecteur b
  a et b sont des vecteurs calculés comme ceci :
  let v1 = p5.Vector.sub(a, pos); soit v1 = pos -> a
  let v2 = p5.Vector.sub(b, pos); soit v2 = pos -> b
  */
function findProjection(pos, a, b) {
  let v1 = p5.Vector.sub(a, pos);
  let v2 = p5.Vector.sub(b, pos);
  v2.normalize();
  let sp = v1.dot(v2);
  v2.mult(sp);
  v2.add(pos);
  return v2;
}

class Vehicle {
  static debug = false;

  constructor(x, y) {
    // position du véhicule
    this.pos = createVector(x, y);
    // vitesse du véhicule
    this.vel = createVector(0, 0);
    // accélération du véhicule
    this.acc = createVector(0, 0);
    // vitesse maximale du véhicule
    this.maxSpeed = 4;
    // force maximale appliquée au véhicule
    this.maxForce = 0.7;
    this.color = "white";
    // à peu près en secondes
    this.dureeDeVie = 5;

    this.r_pourDessin = 8;
    // rayon du véhicule pour l'évitement
    this.r = this.r_pourDessin * 3;

    // Pour évitement d'obstacle
    this.largeurZoneEvitementDevantVaisseau = this.r / 2;

    //pour arrive 
    this.rayonZoneDeFreinage = 100;
    // pour comportement wander
    this.wanderTheta = 0;
    this.wanderRadius = 50;
    this.displaceRange = 0.3;
    

    // chemin derrière vaisseaux
    this.path = [];
    this.pathMaxLength = 30;
    this.behavior = 'pursue';
  }


  followLeader(leader) {
    // Calculate the desired position behind the leader
    let behindLeader = leader.pos.copy();
    behindLeader.sub(p5.Vector.mult(leader.vel, 20)); // Adjust the multiplier as needed

    // Project the current position onto the line defined by the leader's position and the desired position behind the leader
    let projection = findProjection(leader.pos, this.pos, behindLeader);

    // Draw the vector pointing to the projected position (optional)
    let v = p5.Vector.sub(projection, this.pos);
    this.drawVector(this.pos, v);

    // Call the seek method to follow the projected position
    return this.seek(projection);
  }
  
  // Method to prevent the vehicle from going outside the canvas borders
checkBoundaries() {
  // Buffer distance from the canvas borders
  const buffer = 25;

  // Initialize the desired velocity vector to null
  let desired = null;

  // Check if the vehicle is too close to the left edge
  if (this.pos.x < buffer) {
    // Steer towards the right to stay within the canvas
    desired = createVector(this.maxSpeed, this.vel.y);
  }
  // Check if the vehicle is too close to the right edge
  else if (this.pos.x > width - buffer) {
    // Steer towards the left to stay within the canvas
    desired = createVector(-this.maxSpeed, this.vel.y);
  }
  // Check if the vehicle is too close to the top edge
  else if (this.pos.y < buffer) {
    // Steer downwards to stay within the canvas
    desired = createVector(this.vel.x, this.maxSpeed);
  }
  // Check if the vehicle is too close to the bottom edge
  else if (this.pos.y > height - buffer) {
    // Steer upwards to stay within the canvas
    desired = createVector(this.vel.x, -this.maxSpeed);
  }

  // If any boundary condition is met, apply a steering force
  if (desired !== null) {
    // Normalize and scale the desired velocity
    desired.normalize();
    desired.mult(this.maxSpeed);

    // Calculate the steering force to reach the desired velocity
    const steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);

    // Return the steering force to be applied
    return steer;
  } else {
    // If no boundary condition is met, return zero vector (no steering force needed)
    return createVector(0, 0);
  }
}

  fire() {
    // Créez une balle à partir de la position et de la direction du véhicule
    let bullet = new Bullet(this.pos, this.vel.copy());
    // Ajoutez la balle au tableau des balles
    bullets.push(bullet);
  }

  
  wander() {
    // point devant le véhicule
    let wanderPoint = this.vel.copy();
    wanderPoint.setMag(100);
    wanderPoint.add(this.pos);
    let wanderRadius = 50;
    if (Vehicle.debug) {

    // on le dessine sous la forme d'une petit cercle rouge
    fill(255, 0, 0);
    noStroke();
    circle(wanderPoint.x, wanderPoint.y, 8);

    // Cercle autour du point
    
    noFill();
    stroke(255);
    circle(wanderPoint.x, wanderPoint.y, wanderRadius * 2);

    // on dessine une lign qui relie le vaisseau à ce point
    // c'est la ligne blanche en face du vaisseau
    line(this.pos.x, this.pos.y, wanderPoint.x, wanderPoint.y);}

    // On va s'occuper de calculer le point vert SUR LE CERCLE
    // il fait un angle wanderTheta avec le centre du cercle
    // l'angle final par rapport à l'axe des X c'est l'angle du vaisseau
    // + cet angle
    let theta = this.wanderTheta + this.vel.heading();

    let x = wanderRadius * cos(theta);
    let y = wanderRadius * sin(theta);

    // maintenant wanderPoint c'est un point sur le cercle
    wanderPoint.add(x, y);
    if (Vehicle.debug) {

    // on le dessine sous la forme d'un cercle vert
    fill(0, 255, 0);
    noStroke();
    circle(wanderPoint.x, wanderPoint.y, 16);

    // on dessine le vecteur desiredSpeed qui va du vaisseau au poibnt vert
    //stroke(255);
    line(this.pos.x, this.pos.y, wanderPoint.x, wanderPoint.y);}

    // On a donc la vitesse désirée que l'on cherche qui est le vecteur
    // allant du vaisseau au cercle vert. On le calcule :
    // ci-dessous, steer c'est la desiredSpeed directement !
    let steer = wanderPoint.sub(this.pos);

    steer.setMag(this.maxForce);
    this.applyForce(steer);

    // On déplace le point vert sur le cerlcle (en radians)
    this.displaceRange = 0.3;
    this.wanderTheta += random(-this.displaceRange, this.displaceRange);
  }
  // on fait une méthode applyBehaviors qui applique les comportements
  applyBehaviors(target, obstacles, vehicles, distance) {
    let seekForce = this.arrive(target, distance);
    let avoidForce = this.avoid(obstacles);
    let separateForce = this.separate(vehicles);
    let checkBoundariesForce= this.checkBoundaries();
   
    seekForce.mult(0.4);
    avoidForce.mult(0.9);
    separateForce.mult(0.6);
  
    this.applyForce(seekForce);
    this.applyForce(avoidForce);
    this.applyForce(separateForce);
    this.applyForce(checkBoundariesForce);
  
  }
  
  
  
  // Méthode d'évitement d'obstacle, implémente le comportement avoid
  // renvoie une force (un vecteur) pour éviter l'obstacle
  avoid(obstacles) {
    // calcul d'un vecteur ahead devant le véhicule
    // il regarde par exemple 50 frames devant lui
    let ahead = this.vel.copy();
    ahead.mult(this.distanceAhead);
    // on l'ajoute à la position du véhicule
    let pointAuBoutDeAhead = p5.Vector.add(this.pos, ahead);

    if (Vehicle.debug) {
      // on le dessine avec ma méthode this.drawVector(pos vecteur, color)
      this.drawVector(this.pos, ahead, color(255, 0, 0));
      // On dessine ce point au bout du vecteur ahead pour debugger
      fill("lightgreen");
      noStroke();
      circle(pointAuBoutDeAhead.x, pointAuBoutDeAhead.y, 10);

      // On dessine ce point au bout du vecteur ahead pour debugger
      fill("lightgreen");
      noStroke();
      circle(pointAuBoutDeAhead.x, pointAuBoutDeAhead.y, 10);
    }

    // Calcule de ahead2, deux fois plus petit que le premier
    let ahead2 = ahead.copy();
    ahead2.mult(0.5);
    let pointAuBoutDeAhead2 = p5.Vector.add(this.pos, ahead2);
    if (Vehicle.debug) {

      // on le dessine avec ma méthode this.drawVector(pos vecteur, color)
      this.drawVector(this.pos, ahead2, color("lightblue"));
      // On dessine ce point au bout du vecteur ahead pour debugger
      fill("orange");
      noStroke();
      circle(pointAuBoutDeAhead2.x, pointAuBoutDeAhead2.y, 10);
    }
    // Detection de l'obstacle le plus proche
    let obstacleLePlusProche = this.getObstacleLePlusProche(obstacles);

    // Si pas d'obstacle, on renvoie un vecteur nul
    if (obstacleLePlusProche == undefined) {
      return createVector(0, 0);
    }

    // On calcule la distance entre le centre du cercle de l'obstacle 
    // et le bout du vecteur ahead
    let distance = obstacleLePlusProche.pos.dist(pointAuBoutDeAhead);
    // et pour ahead2
    let distance2 = obstacleLePlusProche.pos.dist(pointAuBoutDeAhead2);
    // et pour la position du vaiseau
    let distance3 = obstacleLePlusProche.pos.dist(this.pos);

    let plusPetiteDistance = min(distance, distance2);
    plusPetiteDistance = min(plusPetiteDistance, distance3);

    let pointLePlusProcheDeObstacle = undefined;
    let alerteRougeVaisseauDansObstacle = false;

    if (distance == plusPetiteDistance) {
      pointLePlusProcheDeObstacle = pointAuBoutDeAhead;
    } else if (distance2 == plusPetiteDistance) {
      pointLePlusProcheDeObstacle = pointAuBoutDeAhead2;
    } else if (distance3 == plusPetiteDistance) {
      pointLePlusProcheDeObstacle = this.pos;
      // si le vaisseau est dans l'obstacle, alors alerte rouge !
      if (distance3 < obstacleLePlusProche.r) {
        alerteRougeVaisseauDansObstacle = true;
        obstacleLePlusProche.color = color("red");
      } else {
        obstacleLePlusProche.color = "green";
      }
    }

    
    // On dessine la zone d'évitement
    // Pour cela on trace une ligne large qui va de la position du vaisseau
    // jusqu'au point au bout de ahead
    if (Vehicle.debug) {
      stroke(255, 200, 0, 90);
      strokeWeight(this.largeurZoneEvitementDevantVaisseau);
      line(this.pos.x, this.pos.y, pointAuBoutDeAhead.x, pointAuBoutDeAhead.y);
    }
    // si la distance est < rayon de l'obstacle
    // il y a collision possible et on dessine l'obstacle en rouge

    if (plusPetiteDistance < obstacleLePlusProche.r + this.largeurZoneEvitementDevantVaisseau) {
      // collision possible

      // calcul de la force d'évitement. C'est un vecteur qui va
      // du centre de l'obstacle vers le point au bout du vecteur ahead
      let force = p5.Vector.sub(pointLePlusProcheDeObstacle, obstacleLePlusProche.pos);

      // on le dessine en jaune pour vérifier qu'il est ok (dans le bon sens etc)
      if(Vehicle.debug)
        this.drawVector(obstacleLePlusProche.pos, force, "yellow");

      // Dessous c'est l'ETAPE 2 : le pilotage (comment on se dirige vers la cible)
      // on limite ce vecteur à la longueur maxSpeed
      // force est la vitesse désirée
      force.setMag(this.maxSpeed);
      // on calcule la force à appliquer pour atteindre la cible avec la formule
      // que vous commencez à connaitre : force = vitesse désirée - vitesse courante
      force.sub(this.vel);
      // on limite cette force à la longueur maxForce
      force.limit(this.maxForce);

      if (alerteRougeVaisseauDansObstacle) {
        return force.setMag(this.maxForce * 2);
      } else {
        return force;
      }

    } else {
      // pas de collision possible
      return createVector(0, 0);
    }
  }
  getObstacleLePlusProche(obstacles) {
    let plusPetiteDistance = 100000000;
    let obstacleLePlusProche = undefined;

    obstacles.forEach(o => {
      // Je calcule la distance entre le vaisseau et l'obstacle
      const distance = this.pos.dist(o.pos);
      if (distance < plusPetiteDistance) {
        plusPetiteDistance = distance;
        obstacleLePlusProche = o;
      }
    });

    return obstacleLePlusProche;
  }

  getVehiculeLePlusProche(vehicules) {
    let plusPetiteDistance = Infinity;
    let vehiculeLePlusProche;

    vehicules.forEach(v => {
      if (v != this) {
        // Je calcule la distance entre le vaisseau et le vehicule
        const distance = this.pos.dist(v.pos);
        if (distance < plusPetiteDistance) {
          plusPetiteDistance = distance;
          vehiculeLePlusProche = v;
        }
      }
    });

    return vehiculeLePlusProche;
  }


  getClosestObstacle(pos, obstacles) {
    // on parcourt les obstacles et on renvoie celui qui est le plus près du véhicule
    let closestObstacle = null;
    let closestDistance = 1000000000;
    for (let obstacle of obstacles) {
      let distance = pos.dist(obstacle.pos);
      if (closestObstacle == null || distance < closestDistance) {
        closestObstacle = obstacle;
        closestDistance = distance;
      }
    }
    return closestObstacle;
  }

  arrive(target, distanceVisee = 0) {
    // 2nd argument true enables the arrival behavior
    return this.seek(target, true, distanceVisee);
  }


  seek(target, arrival = false, distanceVisee=0) {
    let force = p5.Vector.sub(target, this.pos);
    let desiredSpeed = this.maxSpeed;
    
    if (arrival) {
      // On définit un rayon de 100 pixels autour de la cible
      // si la distance entre le véhicule courant et la cible
      // est inférieure à ce rayon, on ralentit le véhicule
      // desiredSpeed devient inversement proportionnelle à la distance
      // si la distance est petitarrivee, force = grande
      // Vous pourrez utiliser la fonction P5 
      // distance = map(valeur, valeurMin, valeurMax, nouvelleValeurMin, nouvelleValeurMax)
      // qui prend une valeur entre valeurMin et valeurMax et la transforme en une valeur
      // entre nouvelleValeurMin et nouvelleValeurMax

      // TODO !
      // Approche expérimentale
      // on ajuste le rayon en fonction de la vitesse du véhicule
      //console.log(this.vel.mag());
      //this.rayonZoneDeFreinage = this.vel.mag()*30;

      // 1 - dessiner le cercle de rayon 50 autour du vehicule
      if(Vehicle.debug) {
        stroke("white");
        noFill();
        circle(this.pos.x, this.pos.y, this.rayonZoneDeFreinage);  
      }
    
      // 2 - calcul de la distance entre la cible et le vehicule
      let distance = p5.Vector.dist(this.pos, target);

      // 3 - si distance < rayon du cercle, alors on modifie desiredSPeed
      // qui devient inversement proportionnelle à la distance.
      // si d = rayon alors desiredSpeed = maxSpeed
      // si d = 0 alors desiredSpeed = 0
      desiredSpeed = map(distance, distanceVisee, this.rayonZoneDeFreinage+distanceVisee, 0, this.maxSpeed);
    }

    force.setMag(desiredSpeed);
    force.sub(this.vel);
    force.limit(this.maxForce);
    return force;
  }


  // inverse de seek !
  flee(target) {
    return this.seek(target).mult(-1);
  }
  separate(vehicles) {
    let desiredSeparation = 25; // ajustez la distance minimale selon vos besoins
    let sum = createVector();
    let count = 0;

    // Parcours de tous les autres véhicules
    for (let other of vehicles) {
      let distance = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);

      // Si le véhicule est un voisin proche (à une distance inférieure à la distance minimale)
      if (other !== this && distance < desiredSeparation) {
        let diff = p5.Vector.sub(this.pos, other.pos);
        diff.normalize();
        diff.div(distance); // Plus le véhicule est proche, plus la force d'évitement est grande
        sum.add(diff);
        count++;
      }
    }

    // Calcul de la force d'évitement moyenne
    if (count > 0) {
      sum.div(count);
      sum.normalize();
      sum.mult(this.maxSpeed);
      sum.sub(this.vel);
      sum.limit(this.maxForce);
    }

    return sum;
  }


  /* Poursuite d'un point devant la target !
    cette methode renvoie la force à appliquer au véhicule
  */
  pursue(target, evade = false) {
    // TODO
    // 1 - calcul de la position future de la cible
    // on fait une copie de la position de la target
    // 2 - On calcule un vecteur colinéaire au vecteur vitesse de la cible,
    let prediction = target.vel.copy();
    // et on le multiplie par 10 (10 frames)
    // 3 - prediction dans 10 frames = 10 fois la longueur du vecteur

    // target.distancePrediction varie en fonction de
    // la distance entre le véhicule et la cible
    // plus la cible est loin, plus on prédit loin

    prediction.mult(target.distancePrediction);
    // 4 - on positionne de la target au bout de ce vecteur
    prediction.add(target.pos);


    console.log("target distance prediction", target.distancePrediction)
    // dessin du vecteur prediction
    let v = p5.Vector.sub(prediction, target.pos);
    this.drawVector(target.pos, v);

    // 2 - dessin d'un cercle vert de rayon 20 pour voir ce point
    fill("green");
    circle(prediction.x, prediction.y, 20);

    // 3 - appel à seek avec ce point comme cible 
    let force = this.seek(prediction, evade);

    // n'oubliez pas, on renvoie la force à appliquer au véhicule !
    return force;
  }


  evade(target) {
    let evade = true;
    return this.pursue(target, evade);
  }

  // applyForce est une méthode qui permet d'appliquer une force au véhicule
  // en fait on additionne le vecteurr force au vecteur accélération
  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    

    // Reste de la fonction update
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.set(0, 0);

    // Mettez à jour le chemin et les autres comportements
    this.ajoutePosAuPath();
    this.dureeDeVie -= 0.01;

    
  }

  ajoutePosAuPath() {
    // on rajoute la position courante dans le tableau
    this.path.push(this.pos.copy());

    // si le tableau a plus de 50 éléments, on vire le plus ancien
    if (this.path.length > this.pathMaxLength) {
      this.path.shift();
    }
  }

  // On dessine le véhicule, le chemin etc.
  show() {
    // dessin du chemin
    this.drawPath();
    // dessin du vehicule
    this.drawVehicle();
  }

  drawVehicle() {
    // formes fil de fer en blanc
    stroke(255);
    // épaisseur du trait = 2
    strokeWeight(2);

    // formes pleines
    fill(this.color);

    // sauvegarde du contexte graphique (couleur pleine, fil de fer, épaisseur du trait, 
    // position et rotation du repère de référence)
    push();
    // on déplace le repère de référence.
    translate(this.pos.x, this.pos.y);
    // et on le tourne. heading() renvoie l'angle du vecteur vitesse (c'est l'angle du véhicule)
    rotate(this.vel.heading());

    // Dessin d'un véhicule sous la forme d'un triangle. Comme s'il était droit, avec le 0, 0 en haut à gauche
    triangle(-this.r_pourDessin, -this.r_pourDessin / 2, -this.r_pourDessin, this.r_pourDessin / 2, this.r_pourDessin, 0);
    // Que fait cette ligne ?
    //this.edges();

    // draw velocity vector
    pop();
    this.drawVector(this.pos, this.vel, color(255, 0, 0));

    // Cercle pour évitement entre vehicules et obstacles
    if (Vehicle.debug) {
      stroke(255);
      noFill();
      circle(this.pos.x, this.pos.y, this.r);
    }
  }

  drawPath() {
    push();
    stroke(255);
    noFill();
    strokeWeight(1);

    fill(this.color);
    // dessin du chemin
    this.path.forEach((p, index) => {
      if (!(index % 5)) {

        circle(p.x, p.y, 1);
      }
    });
    pop();
  }
  drawVector(pos, v, color) {
    if (Vehicle.debug) {
      push();
      // Dessin du vecteur vitesse
      // Il part du centre du véhicule et va dans la direction du vecteur vitesse
      strokeWeight(3);
      stroke(color);
      line(pos.x, pos.y, pos.x + v.x, pos.y + v.y);
      // dessine une petite fleche au bout du vecteur vitesse
      let arrowSize = 5;
      translate(pos.x + v.x, pos.y + v.y);
      rotate(v.heading());
      translate(-arrowSize / 2, 0);
      triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
      pop();
    }
  }

  // que fait cette méthode ?
  edges() {
    if (this.pos.x > width + this.r) {
      this.pos.x = -this.r;
    } else if (this.pos.x < -this.r) {
      this.pos.x = width + this.r;
    }
    if (this.pos.y > height + this.r) {
      this.pos.y = -this.r;
    } else if (this.pos.y < -this.r) {
      this.pos.y = height + this.r;
    }
  }
}

class Target extends Vehicle {
  constructor(x, y) {
    super(x, y);
    this.vel = p5.Vector.random2D();
    this.vel.mult(5);
  }


  show() {
    push();
    stroke(255);
    strokeWeight(2);
    fill("#F063A4");
    push();
    translate(this.pos.x, this.pos.y);
    circle(0, 0, this.r * 2);
    pop();
    pop();
  }
}