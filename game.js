
// ==========================================
// MINING EMPIRE - MAIN GAME
// ==========================================

const ores = [
    {name:"Stone", emoji:"🪨", rarity:"Common", chance:4000, value:1, color:"#a5a5a5"},
    {name:"Coal", emoji:"⚫", rarity:"Common", chance:2500, value:3, color:"#777777"},
    {name:"Copper", emoji:"🟤", rarity:"Common", chance:1500, value:6, color:"#c47b48"},
    {name:"Iron", emoji:"🔩", rarity:"Uncommon", chance:1000, value:12, color:"#b2b8c5"},
    {name:"Silver", emoji:"🥈", rarity:"Uncommon", chance:500, value:25, color:"#c8d5e8"},
    {name:"Gold", emoji:"🥇", rarity:"Rare", chance:300, value:60, color:"#ffcf50"},
    {name:"Ruby", emoji:"♦️", rarity:"Rare", chance:150, value:150, color:"#ff4b64"},
    {name:"Sapphire", emoji:"💎", rarity:"Epic", chance:80, value:400, color:"#4899ff"},
    {name:"Emerald", emoji:"💚", rarity:"Epic", chance:40, value:900, color:"#42df91"},
    {name:"Amethyst", emoji:"🔮", rarity:"Legendary", chance:20, value:2500, color:"#b46aff"},
    {name:"Obsidian", emoji:"⬛", rarity:"Legendary", chance:10, value:7000, color:"#a18bd3"},
    {name:"Mythril", emoji:"✨", rarity:"Mythical", chance:5, value:20000, color:"#67e8e8"},
    {name:"Uranium", emoji:"☢️", rarity:"Mythical", chance:3, value:50000, color:"#a5ff48"},
    {name:"Voidium", emoji:"🌌", rarity:"Divine", chance:1, value:150000, color:"#a65bff"},
    {name:"Celestialum", emoji:"🌟", rarity:"Divine", chance:0.5, value:500000, color:"#fff0a1"},
    {name:"Infinitum", emoji:"♾️", rarity:"Secret", chance:0.1, value:2000000, color:"#ff6df1"}
];

const zones = [
    {
        name:"Grasslands Mine",
        description:"A peaceful mine filled with basic minerals.",
        emoji:"🌳",
        cost:0,
        ores:[0,1,2,3,4,5]
    },
    {
        name:"Stone Caverns",
        description:"Deeper underground, more valuable ores await.",
        emoji:"⛰️",
        cost:5000,
        ores:[1,2,3,4,5,6,7]
    },
    {
        name:"Crystal Caves",
        description:"A beautiful cave full of precious crystals.",
        emoji:"💎",
        cost:50000,
        ores:[3,4,5,6,7,8,9]
    },
    {
        name:"Frozen Depths",
        description:"An icy underground world.",
        emoji:"❄️",
        cost:500000,
        ores:[4,5,6,7,8,9,10,11]
    },
    {
        name:"Magma Caverns",
        description:"Extremely valuable minerals hide in the heat.",
        emoji:"🌋",
        cost:5000000,
        ores:[6,7,8,9,10,11,12]
    },
    {
        name:"Ancient Ruins",
        description:"Forgotten treasures from an ancient civilization.",
        emoji:"🏛️",
        cost:50000000,
        ores:[8,9,10,11,12,13,14]
    },
    {
        name:"Shadow Abyss",
        description:"A mysterious place filled with strange minerals.",
        emoji:"🌑",
        cost:500000000,
        ores:[9,10,11,12,13,14,15]
    }
];

// ==========================================
// GAME DATA
// ==========================================

let game = {
    money: 0,
    power: 1,
    blocks: 0,
    zone: 0,
    unlockedZones: [0],
    inventory: {},
    discovered: [],
    multiplier: 1,
    rebirths: 0
};

let toastTimer;

function loadGame() {
    try {
        const saved = localStorage.getItem("miningEmpireSave");

        if (saved) {
            const data = JSON.parse(saved);

            game = {
                ...game,
                ...data
            };

            game.unlockedZones = Array.isArray(game.unlockedZones)
                ? game.unlockedZones : [0];

            game.inventory = game.inventory || {};
            game.discovered = Array.isArray(game.discovered)
                ? game.discovered : [];

            game.unlockedZones = [...new Set([0, ...game.unlockedZones])]
                .filter(i => Number.isInteger(i) && i >= 0 && i < zones.length);

            game.discovered = game.discovered.filter(i =>
                Number.isInteger(i) && i >= 0 && i < ores.length
            );

            game.zone = game.unlockedZones.includes(game.zone)
                ? game.zone : 0;

            game.money = Math.max(0, Number(game.money) || 0);
            game.power = Math.max(1, Number(game.power) || 1);
            game.blocks = Math.max(0, Number(game.blocks) || 0);
            game.multiplier = Math.max(1, Number(game.multiplier) || 1);
            game.rebirths = Math.max(0, Number(game.rebirths) || 0);
        }
    } catch (error) {
        console.error("Save could not be loaded:", error);
    }

    updateUI();
}

