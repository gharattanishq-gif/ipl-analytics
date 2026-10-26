/* ==========================================================
   IPL TEAM ANALYTICS
   TEAM + SEASON SELECTION
   ========================================================== */


/* ==========================================================
   GLOBAL STATE
   ========================================================== */

let selectedTeam = null;
let availableSeasons = [];
let selectedSeasons = [];

let rangeStart = null;
let rangeEnd = null;


/* ==========================================================
   DOM ELEMENTS
   ========================================================== */

const teamGrid =
    document.getElementById("team-grid");

const teamModal =
    document.getElementById("team-modal");

const selectedTeamName =
    document.getElementById("selected-team-name");

const seasonList =
    document.getElementById("season-list");

const seasonCount =
    document.getElementById("season-count");

const changeTeamButton =
    document.getElementById("change-team");

const clearSeasonsButton =
    document.getElementById("clear-seasons");

const analyseTeamButton =
    document.getElementById("analyse-team");

const selectionPreview =
    document.getElementById("selection-preview");


/* ==========================================================
   SEASON HELPERS
   ========================================================== */

function getSeasonStartYear(season) {

    return parseInt(
        season.toString().split("/")[0],
        10
    );

}


function sortSeasons(seasons) {

    return [...seasons].sort(
        (a, b) =>
            getSeasonStartYear(a) -
            getSeasonStartYear(b)
    );

}


/* ==========================================================
   LOAD TEAMS
   ========================================================== */

async function loadTeams() {

    try {

        const response =
            await fetch("/api/teams");


        if (!response.ok) {

            throw new Error(
                "Unable to load teams."
            );

        }


        const teams =
            await response.json();


        displayTeams(teams);


    } catch (error) {

        console.error(
            "Team loading error:",
            error
        );


        teamGrid.innerHTML = `
            <p class="error-message">
                Unable to load teams.
                Please refresh the page.
            </p>
        `;

    }

}


/* ==========================================================
   DISPLAY TEAMS
   ========================================================== */

function displayTeams(teams) {

    teamGrid.innerHTML = "";


    if (!Array.isArray(teams) || teams.length === 0) {

        teamGrid.innerHTML = `
            <p class="error-message">
                No teams available.
            </p>
        `;

        return;

    }


    teams.forEach(team => {

        const button =
            document.createElement("button");


        button.type = "button";


        button.className =
            "team-button";


        button.textContent =
            team;


        button.addEventListener(
            "click",
            () => selectTeam(team)
        );


        teamGrid.appendChild(button);

    });

}


/* ==========================================================
   SELECT TEAM
   ========================================================== */

async function selectTeam(team) {

    selectedTeam = team;

    selectedTeamName.textContent =
        team;


    /* Reset season selection */

    selectedSeasons = [];

    rangeStart = null;
    rangeEnd = null;


    updateSelectionSummary();

    updateAnalyseButton();


    /* Show modal */

    teamModal.style.display = "flex";


    /* Load seasons */

    await loadTeamSeasons(team);

}


/* ==========================================================
   LOAD TEAM SEASONS
   ========================================================== */

async function loadTeamSeasons(team) {

    seasonList.innerHTML = `
        <p class="loading-seasons">
            Loading seasons...
        </p>
    `;


    try {

        const response =
            await fetch(
                `/api/team-seasons?team=${encodeURIComponent(team)}`
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load team seasons."
            );

        }


        const seasons =
            await response.json();


        availableSeasons =
            sortSeasons(seasons);


        displaySeasons();


    } catch (error) {

        console.error(
            "Season loading error:",
            error
        );


        seasonList.innerHTML = `
            <p class="error-message">
                Unable to load seasons.
                Please try again.
            </p>
        `;

    }

}


/* ==========================================================
   DISPLAY SEASON BUTTONS
   ========================================================== */

function displaySeasons() {

    seasonList.innerHTML = "";


    if (
        !Array.isArray(availableSeasons) ||
        availableSeasons.length === 0
    ) {

        seasonList.innerHTML = `
            <p class="error-message">
                No seasons available.
            </p>
        `;

        return;

    }


    availableSeasons.forEach(season => {

        const button =
            document.createElement("button");


        button.type = "button";


        button.className =
            "season-button";


        button.dataset.season =
            season;


        button.textContent =
            season;


        button.addEventListener(
            "click",
            () => handleSeasonClick(season)
        );


        seasonList.appendChild(button);

    });


    updateSeasonButtons();

}


/* ==========================================================
   HANDLE SEASON CLICK
   ========================================================== */

function handleSeasonClick(season) {

    handleRangeSelection(season);


    updateSeasonButtons();

    updateSelectionSummary();

    updateAnalyseButton();

}


/* ==========================================================
   RANGE SELECTION
   ========================================================== */

/*
   Behaviour:

   First click:
   → Select one season.

   Second click:
   → Select every available season
     between the first and second click.

   Same season clicked again:
   → Keep only that season.
*/

