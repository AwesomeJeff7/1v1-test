
const home = document.getElementById("home");
const game = document.getElementById("game");
const canvas = document.getElementById("arenaCanvas");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;
const floorY = 462;

let selectedArena = "dojo";
let selectedMode = "classic";
let fighters = [];
let keys = new Set();
let running = false;
let ended = false;
let lastTime = 0;
let countdownToken = 0;
let projectiles = [];
let item = null;
let itemTimer = 0;
let nextItemDelay = 3;
let message = "";
let messageTimer = 0;

const arenas = {
  dojo: { name: "THE DOJO", sky: "#d6c4a7", ground: "#8d9a8a", wall: "#795f4d" },
  rooftop: { name: "NEON ROOFTOP", sky: "#24294e", ground: "#303448", wall: "#e24e76" },
  desert: { name: "DUSTY DESERT", sky: "#f2b777", ground: "#c78a52", wall: "#e8ad76" },
  ice: { name: "FROST RING", sky: "#a4d9ec", ground: "#d8f4fb", wall: "#76b9d3" }
};

const powers = ["katana", "gun", "laser", "strong", "jetpack"];

const powerNames = {
  katana: "KATANA",
  gun: "GUN",
  laser: "LASER",
  strong: "POWER PUNCH",
  jetpack: "JETPACK"
};

const powerColors = {
  katana: "#f2f2f2",
  gun: "#ffc46b",
  laser: "#ff4dff",
  strong: "#ff654d",
  jetpack: "#70e8ff"
};

function randomPower(exclude = "") {
  const options = powers.filter(p => p !== exclude);
  return options[Math.floor(Math.random() * options.length)];
}

function createFighter(id, power = null) {
  return {
    id,
    x: id === 1 ? 300 : 700,
    y: floorY,
    vx: 0,
    vy: 0,
    health: 100,
    color: id === 1 ? "#ff654d" : "#54b7ff",
    facing: id === 1 ? 1 : -1,
    grounded: true,
    walk: 0,
    punch: 0,
    cooldown: 0,
    hitThisAttack: false,
    hurt: 0,
    jumpHeld: false,
    jumpBuffer: 0,
    power,
    temporaryPower: null,
    powerTimer: 0,
    jetFuel: 0
  };
}

function getPower(f) {
  return f.temporaryPower || f.power;
}

function powerLabel(f) {
  const power = getPower(f);

  if (!power) return "NORMAL PUNCH";

  const name = powerNames[power] || power.toUpperCase();

  if (f.temporaryPower) {
    return `${name} · ${Math.max(0, f.powerTimer).toFixed(1)}s`;
  }

  return name;
}

function updateHealth() {
  for (const f of fighters) {
    const health = Math.max(0, f.health);

    document.getElementById(`p${f.id}Health`).style.width =
      health + "%";

    document.getElementById(`p${f.id}Text`).textContent =
      `${Math.ceil(health)} / 100`;

    document.getElementById(`p${f.id}Power`).textContent =
      powerLabel(f);
  }
}

function showGame() {
  home.classList.add("hidden");
  game.classList.remove("hidden");

  document.getElementById("arenaName").textContent =
    arenas[selectedArena].name;

  document.getElementById("modeName").textContent =
    selectedMode === "random"
      ? "RANDOM POWERS"
      : selectedMode.toUpperCase();

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

  let p1Power = null;
  let p2Power = null;

  if (selectedMode === "random") {
    p1Power = randomPower();
    p2Power = randomPower(p1Power);
  }

  fighters = [
    createFighter(1, p1Power),
    createFighter(2, p2Power)
  ];

  projectiles = [];
  item = null;
  itemTimer = 0;
  nextItemDelay = 3;
  message = "";
  messageTimer = 0;

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
    document.querySelectorAll(".arena").forEach(card =>
      card.classList.remove("selected")
    );

    button.classList.add("selected");
    selectedArena = button.dataset.arena;
  });
});

document.querySelectorAll(".mode").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".mode").forEach(card =>
      card.classList.remove("selected")
    );

    button.classList.add("selected");
    selectedMode = button.dataset.mode;
  });
});

document.getElementById("startBtn").addEventListener("click", showGame);
document.getElementById("backBtn").addEventListener("click", showHome);
document.getElementById("homeBtn").addEventListener("click", showHome);
document.getElementById("rematchBtn").addEventListener("click", resetFight);

