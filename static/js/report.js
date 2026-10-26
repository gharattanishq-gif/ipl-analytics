const params = new URLSearchParams(window.location.search);

const player = params.get("player");
const seasonsParameter = params.get("seasons");

let selectedSeasons = [];
let seasonProgressionChart = null;
let performanceProfileChart = null;
let currentReportData = null;

let activeProgressionType = "batting";
let activeProfileType = "batting";
let activeStatisticsType = "batting";


if (seasonsParameter) {
    selectedSeasons = seasonsParameter.split(",");
}


/* ==========================================
   INSUFFICIENT DATA PLUGIN
========================================== */

const insufficientDataPlugin = {

    id: "insufficientData",

    afterDraw(chart, args, options) {

        if (!options.display) {
            return;
        }

        const { ctx, chartArea } = chart;

        ctx.save();

        ctx.font = "15px Arial";
        ctx.fillStyle = "#9ca3af";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const centerX =
            (chartArea.left + chartArea.right) / 2;

        const centerY =
            (chartArea.top + chartArea.bottom) / 2;


        const message = options.message ||
    `Insufficient qualifying ${options.type} data`;

ctx.fillText(message, centerX, centerY);

        ctx.restore();
    }
};


Chart.register(insufficientDataPlugin);


/* ==========================================
   HELPER FUNCTIONS
========================================== */

function getSeasonStartYear(season) {

    return parseInt(
        season.toString().split("/")[0]
    );

}

function formatSeason(season) {

    season = String(season);

    if (!season.includes("/")) {
        return season;
    }

    const [start, end] = season.split("/");

    return start.slice(0, 2) + end;
}

/* FORMAT EXCLUDED SEASONS */

function formatExcludedSeasons(seasons) {

    const sortedSeasons = [...seasons].sort(

        (a, b) =>
            getSeasonStartYear(a)
            -
            getSeasonStartYear(b)

    );


    const formattedSeasons =
        sortedSeasons.map(
            season => `IPL ${formatSeason(season)}`
        );


    if (formattedSeasons.length === 1) {

        return formattedSeasons[0];

    }


    if (formattedSeasons.length === 2) {

        return (
            `${formattedSeasons[0]} and ` +
            `${formattedSeasons[1]}`
        );

    }


    return (

        formattedSeasons
            .slice(0, -1)
            .join(", ")

        +

        `, and ${
            formattedSeasons[
                formattedSeasons.length - 1
            ]
        }`

    );

}


/* ==========================================
   DISPLAY PLAYER INFORMATION
========================================== */

document.getElementById("playerName").textContent =
    player || "Unknown Player";

document.getElementById("playerPanelName").textContent =
    player || "Unknown Player";


if (player) {

    const initials = player
        .split(" ")
        .map(word => word[0])
        .join("");

    document.getElementById("playerInitials").textContent =
        initials;

}


/* ==========================================
   DISPLAY SELECTED SEASONS
========================================== */

if (selectedSeasons.length > 0) {

    document.getElementById("selectedSeasons").textContent =
        selectedSeasons
        .map(formatSeason)
        .join(", ");


    const sortedSeasons = [...selectedSeasons].sort(

        (a, b) =>
            getSeasonStartYear(a)
            -
            getSeasonStartYear(b)

    );


    if (sortedSeasons.length === 1) {

        document.getElementById("seasonRange").textContent =
            `IPL ${formatSeason(sortedSeasons[0])}`;

    } else {

        document.getElementById("seasonRange").textContent =

            `IPL ${formatSeason(sortedSeasons[0])} – ` +

            `${formatSeason(sortedSeasons[
                sortedSeasons.length - 1
            ])}`;

    }

}


/* ==========================================
   ELEMENT REFERENCES
========================================== */


/* PROGRESSION BUTTONS */

const battingProgressionButton =
    document.getElementById(
        "battingProgressionButton"
    );

const bowlingProgressionButton =
    document.getElementById(
        "bowlingProgressionButton"
    );


/* PROFILE BUTTONS */

const battingProfileButton =
    document.getElementById(
        "battingProfileButton"
    );

const bowlingProfileButton =
    document.getElementById(
        "bowlingProfileButton"
    );