function handleRangeSelection(season) {


    /* ======================================================
       FIRST CLICK
       ====================================================== */

    if (rangeStart === null) {

        rangeStart = season;

        rangeEnd = null;

        selectedSeasons = [
            season
        ];

        return;

    }


    /* ======================================================
       SAME SEASON CLICKED AGAIN
       ====================================================== */

    if (
        rangeStart === season &&
        rangeEnd === null
    ) {

        selectedSeasons = [
            season
        ];

        return;

    }


    /* ======================================================
       SECOND CLICK
       ====================================================== */

    rangeEnd = season;


    const startYear =
        Math.min(
            getSeasonStartYear(rangeStart),
            getSeasonStartYear(rangeEnd)
        );


    const endYear =
        Math.max(
            getSeasonStartYear(rangeStart),
            getSeasonStartYear(rangeEnd)
        );


    selectedSeasons =
        availableSeasons.filter(
            currentSeason => {

                const year =
                    getSeasonStartYear(
                        currentSeason
                    );


                return (
                    year >= startYear &&
                    year <= endYear
                );

            }
        );


    /* ======================================================
       NORMALISE RANGE ENDPOINTS
       ====================================================== */

    if (
        getSeasonStartYear(rangeStart) >
        getSeasonStartYear(rangeEnd)
    ) {

        const temporary =
            rangeStart;


        rangeStart =
            rangeEnd;


        rangeEnd =
            temporary;

    }

}


/* ==========================================================
   UPDATE SEASON BUTTONS
   ========================================================== */

function updateSeasonButtons() {

    document
        .querySelectorAll(".season-button")
        .forEach(button => {

            const season =
                button.dataset.season;


            /* Selected */

            button.classList.toggle(
                "selected",
                selectedSeasons.includes(season)
            );


            /* Range start */

            button.classList.toggle(
                "range-start",
                rangeStart === season
            );


            /* Range end */

            button.classList.toggle(
                "range-end",
                rangeEnd === season
            );

        });

}


/* ==========================================================
   UPDATE SELECTION SUMMARY
   ========================================================== */

function updateSelectionSummary() {

    const count =
        selectedSeasons.length;


    /* ======================================================
       NOTHING SELECTED
       ====================================================== */

    if (count === 0) {

        seasonCount.textContent =
            "0 Seasons Selected";


        selectionPreview.textContent =
            "No seasons selected";


        return;

    }


    /* ======================================================
       UPDATE COUNT
       ====================================================== */

    seasonCount.textContent =
        `${count} ${
            count === 1
                ? "Season"
                : "Seasons"
        } Selected`;


    const sorted =
        sortSeasons(
            selectedSeasons
        );


    /* ======================================================
       RANGE
       ====================================================== */

    if (
        rangeStart &&
        rangeEnd
    ) {

        selectionPreview.textContent =
            `${rangeStart} → ${rangeEnd}`;

        return;

    }


    /* ======================================================
       SINGLE SEASON
       ====================================================== */

    if (
        rangeStart &&
        !rangeEnd
    ) {

        selectionPreview.textContent =
            `${rangeStart}`;

        return;

    }


    /* ======================================================
       FALLBACK
       ====================================================== */

    selectionPreview.textContent =
        sorted.join(", ");

}


/* ==========================================================
   UPDATE ANALYSE BUTTON
   ========================================================== */

function updateAnalyseButton() {

    analyseTeamButton.disabled =
        !selectedTeam ||
        selectedSeasons.length === 0;

}


/* ==========================================================
   CLEAR SEASONS
   ========================================================== */

clearSeasonsButton.addEventListener(
    "click",
    () => {

        selectedSeasons = [];

        rangeStart = null;
        rangeEnd = null;


        updateSeasonButtons();

        updateSelectionSummary();

        updateAnalyseButton();

    }
);


/* ==========================================================
   CHOOSE ANOTHER TEAM
   ========================================================== */

changeTeamButton.addEventListener(
    "click",
    () => {

        selectedTeam = null;

        availableSeasons = [];

        selectedSeasons = [];

        rangeStart = null;
        rangeEnd = null;


        seasonList.innerHTML = "";


        updateSelectionSummary();

        updateAnalyseButton();


        teamModal.style.display =
            "none";

    }
);


/* ==========================================================
   ANALYSE TEAM
   ========================================================== */

analyseTeamButton.addEventListener(
    "click",
    () => {

        if (
            !selectedTeam ||
            selectedSeasons.length === 0
        ) {

            return;

        }


        const team =
            encodeURIComponent(
                selectedTeam
            );


        const sortedSeasons =
            sortSeasons(
                selectedSeasons
            );


        const seasons =
            sortedSeasons.join(",");


        /* ==================================================
           ONE SEASON
           → SINGLE-SEASON DASHBOARD
           ================================================== */

        if (
            sortedSeasons.length === 1
        ) {

            window.location.href =
                `/team/single?team=${team}&season=${encodeURIComponent(
                    sortedSeasons[0]
                )}`;


            return;

        }


        /* ==================================================
           MULTIPLE SEASONS
           → MULTI-SEASON DASHBOARD
           ================================================== */

        window.location.href =
            `/team/multi?team=${team}&seasons=${encodeURIComponent(
                seasons
            )}`;

    }
);


/* ==========================================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
   ========================================================== */

teamModal.addEventListener(
    "click",
    event => {

        if (
            event.target === teamModal
        ) {

            teamModal.style.display =
                "none";

        }

    }
);


/* ==========================================================
   INITIALISE
   ========================================================== */

loadTeams();