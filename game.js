
const ores = [
    {name:"Stone", emoji:"🪨", rarity:"Common", weight:4000, value:1, color:"#aaaaaa"},
    {name:"Coal", emoji:"⚫", rarity:"Common", weight:2500, value:3, color:"#777777"},
    {name:"Copper", emoji:"🟤", rarity:"Common", weight:1500, value:6, color:"#c47b48"},
    {name:"Iron", emoji:"🔩", rarity:"Uncommon", weight:1000, value:12, color:"#b2b8c5"},
    {name:"Silver", emoji:"🥈", rarity:"Uncommon", weight:500, value:25, color:"#c8d5e8"},
    {name:"Gold", emoji:"🥇", rarity:"Rare", weight:300, value:60, color:"#ffcf50"},
    {name:"Ruby", emoji:"♦️", rarity:"Rare", weight:150, value:150, color:"#ff4b64"},
    {name:"Sapphire", emoji:"💎", rarity:"Epic", weight:80, value:400, color:"#4899ff"},
    {name:"Emerald", emoji:"💚", rarity:"Epic", weight:40, value:900, color:"#42df91"},
    {name:"Amethyst", emoji:"🔮", rarity:"Legendary", weight:20, value:2500, color:"#b46aff"},
    {name:"Obsidian", emoji:"⬛", rarity:"Legendary", weight:10, value:7000, color:"#a18bd3"},
    {name:"Mythril", emoji:"✨", rarity:"Mythical", weight:5, value:20000, color:"#67e8e8"},
    {name:"Uranium", emoji:"☢️", rarity:"Mythical", weight:3, value:50000, color:"#a5ff48"},
    {name:"Voidium", emoji:"🌌", rarity:"Divine", weight:1, value:150000, color:"#a65bff"},
    {name:"Celestium", emoji:"🌟", rarity:"Divine", weight:0.5, value:500000, color:"#fff0a1"},
    {name:"Infinityte", emoji:"♾️", rarity:"Secret", weight:0.1, value:2000000, color:"#ff6df1"}
];

const zones = [
    {
        name:"Grasslands Mine",
        description:"Your mining adventure begins!",
        emoji:"🌳",
        cost:0,
        ores:[0,1,2,3,4,5]
    },
    {
        name:"Stone Caverns",
        description:"Deeper underground, better minerals await.",
        emoji:"⛰️",
        cost:5000,
        ores:[1,2,3,4,5,6,7]
    },
    {
        name:"Crystal Caves",
        description:"A cave filled with precious crystals.",
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
        description:"Extremely valuable minerals hide here.",
        emoji:"🌋",
        cost:5000000,
        ores:[6,7,8,9,10,11,12]
    },
    {
        name:"Ancient Ruins",
        description:"Discover forgotten minerals.",
        emoji:"🏛️",
        cost:50000000,
        ores:[8,9,10,11,12,13,14]
    },
    {
        name:"Shadow Abyss",
        description:"The rarest minerals are hidden here.",
        emoji:"🌑",
        cost:500000000,
        ores:[9,10,11,12,13,14,15]
    }
];

const defaultGame = {
    money:0,
    power:1,
    blocks:0,
    zone:0,
    unlockedZones:[0],
    inventory:{},
    discovered:[],
    multiplier:1,
    rebirths:0
};

let game = {...defaultGame};
let recentDrops = [];
let toastTimer;

// ======================================
// SAVE AND LOAD
// ======================================

function saveGame() {
    try {
        localStorage.setItem("miningEmpireSave", JSON.stringify(game));
    } catch (error) {
        console.error("Could not save game:", error);
    }
}

function loadGame() {
    try {
        const saved = localStorage.getItem("miningEmpireSave");

        if (saved) {
            const data = JSON.parse(saved);

            game = {
                ...defaultGame,
                ...data
            };

            game.inventory = data.inventory || {};
            game.discovered = Array.isArray(data.discovered) ? data.discovered : [];
            game.unlockedZones = Array.isArray(data.unlockedZones) ? data.unlockedZones : [0];

            game.money = Math.max(0, Number(game.money) || 0);
            game.power = Math.max(1, Math.floor(Number(game.power) || 1));
            game.blocks = Math.max(0, Number(game.blocks) || 0);
            game.multiplier = Math.max(1, Number(game.multiplier) || 1);
            game.rebirths = Math.max(0, Math.floor(Number(game.rebirths) || 0));

            game.unlockedZones = [...new Set([0, ...game.unlockedZones])]
                .filter(i => Number.isInteger(i) && i >= 0 && i < zones.length);

            game.discovered = [...new Set(game.discovered)]
                .filter(i => Number.isInteger(i) && i >= 0 && i < ores.length);

            if (!game.unlockedZones.includes(game.zone)) {
                game.zone = 0;
            }
        }
    } catch (error) {
        console.error("Save loading failed:", error);
        game = {...defaultGame};
    }

    updateUI();
}