const jumpKeys = new Set(["w", "arrowup"]);
const attackKeys = new Set(["f", "/"]);
const powerKeys = new Set([" ", "enter"]);

window.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();

  if (
    ["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)
  ) {
    event.preventDefault();
  }

  if (keys.has(key)) return;

  keys.add(key);

  if (!running || ended) return;

  const fighter = fighters.find(f =>
    f.controls ? false : (
      f.id === 1
        ? ["w", "a", "s", "d", "f", " "].includes(key)
        : ["arrowup", "arrowdown", "arrowleft", "arrowright", "/", "enter"].includes(key)
    )
  );

  if (key === "w") {
    const f = fighters[0];
    if (f) f.jumpBuffer = 0.14;
  }

  if (key === "arrowup") {
    const f = fighters[1];
    if (f) f.jumpBuffer = 0.14;
  }

  if (key === "f") {
    const f = fighters[0];
    if (f) useAttack(f);
  }

  if (key === "/") {
    const f = fighters[1];
    if (f) useAttack(f);
  }

  if (key === " " || key === "enter") {
    const f = fighters[key === " " ? 0 : 1];

    if (f && getPower(f) === "jetpack") {
      f.jetFuel = Math.max(f.jetFuel, 1.2);
    }
  }
});

window.addEventListener("keyup", event => {
  const key = event.key.toLowerCase();
  keys.delete(key);

  if (key === "w" && fighters[0]) {
    fighters[0].jumpHeld = false;
  }

  if (key === "arrowup" && fighters[1]) {
    fighters[1].jumpHeld = false;
  }
});

window.addEventListener("blur", () => keys.clear());

function useAttack(f) {
  if (!running || ended || f.cooldown > 0) return;

  f.punch = 0.26;
  f.hitThisAttack = false;

  const power = getPower(f);

  if (power === "gun") {
    f.cooldown = 0.65;

    projectiles.push({
      type: "bullet",
      x: f.x + f.facing * 30,
      y: f.y - 55,
      vx: f.facing * 620,
      owner: f.id,
      damage: 12,
      life: 1.5,
      color: "#ffd17c"
    });
  } else if (power === "laser") {
    f.cooldown = 1.0;

    projectiles.push({
      type: "laser",
      x: f.x + f.facing * 20,
      y: f.y - 58,
      vx: f.facing * 900,
      owner: f.id,
      damage: 16,
      life: 0.35,
      color: "#ff4dff"
    });
  } else {
    f.cooldown = power === "katana" ? 0.55 : 0.42;
  }
}

function endFight(winner) {
  ended = true;
  running = false;

  document.getElementById("winner").textContent =
    `PLAYER ${winner} WINS!`;

  document.getElementById("resultMessage").textContent =
    "Knockout!";

  document.getElementById("result").classList.remove("hidden");
}

function damageTarget(target, amount, attacker) {
  target.health = Math.max(0, target.health - amount);
  target.hurt = 0.2;

  target.vx += attacker.facing * 100;

  updateHealth();

  if (target.health <= 0) {
    endFight(attacker.id);
  }
}

