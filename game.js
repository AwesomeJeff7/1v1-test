const ores = [
    { name: "Stone", icon: "🪨", value: 1, weight: 4000 },
    { name: "Coal", icon: "⚫", value: 3, weight: 2500 },
    { name: "Copper", icon: "🟠", value: 8, weight: 1500 },
    { name: "Iron", icon: "🔩", value: 15, weight: 1000 },
    { name: "Silver", icon: "🥈", value: 40, weight: 500 },
    { name: "Gold", icon: "🥇", value: 100, weight: 300 },
    { name: "Ruby", icon: "♦️", value: 250, weight: 150 },
    { name: "Sapphire", icon: "🔷", value: 500, weight: 80 },
    { name: "Emerald", icon: "💚", value: 1000, weight: 40 },
    { name: "Amethyst", icon: "💜", value: 2500, weight: 20 },
    { name: "Obsidian", icon: "⬛", value: 5000, weight: 10 },
    { name: "Mythril", icon: "🌟", value: 12000, weight: 5 },
    { name: "Uranium", icon: "☢️", value: 30000, weight: 3 },
    { name: "Voidium", icon: "🌌", value: 100000, weight: 1 },
    { name: "Celestium", icon: "✨", value: 500000, weight: 0.1 },
    { name: "Infinityte", icon: "♾️", value: 2500000, weight: 0.02 },
    { name: "Airium", icon: "💨", value: 10000000, weight: 0.008 },
    { name: "Eternium", icon: "⏳", value: 25000000, weight: 0.001 },
    { name: "Chronium", icon: "⌛", value: 50000000, weight: 0.0006 },
    { name: "Godlyte", icon: "☀️", value: 100000000, weight: 0.000001 },
    { name: "Omnium", icon: "🔮", value: 250000000, weight: 0.0000004 },
    { name: "Dimensionite", icon: "🌀", value: 500000000, weight: 0.0000002 },
    { name: "Celestialium", icon: "🌠", value: 1000000000, weight: 0.0000001 },
    { name: "Nullium", icon: "⚫", value: 2500000000, weight: 0.00000004 },
    { name: "Transcendium", icon: "💠", value: 5000000000, weight: 0.00000003 },
    { name: "Omnithium", icon: "👑", value: 10000000000, weight: 0.00000002 }
];

const zones = [
    {
        name: "Grasslands Mine",
        description: "A peaceful mine filled with common ores.",
        cost: 0,
        ores: [0, 1, 2, 3, 4, 5, 6]
    },
    {
        name: "Stone Caverns",
        description: "Dark caverns containing valuable minerals.",
        cost: 5000,
        ores: [0,1, 2, 3, 4, 5, 6, 7, 8, 9]
    },
    {
        name: "Crystal Caves",
        description: "Glowing caves filled with precious crystals.",
        cost: 50000,
        ores: [2,3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    },
    {
        name: "Frozen Depths",
        description: "A frozen underground world hiding strange minerals.",
        cost: 250000,
        ores: [5, 6, 7, 8, 9, 10, 11, 12, 13]
    },
    {
        name: "Magma Caverns",
        description: "Volcanic tunnels filled with rare treasures.",
        cost: 1500000,
        ores: [6,7, 8, 9, 10, 11, 12, 13, 14]
    },
    {
        name: "Ancient Ruins",
        description: "An ancient civilization hiding powerful minerals.",
        cost: 10000000,
        ores: [8,9, 10, 11, 12, 13, 14, 15]
    },
    {
        name: "Shadow Abyss",
        description: "The deepest mine, containing the rarest discoveries.",
        cost: 100000000,
        ores: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]
    }
];

