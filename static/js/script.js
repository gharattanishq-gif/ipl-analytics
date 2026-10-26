
let players = [];
let playerAliases = {};

const playerSearch = document.getElementById("playerSearch");
const searchResults = document.getElementById("searchResults");
const selectedPlayerCard = document.getElementById("selectedPlayerCard");
const selectedPlayerName = document.getElementById("selectedPlayerName");
const selectedPlayerRole = document.getElementById("selectedPlayerRole");
const playerInitials = document.getElementById("playerInitials");
const seasonGrid = document.getElementById("seasonGrid");
const generateReport = document.getElementById("generateReport");
const selectionMessage = document.getElementById("selectionMessage");

let selectedPlayer = null;
let selectedSeasons = [];

function getSeasonStartYear(season) {
    return parseInt(season.toString().split("/")[0]);
}

/* LOAD PLAYER DATA AND DISPLAY-NAME MAPPING */

async function loadPlayers() {
    try {
        const response = await fetch("/api/players");

        if (!response.ok) {
            throw new Error("Could not load player data.");
        }

        players = await response.json();

        try {
            const mappingResponse = await fetch("/api/player-mapping");

            if (mappingResponse.ok) {
                playerAliases = await mappingResponse.json();
                console.log("Player display names loaded successfully.");
            } else {
                console.warn("Could not load player display-name mapping.");
            }
        } catch (mappingError) {
            console.warn("Could not load player mapping:", mappingError);
        }

        console.log(`Successfully loaded ${players.length} IPL players.`);
    } catch (error) {
        console.error("Error loading player data:", error);
    }
}

loadPlayers();

/* NORMALIZE SEARCH INPUT */

