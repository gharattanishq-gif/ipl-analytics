/* ==========================================
   REPORT STATE
========================================== */

let comparisonData = null;
let activeComparisonCategory = null;


/* ==========================================
   ELEMENTS
========================================== */

const playerAName =
    document.getElementById("playerAName");

const playerBName =
    document.getElementById("playerBName");

const playerASeasonSummary =
    document.getElementById("playerASeasonSummary");

const playerBSeasonSummary =
    document.getElementById("playerBSeasonSummary");

const tablePlayerAName =
    document.getElementById("tablePlayerAName");

const tablePlayerBName =
    document.getElementById("tablePlayerBName");

const comparisonToggleSection =
    document.getElementById("comparisonToggleSection");

const battingToggle =
    document.getElementById("battingToggle");

const bowlingToggle =
    document.getElementById("bowlingToggle");

const comparisonCategoryTitle =
    document.getElementById("comparisonCategoryTitle");

const comparisonPeriodSummary =
    document.getElementById("comparisonPeriodSummary");

const comparisonRows =
    document.getElementById("comparisonRows");

const qualificationNotice =
    document.getElementById("qualificationNotice");

const qualificationNoticeText =
    document.getElementById("qualificationNoticeText");


/* ==========================================
   METRIC CONFIGURATION
========================================== */

const metricConfigurations = {

    batting: [

        {
            key: "runs",
            label: "Runs",
            better: "higher"
        },

        {
            key: "innings",
            label: "Innings",
            better: null
        },

        {
            key: "batting_average",
            label: "Batting Average",
            better: "higher"
        },

        {
            key: "strike_rate",
            label: "Strike Rate",
            better: "higher"
        },

        {
            key: "dot_ball_percentage",
            label: "Dot Ball %",
            better: "lower"
        },

        {
            key: "boundary_frequency",
            label: "Boundary Rate %",
            better: "higher"
        }

    ],


    bowling: [

        {
            key: "wickets",
            label: "Wickets",
            better: "higher"
        },

        {
            key: "innings",
            label: "Innings",
            better: null
        },

        {
            key: "bowling_average",
            label: "Bowling Average",
            better: "lower"
        },

        {
            key: "economy_rate",
            label: "Economy Rate",
            better: "lower"
        },

        {
            key: "bowling_strike_rate",
            label: "Bowling Strike Rate",
            better: "lower"
        },

        {
            key: "dot_ball_percentage",
            label: "Dot Ball %",
            better: "higher"
        }

    ]

};


/* ==========================================
   READ URL PARAMETERS
========================================== */

const urlParameters =
    new URLSearchParams(window.location.search);

const playerAParameter =
    urlParameters.get("playerA");

const playerBParameter =
    urlParameters.get("playerB");

const seasonsAParameter =
    urlParameters.get("seasonsA");

const seasonsBParameter =
    urlParameters.get("seasonsB");

const comparisonTypeParameter =
    urlParameters.get("type");


/* ==========================================
   LOAD COMPARISON REPORT
========================================== */

async function loadComparisonReport() {

    try {

        const apiURL =
            `/api/comparison-report?` +
            `playerA=${encodeURIComponent(playerAParameter)}` +
            `&playerB=${encodeURIComponent(playerBParameter)}` +
            `&seasonsA=${encodeURIComponent(seasonsAParameter)}` +
            `&seasonsB=${encodeURIComponent(seasonsBParameter)}` +
            `&type=${encodeURIComponent(comparisonTypeParameter)}`;


        const response =
            await fetch(apiURL);


        if (!response.ok) {

            const errorData =
                await response.json();

            throw new Error(
                errorData.error ||
                "Could not load comparison report."
            );

        }


        comparisonData =
            await response.json();


        console.log(
            "Comparison report loaded:",
            comparisonData
        );


        populateReportHeader();

        configureComparisonType();


    } catch (error) {

        console.error(
            "Error loading comparison report:",
            error
        );

    }

}


/* ==========================================
   POPULATE REPORT HEADER
========================================== */

function populateReportHeader() {

    const playerA =
        comparisonData.playerA;

    const playerB =
        comparisonData.playerB;


    playerAName.textContent =
        playerA.name;

    playerBName.textContent =
        playerB.name;


    tablePlayerAName.textContent =
        playerA.name;

    tablePlayerBName.textContent =
        playerB.name;


    playerASeasonSummary.textContent =
        formatSeasonSummary(
            playerA.seasons
        );

    playerBSeasonSummary.textContent =
        formatSeasonSummary(
            playerB.seasons
        );


    comparisonPeriodSummary.textContent =
        `${playerA.seasons.length} vs ` +
        `${playerB.seasons.length} seasons`;

}


/* ==========================================
   FORMAT SEASON SUMMARY
========================================== */

function formatSeasonSummary(seasons) {

    if (seasons.length === 1) {

        return `IPL ${seasons[0]}`;

    }


    return seasons
        .map(season => `IPL ${season}`)
        .join(" • ");

}


/* ==========================================
   CONFIGURE COMPARISON TYPE
========================================== */

function configureComparisonType() {

    const comparisonType =
        comparisonData.comparisonType;


    if (comparisonType === "batting") {

        activeComparisonCategory =
            "batting";

        comparisonToggleSection.classList.add(
            "hidden"
        );

    }


    else if (comparisonType === "bowling") {

        activeComparisonCategory =
            "bowling";

        comparisonToggleSection.classList.add(
            "hidden"
        );

    }


    else {

        activeComparisonCategory =
            "batting";

        comparisonToggleSection.classList.remove(
            "hidden"
        );

    }


    updateComparisonCategoryDisplay();

}