const defaultGame = {
    money: 0,
    power: 1,
    speed: 1,
    luck: 0,
    sellLevel: 0,
    doubleLevel: 0,
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
let toastTimeout;

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

function luckCost() {
    return Math.floor(250 * Math.pow(1.9, game.luck));
}

function sellUpgradeCost() {
    return Math.floor(300 * Math.pow(1.9, game.sellLevel));
}

function doubleCost() {
    return Math.floor(500 * Math.pow(2, game.doubleLevel));
}

function cooldownTime() {
    return Math.max(0.2, 1.2 - (game.speed - 1) * 0.1);
}

function rebirthRequirement() {
    const costs = [
        1000000,
        50000000,
        200000000,
        3000000000,
        50000000000,
        750000000000,
        11000000000000
    ];

    return costs[game.rebirths] ?? costs[costs.length - 1] * Math.pow(15, game.rebirths - costs.length + 1);
}

function rebirthMultiplier() {
    return Math.pow(2, game.rebirths);
}

function sellMultiplier() {
    return 1 + game.sellLevel * 0.25;
}

function doubleChance() {
    return Math.min(game.doubleLevel * 0.05, 0.5);
}

function getLuckMultiplier(oreIndex) {
    return 1 + Math.min(game.luck, 20) * oreIndex * 0.08;
}

function saveGame() {
    try {
        localStorage.setItem("miningEmpireSave", JSON.stringify(game));
    } catch (error) {
        console.error("Save failed:", error);
    }
}

function loadGame() {
    try {
        const saved = JSON.parse(localStorage.getItem("miningEmpireSave"));

        if (!saved || typeof saved !== "object") return;

        game = {
            ...defaultGame,
            ...saved,
            unlockedZones: Array.isArray(saved.unlockedZones) ? saved.unlockedZones : [0],
            discovered: Array.isArray(saved.discovered) ? saved.discovered : [],
            inventory: saved.inventory && typeof saved.inventory === "object" ? saved.inventory : {},
            recentDrops: Array.isArray(saved.recentDrops) ? saved.recentDrops : []
        };

        game.zone = Math.max(0, Math.min(game.zone, zones.length - 1));
        game.luck = Math.max(0, Math.min(20, Number(game.luck) || 0));

        game.unlockedZones = [...new Set([0, ...game.unlockedZones])]
            .filter(index => Number.isInteger(index) && index >= 0 && index < zones.length);

        if (!game.unlockedZones.includes(game.zone)) {
            game.zone = 0;
        }

        game.discovered = [...new Set(game.discovered)]
            .filter(index => Number.isInteger(index) && index >= 0 && index < ores.length);

        game.bestOreIndex = Number.isInteger(game.bestOreIndex) ? game.bestOreIndex : -1;

        if (game.bestOreIndex < 0 && game.discovered.length > 0) {
            game.bestOreIndex = Math.max(...game.discovered);
        }

        for (const key of Object.keys(game.inventory)) {
            const index = Number(key);
            const amount = Number(game.inventory[key]);

            if (!Number.isInteger(index) || index < 0 || index >= ores.length || !Number.isFinite(amount) || amount <= 0) {
                delete game.inventory[key];
            } else {
                game.inventory[key] = Math.floor(amount);
            }
        }
    } catch (error) {
        console.error("Could not load save:", error);
        game = { ...defaultGame };
    }
}

function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 2300);
}

function getInventoryCount() {
    return Object.values(game.inventory).reduce((total, amount) => {
        return total + Number(amount || 0);
    }, 0);
}

function getInventoryValue() {
    let total = 0;

    for (const [key, amount] of Object.entries(game.inventory)) {
        const index = Number(key);
        const ore = ores[index];

        if (ore) {
            total += ore.value * Number(amount || 0);
        }
    }

    return total;
}

function getAvailableOres() {
    return zones[game.zone].ores.map(index => ({
        ore: ores[index],
        index
    }));
}

