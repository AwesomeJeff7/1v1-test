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
    { name: "Infinityte", icon: "♾️", value: 2500000, weight: 0.09 },
    { name: "Airium", icon: "💨", value: 5000000, weight: 0.01 },
    { name: "Eternium", icon: "🔮", value: 10000000, weight: 0.005 },
    { name: "Chronium", icon: "⌛", value: 25000000, weight: 0.000182 },
    { name: "Godlyte", icon: "🌠", value: 60000000, weight: 0.00000911 },
    { name: "Omnium", icon: "🪐", value: 150000000, weight: 0.00000364 },
    { name: "Dimensionite", icon: "🌀", value: 400000000, weight: 0.00000182 },
    { name: "Celestialium", icon: "🌌", value: 1000000000, weight: 0.000000911 },
    { name: "Nullium", icon: "⚫", value: 3000000000, weight: 0.000000364 },
    { name: "Transcendium", icon: "💎", value: 10000000000, weight: 0.000000182 },
    { name: "Omnithium", icon: "♾️", value: 50000000000, weight: 0.0000000911 }
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
        cost: 500,
        ores: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    },
    {
        name: "Crystal Caves",
        description: "Glowing caves filled with precious crystals.",
        cost: 5000,
        ores: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    },
    {
        name: "Frozen Depths",
        description: "A frozen underground world hiding strange minerals.",
        cost: 25000,
        ores: [5, 6, 7, 8, 9, 10, 11, 12, 13]
    },
    {
        name: "Magma Caverns",
        description: "Volcanic tunnels filled with rare treasures.",
        cost: 150000,
        ores: [7, 8, 9, 10, 11, 12, 13, 14]
    },
    {
        name: "Ancient Ruins",
        description: "An ancient civilization hiding powerful minerals.",
        cost: 1000000,
        ores: [9, 10, 11, 12, 13, 14, 15]
    },
    {
        name: "Shadow Abyss",
        description: "The deepest mine, containing the rarest discoveries.",
        cost: 10000000,
        ores: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]
    }
];

const MAX_LUCK_LEVEL = 20;

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
    recentDrops: [],
    items: {
        energyBar: 0,
        autoMine: 0,
        doubleOre: 0,
        superEnergyBar: 0
    },
    effects: {
        holdToMineUntil: 0,
        autoMineUntil: 0,
        doubleOreUntil: 0
    },
    questData: {
        claimed: { stone: [], abyss: [] },
        progress: { stone: 0, abyss: 0 }
    }
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
    return Math.floor(250 * Math.pow(4, game.luck));
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
        15000000,
        200000000,
        3000000000,
        50000000000,
        750000000000,
        11000000000000
    ];

    if (game.rebirths < costs.length) return costs[game.rebirths];
    return costs[costs.length - 1] * Math.pow(15, game.rebirths - costs.length + 1);
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
    return 1 + game.luck * oreIndex * 0.08;
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
            recentDrops: Array.isArray(saved.recentDrops) ? saved.recentDrops : [],
            items: { ...defaultGame.items, ...(saved.items || {}) },
            effects: { ...defaultGame.effects, ...(saved.effects || {}) },
            questData: {
                claimed: {
                    stone: Array.isArray(saved.questData?.claimed?.stone) ? saved.questData.claimed.stone : [],
                    abyss: Array.isArray(saved.questData?.claimed?.abyss) ? saved.questData.claimed.abyss : []
                },
                progress: {
                    stone: Math.max(0, Number(saved.questData?.progress?.stone) || 0),
                    abyss: Math.max(0, Number(saved.questData?.progress?.abyss) || 0)
                }
            }
        };

        game.zone = Math.max(0, Math.min(game.zone, zones.length - 1));
        game.luck = Math.max(0, Math.min(MAX_LUCK_LEVEL, Number(game.luck) || 0));
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

        for (const key of Object.keys(game.items)) {
            game.items[key] = Math.max(0, Math.floor(Number(game.items[key]) || 0));
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
    if (ore.weight <= 0.0000001) return "One-of-a-Kind";
    if (ore.weight <= 0.000001) return "Transcendent";
    if (ore.weight <= 0.00001) return "Divine";
    if (ore.weight <= 0.0001) return "Cosmic";
    if (ore.weight <= 0.001) return "Extremely Rare";
    if (ore.weight <= 0.1) return "Legendary";
    if (ore.weight <= 0.5) return "Mythical";
    if (ore.weight <= 1) return "Epic";
    if (ore.weight <= 5) return "Rare";
    if (ore.weight <= 20) return "Uncommon";
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

        let extraDrop = Math.random() < doubleChance() ? 2 : 1;
        if (Date.now() < game.effects.doubleOreUntil) extraDrop *= 2;
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

    updateQuestProgress(amount, drops);
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
            maxed = game.luck >= MAX_LUCK_LEVEL;
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
    if (type === "luck") game.luck++;
    if (type === "sell") game.sellLevel++;
    if (type === "double") game.doubleLevel++;

    showToast(levelName + " upgraded!");
    render();
    saveGame();
}
