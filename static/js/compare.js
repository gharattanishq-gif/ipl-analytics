let players = [];
let playerMapping = {};

let selectedPlayerA = null;
let selectedPlayerB = null;


/* ==========================================
   PLAYER DISPLAY NAME HELPERS
========================================== */

function getPlayerDisplayName(player) {
    if (!player) return "";

    return (
        playerMapping[player.name]?.display_name ||
        player.name
    );
}

function getPlayerAliases(player) {
    const mapping = playerMapping[player.name];

    const aliases = Array.isArray(mapping?.aliases)
        ? mapping.aliases
        : [];

    const allAliases = [
        player.name,
        getPlayerDisplayName(player),
        ...aliases
    ];

    const seen = new Set();

    return allAliases.filter(alias => {
        if (typeof alias !== "string" || !alias.trim()) {
            return false;
        }

        const normalized = alias.trim().toLowerCase();

        if (seen.has(normalized)) {
            return false;
        }

        seen.add(normalized);
        return true;
    });
}


/* ==========================================
   ELEMENTS
========================================== */

const playerASearch =
    document.getElementById("playerASearch");

const playerBSearch =
    document.getElementById("playerBSearch");

const playerASearchResults =
    document.getElementById("playerASearchResults");

const playerBSearchResults =
    document.getElementById("playerBSearchResults");

const selectionMessage =
    document.getElementById("selectionMessage");


/* ==========================================
   LOAD PLAYERS AND MAPPING
========================================== */

async function loadPlayers() {
    try {
        const response = await fetch("/api/players");

        if (!response.ok) {
            throw new Error("Could not load player data.");
        }

        players = await response.json();

        try {
            const mappingResponse =
                await fetch("/api/player-mapping");

            if (!mappingResponse.ok) {
                throw new Error(
                    "Could not load player mapping."
                );
            }

            playerMapping = await mappingResponse.json();

            console.log(
                `Successfully loaded ${
                    Object.keys(playerMapping).length
                } player mappings.`
            );

        } catch (mappingError) {
            console.warn(
                "Player mapping unavailable. Using original names:",
                mappingError
            );

            playerMapping = {};
        }

        console.log(
            `Successfully loaded ${players.length} IPL players.`
        );

    } catch (error) {
        console.error(
            "Error loading player data:",
            error
        );
    }
}

loadPlayers();


/* ==========================================
   PLAYER SEARCH FUNCTION
========================================== */

function handlePlayerSearch(
    searchInput,
    resultsContainer,
    playerSide
) {
    const searchValue = searchInput.value
        .toLowerCase()
        .trim();

    resultsContainer.innerHTML = "";

    if (searchValue === "") {
        resultsContainer.style.display = "none";
        return;
    }

    const matches = players.filter(player =>
        getPlayerAliases(player).some(alias =>
            alias.toLowerCase().includes(searchValue)
        )
    );

    matches.forEach(player => {
        const result = document.createElement("div");

        result.classList.add("search-result");

        result.textContent = getPlayerDisplayName(player);

        result.addEventListener("click", () => {
            selectPlayer(
                player,
                searchInput,
                resultsContainer,
                playerSide
            );
        });

        resultsContainer.appendChild(result);
    });

    resultsContainer.style.display =
        matches.length > 0 ? "block" : "none";
}


/* ==========================================
   PLAYER A SEARCH
========================================== */

playerASearch.addEventListener(
    "input",
    () => {
        handlePlayerSearch(
            playerASearch,
            playerASearchResults,
            "A"
        );
    }
);


/* ==========================================
   PLAYER B SEARCH
========================================== */

playerBSearch.addEventListener(
    "input",
    () => {
        handlePlayerSearch(
            playerBSearch,
            playerBSearchResults,
            "B"
        );
    }
);


/* ==========================================
   SELECT PLAYER
========================================== */

function selectPlayer(
    player,
    searchInput,
    resultsContainer,
    playerSide
) {
    if (playerSide === "A") {
        selectedPlayerA = player;
    } else {
        selectedPlayerB = player;
    }

    selectedSeasonsA = [];
    selectedSeasonsB = [];

    selectedComparisonType = null;

    seasonSelectionStatus.textContent =
        "Select equal comparison periods";

    comparisonTypeStatus.textContent =
        "Batting, Bowling, or Both";

    searchInput.value = getPlayerDisplayName(player);

    resultsContainer.style.display = "none";

    console.log(
        `Player ${playerSide} selected:`,
        player
    );

    updateSelectionMessage();
    updateCompareButton();
}


