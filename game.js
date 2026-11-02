
const ores = [
    { name: "Stone", icon: "🪨", value: 1, weight: 4000, zone: 0 },
    { name: "Coal", icon: "⚫", value: 3, weight: 2500, zone: 0 },
    { name: "Copper", icon: "🟠", value: 8, weight: 1500, zone: 0 },
    { name: "Iron", icon: "🔩", value: 15, weight: 1000, zone: 0 },
    { name: "Silver", icon: "🥈", value: 40, weight: 500, zone: 0 },
    { name: "Gold", icon: "🪙", value: 100, weight: 300, zone: 0 },
    { name: "Ruby", icon: "♦️", value: 250, weight: 150, zone: 0 },
    { name: "Sapphire", icon: "🔷", value: 500, weight: 80, zone: 0 },
    { name: "Emerald", icon: "💚", value: 1000, weight: 40, zone: 0 },
    { name: "Amethyst", icon: "💜", value: 2500, weight: 20, zone: 0 },
    { name: "Obsidian", icon: "⬛", value: 5000, weight: 10, zone: 1 },
    { name: "Mythril", icon: "🌟", value: 12000, weight: 5, zone: 1 },
    { name: "Uranium", icon: "☢️", value: 30000, weight: 3, zone: 2 },
    { name: "Voidium", icon: "🌌", value: 100000, weight: 1, zone: 3 },
    { name: "Celestium", icon: "✨", value: 500000, weight: 0.5, zone: 4 },
    { name: "Infinityte", icon: "♾️", value: 2500000, weight: 0.1, zone: 5 }
];

const zones = [
    { name: "Grasslands Mine", description: "A peaceful mine filled with common ores.", cost: 0, minOre: 0, maxOre: 9 },
    { name: "Stone Caverns", description: "Dark caverns containing valuable minerals.", cost: 5000, minOre: 0, maxOre: 11 },
    { name: "Crystal Caves", description: "Glowing caves filled with precious crystals.", cost: 25000, minOre: 2, maxOre: 12 },
    { name: "Frozen Depths", description: "A frozen underground world hiding strange minerals.", cost: 100000, minOre: 4, maxOre: 13 },
    { name: "Magma Caverns", description: "Dangerous volcanic tunnels with rare treasures.", cost: 500000, minOre: 6, maxOre: 14 },
    { name: "Ancient Ruins", description: "An ancient underground civilization.", cost: 2500000, minOre: 8, maxOre: 15 },
    { name: "Shadow Abyss", description: "The deepest and rarest mining area.", cost: 10000000, minOre: 10, maxOre: 15 }
];

const defaultGame = {
    money: 0,
    power: 1,
    speed: 1,
    blocks: 0,
    zone: 0,
    unlockedZones: [0],
    inventory: {},
    discovered: [],
    bestOreIndex: -1,
    rebirths: 0,
    recentDrops: []
};

let game = { ...defaultGame };

let mineReadyAt = 0;
let toastTimeout = null;

const $ = id => document.getElementById(id);

function formatNumber(number) {
    if (number >= 1e12) return (number / 1e12).toFixed(2) + "T";
    if (number >= 1e9) return (number / 1e9).toFixed(2) + "B";
    if (number >= 1e6) return (number / 1e6).toFixed(2) + "M";
    if (number >= 1e3) return (number / 1e3).toFixed(2) + "K";
    return Math.floor(number).toLocaleString();
}

function moneyText(amount) {
    return "$" + formatNumber(amount);
}

function powerCost() {
    return Math.floor(50 * Math.pow(1.65, game.power - 1));
}

function speedCost() {
    return Math.floor(100 * Math.pow(1.8, game.speed - 1));
}

function cooldownTime() {
    return Math.max(0.2, 1.2 - (game.speed - 1) * 0.1);
}

function rebirthRequirement() {
    return 1000000 * Math.pow(10, game.rebirths);
}

function moneyMultiplier() {
    return Math.pow(2, game.rebirths);
}

function saveGame() {
    localStorage.setItem("miningEmpireSave", JSON.stringify(game));
}

function loadGame() {
    try {
        const saved = JSON.parse(localStorage.getItem("miningEmpireSave"));

        if (saved) {
            game = {
                ...defaultGame,
                ...saved,
                unlockedZones: Array.isArray(saved.unlockedZones) ? saved.unlockedZones : [0],
                discovered: Array.isArray(saved.discovered) ? saved.discovered : [],
                inventory: saved.inventory || {},
                recentDrops: Array.isArray(saved.recentDrops) ? saved.recentDrops : []
            };
        }
    } catch (error) {
        console.error("Could not load save:", error);
    }
}

function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}

function getInventoryCount() {
    return Object.values(game.inventory).reduce((total, amount) => total + amount, 0);
}

function getInventoryValue() {
    return Object.entries(game.inventory).reduce((total, [index, amount]) => {
        return total + ores[Number(index)].value * amount;
    }, 0);
}

function getZoneOres() {
    const zone = zones[game.zone];

    return ores.filter(ore => ore.zone >= zone.minOre && ore.zone <= zone.maxOre);
}

