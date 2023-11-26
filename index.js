const canvas = document.querySelector("canvas");
const scoreEl = document.querySelector("#scoreEl");
const modalEl = document.querySelector("#modalEl");
const modalScoreEl = document.querySelector("#modalScoreEl");
const buttonEl = document.querySelector("#buttonEl");
const c = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

class Player {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
  }

  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
  }
}

class Projectile {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
  }

  update() {
    this.draw();
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
}

class Enemy {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
  }

  update() {
    this.draw();
    this.x += this.velocity.x;
    this.y += this.velocity.y;
  }
}

const friction = 0.99;
class Particle {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.alpha = 1;
  }

  draw() {
    c.save();
    c.globalAlpha = this.alpha;
    c.beginPath();
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
    c.restore();
  }

  update() {
    this.draw();
    this.velocity.x *= friction;
    this.velocity.y *= friction;
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.alpha -= 0.01;
  }
}

const x = canvas.width / 2;
const y = canvas.height / 2;

let player = new Player(x, y, 10, "white");
let projectiles = [];
let particles = [];
let enemies = [];
let animationId = undefined;
let intervalId = undefined;
let score = 0;

function init() {
  player = new Player(x, y, 10, "white");
  projectiles = [];
  particles = [];
  enemies = [];
  animationId = undefined;
  intervalId = undefined;
  score = 0;
}

function spawnEnemies() {
  intervalId = setInterval(() => {
    console.log(intervalId);
    const radius = Math.random() * (30 - 4) + 4;

    let ex;
    let ey;

    if (Math.random() < 0.5) {
      ex = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
      ey = Math.random() * canvas.height;
    } else {
      ex = Math.random() * canvas.width;
      ey = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
    }

    const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
    const angle = Math.atan2(y - ey, x - ex);
    const velocity = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };

    enemies.push(new Enemy(ex, ey, radius, color, velocity));
  }, 1000);
}

function animate() {
  animationId = requestAnimationFrame(animate);
  // the alpha value creates the fade effect
  c.fillStyle = "rgba(0, 0, 0, 0.1)";
  c.fillRect(0, 0, canvas.width, canvas.height);

  player.draw();

  for (let index = particles.length - 1; index >= 0; index--) {
    const particle = particles[index];

    if (particle.alpha <= 0) {
      particles.splice(index, 1);
    } else {
      particle.update();
    }
  }

  for (let index = projectiles.length - 1; index >= 0; index--) {
    const projectile = projectiles[index];
    projectile.update();

    // remove from edges of screen
    if (
      projectile.x - projectile.radius < 0 ||
      projectile.x - projectile.radius > canvas.width ||
      projectile.y + projectile.radius < 0 ||
      projectile.y - projectile.radius > canvas.height
    ) {
      projectiles.splice(index, 1);
    }
  }

  // loop from the back in order to avoir removing the wrong item from the array
  for (let index = enemies.length - 1; index >= 0; index--) {
    const enemy = enemies[index];
    enemy.update();

    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

    // end game
    if (dist - enemy.radius - player.radius < 1) {
      cancelAnimationFrame(animationId);
      clearInterval(intervalId);
      modalEl.style.display = "block";
      modalScoreEl.innerHTML = score;
    }

    for (
      let projectileIndex = projectiles.length - 1;
      projectileIndex >= 0;
      projectileIndex--
    ) {
      const projectile = projectiles[projectileIndex];
      const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

      // when projectile touch enemy
      if (dist - enemy.radius - projectile.radius < 1) {
        if (dist - enemy.radius - projectile.radius < 1) {
          // create explosions
          for (let i = 0; i < enemy.radius * 2; i++) {
            particles.push(
              new Particle(
                projectile.x,
                projectile.y,
                Math.random() * 2,
                enemy.color,
                {
                  x: (Math.random() - 0.5) * (Math.random() * 6),
                  y: (Math.random() - 0.5) * (Math.random() * 6),
                }
              )
            );
          }

          if (enemy.radius - 10 > 5) {
            score += 100;
            scoreEl.innerHTML = score;

            // this is where we shrink our enemy
            gsap.to(enemy, { radius: enemy.radius - 10 });
            projectiles.splice(projectileIndex, 1);
          } else {
            score += 150;
            scoreEl.innerHTML = score;

            // remove enemy if there are too small
            // setTimeout no longer required as looping back through the array
            enemies.splice(index, 1);
            projectiles.splice(projectileIndex, 1);
          }
        }
      }
    }
  }
}

addEventListener("click", (e) => {
  const angle = Math.atan2(e.clientY - y, e.clientX - x);

  const velocity = {
    x: Math.cos(angle) * 4,
    y: Math.sin(angle) * 4,
  };
  projectiles.push(new Projectile(x, y, 5, "white", velocity));
});

buttonEl.addEventListener("click", (e) => {
  init();
  animate();
  spawnEnemies();
  modalEl.style.display = "none";
});

animate();
spawnEnemies();