/* DETAILED STATISTICS */

const viewDetailedStatisticsButton =
    document.getElementById(
        "viewDetailedStatisticsButton"
    );

const detailedStatisticsContent =
    document.getElementById(
        "detailedStatisticsContent"
    );

const battingStatisticsButton =
    document.getElementById(
        "battingStatisticsButton"
    );

const bowlingStatisticsButton =
    document.getElementById(
        "bowlingStatisticsButton"
    );

const statisticsTableContainer =
    document.getElementById(
        "statisticsTableContainer"
    );

const statisticsTableHead =
    document.getElementById(
        "statisticsTableHead"
    );

const statisticsTableBody =
    document.getElementById(
        "statisticsTableBody"
    );

const qualificationNotice =
    document.getElementById(
        "qualificationNotice"
    );

const qualificationNoticeText =
    document.getElementById(
        "qualificationNoticeText"
    );

const statisticsUnavailable =
    document.getElementById(
        "statisticsUnavailable"
    );

const statisticsUnavailableText =
    document.getElementById(
        "statisticsUnavailableText"
    );


/* QUALIFICATION MODAL */

const viewQualificationCriteriaButton =
    document.getElementById(
        "viewQualificationCriteriaButton"
    );

const qualificationModal =
    document.getElementById(
        "qualificationModal"
    );

const closeQualificationModal =
    document.getElementById(
        "closeQualificationModal"
    );


/* ==========================================
   LOAD PLAYER REPORT
========================================== */

async function loadPlayerReport() {

    try {

        const apiURL =

            `/api/player-report?player=${encodeURIComponent(player)}` +

            `&seasons=${encodeURIComponent(seasonsParameter)}`;


        const response = await fetch(apiURL);


        if (!response.ok) {

            throw new Error(
                "Could not load player report."
            );

        }


        const reportData =
            await response.json();


        currentReportData =
            reportData;


        console.log(
            "Player Report Data:",
            reportData
        );


        /* PERFORMANCE INDICES */

        displayPerformanceIndices(
            reportData
        );


        /* PERFORMANCE RATING */

        displayPerformanceRating(
            reportData
        );


        /* PROGRESSION CHART */

        setDefaultProgressionType(
            reportData
        );

        displaySeasonProgressionChart(

            reportData,

            activeProgressionType

        );


        /* PERFORMANCE PROFILE */

        setDefaultProfileType(
            reportData
        );

        displayPerformanceProfileChart(

            reportData,

            activeProfileType

        );


        /* DETAILED STATISTICS */

        setDefaultStatisticsType(
            reportData
        );

        displayActiveStatistics(
            reportData
        );


    } catch (error) {

        console.error(
            "Error loading player report:",
            error
        );

    }

}


/* ==========================================
   DISPLAY PERFORMANCE INDICES
========================================== */

function displayPerformanceIndices(reportData) {

    const battingIndex =
        reportData.overall_batting_index;

    const bowlingIndex =
        reportData.overall_bowling_index;


    /* BATTING INDEX */

    const battingIndexElement =
        document.getElementById(
            "battingIndex"
        );

    const battingIndexFill =
        battingIndexElement
            .closest(".index-card")
            .querySelector(".index-fill");


    if (battingIndex !== null) {

        battingIndexElement.textContent =
            battingIndex.toFixed(2);

        battingIndexFill.style.width =
            `${battingIndex}%`;

    } else {

        battingIndexElement.textContent =
            "N/A";

        battingIndexFill.style.width =
            "0%";

    }


    /* BOWLING INDEX */

    const bowlingIndexElement =
        document.getElementById(
            "bowlingIndex"
        );

    const bowlingIndexFill =
        bowlingIndexElement
            .closest(".index-card")
            .querySelector(".index-fill");


    if (bowlingIndex !== null) {

        bowlingIndexElement.textContent =
            bowlingIndex.toFixed(2);

        bowlingIndexFill.style.width =
            `${bowlingIndex}%`;

    } else {

        bowlingIndexElement.textContent =
            "N/A";

        bowlingIndexFill.style.width =
            "0%";

    }

}


/* ==========================================
   DISPLAY PERFORMANCE RATING
========================================== */

