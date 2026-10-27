
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
let platforms = [];
let disaster = null;
let disasterCooldown = 5;
let disasterWarning = 0;
let disasterTypeNext = "";
let hazardObjects = [];
let disasterRound = 0;

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

function makePlatforms() {
  platforms = [
    { x: 145, y: 355, w: 190, h: 13 },
    { x: 405, y: 300, w: 190, h: 13 },
    { x: 665, y: 355, w: 190, h: 13 }
  ];
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
    onPlatform: false,
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
    jetFuel: 0,
    safeFlash: 0
  };
}

function getPower(f) {
  return f.temporaryPower || f.power;
}

function powerLabel(f) {
  const power = getPower(f);
  if (!power) return "NORMAL PUNCH";
  const name = powerNames[power] || power.toUpperCase();
  if (f.temporaryPower) return `${name} · ${Math.max(0, f.powerTimer).toFixed(1)}s`;
  return name;
}

function updateHealth() {
  for (const f of fighters) {
    const health = Math.max(0, f.health);
    document.getElementById(`p${f.id}Health`).style.width = health + "%";
    document.getElementById(`p${f.id}Text`).textContent = `${Math.ceil(health)} / 100`;
    document.getElementById(`p${f.id}Power`).textContent = powerLabel(f);
  }
}

function showGame() {
  home.classList.add("hidden");
  game.classList.remove("hidden");
  document.getElementById("arenaName").textContent = arenas[selectedArena].name;
  document.getElementById("modeName").textContent = ({
    random: "RANDOM POWERS",
    disasters: "DISASTERS"
  })[selectedMode] || selectedMode.toUpperCase();
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

  fighters = [createFighter(1, p1Power), createFighter(2, p2Power)];
  projectiles = [];
  item = null;
  itemTimer = 0;
  nextItemDelay = 3;
  message = "";
  messageTimer = 0;
  hazardObjects = [];
  disaster = null;
  disasterCooldown = 4 + Math.random() * 2;
  disasterWarning = 0;
  disasterTypeNext = "";
  disasterRound = 0;
  makePlatforms();

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
      card.setAttribute("aria-pressed", "false");
    });
    button.classList.add("selected");
    button.setAttribute("aria-pressed", "true");
    selectedArena = button.dataset.arena;
  });
});

document.querySelectorAll(".mode").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".mode").forEach(card => {
      card.classList.remove("selected");
      card.setAttribute("aria-pressed", "false");
    });
    button.classList.add("selected");
    button.setAttribute("aria-pressed", "true");
    selectedMode = button.dataset.mode;
  });
});

document.getElementById("startBtn").addEventListener("click", showGame);
document.getElementById("backBtn").addEventListener("click", showHome);
document.getElementById("homeBtn").addEventListener("click", showHome);
document.getElementById("rematchBtn").addEventListener("click", resetFight);

window.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
  if (keys.has(key)) return;
  keys.add(key);
  if (!running || ended) return;

  if (key === "w" && fighters[0]) fighters[0].jumpBuffer = 0.14;
  if (key === "arrowup" && fighters[1]) fighters[1].jumpBuffer = 0.14;
  if (key === "f" && fighters[0]) useAttack(fighters[0]);
  if (key === "/" && fighters[1]) useAttack(fighters[1]);

  if (key === " " || key === "enter") {
    const f = fighters[key === " " ? 0 : 1];
    if (f && getPower(f) === "jetpack") f.jetFuel = Math.max(f.jetFuel, 1.2);
  }
});

window.addEventListener("keyup", event => {
  const key = event.key.toLowerCase();
  keys.delete(key);
  if (key === "w" && fighters[0]) fighters[0].jumpHeld = false;
  if (key === "arrowup" && fighters[1]) fighters[1].jumpHeld = false;
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
      type: "bullet", x: f.x + f.facing * 30, y: f.y - 55,
      vx: f.facing * 620, owner: f.id, damage: 12, life: 1.5, color: "#ffd17c"
    });
  } else if (power === "laser") {
    f.cooldown = 1.0;
    projectiles.push({
      type: "laser", x: f.x + f.facing * 20, y: f.y - 58,
      vx: f.facing * 900, owner: f.id, damage: 16, life: 0.35, color: "#ff4dff"
    });
  } else {
    f.cooldown = power === "katana" ? 0.55 : 0.42;
  }
}