/* ==========================================
   UPDATE SELECTION MESSAGE
========================================== */

function updateSelectionMessage() {
    if (selectedPlayerA && selectedPlayerB) {
        selectionMessage.textContent =
            `${getPlayerDisplayName(selectedPlayerA)} vs ` +
            `${getPlayerDisplayName(selectedPlayerB)}`;
    } else if (selectedPlayerA) {
        selectionMessage.textContent =
            `${getPlayerDisplayName(selectedPlayerA)} ` +
            `selected as Player A. Select Player B.`;
    } else if (selectedPlayerB) {
        selectionMessage.textContent =
            `${getPlayerDisplayName(selectedPlayerB)} ` +
            `selected as Player B. Select Player A.`;
    } else {
        selectionMessage.textContent =
            "Select two players to begin configuring your comparison.";
    }
}


/* ==========================================
   CLOSE SEARCH RESULTS WHEN CLICKING OUTSIDE
========================================== */

document.addEventListener("click", event => {
    if (
        !playerASearch.contains(event.target) &&
        !playerASearchResults.contains(event.target)
    ) {
        playerASearchResults.style.display = "none";
    }

    if (
        !playerBSearch.contains(event.target) &&
        !playerBSearchResults.contains(event.target)
    ) {
        playerBSearchResults.style.display = "none";
    }
});


/* ==========================================
   SEASON SELECTION STATE
========================================== */

let selectedSeasonsA = [];
let selectedSeasonsB = [];

let temporarySeasonsA = [];
let temporarySeasonsB = [];


/* ==========================================
   SEASON MODAL ELEMENTS
========================================== */

const openSeasonSelection =
    document.getElementById("openSeasonSelection");

const seasonModal =
    document.getElementById("seasonModal");

const closeSeasonModal =
    document.getElementById("closeSeasonModal");

const cancelSeasonSelection =
    document.getElementById("cancelSeasonSelection");

const confirmSeasonSelection =
    document.getElementById("confirmSeasonSelection");

const seasonPlayerAName =
    document.getElementById("seasonPlayerAName");

const seasonPlayerBName =
    document.getElementById("seasonPlayerBName");

const playerASeasonGrid =
    document.getElementById("playerASeasonGrid");

const playerBSeasonGrid =
    document.getElementById("playerBSeasonGrid");

const playerASeasonCount =
    document.getElementById("playerASeasonCount");

const playerBSeasonCount =
    document.getElementById("playerBSeasonCount");

const seasonValidationMessage =
    document.getElementById("seasonValidationMessage");

const seasonSelectionStatus =
    document.getElementById("seasonSelectionStatus");


/* ==========================================
   GET SEASON START YEAR
========================================== */

function getSeasonStartYear(season) {
    return parseInt(
        season.toString().split("/")[0]
    );
}


/* ==========================================
   OPEN SEASON MODAL
========================================== */

openSeasonSelection.addEventListener(
    "click",
    () => {
        if (!selectedPlayerA || !selectedPlayerB) {
            selectionMessage.textContent =
                "Select Player A and Player B before choosing seasons.";

            return;
        }

        temporarySeasonsA = [...selectedSeasonsA];
        temporarySeasonsB = [...selectedSeasonsB];

        seasonPlayerAName.textContent =
            getPlayerDisplayName(selectedPlayerA);

        seasonPlayerBName.textContent =
            getPlayerDisplayName(selectedPlayerB);

        createSeasonButtons(
            selectedPlayerA,
            playerASeasonGrid,
            temporarySeasonsA,
            "A"
        );

        createSeasonButtons(
            selectedPlayerB,
            playerBSeasonGrid,
            temporarySeasonsB,
            "B"
        );

        updateSeasonModalState();

        seasonModal.classList.remove("hidden");
    }
);


/* ==========================================
   CREATE SEASON BUTTONS
========================================== */

function createSeasonButtons(
    player,
    seasonGrid,
    selectedSeasons,
    playerSide
) {
    seasonGrid.innerHTML = "";

    const seasons = [...player.seasons].sort(
        (a, b) =>
            getSeasonStartYear(b) -
            getSeasonStartYear(a)
    );

    seasons.forEach(season => {
        const button = document.createElement("button");

        button.type = "button";
        button.classList.add("season-button");
        button.textContent = season;

        if (selectedSeasons.includes(season)) {
            button.classList.add("selected");
        }

        button.addEventListener("click", () => {
            toggleTemporarySeason(
                season,
                playerSide,
                button
            );
        });

        seasonGrid.appendChild(button);
    });
}