function displayPerformanceRating(reportData) {

    const battingIndex =
        reportData.overall_batting_index;

    const bowlingIndex =
        reportData.overall_bowling_index;


    const availableIndices = [

        battingIndex,

        bowlingIndex

    ].filter(
        index => index !== null
    );


    const ratingElement =
        document.getElementById(
            "performanceRating"
        );

    const starsElement =
        document.getElementById(
            "performanceStars"
        );


    if (availableIndices.length === 0) {

        ratingElement.textContent =
            "N/A";

        starsElement.textContent =
            "☆ ☆ ☆ ☆ ☆";

        return;

    }


    const highestIndex =
        Math.max(...availableIndices);


    const performanceRating =
        highestIndex / 20;


    ratingElement.textContent =
        `${performanceRating.toFixed(2)} / 5.0`;


    const roundedRating =
        Math.round(performanceRating);


    let stars = "";


    for (let i = 1; i <= 5; i++) {

        if (i <= roundedRating) {

            stars += "★ ";

        } else {

            stars += "☆ ";

        }

    }


    starsElement.textContent =
        stars.trim();

}


/* ==========================================
   SET DEFAULT PROGRESSION TYPE
========================================== */

function setDefaultProgressionType(reportData) {

    if (reportData.batting_records.length > 0) {

        activeProgressionType =
            "batting";

        battingProgressionButton
            .classList
            .add("active");

        bowlingProgressionButton
            .classList
            .remove("active");

    } else {

        activeProgressionType =
            "bowling";

        bowlingProgressionButton
            .classList
            .add("active");

        battingProgressionButton
            .classList
            .remove("active");

    }

}


/* ==========================================
   DISPLAY SEASON PROGRESSION CHART
========================================== */



