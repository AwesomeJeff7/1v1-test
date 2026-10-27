
const home = document.getElementById("home");
const game = document.getElementById("game");
const canvas = document.getElementById("arenaCanvas");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;
const floorY = 462;

let selectedArena = "dojo";
let fighters = [];
let keys = new Set();
let running = false;
let ended = false;
let lastTime = 0;
let countdownToken = 0;

const arenas = {
  dojo: {
    name: "THE DOJO",
    sky: "#d6c4a7",
    ground: "#8d9a8a",
    wall: "#795f4d"
  },
  rooftop: {
    name: "NEON ROOFTOP",
    sky: "#24294e",
    ground: "#303448",
    wall: "#e24e76"
  },
  desert: {
    name: "DUSTY DESERT",
    sky: "#f2b777",
    ground: "#c78a52",
    wall: "#e8ad76"
  },
  ice: {
    name: "FROST RING",
    sky: "#a4d9ec",
    ground: "#d8f4fb",
    wall: "#76b9d3"
  }
};

function createFighter(id) {
  return {
    id,
    x: id === 1 ? 300 : 700,
    y: floorY,
    health: 100,
    color: id === 1 ? "#ff654d" : "#54b7ff",
    facing: id === 1 ? 1 : -1,
    vx: 0,
    vy: 0,
    walk: 0,
    punch: 0,
    cooldown: 0,
    hitThisPunch: false,
    hurt: 0,
    controls: id === 1
      ? {
          up: "w",
          down: "s",
          left: "a",
          right: "d",
          punch: "f"
        }
      : {
          up: "arrowup",
          down: "arrowdown",
          left: "arrowleft",
          right: "arrowright",
          punch: "/"
        }
  };
}

function updateHealth() {
  fighters.forEach(f => {
    const health = Math.max(0, f.health);

    document.getElementById(`p${f.id}Health`).style.width =
      health + "%";

    document.getElementById(`p${f.id}Text`).textContent =
      `${Math.ceil(health)} / 100`;
  });
}

function showGame() {
  home.classList.add("hidden");
  game.classList.remove("hidden");
  document.getElementById("arenaName").textContent =
    arenas[selectedArena].name;

  keys.clear();
  resetFight();
}

function showHome() {
  running = false;
  ended = true;
  countdownToken++;
  keys.clear();

  game.classList.add("hidden");
  home.classList.remove("hidden");

  document.getElementById("countdown").classList.add("hidden");
  document.getElementById("result").classList.add("hidden");
}

function resetFight() {
  countdownToken++;

  const token = countdownToken;

  fighters = [
    createFighter(1),
    createFighter(2)
  ];

  running = false;
  ended = false;
  keys.clear();

  document.getElementById("result").classList.add("hidden");

  const countdown = document.getElementById("countdown");
  countdown.classList.remove("hidden");

  updateHealth();

  let number = 3;
  countdown.textContent = number;

  const tick = () => {
    if (token !== countdownToken || ended) return;

    number--;

    if (number > 0) {
      countdown.textContent = number;
      setTimeout(tick, 650);
    } else {
      countdown.textContent = "FIGHT!";

      setTimeout(() => {
        if (token !== countdownToken || ended) return;

        countdown.classList.add("hidden");
        running = true;
      }, 450);
    }
  };

  setTimeout(tick, 650);
}

document.querySelectorAll(".arena").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".arena").forEach(card => {
      card.classList.remove("selected");
    });

    button.classList.add("selected");
    selectedArena = button.dataset.arena;
  });
});

document.getElementById("startBtn").addEventListener("click", showGame);
document.getElementById("backBtn").addEventListener("click", showHome);
document.getElementById("homeBtn").addEventListener("click", showHome);
document.getElementById("rematchBtn").addEventListener("click", resetFight);

window.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();

  if (
    ["arrowup", "arrowdown", "arrowleft", "arrowright", " "]
      .includes(key)
  ) {
    event.preventDefault();
  }

  if (!keys.has(key)) {
    const fighter = fighters.find(f => f.controls.punch === key);

    if (fighter && running && !ended && fighter.cooldown <= 0) {
      fighter.punch = 0.24;
      fighter.cooldown = 0.42;
      fighter.hitThisPunch = false;
    }
  }

  keys.add(key);
});