/* ==========================================
   UPDATE CATEGORY DISPLAY
========================================== */

function updateComparisonCategoryDisplay() {

    if (
        activeComparisonCategory === "batting"
    ) {

        comparisonCategoryTitle.textContent =
            "Batting Metrics";

        battingToggle.classList.add(
            "active"
        );

        bowlingToggle.classList.remove(
            "active"
        );

    }


    else {

        comparisonCategoryTitle.textContent =
            "Bowling Metrics";

        bowlingToggle.classList.add(
            "active"
        );

        battingToggle.classList.remove(
            "active"
        );

    }


    if (comparisonData) {

        renderComparison();

    }

}


/* ==========================================
   RENDER COMPARISON
========================================== */

function renderComparison() {

    comparisonRows.innerHTML = "";

    qualificationNotice.classList.add(
        "hidden"
    );


    const categoryData =
        comparisonData[
            activeComparisonCategory
        ];


    if (!categoryData) {

        return;

    }


    const playerAData =
        categoryData.playerA;

    const playerBData =
        categoryData.playerB;


    if (!playerAData || !playerBData) {

        qualificationNotice.classList.remove(
            "hidden"
        );


        qualificationNoticeText.textContent =
            `Insufficient ${activeComparisonCategory} ` +
            `data is available for this comparison.`;


        return;

    }


    const metrics =
        metricConfigurations[
            activeComparisonCategory
        ];


    metrics.forEach(metric => {

        createComparisonRow(
            metric,
            playerAData,
            playerBData
        );

    });


    showQualificationNotice(
        playerAData,
        playerBData
    );

}


/* ==========================================
   CREATE COMPARISON ROW
========================================== */

function createComparisonRow(
    metric,
    playerAData,
    playerBData
) {

    const valueA =
        playerAData[metric.key];

    const valueB =
        playerBData[metric.key];


    const winner =
        determineBetterValue(
            valueA,
            valueB,
            metric.better
        );


    const row =
        document.createElement("div");


    row.className =
        "comparison-row";


    row.innerHTML = `

        <div class="player-value">

            ${createValueDisplay(
                valueA,
                winner === "A",
                metric.key
            )}

        </div>


        <div class="metric-name">

            ${metric.label}

        </div>


        <div class="player-value player-b-value">

            ${createValueDisplay(
                valueB,
                winner === "B",
                metric.key
            )}

        </div>

    `;


    comparisonRows.appendChild(row);

}


/* ==========================================
   DETERMINE BETTER VALUE
========================================== */

function determineBetterValue(
    valueA,
    valueB,
    betterDirection
) {

    if (
        betterDirection === null ||
        valueA === null ||
        valueB === null ||
        valueA === valueB
    ) {

        return null;

    }


    if (betterDirection === "higher") {

        return valueA > valueB
            ? "A"
            : "B";

    }


    if (betterDirection === "lower") {

        return valueA < valueB
            ? "A"
            : "B";

    }


    return null;

}


/* ==========================================
   CREATE VALUE DISPLAY
========================================== */

/* ==========================================
   CREATE VALUE DISPLAY
========================================== */

function createValueDisplay(
    value,
    isBetter,
    metricKey
) {

    let displayedValue;

    if (value === null || value === undefined) {
        displayedValue = "N/A";
    } else if (metricKey === "boundary_frequency") {
        displayedValue = `${Number(value).toFixed(2)}%`;
    } else {
        displayedValue = value;
    }

    if (!isBetter) {
        return displayedValue;
    }

    return `
        <span class="better-value">
            ${displayedValue}
            <span class="better-arrow">
                ↑
            </span>
        </span>
    `;
}

/* ==========================================
   QUALIFICATION NOTICE
========================================== */

function showQualificationNotice(
    playerAData,
    playerBData
) {

    const unqualifiedPlayers = [];


    if (!playerAData.qualified) {

        unqualifiedPlayers.push(
            comparisonData.playerA.name
        );

    }


    if (!playerBData.qualified) {

        unqualifiedPlayers.push(
            comparisonData.playerB.name
        );

    }


    if (unqualifiedPlayers.length === 0) {

        qualificationNotice.classList.add(
            "hidden"
        );

        return;

    }


    qualificationNotice.classList.remove(
        "hidden"
    );


    qualificationNoticeText.textContent =

        `${unqualifiedPlayers.join(" and ")} ` +

        `did not have qualifying ` +

        `${activeComparisonCategory} data ` +

        `for every selected season. ` +

        `The comparison uses the available seasons only.`;

}


/* ==========================================
   TOGGLE EVENTS
========================================== */

battingToggle.addEventListener(
    "click",
    () => {

        if (
            comparisonData.comparisonType !== "both"
        ) {

            return;

        }


        activeComparisonCategory =
            "batting";


        updateComparisonCategoryDisplay();

    }
);


bowlingToggle.addEventListener(
    "click",
    () => {

        if (
            comparisonData.comparisonType !== "both"
        ) {

            return;

        }


        activeComparisonCategory =
            "bowling";


        updateComparisonCategoryDisplay();

    }
);


/* ==========================================
   INITIALIZE REPORT
========================================== */

loadComparisonReport();