function displaySeasonProgressionChart(reportData, type) {

    const isBatting = type === "batting";
    const isSingleSeason = selectedSeasons.length === 1;

    const chartCanvas = document.getElementById(
        "seasonProgressionChart"
    );

    let chartType;
    let labels = [];
    let values = [];
    let metricLabel;
    let axisMaximum;
    let axisStep;
    let axisTitle;
    let chartColor;

    /* ==========================================
       SINGLE SEASON: MATCH-BY-MATCH BAR CHART
    ========================================== */

    if (isSingleSeason) {

        const allRecords = reportData.match_records || [];

        const selectedSeason = String(selectedSeasons[0]);

        const records = allRecords
            .filter(record => {

                if (String(record.season) !== selectedSeason) {
                    return false;
                }

                if (isBatting) {
                    return Number(record.balls_faced) > 0 ||
                           Number(record.runs) > 0;
                }

                return Number(record.balls_bowled) > 0 ||
                       Number(record.wickets) > 0;
            })
            .sort((a, b) =>
                Number(a.match_id) - Number(b.match_id)
            );

        chartType = "bar";

        metricLabel = isBatting ? "Runs" : "Wickets";

        axisMaximum = isBatting ? 150 : 10;
        axisStep = isBatting ? 25 : 1;
        axisTitle = metricLabel;

        chartColor = isBatting ? "#36A2EB" : "#FF6384";

        labels = records.map((record, index) =>
            `Match ${index + 1}`
        );

        values = records.map(record =>
            isBatting
                ? Number(record.runs) || 0
                : Number(record.wickets) || 0
        );
    }

    /* ==========================================
       MULTIPLE SEASONS: SEASONAL INDEX LINE CHART
    ========================================== */

    else {

        const sourceRecords = isBatting
            ? reportData.batting_records
            : reportData.bowling_records;

        const records = [...(sourceRecords || [])]
            .filter(record =>
                selectedSeasons.includes(String(record.season))
            )
            .sort((a, b) =>
                getSeasonStartYear(a.season) -
                getSeasonStartYear(b.season)
            );

        chartType = "line";

        metricLabel = isBatting
            ? "Batting Index"
            : "Bowling Index";

        axisMaximum = 100;
        axisStep = 20;
        axisTitle = "Index (0–100)";

        chartColor = isBatting ? "#36A2EB" : "#FF6384";

        labels = records.map(record =>
            `IPL ${formatSeason(record.season)}`
        );

        values = records.map(record =>
            Number(
                isBatting
                    ? record.batting_index
                    : record.bowling_index
            )
        );
    }

    /* ==========================================
       UPDATE CHART HEADING
    ========================================== */

    const chartCard = chartCanvas.closest(".report-card");

if (chartCard) {
    const heading = chartCard.querySelector(".card-header h2");

    if (heading) {
        heading.textContent = selectedSeasons.length === 1
            ? "Match-by-Match Performance"
            : "Season-by-Season Performance";
    }
}
    /* ==========================================
       REBUILD CHART
    ========================================== */

    if (seasonProgressionChart) {
        seasonProgressionChart.destroy();
    }

    const hasData = values.some(Number.isFinite);

    const dataset = {
        label: metricLabel,
        data: values,

        borderColor: chartColor,
        backgroundColor: chartType === "bar"
            ? chartColor
            : "rgba(54, 162, 235, 0.15)",

        borderWidth: 2,

        spanGaps: false
    };

    if (chartType === "bar") {

        dataset.borderRadius = 4;
        dataset.maxBarThickness = 32;

    } else {

        dataset.fill = false;
        dataset.tension = 0.25;
        dataset.pointRadius = 4;
        dataset.pointHoverRadius = 6;
        dataset.pointBackgroundColor = chartColor;
        dataset.backgroundColor = chartColor;

    }

    seasonProgressionChart = new Chart(chartCanvas, {

        type: chartType,

        data: {
            labels: labels,
            datasets: [dataset]
        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                mode: "index",
                intersect: false
            },

            scales: {

                y: {
                    display: true,
                    beginAtZero: true,
                    min: 0,
                    max: axisMaximum,

                    ticks: {
                        stepSize: axisStep
                    },

                    title: {
                        display: true,
                        text: axisTitle
                    }
                },

                x: {
                    display: true,

                    title: {
                        display: true,
                        text: isSingleSeason ? "Match" : "Season"
                    }
                }
            },

            plugins: {

                legend: {
                    display: hasData
                },

                insufficientData: {
                    display: !hasData,
                    type: type,

                    message: isSingleSeason
                        ? `No ${metricLabel.toLowerCase()} match data available`
                        : `No seasonal ${metricLabel.toLowerCase()} data available`
                },

                tooltip: {
                    callbacks: {
                        label: context =>
                            `${metricLabel}: ${context.parsed.y}`
                    }
                }
            }
        }
    });
}


/* ==========================================
   SET DEFAULT PROFILE TYPE
========================================== */

function setDefaultProfileType(reportData) {

    if (reportData.batting_records.length > 0) {

        activeProfileType =
            "batting";

        battingProfileButton
            .classList
            .add("active");

        bowlingProfileButton
            .classList
            .remove("active");

    } else {

        activeProfileType =
            "bowling";

        bowlingProfileButton
            .classList
            .add("active");

        battingProfileButton
            .classList
            .remove("active");

    }

}


/* ==========================================
   CALCULATE AVERAGE SCORE
========================================== */

function calculateAverageScore(
    records,
    metric
) {

    if (records.length === 0) {

        return 0;

    }


    const total =
        records.reduce(

            (sum, record) =>
                sum + record[metric],

            0

        );


    return Number(

        (
            total /
            records.length
        ).toFixed(2)

    );

}


/* ==========================================
   DISPLAY PERFORMANCE PROFILE
========================================== */

