const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");

const scoreEl = document.querySelector("#scoreEl");
const modalEl = document.querySelector("#modalEl");
const modalScoreEl = document.querySelector("#modalScoreEl");
const buttonEl = document.querySelector("#buttonEl");
const startButtonEl = document.querySelector("#startButtonEl");
const startModalEl = document.querySelector("#startModalEl");
const volumeUpEl = document.querySelector("#volumeUpEl");
const volumeOffEl = document.querySelector("#volumeOffEl");

canvas.width = innerWidth;
canvas.height = innerHeight;

const x_half = canvas.width / 2;
const y_half = canvas.height / 2;

let player = new Player(x_half, y_half, 10, "white");
let projectiles = [];
let particles = [];
let enemies = [];
let animationId = undefined;
let intervalId = undefined;
let score = 0;
let powerUps = [];
let frames = 0;
let backgroundParticles = [];
let game = {
  active: false,
};

function init() {
  player = new Player(x_half, y_half, 10, "white");
  projectiles = [];
  particles = [];
  enemies = [];
  powerUps = [];
  animationId = undefined;
  intervalId = undefined;
  score = 0;
  scoreEl.innerHTML = 0;
  frames = 0;
  backgroundParticles = [];
  game = {
    active: true,
  };

  const spacing = 30;

  for (x = 0; x < canvas.width + spacing; x += spacing) {
    for (y = 0; y < canvas.height + spacing; y += spacing) {
      backgroundParticles.push(
        new BackgroundParticle({
          position: {
            x,
            y,
          },
          radius: 3,
        })
      );
    }
  }
}

function spawnEnemies() {
  intervalId = setInterval(() => {
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
    const angle = Math.atan2(y_half - ey, x_half - ex);
    const velocity = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };

    enemies.push(new Enemy(ex, ey, radius, color, velocity));
  }, 1000);
}

function spawnPowerUps() {
  spawnPowerUpsId = setInterval(() => {
    powerUps.push(
      new PowerUp({
        position: {
          x: -30,
          y: Math.random() * canvas.height,
        },
        velocity: {
          x: Math.random() + 1,
          y: 0,
        },
      })
    );
  }, 10000);
}

function createScoreLabel({ position, score }) {
  const scoreLabel = document.createElement("label");
  scoreLabel.innerHTML = score;
  scoreLabel.style.color = "white";
  scoreLabel.style.position = "absolute";
  scoreLabel.style.left = position.x + "px";
  scoreLabel.style.top = position.y + "px";
  scoreLabel.style.userSelect = "none";

  document.body.appendChild(scoreLabel);
  gsap.to(scoreLabel, {
    opacity: 0,
    y: -30,
    duration: 0.75,
    onComplete: () => {
      scoreLabel.parentNode.removeChild(scoreLabel);
    },
  });
}