function endFight(winner) {
  ended = true;
  running = false;
  document.getElementById("winner").textContent = `PLAYER ${winner} WINS!`;
  document.getElementById("resultMessage").textContent = selectedMode === "disasters"
    ? "Survived the chaos and won the fight!"
    : "Knockout!";
  document.getElementById("result").classList.remove("hidden");
}

function damageTarget(target, amount, attacker) {
  target.health = Math.max(0, target.health - amount);
  target.hurt = 0.2;
  target.vx += attacker ? (attacker.facing * 100) : 0;
  updateHealth();
  if (target.health <= 0) endFight(attacker ? attacker.id : (target.id === 1 ? 2 : 1));
}

function damageFromDisaster(target, amount, knockback = 0) {
  if (!target || target.health <= 0 || ended) return;
  target.health = Math.max(0, target.health - amount);
  target.hurt = 0.25;
  target.safeFlash = 0.35;
  target.vx += knockback;
  updateHealth();
  if (target.health <= 0) endFight(target.id === 1 ? 2 : 1);
}

function platformUnderFighter(f) {
  const feet = f.y;
  return platforms.find(p =>
    f.x + 14 > p.x && f.x - 14 < p.x + p.w &&
    feet >= p.y - 3 && feet <= p.y + p.h + 8 &&
    f.vy >= 0
  );
}

function update(dt) {
  if (!running || ended) return;

  messageTimer = Math.max(0, messageTimer - dt);

  for (const f of fighters) {
    f.cooldown = Math.max(0, f.cooldown - dt);
    f.punch = Math.max(0, f.punch - dt);
    f.hurt = Math.max(0, f.hurt - dt);
    f.jumpBuffer = Math.max(0, f.jumpBuffer - dt);
    f.safeFlash = Math.max(0, f.safeFlash - dt);

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

    const oldY = f.y;
    const left = keys.has(f.id === 1 ? "a" : "arrowleft");
    const right = keys.has(f.id === 1 ? "d" : "arrowright");
    let dx = Number(right) - Number(left);
    const speed = selectedArena === "ice" ? 245 : 275;

    if (dx !== 0) {
      f.vx = dx * speed;
      f.facing = dx > 0 ? 1 : -1;
      f.walk += dt * 12;
    } else {
      f.vx *= Math.pow(0.0005, dt);
      if (Math.abs(f.vx) < 2) f.vx = 0;
    }

    if (f.jumpBuffer > 0 && f.grounded) {
      f.vy = -560;
      f.grounded = false;
      f.onPlatform = false;
      f.jumpBuffer = 0;
      f.jumpHeld = true;
    }

    const jetKey = keys.has(f.id === 1 ? " " : "enter");
    const jetpack = getPower(f) === "jetpack" && jetKey && f.jetFuel > 0;
    if (jetpack) {
      f.jetFuel = Math.max(0, f.jetFuel - dt);
      f.vy = Math.max(f.vy - 850 * dt, -390);
    } else {
      f.vy += 1450 * dt;
    }

    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.x = Math.max(30, Math.min(W - 30, f.x));
    f.grounded = false;
    f.onPlatform = false;

    if (f.y >= floorY) {
      f.y = floorY;
      f.vy = 0;
      f.grounded = true;
    } else if (f.vy >= 0) {
      for (const p of platforms) {
        const wasAbove = oldY <= p.y + 3;
        const crossed = f.y >= p.y && oldY <= p.y;
        if (wasAbove && crossed && f.x + 14 > p.x && f.x - 14 < p.x + p.w) {
          f.y = p.y;
          f.vy = 0;
          f.grounded = true;
          f.onPlatform = true;
          break;
        }
      }
    }
  }

  const [p1, p2] = fighters;
  const horizontalDistance = p2.x - p1.x;
  if (Math.abs(horizontalDistance) < 55 && Math.abs(p1.y - p2.y) < 65) {
    const push = (55 - Math.abs(horizontalDistance)) / 2;
    const direction = horizontalDistance >= 0 ? 1 : -1;
    p1.x -= push * direction;
    p2.x += push * direction;
  }

  if (Math.abs(p1.x - p2.x) < 300) {
    p1.facing = p1.x < p2.x ? 1 : -1;
    p2.facing = -p1.facing;
  }

  for (const f of fighters) {
    if (f.punch > 0.09 && f.punch < 0.22 && !f.hitThisAttack) {
      f.hitThisAttack = true;
      const target = fighters.find(other => other !== f);
      const power = getPower(f);
      const dx = target.x - f.x;
      const dy = (target.y - 55) - (f.y - 55);
      const inFront = dx * f.facing > 0;
      const range = power === "katana" ? 155 : 105;
      const damage = power === "katana" ? 19 : power === "strong" ? 18 : 9;
      if (Math.abs(dx) < range && Math.abs(dy) < 85 && inFront) damageTarget(target, damage, f);
    }
    if (f.punch === 0) f.hitThisAttack = false;
  }

  for (const shot of projectiles) {
    const previousX = shot.x;
    shot.x += shot.vx * dt;
    shot.life -= dt;
    const target = fighters.find(f => f.id !== shot.owner);
    if (!target) continue;
    const crossedTarget = Math.min(previousX, shot.x) <= target.x + 28 &&
      Math.max(previousX, shot.x) >= target.x - 28;
    const hit = crossedTarget && Math.abs(shot.y - (target.y - 55)) < 48;
    if (hit && !shot.hit) {
      shot.hit = true;
      shot.life = 0;
      const attacker = fighters.find(f => f.id === shot.owner);
      damageTarget(target, shot.damage, attacker);
    }
  }
  projectiles = projectiles.filter(shot => shot.life > 0 && shot.x > -80 && shot.x < W + 80);

  if (selectedMode === "items") updateItems(dt);
  if (selectedMode === "disasters") updateDisasters(dt);

  updateHealth();
}