window.addEventListener("keyup", event => {
  keys.delete(event.key.toLowerCase());
});

window.addEventListener("blur", () => keys.clear());

function endFight(winner) {
  ended = true;
  running = false;

  document.getElementById("winner").textContent =
    `PLAYER ${winner} WINS!`;

  document.getElementById("result").classList.remove("hidden");
}

function update(dt) {
  if (!running || ended) return;

  for (const f of fighters) {
    f.cooldown = Math.max(0, f.cooldown - dt);
    f.punch = Math.max(0, f.punch - dt);
    f.hurt = Math.max(0, f.hurt - dt);

    const left = keys.has(f.controls.left);
    const right = keys.has(f.controls.right);
    const up = keys.has(f.controls.up);
    const down = keys.has(f.controls.down);

    let dx = Number(right) - Number(left);
    let dy = Number(down) - Number(up);

    const length = Math.hypot(dx, dy) || 1;
    dx /= length;
    dy /= length;

    const speed = selectedArena === "ice" ? 238 : 270;

    f.vx = dx * speed;
    f.vy = dy * speed * 0.72;

    f.x += f.vx * dt;
    f.y += f.vy * dt;

    f.x = Math.max(45, Math.min(W - 45, f.x));
    f.y = Math.max(315, Math.min(floorY, f.y));

    if (dx !== 0) f.facing = dx > 0 ? 1 : -1;

    if (dx !== 0 || dy !== 0) {
      f.walk += dt * 12;
    }
  }

  const [p1, p2] = fighters;

  // Prevent fighters from standing inside each other.
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const distance = Math.hypot(dx, dy) || 1;

  if (distance < 62) {
    const push = (62 - distance) / 2;

    p1.x -= dx / distance * push;
    p2.x += dx / distance * push;
  }

  // Face the opponent when they are nearby.
  if (Math.abs(p1.x - p2.x) < 280) {
    p1.facing = p1.x < p2.x ? 1 : -1;
    p2.facing = -p1.facing;
  }

  for (const f of fighters) {
    // One damage check per punch.
    if (
      f.punch > 0.09 &&
      f.punch < 0.21 &&
      !f.hitThisPunch
    ) {
      f.hitThisPunch = true;

      const target = fighters.find(other => other !== f);
      const dx = target.x - f.x;
      const dy = target.y - f.y;
      const distance = Math.hypot(dx, dy);

      const inFront = dx * f.facing > 0;

      if (distance < 112 && inFront && Math.abs(dy) < 90) {
        target.health = Math.max(0, target.health - 9);
        target.hurt = 0.18;
        target.x += f.facing * 22;

        updateHealth();

        if (target.health <= 0) {
          endFight(f.id);
          return;
        }
      }
    }

    if (f.punch === 0) {
      f.hitThisPunch = false;
    }
  }
}