/* ==========================================
   TOGGLE TEMPORARY SEASON
========================================== */

function toggleTemporarySeason(
    season,
    playerSide,
    button
) {
    if (playerSide === "A") {
        if (temporarySeasonsA.includes(season)) {
            temporarySeasonsA =
                temporarySeasonsA.filter(
                    item => item !== season
                );

            button.classList.remove("selected");
        } else {
            temporarySeasonsA.push(season);
            button.classList.add("selected");
        }
    } else {
        if (temporarySeasonsB.includes(season)) {
            temporarySeasonsB =
                temporarySeasonsB.filter(
                    item => item !== season
                );

            button.classList.remove("selected");
        } else {
            temporarySeasonsB.push(season);
            button.classList.add("selected");
        }
    }

    updateSeasonModalState();
}


/* ==========================================
   UPDATE SEASON MODAL STATE
========================================== */

function updateSeasonModalState() {
    const countA = temporarySeasonsA.length;
    const countB = temporarySeasonsB.length;

    playerASeasonCount.textContent =
        `${countA} season${countA === 1 ? "" : "s"} selected`;

    playerBSeasonCount.textContent =
        `${countB} season${countB === 1 ? "" : "s"} selected`;

    const validSelection =
        countA > 0 &&
        countB > 0 &&
        countA === countB;

    confirmSeasonSelection.disabled = !validSelection;

    if (countA === 0 && countB === 0) {
        seasonValidationMessage.textContent =
            "Select at least one season for each player.";
    } else if (countA === countB) {
        seasonValidationMessage.textContent =
            `${countA} vs ${countB} seasons — valid comparison period.`;
    } else {
        seasonValidationMessage.textContent =
            `${countA} vs ${countB} seasons — select an equal number of seasons.`;
    }
}


/* ==========================================
   CONFIRM SEASON SELECTION
========================================== */

confirmSeasonSelection.addEventListener(
    "click",
    () => {
        selectedSeasonsA = [...temporarySeasonsA];
        selectedSeasonsB = [...temporarySeasonsB];

        selectedComparisonType = null;

        comparisonTypeStatus.textContent =
            "Batting, Bowling, or Both";

        const seasonCount = selectedSeasonsA.length;

        seasonSelectionStatus.textContent =
            `${seasonCount} vs ${seasonCount} seasons selected`;

        seasonModal.classList.add("hidden");

        updateSelectionMessage();
        updateCompareButton();
    }
);


/* ==========================================
   CANCEL SEASON SELECTION
========================================== */

cancelSeasonSelection.addEventListener(
    "click",
    closeSeasonSelectionWithoutSaving
);


/* ==========================================
   CLOSE BUTTON
========================================== */

closeSeasonModal.addEventListener(
    "click",
    closeSeasonSelectionWithoutSaving
);


/* ==========================================
   CLOSE WITHOUT SAVING
========================================== */

function closeSeasonSelectionWithoutSaving() {
    temporarySeasonsA = [];
    temporarySeasonsB = [];

    seasonModal.classList.add("hidden");
}


/* ==========================================
   CLOSE MODAL BY CLICKING BACKDROP
========================================== */

seasonModal.addEventListener("click", event => {
    if (event.target === seasonModal) {
        closeSeasonSelectionWithoutSaving();
    }
});


/* ==========================================
   COMPARISON TYPE STATE
========================================== */

let selectedComparisonType = null;
let temporaryComparisonType = null;


/* ==========================================
   COMPARISON TYPE ELEMENTS
========================================== */

const openComparisonType =
    document.getElementById("openComparisonType");

const comparisonTypeModal =
    document.getElementById("comparisonTypeModal");

const closeComparisonTypeModal =
    document.getElementById("closeComparisonTypeModal");

const cancelComparisonType =
    document.getElementById("cancelComparisonType");

const confirmComparisonType =
    document.getElementById("confirmComparisonType");

const comparisonTypeStatus =
    document.getElementById("comparisonTypeStatus");

const comparisonTypeOptions =
    document.querySelectorAll(".comparison-type-option");


/* ==========================================
   OPEN COMPARISON TYPE MODAL
========================================== */

openComparisonType.addEventListener(
    "click",
    () => {
        if (!selectedPlayerA || !selectedPlayerB) {
            selectionMessage.textContent =
                "Select Player A and Player B before choosing a comparison type.";

            return;
        }

        if (
            selectedSeasonsA.length === 0 ||
            selectedSeasonsB.length === 0
        ) {
            selectionMessage.textContent =
                "Select comparison seasons before choosing a comparison type.";

            return;
        }

        temporaryComparisonType = selectedComparisonType;

        updateComparisonTypeOptions();
        updateComparisonTypeModalState();

        comparisonTypeModal.classList.remove("hidden");
    }
);