function displayPerformanceProfileChart(
    reportData,
    type
) {

    const records =

        type === "batting"
            ? reportData.batting_records
            : reportData.bowling_records;


    const hasData =
        records.length > 0;


    const chartCanvas =
        document.getElementById(
            "performanceProfileChart"
        );


    let labels = [];

    let profileData = [];


    /* BATTING PROFILE */

    if (type === "batting") {

        labels = [

            "Average",

            "Strike Rate",

            "Team Contribution",

            "Dot Ball Control",

            "Boundary Frequency"

        ];


        profileData = [

            calculateAverageScore(
                records,
                "average_score"
            ),

            calculateAverageScore(
                records,
                "strike_rate_score"
            ),

            calculateAverageScore(
                records,
                "contribution_score"
            ),

            calculateAverageScore(
                records,
                "dot_ball_score"
            ),

            calculateAverageScore(
                records,
                "boundary_frequency_score"
            )

        ];

    }


    /* BOWLING PROFILE */

    else {

        labels = [

            "Average",

            "Strike Rate",

            "Economy",

            "Wicket Contribution",

            "Dot Ball %"

        ];


        profileData = [

            calculateAverageScore(
                records,
                "average_score"
            ),

            calculateAverageScore(
                records,
                "strike_rate_score"
            ),

            calculateAverageScore(
                records,
                "economy_score"
            ),

            calculateAverageScore(
                records,
                "contribution_score"
            ),

            calculateAverageScore(
                records,
                "dot_ball_score"
            )

        ];

    }


    if (performanceProfileChart) {

        performanceProfileChart.destroy();

    }


    performanceProfileChart =
        new Chart(

            chartCanvas,

            {

                type: "radar",

                data: {

                    labels: labels,

                    datasets:

                        hasData

                            ? [

                                {

                                    label:

                                        type === "batting"
                                            ? "Batting Profile"
                                            : "Bowling Profile",

                                    data:
                                        profileData,

                                    borderColor:

                                        type === "batting"
                                            ? "#36A2EB"
                                            : "#FF6384",

                                    backgroundColor:

                                        type === "batting"
                                            ? "rgba(54, 162, 235, 0.20)"
                                            : "rgba(255, 99, 132, 0.20)",

                                    pointBackgroundColor:

                                        type === "batting"
                                            ? "#36A2EB"
                                            : "#FF6384",

                                    pointBorderColor:
                                        "#ffffff",

                                    borderWidth:
                                        2

                                }

                            ]

                            : []

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    scales: {

                        r: {

                            display: hasData,

                            beginAtZero: true,

                            min: 0,

                            max: 100,

                            ticks: {

                                stepSize: 20

                            }

                        }

                    },


                    plugins: {

                        legend: {

                            display: false

                        },

                        insufficientData: {

                            display: !hasData,

                            type: type

                        }

                    }

                }

            }

        );

}


/* ==========================================
   SET DEFAULT STATISTICS TYPE
========================================== */

function setDefaultStatisticsType(reportData) {

    if (reportData.batting_records.length > 0) {

        activeStatisticsType =
            "batting";

        battingStatisticsButton
            .classList
            .add("active");

        bowlingStatisticsButton
            .classList
            .remove("active");

    } else {

        activeStatisticsType =
            "bowling";

        bowlingStatisticsButton
            .classList
            .add("active");

        battingStatisticsButton
            .classList
            .remove("active");

    }

}


/* ==========================================
   DISPLAY ACTIVE STATISTICS
========================================== */

function displayActiveStatistics(reportData) {

    if (activeStatisticsType === "batting") {

        displayBattingStatistics(
            reportData
        );

    } else {

        displayBowlingStatistics(
            reportData
        );

    }

}


/* ==========================================
   DISPLAY BATTING STATISTICS
========================================== */