function normalizePlayerSearch(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/* GET USER-FACING PLAYER NAME */

function getDisplayName(player) {
    const details = playerAliases[player.name];

    if (details && typeof details === "object" && !Array.isArray(details)) {
        return details.display_name || player.name;
    }

    return player.name;
}

/* GET SEARCH ALIASES */

function getPlayerAliases(player) {
    const details = playerAliases[player.name];

    if (Array.isArray(details)) {
        return details;
    }

    if (details && typeof details === "object") {
        return details.aliases || [];
    }

    return [];
}

/* MATCH PLAYERS BY CANONICAL NAME, DISPLAY NAME OR ALIAS */

function matchesPlayerSearch(player, searchValue) {
    const normalizedName = normalizePlayerSearch(player.name);
    const displayName = normalizePlayerSearch(getDisplayName(player));

    if (
        normalizedName.includes(searchValue) ||
        displayName.includes(searchValue)
    ) {
        return true;
    }

    const aliases = getPlayerAliases(player);

    if (
        aliases.some(alias =>
            normalizePlayerSearch(alias).includes(searchValue)
        )
    ) {
        return true;
    }

    // Fallback: "Virat Kohli" can match the canonical record "V Kohli".
    const queryWords = searchValue.split(" ");
    const nameWords = player.name.trim().split(/\s+/);

    if (queryWords.length >= 2 && nameWords.length >= 2) {
        const querySurname = normalizePlayerSearch(
            queryWords[queryWords.length - 1]
        );

        const nameSurname = normalizePlayerSearch(
            nameWords[nameWords.length - 1]
        );

        const firstStoredWord = nameWords[0];
        const firstQueryWord = queryWords[0];

        const storedWordIsInitials = /^[A-Z]{1,3}$/.test(firstStoredWord);

        if (
            querySurname === nameSurname &&
            storedWordIsInitials &&
            firstStoredWord[0].toLowerCase() === firstQueryWord[0]
        ) {
            return true;
        }
    }

    return false;
}

/* PLAYER SEARCH */

playerSearch.addEventListener("input", function () {
    const searchValue = normalizePlayerSearch(playerSearch.value);

    searchResults.innerHTML = "";

    if (searchValue === "") {
        searchResults.style.display = "none";
        return;
    }

    const matches = players.filter(player =>
        matchesPlayerSearch(player, searchValue)
    );

    matches.forEach(player => {
        const result = document.createElement("div");

        result.classList.add("search-result");
        result.textContent = getDisplayName(player);

        result.addEventListener("click", () => {
            selectPlayer(player);
        });

        searchResults.appendChild(result);
    });

    searchResults.style.display =
        matches.length > 0 ? "block" : "none";
});

/* SELECT PLAYER */

function selectPlayer(player) {
    selectedPlayer = player;
    selectedSeasons = [];

    // Show the friendly name, but retain the original player object.
    playerSearch.value = getDisplayName(player);
    searchResults.style.display = "none";

    selectedPlayerName.textContent = getDisplayName(player);
    selectedPlayerRole.textContent = player.role || "IPL Player";

    playerInitials.textContent = getDisplayName(player)
        .split(" ")
        .map(word => word[0])
        .join("");

    selectedPlayerCard.classList.remove("hidden");

    clearActiveFilters();
    createSeasonButtons();
    updateGenerateButton();
}

/* CREATE SEASON BUTTONS */

function createSeasonButtons() {
    seasonGrid.innerHTML = "";

    const seasons = [...selectedPlayer.seasons].sort(
        (a, b) => getSeasonStartYear(b) - getSeasonStartYear(a)
    );

    seasons.forEach(season => {
        const button = document.createElement("button");

        button.classList.add("season-button");
        button.textContent = season;

        button.addEventListener("click", () => {
            toggleSeason(season, button);
        });

        seasonGrid.appendChild(button);
    });
}

/* SELECT INDIVIDUAL SEASON */

function toggleSeason(season, button) {
    if (selectedSeasons.includes(season)) {
        selectedSeasons = selectedSeasons.filter(
            item => item !== season
        );

        button.classList.remove("selected");
    } else {
        selectedSeasons.push(season);
        button.classList.add("selected");
    }

    clearActiveFilters();
    updateGenerateButton();
}

/* QUICK FILTERS */

document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", () => {
        if (!selectedPlayer) {
            alert("Please select a player first.");
            return;
        }

        clearActiveFilters();
        button.classList.add("active");

        const filter = button.dataset.filter;

        const seasons = [...selectedPlayer.seasons].sort(
            (a, b) => getSeasonStartYear(b) - getSeasonStartYear(a)
        );

        if (filter === "career") {
            selectedSeasons = [...seasons];
        } else if (filter === "5") {
            selectedSeasons = seasons.slice(0, 5);
        } else if (filter === "3") {
            selectedSeasons = seasons.slice(0, 3);
        } else if (filter === "custom") {
            selectedSeasons = [];
        }

        updateSeasonButtons();
        updateGenerateButton();
    });
});

/* REMOVE ACTIVE QUICK FILTER */

function clearActiveFilters() {
    document.querySelectorAll(".filter-btn").forEach(button => {
        button.classList.remove("active");
    });
}

/* UPDATE SEASON BUTTONS */

function updateSeasonButtons() {
    document.querySelectorAll(".season-button").forEach(button => {
        const season = button.textContent;

        button.classList.toggle(
            "selected",
            selectedSeasons.includes(season)
        );
    });
}

/* CLEAR SEASONS */

document.getElementById("clearSeasons").addEventListener("click", () => {
    selectedSeasons = [];

    clearActiveFilters();
    updateSeasonButtons();
    updateGenerateButton();
});

/* UPDATE GENERATE BUTTON */

function updateGenerateButton() {
    const ready =
        selectedPlayer !== null &&
        selectedSeasons.length > 0;

    generateReport.disabled = !ready;

    if (ready) {
        selectionMessage.textContent =
            `${getDisplayName(selectedPlayer)} • ${selectedSeasons.length} season(s) selected`;
    } else {
        selectionMessage.textContent =
            "Select a player and at least one season.";
    }
}

/* GENERATE REPORT USING CANONICAL PLAYER NAME */

generateReport.addEventListener("click", () => {
    const playerName = encodeURIComponent(selectedPlayer.name);
    const seasons = selectedSeasons.join(",");

    window.location.href =
        `/report?player=${playerName}&seasons=${seasons}`;
});