function saveGame() {
    localStorage.setItem("miningEmpireSave", JSON.stringify(game));
}

// ==========================================
// FORMATTING
// ==========================================

function formatNumber(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";

    return Math.floor(num).toLocaleString();
}

function upgradeCost() {
    return Math.floor(50 * Math.pow(1.65, game.power - 1));
}

function rebirthCost() {
    return 1000000 * Math.pow(10, game.rebirths);
}

// ==========================================
// RANDOM ORE SYSTEM
// ==========================================

function getRandomOre() {
    const currentZone = zones[game.zone];

    const availableOres = currentZone.ores.map(index => ores[index]);

    const totalWeight = availableOres.reduce(
        (total, ore) => total + ore.chance, 0
    );

    let roll = Math.random() * totalWeight;

    for (let ore of availableOres) {
        roll -= ore.chance;

        if (roll <= 0) {
            return ore;
        }
    }

    return availableOres[0];
}

// ==========================================
// MINING
// ==========================================

function mine() {
    const amount = Math.min(5, Math.max(1, Math.floor(game.power)));

    game.blocks += amount;

    let lastOre = null;
    let discoveries = [];

    for (let i = 0; i < amount; i++) {
        const ore = getRandomOre();
        const oreIndex = ores.indexOf(ore);

        game.inventory[ore.name] =
            (game.inventory[ore.name] || 0) + 1;

        if (!game.discovered.includes(oreIndex)) {
            game.discovered.push(oreIndex);
            discoveries.push(ore);
        }

        lastOre = ore;
    }

    // Chance for bonus ore drops
    let bonus = 0;

    if (Math.random() < 0.05) {
        bonus = 2;
    } else if (Math.random() < 0.15) {
        bonus = 1;
    }

    if (bonus > 0) {
        for (let i = 0; i < bonus; i++) {
            const ore = getRandomOre();
            const oreIndex = ores.indexOf(ore);

            game.inventory[ore.name] =
                (game.inventory[ore.name] || 0) + 1;

            if (!game.discovered.includes(oreIndex)) {
                game.discovered.push(oreIndex);
                discoveries.push(ore);
            }

            lastOre = ore;
        }
    }

    animateBlock();

    if (discoveries.length > 0) {
        showToast("NEW DISCOVERY: " + discoveries[0].name + "!");
    }

    showDrop(lastOre, bonus);

    updateUI();
    saveGame();
}

function animateBlock() {
    const block = document.getElementById("mineBlock");

    block.classList.remove("mining");
    void block.offsetWidth;
    block.classList.add("mining");
}

function showDrop(ore, bonus) {
    const notification = document.getElementById("dropNotification");
    const blockEmoji = document.getElementById("blockEmoji");

    blockEmoji.textContent = ore.emoji;

    notification.textContent =
        `Found ${ore.emoji} ${ore.name}!` +
        (bonus > 0 ? ` +${bonus} BONUS ORES!` : "");

    notification.style.color = ore.color;
}

// ==========================================
// INVENTORY
// ==========================================

function inventoryValue() {
    let total = 0;

    for (const ore of ores) {
        total += (game.inventory[ore.name] || 0) * ore.value;
    }

    return total;
}

function inventoryCount() {
    return Object.values(game.inventory).reduce(
        (sum, amount) => sum + amount, 0
    );
}

function sellAll() {
    const value = inventoryValue();

    if (value <= 0) {
        showToast("You don't have any ores to sell!");
        return;
    }

    const earnings = Math.floor(value * game.multiplier);

    game.money += earnings;
    game.inventory = {};

    showToast("Sold everything for $" + formatNumber(earnings));

    updateUI();
    saveGame();
}

// ==========================================
// PICKAXE UPGRADES
// ==========================================

function buyUpgrade() {
    const cost = upgradeCost();

    if (game.money < cost) {
        showToast("Not enough money!");
        return;
    }

    game.money -= cost;
    game.power++;

    showToast("Pickaxe upgraded! Power is now " + game.power);

    updateUI();
    saveGame();
}

// ==========================================
// MINING ZONES
// ==========================================