function displayBattingStatistics(reportData) {

    const records = [
        ...reportData.batting_records
    ].sort(

        (a, b) =>
            getSeasonStartYear(a.season)
            -
            getSeasonStartYear(b.season)

    );


    const qualifyingSeasons =
        records.map(
            record => record.season
        );


    const nonQualifyingSeasons =
        selectedSeasons.filter(

            season =>
                !qualifyingSeasons.includes(season)

        );


    /* RESET DISPLAY */

    qualificationNotice
        .classList
        .add("hidden");

    statisticsUnavailable
        .classList
        .add("hidden");

    statisticsTableContainer
        .classList
        .remove("hidden");


    /* BATTING HEADER THEME */

    statisticsTableHead
        .classList
        .remove("bowling-table-header");

    statisticsTableHead
        .classList
        .add("batting-table-header");


    /* NO QUALIFYING DATA */

    if (records.length === 0) {

        statisticsTableContainer
            .classList
            .add("hidden");

        statisticsUnavailable
            .classList
            .remove("hidden");

        statisticsUnavailableText.textContent =
            "Insufficient qualifying batting data for the selected period.";

        return;

    }


    /* PARTIAL QUALIFICATION */

    if (nonQualifyingSeasons.length > 0) {

        qualificationNotice
            .classList
            .remove("hidden");


        const seasonText =
            formatExcludedSeasons(
                nonQualifyingSeasons
            );


        qualificationNoticeText.textContent =

            `The player did not meet the minimum batting ` +

            `qualification criteria for the following selected ` +

            `seasons: ${seasonText}. ` +

            `These seasons have been excluded from the ` +

            `detailed statistics.`;

    }


    statisticsTableHead.innerHTML = `

        <tr>

            <th>Season</th>

            <th>Inns</th>

            <th>Runs</th>

            <th>Balls</th>

            <th>Avg</th>

            <th>SR</th>

            <th>Dot %</th>

            <th>Boundary Freq.</th>

            <th>Contribution %</th>

            <th>Batting Index</th>

        </tr>

    `;


    statisticsTableBody.innerHTML =

        records.map(record => `

            <tr>

                <td>${formatSeason(record.season)}</td>

                <td>${formatSeason(record.innings)}</td>

                <td>${record.runs}</td>

                <td>${record.balls_faced}</td>

                <td>
                    ${record.batting_average.toFixed(2)}
                </td>

                <td>
                    ${record.strike_rate.toFixed(2)}
                </td>

                <td>
                    ${record.dot_ball_percentage.toFixed(2)}
                </td>

                <td>
                    ${record.boundary_frequency.toFixed(2)}
                </td>

                <td>
                    ${record.team_contribution_percentage.toFixed(2)}
                </td>

                <td>
                    ${record.batting_index.toFixed(2)}
                </td>

            </tr>

        `).join("");

}


/* ==========================================
   DISPLAY BOWLING STATISTICS
========================================== */

function displayBowlingStatistics(reportData) {

    const records = [
        ...reportData.bowling_records
    ].sort(

        (a, b) =>
            getSeasonStartYear(a.season)
            -
            getSeasonStartYear(b.season)

    );


    const qualifyingSeasons =
        records.map(
            record => record.season
        );


    const nonQualifyingSeasons =
        selectedSeasons.filter(

            season =>
                !qualifyingSeasons.includes(season)

        );


    /* RESET DISPLAY */

    qualificationNotice
        .classList
        .add("hidden");

    statisticsUnavailable
        .classList
        .add("hidden");

    statisticsTableContainer
        .classList
        .remove("hidden");


    /* BOWLING HEADER THEME */

    statisticsTableHead
        .classList
        .remove("batting-table-header");

    statisticsTableHead
        .classList
        .add("bowling-table-header");


    /* NO QUALIFYING DATA */

    if (records.length === 0) {

        statisticsTableContainer
            .classList
            .add("hidden");

        statisticsUnavailable
            .classList
            .remove("hidden");

        statisticsUnavailableText.textContent =
            "Insufficient qualifying bowling data for the selected period.";

        return;

    }


    /* PARTIAL QUALIFICATION */

    if (nonQualifyingSeasons.length > 0) {

        qualificationNotice
            .classList
            .remove("hidden");


        const seasonText =
            formatExcludedSeasons(
                nonQualifyingSeasons
            );


        qualificationNoticeText.textContent =

            `The player did not meet the minimum bowling ` +

            `qualification criteria for the following selected ` +

            `seasons: ${seasonText}. ` +

            `These seasons have been excluded from the ` +

            `detailed statistics.`;

    }


    statisticsTableHead.innerHTML = `

        <tr>

            <th>Season</th>

            <th>Inns</th>

            <th>Wickets</th>

            <th>Balls</th>

            <th>Average</th>

            <th>Economy</th>

            <th>Strike Rate</th>

            <th>Dot %</th>

            <th>Contribution %</th>

            <th>Bowling Index</th>

        </tr>

    `;


    statisticsTableBody.innerHTML =

        records.map(record => `

            <tr>

                <td>${record.season}</td>

                <td>${record.innings}</td>

                <td>${record.wickets}</td>

                <td>${record.balls_bowled}</td>

                <td>
                    ${record.bowling_average.toFixed(2)}
                </td>

                <td>
                    ${record.economy_rate.toFixed(2)}
                </td>

                <td>
                    ${record.bowling_strike_rate.toFixed(2)}
                </td>

                <td>
                    ${record.dot_ball_percentage.toFixed(2)}
                </td>

                <td>
                    ${record.team_wicket_contribution_percentage.toFixed(2)}
                </td>

                <td>
                    ${record.bowling_index.toFixed(2)}
                </td>

            </tr>

        `).join("");

}