function getRandomOre() {
    const available = getAvailableOres();

    const weightedOres = available.map(item => ({
        ...item,
        weight: item.ore.weight * getLuckMultiplier(item.index)
    }));

    const totalWeight = weightedOres.reduce((sum, item) => sum + item.weight, 0);

    let roll = Math.random() * totalWeight;

    for (const item of weightedOres) {
        roll -= item.weight;

        if (roll <= 0) {
            return item;
        }
    }

    return weightedOres[weightedOres.length - 1];
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

function checkBestOre(index) {
    if (game.bestOreIndex < 0 || ores[index].value > ores[game.bestOreIndex].value) {
        game.bestOreIndex = index;
        showToast("New best ore found: " + ores[index].name + "!");
    }
}

function mine() {
    if (Date.now() < mineReadyAt) return;

    mineReadyAt = Date.now() + cooldownTime() * 1000;

    const amount = Math.min(game.power, 20);
    const drops = [];

    for (let i = 0; i < amount; i++) {
        const result = getRandomOre();
        const index = result.index;

        const extraDrop = Math.random() < doubleChance() ? 2 : 1;
        game.inventory[index] = (game.inventory[index] || 0) + extraDrop;

        if (!game.discovered.includes(index)) {
            game.discovered.push(index);
        }

        checkBestOre(index);

        drops.push({
            index,
            amount: extraDrop
        });
    }

    game.blocks += amount;
    game.recentDrops = drops.slice(-6);

    const summary = drops.map(drop => {
        const ore = ores[drop.index];
        return ore.icon + " " + ore.name + (drop.amount > 1 ? " x" + drop.amount : "");
    });

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

    const progress = ready ? 100 : (1 - remaining / total) * 100;
    $("cooldownFill").style.width = progress + "%";

    $("cooldownText").textContent = ready
        ? "Ready to mine!"
        : "Next mine in " + (remaining / 1000).toFixed(1) + "s";
}

function buyUpgrade(type) {
    let cost;
    let levelName;
    let maxed = false;

    switch (type) {
        case "power":
            cost = powerCost();
            levelName = "Pickaxe Power";
            break;

        case "speed":
            cost = speedCost();
            levelName = "Mining Speed";
            maxed = cooldownTime() <= 0.2;
            break;

        case "luck":
            cost = luckCost();
            levelName = "Ore Luck";
            maxed = game.luck >= 20;
            break;

        case "sell":
            cost = sellUpgradeCost();
            levelName = "Ore Value";
            break;

        case "double":
            cost = doubleCost();
            levelName = "Double Drops";
            maxed = doubleChance() >= 0.5;
            break;

        default:
            return;
    }

    if (maxed) {
        showToast(levelName + " is already maxed!");
        return;
    }

    if (game.money < cost) {
        showToast("You need " + moneyText(cost - game.money) + " more!");
        return;
    }

    game.money -= cost;

    if (type === "power") game.power++;
    if (type === "speed") game.speed++;
    if (type === "luck") game.luck = Math.min(20, game.luck + 1);
    if (type === "sell") game.sellLevel++;
    if (type === "double") game.doubleLevel++;

    showToast(levelName + " upgraded!");
    render();
    saveGame();
}

function sellAll() {
    const count = getInventoryCount();
    const baseValue = getInventoryValue();

    if (count <= 0 || baseValue <= 0) {
        showToast("Your inventory is empty!");
        return;
    }

    const earnings = Math.floor(
        baseValue * sellMultiplier() * rebirthMultiplier()
    );

    if (!Number.isFinite(earnings) || earnings <= 0) {
        showToast("Could not calculate your sale. Try again.");
        return;
    }

    game.money += earnings;
    game.inventory = {};

    render();
    saveGame();

    showToast("Sold " + formatNumber(count) + " ores for " + moneyText(earnings) + "!");
}

function unlockZone(index) {
    const zone = zones[index];

    if (!zone) return;

    if (game.unlockedZones.includes(index)) {
        game.zone = index;
        render();
        saveGame();
        showToast("Traveled to " + zone.name + "!");
        return;
    }

    if (game.money < zone.cost) {
        showToast("You need " + moneyText(zone.cost - game.money) + " more to unlock this area!");
        return;
    }

    game.money -= zone.cost;
    game.unlockedZones.push(index);
    game.zone = index;

    render();
    saveGame();

    showToast("Unlocked " + zone.name + "!");
}

function rebirth() {
    const requirement = rebirthRequirement();

    if (game.money < requirement) {
        showToast("You need " + moneyText(requirement - game.money) + " more!");
        return;
    }

    const confirmed = confirm(
        "Rebirth now?\n\nYou will lose your money, upgrades, inventory, and unlocked areas.\n\nYour discoveries and best ore will stay."
    );

    if (!confirmed) return;

    game.rebirths++;
    game.money = 0;
    game.power = 1;
    game.speed = 1;
    game.luck = 0;
    game.sellLevel = 0;
    game.doubleLevel = 0;
    game.blocks = 0;
    game.zone = 0;
    game.unlockedZones = [0];
    game.inventory = {};
    game.recentDrops = [];

    mineReadyAt = 0;

    render();
    saveGame();

    showToast("Rebirth complete! Your money multiplier is now x" + formatNumber(rebirthMultiplier()) + "!");
}

function renderBestOre() {
    const container = $("bestOre");

    if (game.bestOreIndex < 0 || !ores[game.bestOreIndex]) {
        container.textContent = "No ores discovered yet!";
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

function renderRecentDrops() {
    const container = $("recentDrops");
    container.innerHTML = "";

    game.recentDrops.forEach(drop => {
        const index = typeof drop === "number" ? drop : drop.index;
        const amount = typeof drop === "number" ? 1 : drop.amount;
        const ore = ores[index];

        if (!ore) return;

        const chip = document.createElement("div");
        chip.className = "drop-chip";
        chip.textContent = ore.icon + " " + ore.name + (amount > 1 ? " x" + amount : "");

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
        cost.textContent = unlocked
            ? "Unlocked"
            : "Unlock Cost: " + moneyText(zone.cost);

        const oreNames = zone.ores.map(oreIndex => ores[oreIndex].name);
        const contents = document.createElement("p");
        contents.textContent = "Possible ores: " + oreNames.join(", ");

        const button = document.createElement("button");
        button.className = "primary-button";

        if (selected) {
            button.textContent = "Current Area";
            button.disabled = true;
        } else if (unlocked) {
            button.textContent = "Travel";
        } else {
            button.textContent = "Unlock";
            button.disabled = game.money < zone.cost;
        }

        button.addEventListener("click", () => unlockZone(index));

        card.append(title, description, cost, contents, button);
        container.appendChild(card);
    });
}

function renderOreIndex() {
    const container = $("oreIndex");
    container.innerHTML = "";

    const discoveredCount = game.discovered.length;

    $("collectionText").textContent =
        discoveredCount + " / " + ores.length + " ores discovered";

    $("collectionProgress").style.width =
        (discoveredCount / ores.length * 100) + "%";

    const available = getAvailableOres();
    const totalWeight = available.reduce((sum, item) => {
        return sum + item.ore.weight * getLuckMultiplier(item.index);
    }, 0);

    ores.forEach((ore, index) => {
        const discovered = game.discovered.includes(index);
        const isAvailable = zones[game.zone].ores.includes(index);

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

        if (isAvailable) {
            const effectiveWeight = ore.weight * getLuckMultiplier(index);
            const oneIn = Math.max(1, Math.round(totalWeight / effectiveWeight));
            chance.textContent = "Current area: 1 in " + formatNumber(oneIn);
        } else {
            chance.textContent = "Not in this area";
        }

        card.append(icon, name, rarity, value, chance);
        container.appendChild(card);
    });
}

function renderUpgrades() {
    $("powerLevel").textContent = game.power;
    $("powerAmount").textContent = Math.min(game.power, 20);
    $("powerCost").textContent = moneyText(powerCost());
    $("powerButton").disabled = game.money < powerCost();

    $("speedLevel").textContent = game.speed;
    $("speedCooldown").textContent = cooldownTime().toFixed(1) + "s";
    $("speedCost").textContent = cooldownTime() <= 0.2 ? "MAXED" : moneyText(speedCost());
    $("speedButton").disabled = game.money < speedCost() || cooldownTime() <= 0.2;

    $("luckLevel").textContent = game.luck;
    $("luckBonus").textContent = "+" + (game.luck * 10) + "%";
    $("luckCost").textContent = game.luck >= 20 ? "MAXED" : moneyText(luckCost());
    $("luckButton").disabled = game.money < luckCost() || game.luck >= 20;

    $("sellLevel").textContent = game.sellLevel;
    $("sellBonus").textContent = "+" + (game.sellLevel * 25) + "%";
    $("sellCost").textContent = moneyText(sellUpgradeCost());
    $("sellUpgradeButton").disabled = game.money < sellUpgradeCost();

    $("doubleLevel").textContent = game.doubleLevel;
    $("doubleChance").textContent = (doubleChance() * 100).toFixed(0) + "%";
    $("doubleCost").textContent = doubleChance() >= 0.5 ? "MAXED" : moneyText(doubleCost());
    $("doubleButton").disabled = game.money < doubleCost() || doubleChance() >= 0.5;
}

function render() {
    $("money").textContent = moneyText(game.money);
    $("power").textContent = game.power;
    $("blocks").textContent = formatNumber(game.blocks);
    $("zoneName").textContent = zones[game.zone].name;
    $("zoneDescription").textContent = zones[game.zone].description;
    $("zoneLevel").textContent = "Area " + (game.zone + 1);

    $("multiplier").textContent = "x" + formatNumber(rebirthMultiplier());

    $("inventoryValue").textContent = moneyText(getInventoryValue());
    $("oreCount").textContent = formatNumber(getInventoryCount());

    $("rebirthCount").textContent = game.rebirths;
    $("rebirthMultiplier").textContent = "x" + formatNumber(rebirthMultiplier());
    $("rebirthRequirement").textContent = moneyText(rebirthRequirement());

    $("rebirthButton").disabled = game.money < rebirthRequirement();

    $("rebirthStatus").textContent = game.money >= rebirthRequirement()
        ? "You can rebirth now!"
        : "You need " + moneyText(rebirthRequirement() - game.money) + " more.";

    renderUpgrades();
    renderRecentDrops();
    renderBestOre();
    renderZones();
    renderOreIndex();
    updateCooldown();
}

function setupTabs() {
    document.querySelectorAll(".tab-button").forEach(button => {
        button.addEventListener("click", () => {
            document.querySelectorAll(".tab-button").forEach(tab => {
                tab.classList.remove("active");
            });

            document.querySelectorAll(".page").forEach(page => {
                page.classList.remove("active");
            });

            button.classList.add("active");
            $(button.dataset.tab).classList.add("active");
        });
    });
}

$("mineButton").addEventListener("click", mine);
$("mineBlock").addEventListener("click", mine);
$("sellButton").addEventListener("click", sellAll);
$("powerButton").addEventListener("click", () => buyUpgrade("power"));
$("speedButton").addEventListener("click", () => buyUpgrade("speed"));
$("luckButton").addEventListener("click", () => buyUpgrade("luck"));
$("sellUpgradeButton").addEventListener("click", () => buyUpgrade("sell"));
$("doubleButton").addEventListener("click", () => buyUpgrade("double"));
$("rebirthButton").addEventListener("click", rebirth);

loadGame();
setupTabs();
render();

setInterval(updateCooldown, 50);
setInterval(saveGame, 10000);
window.addEventListener("beforeunload", saveGame);