function renderZones() {
    const container = document.getElementById("zones");
    container.innerHTML = "";

    zones.forEach((zone, index) => {
        const unlocked = game.unlockedZones.includes(index);
        const active = game.zone === index;

        const card = document.createElement("button");

        card.className =
            "zone-card" +
            (active ? " active" : "") +
            (!unlocked ? " locked" : "");

        card.innerHTML = `
            ${zone.emoji} ${zone.name}
            <small>
                ${unlocked ? (active ? "Currently mining" : "Unlocked") :
                "🔒 $" + formatNumber(zone.cost)}
            </small>
        `;

        card.disabled = !unlocked && game.money < zone.cost;

        card.addEventListener("click", () => {
            if (unlocked) {
                game.zone = index;
                showToast("Entered " + zone.name);
            } else {
                buyZone(index);
            }

            updateUI();
            saveGame();
        });

        container.appendChild(card);
    });
}

function buyZone(index) {
    const zone = zones[index];

    if (game.unlockedZones.includes(index)) {
        return;
    }

    if (game.money < zone.cost) {
        showToast("Not enough money!");
        return;
    }

    game.money -= zone.cost;
    game.unlockedZones.push(index);
    game.zone = index;

    showToast("Unlocked " + zone.name + "!");
}

// ==========================================
// ORE COLLECTION
// ==========================================

function renderOreIndex() {
    const container = document.getElementById("oreIndex");
    container.innerHTML = "";

    ores.forEach((ore, index) => {
        const discovered = game.discovered.includes(index);

        const card = document.createElement("div");

        card.className = "ore-card" +
            (discovered ? "" : " undiscovered");

        card.innerHTML = `
            <div class="ore-icon">
                ${discovered ? ore.emoji : "❔"}
            </div>
            <div class="ore-name">
                ${discovered ? ore.name : "Unknown"}
            </div>
            <div class="ore-rarity">
                ${ore.rarity}
            </div>
        `;

        if (discovered) {
            card.style.borderColor = ore.color;
        }

        container.appendChild(card);
    });

    const discoveredCount = game.discovered.length;
    const percentage = discoveredCount / ores.length * 100;

    document.getElementById("collectionText").textContent =
        `${discoveredCount} / ${ores.length} Discovered`;

    document.getElementById("collectionProgress").style.width =
        percentage + "%";
}

// ==========================================
// REBIRTH
// ==========================================

function rebirth() {
    const cost = rebirthCost();

    if (game.money < cost) {
        showToast("You need $" + formatNumber(cost) + " to rebirth!");
        return;
    }

    const confirmed = confirm(
        "Rebirth will reset your money, pickaxe, zones, and inventory. " +
        "Your discoveries and permanent multiplier will remain. Continue?"
    );

    if (!confirmed) return;

    game.money = 0;
    game.power = 1;
    game.blocks = 0;
    game.zone = 0;
    game.unlockedZones = [0];
    game.inventory = {};

    game.rebirths++;
    game.multiplier *= 2;

    showToast("REBIRTH! Permanent multiplier doubled!");

    updateUI();
    saveGame();
}

// ==========================================
// NOTIFICATIONS
// ==========================================

function showToast(message) {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

// ==========================================
// UPDATE GAME UI
// ==========================================

function updateUI() {
    const zone = zones[game.zone];

    document.getElementById("money").textContent =
        formatNumber(game.money);

    document.getElementById("power").textContent =
        formatNumber(game.power);

    document.getElementById("blocks").textContent =
        formatNumber(game.blocks);

    document.getElementById("zoneName").textContent =
        zone.name;

    document.getElementById("zoneDescription").textContent =
        zone.description;

    document.getElementById("zoneLevel").textContent =
        "ZONE " + (game.zone + 1);

    document.getElementById("inventoryValue").textContent =
        "$" + formatNumber(inventoryValue());

    document.getElementById("oreCount").textContent =
        formatNumber(inventoryCount());

    document.getElementById("upgradePower").textContent =
        formatNumber(game.power);

    document.getElementById("upgradeCost").textContent =
        "$" + formatNumber(upgradeCost());

    document.getElementById("multiplier").textContent =
        "x" + formatNumber(game.multiplier);

    document.getElementById("rebirthRequirement").textContent =
        "$" + formatNumber(rebirthCost());

    document.getElementById("upgradeButton").disabled =
        game.money < upgradeCost();

    document.getElementById("rebirthButton").disabled =
        game.money < rebirthCost();

    document.getElementById("sellButton").disabled =
        inventoryCount() === 0;

    renderZones();
    renderOreIndex();
}

// ==========================================
// BUTTON CONNECTIONS
// ==========================================

document.getElementById("mineButton").addEventListener("click", mine);

document.getElementById("mineBlock").addEventListener("click", mine);

document.getElementById("sellButton").addEventListener("click", sellAll);

document.getElementById("upgradeButton").addEventListener("click", buyUpgrade);

document.getElementById("rebirthButton").addEventListener("click", rebirth);

// ==========================================
// AUTO SAVE
// ==========================================

setInterval(saveGame, 5000);

window.addEventListener("beforeunload", saveGame);

// START GAME
loadGame();