/* ==========================================
   SELECT COMPARISON TYPE OPTION
========================================== */

comparisonTypeOptions.forEach(option => {
    option.addEventListener("click", () => {
        temporaryComparisonType =
            option.dataset.comparisonType;

        updateComparisonTypeOptions();
        updateComparisonTypeModalState();
    });
});


/* ==========================================
   UPDATE OPTION APPEARANCE
========================================== */

function updateComparisonTypeOptions() {
    comparisonTypeOptions.forEach(option => {
        const optionType = option.dataset.comparisonType;

        option.classList.toggle(
            "selected",
            optionType === temporaryComparisonType
        );
    });
}


/* ==========================================
   UPDATE MODAL STATE
========================================== */

function updateComparisonTypeModalState() {
    confirmComparisonType.disabled =
        temporaryComparisonType === null;
}


/* ==========================================
   CONFIRM COMPARISON TYPE
========================================== */

confirmComparisonType.addEventListener(
    "click",
    () => {
        selectedComparisonType = temporaryComparisonType;

        if (selectedComparisonType === "batting") {
            comparisonTypeStatus.textContent =
                "Batting Metrics";
        } else if (selectedComparisonType === "bowling") {
            comparisonTypeStatus.textContent =
                "Bowling Metrics";
        } else {
            comparisonTypeStatus.textContent =
                "Batting & Bowling Metrics";
        }

        comparisonTypeModal.classList.add("hidden");

        updateSelectionMessage();
        updateCompareButton();
    }
);


/* ==========================================
   CANCEL COMPARISON TYPE
========================================== */

cancelComparisonType.addEventListener(
    "click",
    closeComparisonTypeWithoutSaving
);


/* ==========================================
   CLOSE BUTTON
========================================== */

closeComparisonTypeModal.addEventListener(
    "click",
    closeComparisonTypeWithoutSaving
);


/* ==========================================
   CLOSE WITHOUT SAVING
========================================== */

function closeComparisonTypeWithoutSaving() {
    temporaryComparisonType = null;

    comparisonTypeModal.classList.add("hidden");
}


/* ==========================================
   CLOSE MODAL BY CLICKING BACKDROP
========================================== */

comparisonTypeModal.addEventListener("click", event => {
    if (event.target === comparisonTypeModal) {
        closeComparisonTypeWithoutSaving();
    }
});


/* ==========================================
   COMPARE BUTTON
========================================== */

const comparePlayers =
    document.getElementById("comparePlayers");


/* ==========================================
   UPDATE COMPARE BUTTON
========================================== */

function updateCompareButton() {
    const ready =
        selectedPlayerA !== null &&
        selectedPlayerB !== null &&
        selectedSeasonsA.length > 0 &&
        selectedSeasonsB.length > 0 &&
        selectedSeasonsA.length === selectedSeasonsB.length &&
        selectedComparisonType !== null;

    comparePlayers.disabled = !ready;

    if (ready) {
        selectionMessage.textContent =
            `${getPlayerDisplayName(selectedPlayerA)} vs ` +
            `${getPlayerDisplayName(selectedPlayerB)} • ` +
            `${selectedSeasonsA.length} season(s) each • ` +
            `${getComparisonTypeLabel(selectedComparisonType)}`;
    }
}


/* ==========================================
   COMPARISON TYPE LABEL
========================================== */

function getComparisonTypeLabel(type) {
    if (type === "batting") {
        return "Batting Metrics";
    }

    if (type === "bowling") {
        return "Bowling Metrics";
    }

    return "Batting & Bowling Metrics";
}


/* ==========================================
   GENERATE COMPARISON REPORT
========================================== */

comparePlayers.addEventListener(
    "click",
    () => {
        if (comparePlayers.disabled) {
            return;
        }

        // Keep canonical names in the URL for backend compatibility.
        const playerA =
            encodeURIComponent(selectedPlayerA.name);

        const playerB =
            encodeURIComponent(selectedPlayerB.name);

        const seasonsA =
            selectedSeasonsA.join(",");

        const seasonsB =
            selectedSeasonsB.join(",");

        const comparisonType =
            selectedComparisonType;

        window.location.href =
            `/comparison-report?playerA=${playerA}` +
            `&playerB=${playerB}` +
            `&seasonsA=${seasonsA}` +
            `&seasonsB=${seasonsB}` +
            `&type=${comparisonType}`;
    }
);