// ======================================
// NUMBER FORMATTING
// ======================================

function formatNumber(number) {
    if (number >= 1e12) return (number / 1e12).toFixed(2) + "T";
    if (number >= 1e9) return (number / 1e9).toFixed(2) + "B";
    if (number >= 1e6) return (number / 1e6).toFixed(2) + "M";
    if (number >= 1e3) return (number / 1e3).toFixed(2) + "K";

    return Math.floor(number).toLocaleString();
}

function upgradeCost() {
    return Math.floor(50 * Math.pow(1.65, game.power - 1));
}

function rebirthCost() {
    return 1000000 * Math.pow(10, game.rebirths);
}

// ======================================
// TAB MENU
// ======================================

function switchTab(tabName) {
    document.querySelectorAll(".tab").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.tab === tabName
        );
    });

    document.querySelectorAll(".page").forEach(page => {
        page.classList.toggle(
            "active",
            page.id === tabName
        );
    });
}

document.querySelectorAll(".tab").forEach(button => {
    button.addEventListener("click", () => {
        switchTab(button.dataset.tab);
    });
});

// ======================================
// RANDOM ORE SYSTEM
// ======================================

function getRandomOre() {
    const availableOres = zones[game.zone].ores.map(index => ores[index]);

    const totalWeight = availableOres.reduce(
        (total, ore) => total + ore.weight,
        0
    );

    let roll = Math.random() * totalWeight;

    for (const ore of availableOres) {
        roll -= ore.weight;

        if (roll <= 0) {
            return ore;
        }
    }

    return availableOres[0];
}

// ======================================
// MINING
// ======================================

function mine() {
    const amount = Math.min(game.power, 10);

    game.blocks += amount;

    let found = [];
    let newDiscoveries = [];

    for (let i = 0; i < amount; i++) {
        const ore = getRandomOre();
        const index = ores.indexOf(ore);

        game.inventory[ore.name] =
            (game.inventory[ore.name] || 0) + 1;

        found.push(ore);

        if (!game.discovered.includes(index)) {
            game.discovered.push(index);
            newDiscoveries.push(ore);
        }
    }

    // Bonus drop RNG
    let bonus = 0;

    if (Math.random() < 0.05) {
        bonus = 2;
    } else if (Math.random() < 0.15) {
        bonus = 1;
    }

    for (let i = 0; i < bonus; i++) {
        const ore = getRandomOre();
        const index = ores.indexOf(ore);

        game.inventory[ore.name] =
            (game.inventory[ore.name] || 0) + 1;

        found.push(ore);

        if (!game.discovered.includes(index)) {
            game.discovered.push(index);
            newDiscoveries.push(ore);
        }
    }

    const bestOre = found.reduce(
        (best, ore) => ore.value > best.value ? ore : best,
        found[0]
    );

    animateBlock(bestOre);

    if (newDiscoveries.length > 0) {
        showToast("NEW ORE DISCOVERED: " + newDiscoveries[0].name + "!");
    }

    showDrop(bestOre, found.length, bonus);

    recentDrops.unshift(...found.map(ore => ore));

    recentDrops = recentDrops.slice(0, 8);

    updateUI();
    saveGame();
}

function animateBlock(ore) {
    const block = document.getElementById("mineBlock");

    block.textContent = ore.emoji;
    block.style.borderColor = ore.color;

    block.classList.remove("mining");
    void block.offsetWidth;
    block.classList.add("mining");
}

function showDrop(ore, amount, bonus) {
    document.getElementById("mineText").textContent =
        "Found " + amount + " block(s)!";

    const notification = document.getElementById("dropNotification");

    notification.textContent =
        ore.emoji + " Best find: " + ore.name +
        (bonus > 0 ? " | BONUS DROP!" : "");

    notification.style.color = ore.color;
}

// ======================================
// INVENTORY AND SELLING
// ======================================

function inventoryValue() {
    let total = 0;

    for (const ore of ores) {
        total += (game.inventory[ore.name] || 0) * ore.value;
    }

    return total;
}

function inventoryCount() {
    return Object.values(game.inventory).reduce(
        (sum, amount) => sum + amount,
        0
    );
}

function sellAll() {
    const value = inventoryValue();

    if (value <= 0) {
        showToast("You have no ores to sell!");
        return;
    }

    const earnings = Math.floor(value * game.multiplier);

    game.money += earnings;
    game.inventory = {};

    showToast("Sold ores for $" + formatNumber(earnings));

    updateUI();
    saveGame();
}

// ======================================
// PICKAXE UPGRADES
// ======================================

function buyUpgrade() {
    const cost = upgradeCost();

    if (game.money < cost) {
        showToast("Not enough money!");
        return;
    }

    game.money -= cost;
    game.power++;

    showToast("Pickaxe upgraded! Power: " + game.power);

    updateUI();
    saveGame();
}