function getRandomOre() {
    const available = getZoneOres();
    const totalWeight = available.reduce((sum, ore) => sum + ore.weight, 0);

    let roll = Math.random() * totalWeight;

    for (const ore of available) {
        roll -= ore.weight;
        if (roll <= 0) return ore;
    }

    return available[available.length - 1];
}

function checkBestOre(ore) {
    const index = ores.indexOf(ore);

    if (index > game.bestOreIndex) {
        game.bestOreIndex = index;
        showToast("New best ore ever found: " + ore.name + "!");
    }
}

function mine() {
    if (Date.now() < mineReadyAt) return;

    mineReadyAt = Date.now() + cooldownTime() * 1000;

    const amount = Math.min(game.power, 10);
    const drops = [];

    for (let i = 0; i < amount; i++) {
        const ore = getRandomOre();
        const index = ores.indexOf(ore);

        game.inventory[index] = (game.inventory[index] || 0) + 1;

        if (!game.discovered.includes(index)) {
            game.discovered.push(index);
        }

        checkBestOre(ore);
        drops.push(ore);
    }

    game.blocks += amount;
    game.recentDrops = drops.slice(-5).map(ore => ores.indexOf(ore));

    const summary = drops.map(ore => ore.icon + " " + ore.name);
    $("dropNotification").textContent = summary.join("  •  ");
    $("mineText").textContent = "You mined " + amount + (amount === 1 ? " block." : " blocks.");

    render();
    saveGame();
}

function updateCooldown() {
    const remaining = Math.max(0, mineReadyAt - Date.now());
    const total = cooldownTime() * 1000;
    const ready = remaining <= 0;

    $("mineButton").disabled = !ready;
    $("mineBlock").disabled = !ready;

    $("cooldownFill").style.width = (ready ? 100 : (1 - remaining / total) * 100) + "%";

    $("cooldownText").textContent = ready
        ? "Ready to mine!"
        : "Next mine in " + (remaining / 1000).toFixed(1) + "s";
}

function buyPower() {
    const cost = powerCost();

    if (game.money < cost) {
        showToast("Not enough money!");
        return;
    }

    game.money -= cost;
    game.power++;

    showToast("Pickaxe power upgraded!");
    render();
    saveGame();
}

function buySpeed() {
    if (cooldownTime() <= 0.2) {
        showToast("Mining speed is already maxed!");
        return;
    }

    const cost = speedCost();

    if (game.money < cost) {
        showToast("Not enough money!");
        return;
    }

    game.money -= cost;
    game.speed++;

    showToast("Mining speed upgraded!");
    render();
    saveGame();
}

function sellAll() {
    const value = getInventoryValue();

    if (value <= 0) {
        showToast("You have no ores to sell!");
        return;
    }

    const earnings = value * moneyMultiplier();

    game.money += earnings;
    game.inventory = {};

    showToast("Sold ores for " + moneyText(earnings) + "!");
    render();
    saveGame();
}

function unlockZone(index) {
    const zone = zones[index];

    if (game.unlockedZones.includes(index)) {
        game.zone = index;
        render();
        saveGame();
        return;
    }

    if (game.money < zone.cost) {
        showToast("Not enough money to unlock this area!");
        return;
    }

    game.money -= zone.cost;
    game.unlockedZones.push(index);
    game.zone = index;

    showToast("Unlocked " + zone.name + "!");
    render();
    saveGame();
}

function rebirth() {
    const requirement = rebirthRequirement();

    if (game.money < requirement) {
        showToast("You need " + moneyText(requirement) + " to rebirth!");
        return;
    }

    if (!confirm("Rebirth? This resets your money, upgrades, inventory and area unlocks. Your discoveries and best ore will stay.")) {
        return;
    }

    game.rebirths++;
    game.money = 0;
    game.power = 1;
    game.speed = 1;
    game.blocks = 0;
    game.zone = 0;
    game.unlockedZones = [0];
    game.inventory = {};

    mineReadyAt = 0;

    showToast("Rebirth complete! Permanent multiplier increased!");
    render();
    saveGame();
}

function renderBestOre() {
    const container = $("bestOre");

    if (game.bestOreIndex < 0) {
        container.textContent = "No rare ores discovered yet!";
        return;
    }

    const ore = ores[game.bestOreIndex];

    container.innerHTML = `
        <div class="best-ore-display">
            <div class="best-ore-icon">${ore.icon}</div>
            <div>
                <div class="best-ore-name">${ore.name}</div>
                <div class="best-ore-details">
                    Value: ${moneyText(ore.value)}<br>
                    Rarity: ${getRarity(ore)}
                </div>
            </div>
        </div>
    `;
}

function getRarity(ore) {
    if (ore.weight <= 0.1) return "Extremely Rare";
    if (ore.weight <= 0.5) return "Legendary";
    if (ore.weight <= 1) return "Mythical";
    if (ore.weight <= 5) return "Epic";
    if (ore.weight <= 20) return "Rare";
    if (ore.weight <= 150) return "Uncommon";
    return "Common";
}