/* ==========================================
   PROGRESSION TOGGLE
========================================== */

battingProgressionButton.addEventListener(

    "click",

    () => {

        if (!currentReportData) {
            return;
        }


        activeProgressionType =
            "batting";


        battingProgressionButton
            .classList
            .add("active");

        bowlingProgressionButton
            .classList
            .remove("active");


        displaySeasonProgressionChart(
            currentReportData,
            "batting"
        );

    }

);


bowlingProgressionButton.addEventListener(

    "click",

    () => {

        if (!currentReportData) {
            return;
        }


        activeProgressionType =
            "bowling";


        bowlingProgressionButton
            .classList
            .add("active");

        battingProgressionButton
            .classList
            .remove("active");


        displaySeasonProgressionChart(
            currentReportData,
            "bowling"
        );

    }

);


/* ==========================================
   PROFILE TOGGLE
========================================== */

battingProfileButton.addEventListener(

    "click",

    () => {

        if (!currentReportData) {
            return;
        }


        activeProfileType =
            "batting";


        battingProfileButton
            .classList
            .add("active");

        bowlingProfileButton
            .classList
            .remove("active");


        displayPerformanceProfileChart(
            currentReportData,
            "batting"
        );

    }

);


bowlingProfileButton.addEventListener(

    "click",

    () => {

        if (!currentReportData) {
            return;
        }


        activeProfileType =
            "bowling";


        bowlingProfileButton
            .classList
            .add("active");

        battingProfileButton
            .classList
            .remove("active");


        displayPerformanceProfileChart(
            currentReportData,
            "bowling"
        );

    }

);


/* ==========================================
   STATISTICS TOGGLE
========================================== */

battingStatisticsButton.addEventListener(

    "click",

    () => {

        if (!currentReportData) {
            return;
        }


        activeStatisticsType =
            "batting";


        battingStatisticsButton
            .classList
            .add("active");

        bowlingStatisticsButton
            .classList
            .remove("active");


        displayBattingStatistics(
            currentReportData
        );

    }

);


bowlingStatisticsButton.addEventListener(

    "click",

    () => {

        if (!currentReportData) {
            return;
        }


        activeStatisticsType =
            "bowling";


        bowlingStatisticsButton
            .classList
            .add("active");

        battingStatisticsButton
            .classList
            .remove("active");


        displayBowlingStatistics(
            currentReportData
        );

    }

);


/* ==========================================
   DETAILED STATISTICS PANEL
========================================== */

viewDetailedStatisticsButton.addEventListener(

    "click",

    () => {

        const isHidden =

            detailedStatisticsContent
                .classList
                .contains("hidden");


        if (isHidden) {

            detailedStatisticsContent
                .classList
                .remove("hidden");

            viewDetailedStatisticsButton.textContent =
                "Hide Detailed Statistics ↑";

        } else {

            detailedStatisticsContent
                .classList
                .add("hidden");

            viewDetailedStatisticsButton.textContent =
                "View Detailed Statistics →";

        }

    }

);


/* ==========================================
   QUALIFICATION MODAL
========================================== */

viewQualificationCriteriaButton.addEventListener(

    "click",

    () => {

        qualificationModal
            .classList
            .remove("hidden");

    }

);


closeQualificationModal.addEventListener(

    "click",

    () => {

        qualificationModal
            .classList
            .add("hidden");

    }

);


qualificationModal.addEventListener(

    "click",

    event => {

        if (event.target === qualificationModal) {

            qualificationModal
                .classList
                .add("hidden");

        }

    }

);


/* ==========================================
   START API REQUEST
========================================== */

loadPlayerReport();