// ======================================
// AREAS
// ======================================

function buyZone(index) {
    const zone = zones[index];

    if (game.unlockedZones.includes(index)) {
        game.zone = index;
        showToast("Entered " + zone.name);
        updateUI();
        saveGame();
        return;
    }

    if (game.money < zone.cost) {
        showToast("Not enough money!");
        return;
    }

    game.money -= zone.cost;
    game.unlockedZones.push(index);
    game.zone = index;

    showToast("NEW AREA UNLOCKED: " + zone.name + "!");

    updateUI();
    saveGame();
}

function renderZones() {
    const container = document.getElementById("zones");
    container.innerHTML = "";

    zones.forEach((zone, index) => {
        const unlocked = game.unlockedZones.includes(index);
        const active = game.zone === index;

        const button = document.createElement("button");

        button.className =
            "zone-card" +
            (active ? " active" : "");

        button.innerHTML = `
            <h3>${zone.emoji} ${zone.name}</h3>
            <small>${zone.description}</small>
            <small>
                ${active ? "CURRENT AREA" :
                unlocked ? "UNLOCKED - ENTER" :
                "🔒 $" + formatNumber(zone.cost)}
            </small>
        `;

        button.disabled = !unlocked && game.money < zone.cost;

        button.addEventListener("click", () => buyZone(index));

        container.appendChild(button);
    });
}

// ======================================
// ORE COLLECTION
// ======================================

function renderCollection() {
    const container = document.getElementById("oreIndex");
    container.innerHTML = "";

    ores.forEach((ore, index) => {
        const discovered = game.discovered.includes(index);

        const card = document.createElement("div");

        card.className =
            "ore-card" + (discovered ? "" : " undiscovered");

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

    const count = game.discovered.length;

    document.getElementById("collectionText").textContent =
        `${count} / ${ores.length} Discovered`;

    document.getElementById("collectionProgress").style.width =
        (count / ores.length * 100) + "%";
}

function renderRecentDrops() {
    const container = document.getElementById("recentDrops");

    if (recentDrops.length === 0) {
        container.textContent = "No discoveries yet.";
        return;
    }

    container.innerHTML = "";

    recentDrops.forEach(ore => {
        const item = document.createElement("div");
        item.className = "recent-item";
        item.textContent = ore.emoji + " " + ore.name;
        item.style.borderBottom = "2px solid " + ore.color;

        container.appendChild(item);
    });
}

// ======================================
// REBIRTH
// ======================================

function rebirth() {
    const cost = rebirthCost();

    if (game.money < cost) {
        showToast("You need $" + formatNumber(cost) + "!");
        return;
    }

    const confirmed = confirm(
        "Are you sure you want to rebirth? " +
        "Your money, upgrades, areas and inventory will reset. " +
        "Your ore discoveries and multiplier will remain."
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

    showToast("REBIRTH SUCCESSFUL! Money multiplier doubled!");

    updateUI();
    saveGame();
}

// ======================================
// NOTIFICATIONS
// ======================================

function showToast(message) {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

// ======================================
// UPDATE EVERYTHING
// ======================================

function updateUI() {
    document.getElementById("money").textContent =
        formatNumber(game.money);

    document.getElementById("power").textContent =
        formatNumber(game.power);

    document.getElementById("blocks").textContent =
        formatNumber(game.blocks);

    document.getElementById("zoneName").textContent =
        zones[game.zone].name;

    document.getElementById("zoneDescription").textContent =
        zones[game.zone].description;

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

    document.getElementById("rebirthCount").textContent =
        game.rebirths;

    document.getElementById("rebirthRequirement").textContent =
        "$" + formatNumber(rebirthCost());

    document.getElementById("upgradeButton").disabled =
        game.money < upgradeCost();

    document.getElementById("rebirthButton").disabled =
        game.money < rebirthCost();

    document.getElementById("sellButton").disabled =
        inventoryCount() === 0;

    document.getElementById("rebirthStatus").textContent =
        game.money >= rebirthCost()
        ? "You can rebirth now!"
        : "You need $" + formatNumber(rebirthCost() - game.money) + " more.";

    renderZones();
    renderCollection();
    renderRecentDrops();
}

// ======================================
// BUTTONS
// ======================================

document.getElementById("mineButton").addEventListener("click", mine);
document.getElementById("mineBlock").addEventListener("click", mine);
document.getElementById("sellButton").addEventListener("click", sellAll);
document.getElementById("upgradeButton").addEventListener("click", buyUpgrade);
document.getElementById("rebirthButton").addEventListener("click", rebirth);

// ======================================
// AUTOSAVE
// ======================================

setInterval(saveGame, 5000);

window.addEventListener("beforeunload", saveGame);

loadGame();