function renderRecentDrops() {
    const container = $("recentDrops");
    container.innerHTML = "";

    game.recentDrops.forEach(index => {
        const ore = ores[index];
        if (!ore) return;

        const chip = document.createElement("div");
        chip.className = "drop-chip";
        chip.textContent = ore.icon + " " + ore.name;
        container.appendChild(chip);
    });
}

function renderZones() {
    const container = $("zones");
    container.innerHTML = "";

    zones.forEach((zone, index) => {
        const unlocked = game.unlockedZones.includes(index);
        const selected = game.zone === index;

        const card = document.createElement("div");
        card.className = "zone-card" + (unlocked ? "" : " locked") + (selected ? " selected" : "");

        const title = document.createElement("h3");
        title.textContent = zone.name;

        const description = document.createElement("p");
        description.textContent = zone.description;

        const cost = document.createElement("p");
        cost.textContent = unlocked ? "Unlocked" : "Unlock Cost: " + moneyText(zone.cost);

        const button = document.createElement("button");
        button.className = "primary-button";
        button.textContent = selected ? "Current Area" : unlocked ? "Travel" : "Unlock";

        button.disabled = selected;
        button.addEventListener("click", () => unlockZone(index));

        card.append(title, description, cost, button);
        container.appendChild(card);
    });
}

function renderOreIndex() {
    const container = $("oreIndex");
    container.innerHTML = "";

    const discoveredCount = game.discovered.length;

    $("collectionText").textContent = discoveredCount + " / " + ores.length + " ores discovered";
    $("collectionProgress").style.width = (discoveredCount / ores.length * 100) + "%";

    const available = getZoneOres();
    const totalWeight = available.reduce((sum, ore) => sum + ore.weight, 0);

    ores.forEach((ore, index) => {
        const discovered = game.discovered.includes(index);

        const card = document.createElement("div");
        card.className = "ore-card" + (discovered ? "" : " undiscovered");

        const icon = document.createElement("div");
        icon.className = "ore-icon";
        icon.textContent = discovered ? ore.icon : "❔";

        const name = document.createElement("div");
        name.className = "ore-name";
        name.textContent = discovered ? ore.name : "???";

        const rarity = document.createElement("div");
        rarity.className = "ore-chance";
        rarity.textContent = discovered ? getRarity(ore) : "Undiscovered";

        const value = document.createElement("div");
        value.className = "ore-value";
        value.textContent = discovered ? "Value: " + moneyText(ore.value) : "Value: ???";

        const chance = document.createElement("div");
        chance.className = "ore-chance";

        if (available.includes(ore)) {
            const oneIn = Math.round(totalWeight / ore.weight);
            chance.textContent = "Current area: 1 in " + Math.max(1, oneIn);
        } else {
            chance.textContent = "Not in this area";
        }

        card.append(icon, name, rarity, value, chance);
        container.appendChild(card);
    });
}

function render() {
    $("money").textContent = moneyText(game.money);
    $("power").textContent = game.power;
    $("blocks").textContent = formatNumber(game.blocks);
    $("zoneName").textContent = zones[game.zone].name;
    $("zoneDescription").textContent = zones[game.zone].description;
    $("zoneLevel").textContent = "Area " + (game.zone + 1);

    $("multiplier").textContent = "x" + formatNumber(moneyMultiplier());
    $("inventoryValue").textContent = moneyText(getInventoryValue());
    $("oreCount").textContent = formatNumber(getInventoryCount());

    $("upgradePower").textContent = game.power;
    $("upgradeCost").textContent = moneyText(powerCost());
    $("upgradeButton").disabled = game.money < powerCost();

    $("speedLevel").textContent = game.speed;
    $("currentCooldown").textContent = cooldownTime().toFixed(1) + "s";
    $("speedCost").textContent = cooldownTime() <= 0.2 ? "MAXED" : moneyText(speedCost());
    $("speedButton").disabled = game.money < speedCost() || cooldownTime() <= 0.2;

    $("rebirthCount").textContent = game.rebirths;
    $("rebirthRequirement").textContent = moneyText(rebirthRequirement());
    $("rebirthButton").disabled = game.money < rebirthRequirement();
    $("rebirthStatus").textContent = game.money >= rebirthRequirement()
        ? "You can rebirth now!"
        : "You need " + moneyText(rebirthRequirement() - game.money) + " more.";

    renderRecentDrops();
    renderBestOre();
    renderZones();
    renderOreIndex();
    updateCooldown();
}

function setupTabs() {
    document.querySelectorAll(".tab-button").forEach(button => {
        button.addEventListener("click", () => {
            document.querySelectorAll(".tab-button").forEach(tab => tab.classList.remove("active"));
            document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));

            button.classList.add("active");
            $(button.dataset.tab).classList.add("active");
        });
    });
}

$("mineButton").addEventListener("click", mine);
$("mineBlock").addEventListener("click", mine);
$("upgradeButton").addEventListener("click", buyPower);
$("speedButton").addEventListener("click", buySpeed);
$("sellButton").addEventListener("click", sellAll);
$("rebirthButton").addEventListener("click", rebirth);

loadGame();
setupTabs();
render();

setInterval(updateCooldown, 50);