function animate() {
  animationId = requestAnimationFrame(animate);
  // the alpha value creates the fade effect
  c.fillStyle = "rgba(0, 0, 0, 0.1)";
  c.fillRect(0, 0, canvas.width, canvas.height);
  frames++;

  backgroundParticles.forEach((backgroundParticle) => {
    backgroundParticle.update();

    const dist = Math.hypot(
      player.x - backgroundParticle.position.x,
      player.y - backgroundParticle.position.y
    );

    if (dist < 100) {
      backgroundParticle.alpha = 0;
      if (dist > 70) {
        backgroundParticle.alpha = 0.5;
      }
    } else if (dist > 100 && backgroundParticle.alpha < 0.1) {
      backgroundParticle.alpha += 0.01;
    } else if (dist > 100 && backgroundParticle.alpha > 0.1) {
      backgroundParticle.alpha -= 0.01;
    }
  });

  player.update();

  for (let i = powerUps.length - 1; i >= 0; i--) {
    const powerUp = powerUps[i];
    powerUp.update();

    if (powerUp.position.x > canvas.width) {
      powerUps.splice(i, 1);
    } else {
      powerUp.update();
    }

    const dist = Math.hypot(
      player.x - powerUp.position.x,
      player.y - powerUp.position.y
    );
    // gain power up
    if (dist < powerUp.image.height / 2 + player.radius) {
      powerUps.splice(i, 1);
      player.powerUp = "MachineGun";
      player.color = "yellow";
      audio.powerUpNoise.play();

      // power up runs out
      setTimeout(() => {
        player.powerUp = null;
        player.color = "white";
      }, 5000);
    }
  }

  // machine gun animation / implementation
  if (player.powerUp === "MachineGun") {
    const angle = Math.atan2(
      mouse.position.y - player.y,
      mouse.position.x - player.x
    );
    const velocity = {
      x: Math.cos(angle) * 4,
      y: Math.sin(angle) * 4,
    };
    if (frames % 2 === 0) {
      projectiles.push(
        new Projectile(player.x, player.y, 5, "yellow", velocity)
      );
    }

    if (frames % 4 === 0) {
      audio.shoot.play();
    }
  }

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
      audio.death.play();
      game.active = false;

      modalEl.style.display = "block";
      gsap.fromTo(
        "#modalEl",
        {
          scale: 0.8,
          opacity: 0,
        },
        {
          scale: 1,
          opacity: 1,
          ease: "expo",
        }
      );
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
            audio.damageTaken.play();
            score += 100;
            scoreEl.innerHTML = score;

            // this is where we shrink our enemy
            gsap.to(enemy, { radius: enemy.radius - 10 });
            createScoreLabel({
              position: {
                x: projectile.x,
                y: projectile.y,
              },
              score: 100,
            });
            projectiles.splice(projectileIndex, 1);
          } else {
            audio.explode.play();
            score += 150;
            scoreEl.innerHTML = score;
            createScoreLabel({
              position: {
                x: projectile.x,
                y: projectile.y,
              },
              score: 150,
            });

            // change background particle color
            backgroundParticles.forEach((backgroundParticle) => {
              gsap.set(backgroundParticle, {
                color: "white",
                alpha: 1,
              });
              gsap.to(backgroundParticle, {
                color: enemy.color,
                alpha: 0.1,
              });
            });

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

let audioInitialized = false;

window.addEventListener("click", (e) => {
  if (!audio.background.playing() && !audioInitialized) {
    audio.background.play();
    audioInitialized = true;
  }

  if (game.active) {
    const angle = Math.atan2(e.clientY - player.y, e.clientX - player.x);

    const velocity = {
      x: Math.cos(angle) * 4,
      y: Math.sin(angle) * 4,
    };
    projectiles.push(new Projectile(player.x, player.y, 5, "white", velocity));
    audio.shoot.play();
  }
});

const mouse = {
  position: {
    x: 0,
    y: 0,
  },
};

addEventListener("mousemove", (e) => {
  mouse.position.x = e.clientX;
  mouse.position.y = e.clientY;
});

// restart game
buttonEl.addEventListener("click", (e) => {
  audio.select.play();
  init();
  animate();
  spawnEnemies();
  spawnPowerUps();
  gsap.to("#modalEl", {
    opacity: 0,
    scale: 0.8,
    duration: 0.2,
    ease: "expo.in",
    onComplete: () => {
      modalEl.style.display = "none";
    },
  });
});

startButtonEl.addEventListener("click", (e) => {
  audio.select.play();
  init();
  animate();
  spawnEnemies();
  spawnPowerUps();
  gsap.to("#startModalEl", {
    opacity: 0,
    scale: 0.8,
    duration: 0.2,
    ease: "expo.in",
    onComplete: () => {
      startModalEl.style.display = "none";
    },
  });
});

// mute everything
volumeUpEl.addEventListener("click", (e) => {
  audio.background.pause();
  volumeOffEl.style.display = "block";
  volumeUpEl.style.display = "none";

  for (let key in audio) {
    audio[key].mute(true);
  }
});

// unmute everything
volumeOffEl.addEventListener("click", (e) => {
  volumeOffEl.style.display = "none";
  volumeUpEl.style.display = "block";

  for (let key in audio) {
    audio[key].mute(false);
  }
  if (audioInitialized) {
    audio.background.play();
  }
});

window.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowRight":
    case "d":
      player.velocity.x += 1;
      break;
    case "ArrowUp":
    case "w":
      player.velocity.y -= 1;
      break;
    case "ArrowLeft":
    case "a":
      player.velocity.x -= 1;
      break;
    case "ArrowDown":
    case "s":
      player.velocity.y += 1;
      break;
    default:
      break;
  }
});
