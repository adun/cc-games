const canvas = document.querySelector("canvas");
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

const x = canvas.width / 2;
const y = canvas.height / 2;

const projectiles = [];
const enemies = [];
const player = new Player(x, y, 30, "blue");

function spawnEnemies() {
  setInterval(() => {
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

    const color = "green";
    const angle = Math.atan2(y - ey, x - ex);
    const velocity = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };

    enemies.push(new Enemy(ex, ey, radius, color, velocity));
  }, 500);
}

function animate() {
  requestAnimationFrame(animate);
  c.clearRect(0, 0, canvas.width, canvas.height);

  player.draw();

  projectiles.forEach((projectile) => {
    projectile.update();
  });

  enemies.forEach((enemy) => {
    enemy.update();
  });
}

addEventListener("click", (e) => {
  const angle = Math.atan2(e.clientY - y, e.clientX - x);

  const velocity = {
    x: Math.cos(angle),
    y: Math.sin(angle),
  };
  projectiles.push(new Projectile(x, y, 5, "red", velocity));
});

animate();
spawnEnemies();