function drawLine(x1, y1, x2, y2, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function circle(x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawFighter(f) {
  const moving = running && (f.vx !== 0 || f.vy !== 0);
  const step = moving ? Math.sin(f.walk) * 13 : 0;
  const color = f.hurt > 0 ? "#ffffff" : f.color;
  const x = f.x;
  const y = f.y;
  const face = f.facing;
  const headY = y - 83;

  // Shadow.
  ctx.fillStyle = "#00000025";
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 25, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs.
  drawLine(x, y - 35, x - 11 + step, y - 4, 7, color);
  drawLine(x, y - 35, x + 12 - step, y - 4, 7, color);

  // Body.
  drawLine(x, y - 65, x, y - 34, 8, color);

  // Back arm.
  drawLine(x, y - 59, x - face * 17, y - 43, 6, color);

  // Punching arm.
  if (f.punch > 0) {
    const progress = Math.sin(
      (1 - f.punch / 0.24) * Math.PI
    );

    const elbowX = x + face * (13 + progress * 13);
    const handX = x + face * (25 + progress * 48);
    const elbowY = y - 57;
    const handY = y - 55;

    drawLine(x, y - 60, elbowX, elbowY, 6, color);
    drawLine(elbowX, elbowY, handX, handY, 6, color);
    circle(handX, handY, 6, color);

    if (progress > 0.75) {
      ctx.strokeStyle = "#fff4b3";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(
        handX + face * 6,
        handY,
        14,
        -1.1,
        1.1
      );
      ctx.stroke();
    }
  } else {
    drawLine(x, y - 59, x + face * 17, y - 47, 6, color);
    circle(x + face * 18, y - 46, 4, color);
  }

  // Head and face.
  circle(x, headY, 14, color);
  circle(x + face * 4, headY - 1, 2.2, "#161b23");

  // Player label.
  ctx.font = "bold 12px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = color;
  ctx.fillText(`P${f.id}`, x, y - 108);
}

function drawBackground() {
  const arena = arenas[selectedArena];

  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, arena.sky);
  gradient.addColorStop(1, arena.ground);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  if (selectedArena === "dojo") {
    ctx.fillStyle = arena.wall;

    for (let x = 35; x < W; x += 115) {
      ctx.fillRect(x, 35, 8, 75);
    }

    ctx.fillRect(0, 105, W, 9);
    ctx.fillStyle = "#f0e7d6";
    ctx.fillRect(0, 114, W, 5);
  }

  if (selectedArena === "rooftop") {
    for (let i = 0; i < 12; i++) {
      const x = i * 92 - 20;
      const height = 70 + (i * 43) % 155;

      ctx.fillStyle = i % 2 ? "#282d49" : "#30334f";
      ctx.fillRect(x, 310 - height, 65, height);

      ctx.fillStyle = "#f59bcb";

      for (let y = 325 - height; y < 300; y += 20) {
        ctx.fillRect(x + 12, y, 5, 8);
        ctx.fillRect(x + 32, y, 5, 8);
      }
    }
  }

  if (selectedArena === "desert") {
    circle(810, 85, 43, "#ffe0a0");

    ctx.fillStyle = "#d99b69";
    ctx.beginPath();
    ctx.moveTo(0, 280);
    ctx.lineTo(150, 130);
    ctx.lineTo(280, 280);
    ctx.lineTo(450, 165);
    ctx.lineTo(600, 280);
    ctx.lineTo(790, 145);
    ctx.lineTo(1000, 280);
    ctx.closePath();
    ctx.fill();
  }

  if (selectedArena === "ice") {
    circle(810, 75, 32, "#f1ffff");

    for (let i = 0; i < 35; i++) {
      ctx.fillStyle = "#ffffffaa";
      ctx.fillRect((i * 137) % W, (i * 61) % 260, 2, 2);
    }

    ctx.fillStyle = "#c8eaf3";
    ctx.beginPath();
    ctx.moveTo(0, 280);
    ctx.lineTo(130, 150);
    ctx.lineTo(240, 280);
    ctx.lineTo(420, 170);
    ctx.lineTo(600, 280);
    ctx.lineTo(770, 140);
    ctx.lineTo(1000, 280);
    ctx.closePath();
    ctx.fill();
  }

  // Arena floor.
  ctx.fillStyle = arena.ground;
  ctx.fillRect(0, floorY, W, H - floorY);

  ctx.fillStyle = "#ffffff30";
  ctx.fillRect(0, floorY, W, 4);

  // Floor markings.
  ctx.strokeStyle = selectedArena === "ice"
    ? "#90c7d8"
    : "#ffffff28";

  ctx.lineWidth = 2;

  for (let x = 30; x < W; x += 70) {
    ctx.beginPath();
    ctx.moveTo(x, floorY + 18);
    ctx.lineTo(x + 35, floorY + 18);
    ctx.stroke();
  }

  ctx.setLineDash([8, 9]);
  ctx.beginPath();
  ctx.moveTo(W / 2, floorY + 20);
  ctx.lineTo(W / 2, H);
  ctx.stroke();
  ctx.setLineDash([]);
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  drawBackground();

  fighters.forEach(drawFighter);
}

function loop(time) {
  const dt = Math.min((time - lastTime) / 1000 || 0, 0.035);
  lastTime = time;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