function update(dt) {
  if (!running || ended) return;

  messageTimer = Math.max(0, messageTimer - dt);

  for (const f of fighters) {
    f.cooldown = Math.max(0, f.cooldown - dt);
    f.punch = Math.max(0, f.punch - dt);
    f.hurt = Math.max(0, f.hurt - dt);
    f.jumpBuffer = Math.max(0, f.jumpBuffer - dt);

    if (f.temporaryPower) {
      f.powerTimer -= dt;

      if (f.powerTimer <= 0) {
        f.temporaryPower = null;
        f.powerTimer = 0;
        message = `PLAYER ${f.id}'S POWER EXPIRED`;
        messageTimer = 1.5;
        updateHealth();
      }
    }

    const left = keys.has(f.id === 1 ? "a" : "arrowleft");
    const right = keys.has(f.id === 1 ? "d" : "arrowright");
    const jumpKey = f.id === 1 ? "w" : "arrowup";

    let dx = Number(right) - Number(left);
    const speed = selectedArena === "ice" ? 245 : 275;

    // Horizontal movement with friction.
    if (dx !== 0) {
      f.vx = dx * speed;
      f.facing = dx > 0 ? 1 : -1;
      f.walk += dt * 12;
    } else {
      f.vx *= Math.pow(0.0005, dt);
      if (Math.abs(f.vx) < 2) f.vx = 0;
    }

    // Jumping only starts while grounded.
    if (f.jumpBuffer > 0 && f.grounded) {
      f.vy = -560;
      f.grounded = false;
      f.jumpBuffer = 0;
      f.jumpHeld = true;
    }

    // Gravity stops fighters from floating.
    const jetpack = getPower(f) === "jetpack" &&
      (keys.has(f.id === 1 ? " " : "enter"));

    if (jetpack) {
      f.jetFuel = Math.max(0, f.jetFuel - dt);
      f.vy = Math.max(f.vy - 850 * dt, -390);
    } else {
      f.vy += 1450 * dt;
    }

    f.x += f.vx * dt;
    f.y += f.vy * dt;

    f.x = Math.max(30, Math.min(W - 30, f.x));

    if (f.y >= floorY) {
      f.y = floorY;
      f.vy = 0;
      f.grounded = true;
    } else {
      f.grounded = false;
    }
  }

  // Keep players from overlapping horizontally.
  const [p1, p2] = fighters;
  const horizontalDistance = p2.x - p1.x;

  if (Math.abs(horizontalDistance) < 55 &&
      Math.abs(p1.y - p2.y) < 65) {
    const push = (55 - Math.abs(horizontalDistance)) / 2;
    const direction = horizontalDistance >= 0 ? 1 : -1;

    p1.x -= push * direction;
    p2.x += push * direction;
  }

  // Face the opponent.
  if (Math.abs(p1.x - p2.x) < 300) {
    p1.facing = p1.x < p2.x ? 1 : -1;
    p2.facing = -p1.facing;
  }

  // Melee attacks.
  for (const f of fighters) {
    if (
      f.punch > 0.09 &&
      f.punch < 0.22 &&
      !f.hitThisAttack
    ) {
      f.hitThisAttack = true;

      const target = fighters.find(other => other !== f);
      const power = getPower(f);

      const dx = target.x - f.x;
      const dy = (target.y - 55) - (f.y - 55);
      const inFront = dx * f.facing > 0;

      const range = power === "katana" ? 155 : 105;
      const damage = power === "katana"
        ? 19
        : power === "strong"
          ? 18
          : 9;

      if (
        Math.abs(dx) < range &&
        Math.abs(dy) < 85 &&
        inFront
      ) {
        damageTarget(target, damage, f);
      }
    }

    if (f.punch === 0) {
      f.hitThisAttack = false;
    }
  }

  // Update bullets and lasers.
  for (const shot of projectiles) {
    shot.x += shot.vx * dt;
    shot.life -= dt;

    const target = fighters.find(f => f.id !== shot.owner);

    if (!target) continue;

    const hit = Math.abs(shot.x - target.x) < 28 &&
      Math.abs(shot.y - (target.y - 55)) < 48;

    if (hit && !shot.hit) {
      shot.hit = true;
      shot.life = 0;

      const attacker = fighters.find(f => f.id === shot.owner);
      damageTarget(target, shot.damage, attacker);
    }
  }

  projectiles = projectiles.filter(shot =>
    shot.life > 0 && shot.x > -50 && shot.x < W + 50
  );

  // Items mode: spawn a pickup every few seconds.
  if (selectedMode === "items") {
    if (!item) {
      itemTimer += dt;

      if (itemTimer >= nextItemDelay) {
        itemTimer = 0;
        nextItemDelay = 4 + Math.random() * 3;

        item = {
          x: 100 + Math.random() * (W - 200),
          y: floorY - 22,
          type: randomPower(),
          bob: Math.random() * 6
        };
      }
    } else {
      item.bob += dt * 4;

      for (const f of fighters) {
        const distance = Math.hypot(
          f.x - item.x,
          (f.y - 45) - (item.y + Math.sin(item.bob) * 4)
        );

        if (distance < 48) {
          f.temporaryPower = item.type;
          f.powerTimer = 10;
          f.jetFuel = 1.2;

          message = `PLAYER ${f.id} GOT ${powerNames[item.type]}!`;
          messageTimer = 1.8;

          item = null;
          itemTimer = 0;
          updateHealth();
          break;
        }
      }
    }
  }

  updateHealth();
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
  const moving = Math.abs(f.vx) > 15 && running;
  const step = moving ? Math.sin(f.walk) * 12 : 0;
  const color = f.hurt > 0 ? "#ffffff" : f.color;
  const x = f.x;
  const y = f.y;
  const face = f.facing;
  const headY = y - 83;
  const power = getPower(f);

  // Shadow.
  ctx.fillStyle = "#00000028";
  ctx.beginPath();
  ctx.ellipse(x, floorY + 3, 25, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Jetpack.
  if (power === "jetpack") {
    ctx.fillStyle = "#53616c";
    ctx.fillRect(x - 19, y - 67, 9, 24);
    ctx.fillStyle = "#70e8ff";

    if (keys.has(f.id === 1 ? " " : "enter")) {
      ctx.beginPath();
      ctx.moveTo(x - 15, y - 42);
      ctx.lineTo(x - 22, y - 22);
      ctx.lineTo(x - 10, y - 29);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Legs.
  drawLine(x, y - 35, x - 11 + step, y - 4, 7, color);
  drawLine(x, y - 35, x + 12 - step, y - 4, 7, color);

  // Body.
  drawLine(x, y - 65, x, y - 34, 8, color);

  // Back arm.
  drawLine(x, y - 59, x - face * 17, y - 43, 6, color);

  // Attack arm.
  if (f.punch > 0) {
    const progress = Math.sin(
      (1 - f.punch / 0.26) * Math.PI
    );

    const elbowX = x + face * (13 + progress * 13);
    const handX = x + face * (25 + progress * 48);
    const handY = y - 55;

    drawLine(x, y - 60, elbowX, y - 57, 6, color);
    drawLine(elbowX, y - 57, handX, handY, 6, color);
    circle(handX, handY, 6, color);

    if (power === "katana") {
      drawLine(
        handX,
        handY - 3,
        handX + face * 35,
        handY - 30,
        5,
        "#e8eef5"
      );
      drawLine(
        handX,
        handY - 3,
        handX + face * 35,
        handY - 30,
        2,
        "#5a6878"
      );
    }
  } else {
    drawLine(x, y - 59, x + face * 17, y - 47, 6, color);
    circle(x + face * 18, y - 46, 4, color);
  }

  // Head and face.
  circle(x, headY, 14, color);
  circle(x + face * 4, headY - 1, 2.2, "#161b23");

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

  ctx.fillStyle = arena.ground;
  ctx.fillRect(0, floorY, W, H - floorY);

  ctx.fillStyle = "#ffffff30";
  ctx.fillRect(0, floorY, W, 4);

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

function drawItem() {
  if (!item) return;

  const x = item.x;
  const y = item.y + Math.sin(item.bob) * 4;
  const color = powerColors[item.type];

  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;

  circle(x, y, 17, "#202630");
  circle(x, y, 13, color);

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#171b23";
  ctx.font = "bold 13px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const symbols = {
    katana: "K",
    gun: "G",
    laser: "L",
    strong: "P",
    jetpack: "J"
  };

  ctx.fillText(symbols[item.type], x, y + 1);
  ctx.restore();

  ctx.textBaseline = "alphabetic";
}

function drawProjectiles() {
  for (const shot of projectiles) {
    if (shot.type === "laser") {
      ctx.globalAlpha = Math.min(1, shot.life * 8);
      ctx.strokeStyle = shot.color;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(shot.x, shot.y);
      ctx.lineTo(shot.x - shot.vx * 0.12, shot.y);
      ctx.stroke();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(shot.x, shot.y);
      ctx.lineTo(shot.x - shot.vx * 0.12, shot.y);
      ctx.stroke();

      ctx.globalAlpha = 1;
    } else {
      circle(shot.x, shot.y, 5, shot.color);
      circle(shot.x, shot.y, 2, "#fff6d8");
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  drawBackground();

  if (item) drawItem();

  drawProjectiles();
  fighters.forEach(drawFighter);

  if (messageTimer > 0) {
    ctx.fillStyle = "#111722cc";
    ctx.fillRect(270, 35, 460, 40);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(message, W / 2, 60);
  }

  if (selectedMode === "items" && running && !item) {
    ctx.fillStyle = "#ffffffbb";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("ITEMS SPAWN DURING THE FIGHT", W / 2, 25);
  }
}

function loop(time) {
  const dt = Math.min((time - lastTime) / 1000 || 0, 0.035);
  lastTime = time;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