function updateItems(dt) {
  if (!item) {
    itemTimer += dt;
    if (itemTimer >= nextItemDelay) {
      itemTimer = 0;
      nextItemDelay = 4 + Math.random() * 3;
      item = { x: 100 + Math.random() * (W - 200), y: floorY - 22, type: randomPower(), bob: Math.random() * 6 };
    }
  } else {
    item.bob += dt * 4;
    for (const f of fighters) {
      const distance = Math.hypot(f.x - item.x, (f.y - 45) - (item.y + Math.sin(item.bob) * 4));
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

function startDisaster(type) {
  disasterRound++;
  disasterTypeNext = "";
  disasterWarning = 0;
  hazardObjects = [];

  const names = {
    volcano: "VOLCANO ERUPTION! GET AWAY FROM THE RED ZONE!",
    acid: "ACID RAIN! HIDE UNDER A PLATFORM!",
    rocks: "FALLING ROCKS! KEEP MOVING!"
  };
  message = names[type];
  messageTimer = 2.2;

  if (type === "volcano") {
    const side = Math.random() < 0.5 ? "left" : "right";
    disaster = { type, timer: 0, duration: 4.5, side, edge: side === "left" ? 0 : W, safeX: side === "left" ? 245 : W - 245 };
  } else if (type === "acid") {
    disaster = { type, timer: 0, duration: 5, drops: [] };
    for (let i = 0; i < 80; i++) {
      disaster.drops.push({ x: Math.random() * W, y: Math.random() * H, speed: 180 + Math.random() * 260 });
    }
  } else {
    disaster = { type, timer: 0, duration: 5 };
    for (let i = 0; i < 12; i++) {
      hazardObjects.push({
        x: 70 + Math.random() * (W - 140),
        y: -Math.random() * 520 - 20,
        speed: 200 + Math.random() * 180,
        radius: 13 + Math.random() * 15,
        hit: false
      });
    }
  }
}

function updateDisasters(dt) {
  if (!disaster) {
    if (disasterWarning > 0) {
      disasterWarning -= dt;
      if (disasterWarning <= 0) startDisaster(disasterTypeNext);
    } else {
      disasterCooldown -= dt;
      if (disasterCooldown <= 0) {
        const types = ["volcano", "acid", "rocks"];
        disasterTypeNext = types[Math.floor(Math.random() * types.length)];
        disasterWarning = 2;
        disasterCooldown = 8 + Math.random() * 4;
        message = disasterTypeNext === "volcano" ? "WARNING: VOLCANO ERUPTION SOON!" :
          disasterTypeNext === "acid" ? "WARNING: ACID RAIN SOON! FIND COVER!" :
          "WARNING: FALLING ROCKS SOON!";
        messageTimer = 2;
      }
    }
    return;
  }

  disaster.timer += dt;

  if (disaster.type === "volcano") {
    for (const f of fighters) {
      const inDanger = disaster.side === "left" ? f.x < 225 : f.x > W - 225;
      if (inDanger && f.y > 365) damageFromDisaster(f, 18 * dt, disaster.side === "left" ? 100 * dt : -100 * dt);
    }
  } else if (disaster.type === "acid") {
    for (const drop of disaster.drops) {
      drop.y += drop.speed * dt;
      if (drop.y > H + 10) {
        drop.y = -Math.random() * 80;
        drop.x = Math.random() * W;
      }
    }

    for (const f of fighters) {
      const covered = platforms.some(p =>
        f.x > p.x - 5 && f.x < p.x + p.w + 5 &&
        f.y - 83 >= p.y + p.h - 4
      );
      if (covered) {
        f.safeFlash = Math.max(f.safeFlash, 0.04);
      } else {
        damageFromDisaster(f, 9 * dt);
      }
    }
  } else if (disaster.type === "rocks") {
    for (const rock of hazardObjects) {
      rock.y += rock.speed * dt;
      if (!rock.hit) {
        for (const f of fighters) {
          if (Math.abs(f.x - rock.x) < rock.radius + 17 && Math.abs((f.y - 35) - rock.y) < rock.radius + 22) {
            rock.hit = true;
            damageFromDisaster(f, 15, f.x < rock.x ? -120 : 120);
          }
        }
      }
    }
    hazardObjects = hazardObjects.filter(rock => rock.y < H + 60 && !rock.hit);
  }

  if (disaster && disaster.timer >= disaster.duration) {
    disaster = null;
    disasterCooldown = 6 + Math.random() * 4;
    hazardObjects = [];
    message = "DISASTER OVER! KEEP FIGHTING!";
    messageTimer = 1.6;
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
  const moving = Math.abs(f.vx) > 15 && running;
  const step = moving ? Math.sin(f.walk) * 12 : 0;
  const color = f.hurt > 0 ? "#ffffff" : f.color;
  const x = f.x;
  const y = f.y;
  const face = f.facing;
  const headY = y - 83;
  const power = getPower(f);

  ctx.fillStyle = "#00000028";
  ctx.beginPath();
  ctx.ellipse(x, f.onPlatform ? y + 3 : floorY + 3, 25, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  if (power === "jetpack") {
    ctx.fillStyle = "#53616c";
    ctx.fillRect(x - 19, y - 67, 9, 24);
    if (keys.has(f.id === 1 ? " " : "enter") && f.jetFuel > 0) {
      ctx.fillStyle = "#70e8ff";
      ctx.beginPath();
      ctx.moveTo(x - 15, y - 42);
      ctx.lineTo(x - 22, y - 22);
      ctx.lineTo(x - 10, y - 29);
      ctx.closePath();
      ctx.fill();
    }
  }

  drawLine(x, y - 35, x - 11 + step, y - 4, 7, color);
  drawLine(x, y - 35, x + 12 - step, y - 4, 7, color);
  drawLine(x, y - 65, x, y - 34, 8, color);
  drawLine(x, y - 59, x - face * 17, y - 43, 6, color);

  if (f.punch > 0) {
    const progress = Math.sin((1 - f.punch / 0.26) * Math.PI);
    const elbowX = x + face * (13 + progress * 13);
    const handX = x + face * (25 + progress * 48);
    const handY = y - 55;
    drawLine(x, y - 60, elbowX, y - 57, 6, color);
    drawLine(elbowX, y - 57, handX, handY, 6, color);
    circle(handX, handY, 6, color);
    if (power === "katana") {
      drawLine(handX, handY - 3, handX + face * 35, handY - 30, 5, "#e8eef5");
      drawLine(handX, handY - 3, handX + face * 35, handY - 30, 2, "#5a6878");
    }
  } else {
    drawLine(x, y - 59, x + face * 17, y - 47, 6, color);
    circle(x + face * 18, y - 46, 4, color);
  }

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
    for (let x = 35; x < W; x += 115) ctx.fillRect(x, 35, 8, 75);
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
  ctx.strokeStyle = selectedArena === "ice" ? "#90c7d8" : "#ffffff28";
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

  drawPlatforms();
}

function drawPlatforms() {
  for (let i = 0; i < platforms.length; i++) {
    const p = platforms[i];
    const color = selectedArena === "ice" ? "#effcff" :
      selectedArena === "rooftop" ? "#f77ba8" :
      selectedArena === "desert" ? "#f4d19b" : "#e6d4b6";
    ctx.fillStyle = "#18202c55";
    ctx.fillRect(p.x + 4, p.y + 7, p.w, p.h);
    ctx.fillStyle = color;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = "#ffffffaa";
    ctx.fillRect(p.x, p.y, p.w, 3);
    ctx.fillStyle = "#20263066";
    for (let x = p.x + 12; x < p.x + p.w; x += 26) ctx.fillRect(x, p.y + 5, 12, 3);
  }
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
  const symbols = { katana: "K", gun: "G", laser: "L", strong: "P", jetpack: "J" };
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

function drawDisaster() {
  if (selectedMode !== "disasters") return;

  if (disasterWarning > 0) {
    ctx.save();
    ctx.fillStyle = "#111722d9";
    ctx.fillRect(245, 78, 510, 42);
    ctx.strokeStyle = "#ffd15c";
    ctx.lineWidth = 2;
    ctx.strokeRect(245, 78, 510, 42);
    ctx.fillStyle = "#fff0b5";
    ctx.font = "bold 17px Arial";
    ctx.textAlign = "center";
    const label = disasterTypeNext === "volcano" ? "VOLCANO INCOMING — MOVE AWAY!" :
      disasterTypeNext === "acid" ? "ACID RAIN INCOMING — FIND COVER!" :
      "FALLING ROCKS INCOMING — KEEP MOVING!";
    ctx.fillText(label, W / 2, 104);
    ctx.restore();
  }

  if (!disaster) return;
  ctx.save();

  if (disaster.type === "volcano") {
    const left = disaster.side === "left";
    const dangerWidth = 225;
    const gradient = ctx.createLinearGradient(left ? 0 : W - dangerWidth, 0, left ? dangerWidth : W, 0);
    gradient.addColorStop(0, "#ff2c1fdd");
    gradient.addColorStop(1, "#ff8b20aa");
    ctx.fillStyle = gradient;
    ctx.fillRect(left ? 0 : W - dangerWidth, 0, dangerWidth, H);
    ctx.fillStyle = "#ffcb45";
    for (let i = 0; i < 22; i++) {
      const x = left ? Math.random() * dangerWidth : W - Math.random() * dangerWidth;
      const y = (i * 37 + disaster.timer * 210) % 400;
      circle(x, y, 3 + (i % 4), "#ffbd46");
    }
    ctx.fillStyle = "#fff1c4";
    ctx.font = "bold 15px Arial";
    ctx.textAlign = "center";
    ctx.fillText(left ? "LAVA! RUN RIGHT!" : "LAVA! RUN LEFT!", left ? 112 : W - 112, 155);
  }

  if (disaster.type === "acid") {
    ctx.fillStyle = "#7dff5570";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#d4ff74";
    ctx.lineWidth = 2;
    for (const drop of disaster.drops) {
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - 4, drop.y + 12);
      ctx.stroke();
    }
    ctx.fillStyle = "#f2ffad";
    ctx.font = "bold 15px Arial";
    ctx.textAlign = "center";
    ctx.fillText("ACID RAIN — STAY UNDER A PLATFORM!", W / 2, 150);
  }

  if (disaster.type === "rocks") {
    for (const rock of hazardObjects) {
      circle(rock.x, rock.y, rock.radius + 3, "#4a3b32");
      circle(rock.x - 3, rock.y - 3, rock.radius, "#81776c");
      circle(rock.x - 6, rock.y - 7, Math.max(3, rock.radius * 0.25), "#b6a99a");
    }
    ctx.fillStyle = "#fff1d4";
    ctx.font = "bold 15px Arial";
    ctx.textAlign = "center";
    ctx.fillText("FALLING ROCKS — DODGE!", W / 2, 150);
  }

  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawBackground();
  if (item) drawItem();
  drawProjectiles();
  drawDisaster();
  fighters.forEach(drawFighter);

  if (messageTimer > 0) {
    ctx.fillStyle = "#111722cc";
    ctx.fillRect(220, 35, 560, 34);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px Arial";
    ctx.textAlign = "center";
    ctx.fillText(message, W / 2, 57);
  }

  if (selectedMode === "items" && running && !item) {
    ctx.fillStyle = "#ffffffbb";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("ITEMS SPAWN DURING THE FIGHT", W / 2, 25);
  }

  if (selectedMode === "disasters" && running && !disaster && disasterWarning <= 0) {
    ctx.fillStyle = "#ffffffbb";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("WATCH FOR DISASTER WARNINGS", W / 2, 25);
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
