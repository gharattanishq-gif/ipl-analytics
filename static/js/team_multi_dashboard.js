/* ==========================================================
   TEAM MULTI-SEASON DASHBOARD
   Uses ONLY the seasons passed in the URL.

   Expected URL:
   /team/multi?team=Chennai%20Super%20Kings&seasons=2014,2015,2016,2017,2018,2019
========================================================== */


/* ==========================================================
   READ URL PARAMETERS
========================================================== */

const urlParams = new URLSearchParams(
    window.location.search
);

const team = urlParams.get("team");

const seasonsParameter =
    urlParams.get("seasons");


/* ==========================================================
   PARSE + SORT SELECTED SEASONS
========================================================== */

let selectedSeasons = [];

if (seasonsParameter) {

    selectedSeasons =
        seasonsParameter
            .split(",")
            .map(
                season => season.trim()
            )
            .filter(Boolean);
}


/* ==========================================================
   GET SEASON START YEAR
========================================================== */

function getSeasonStartYear(season) {

    const value =
        String(season).trim();

    /*
       Handles:

       2014
       2014/15
       2020/21
    */

    const year =
        parseInt(
            value.split("/")[0],
            10
        );

    return Number.isNaN(year)
        ? 9999
        : year;
}


/* ==========================================================
   SORT SEASONS CHRONOLOGICALLY
========================================================== */

selectedSeasons.sort(
    (a, b) =>
        getSeasonStartYear(a) -
        getSeasonStartYear(b)
);


/* ==========================================================
   DISPLAY HEADER + SELECTED PERIOD
========================================================== */

function displayHeader() {

    const teamNameElement =
        document.getElementById(
            "team-name"
        );


    if (teamNameElement) {

        teamNameElement.textContent =
            team
                ? `${team} — Multi-Season Analysis`
                : "Team Multi-Season Analysis";
    }


    const seasonRange =
        document.getElementById(
            "season-range"
        );


    if (!seasonRange) {
        return;
    }


    /* ------------------------------------------------------
       NO SEASONS
    ------------------------------------------------------ */

    if (
        selectedSeasons.length === 0
    ) {

        seasonRange.innerHTML = `
            <option
                value="selected"
                selected
            >
                No Seasons Selected
            </option>
        `;

        return;
    }


    /*
       IMPORTANT:

       The dashboard must NOT decide:

       Last 3 Seasons
       Last 5 Seasons
       All Seasons

       The selection page already decided the seasons.

       Therefore the URL is the source of truth.
    */


    let label;


    /* ------------------------------------------------------
       ONE SEASON
    ------------------------------------------------------ */

    if (
        selectedSeasons.length === 1
    ) {

        label =
            `IPL ${selectedSeasons[0]}`;
    }


    /* ------------------------------------------------------
       MULTIPLE SEASONS
    ------------------------------------------------------ */

    else {

        const first =
            selectedSeasons[0];

        const last =
            selectedSeasons[
                selectedSeasons.length - 1
            ];


        /*
           Check whether the seasons are continuous.

           Example:

           2014
           2015
           2016
           2017
           2018
           2019

           => IPL 2014 – 2019


           But:

           2014
           2015
           2018
           2019

           => 4 Seasons Selected
        */

        const years =
            selectedSeasons.map(
                getSeasonStartYear
            );


        const isContinuous =
            years.every(
                (year, index) => {

                    if (index === 0) {
                        return true;
                    }

                    return (
                        year ===
                        years[index - 1] + 1
                    );
                }
            );


        if (isContinuous) {

            label =
                `IPL ${first} – ${last}`;
        }

        else {

            label =
                `${selectedSeasons.length} Seasons Selected`;
        }
    }


    /* ------------------------------------------------------
       UPDATE SELECTOR
    ------------------------------------------------------ */

    seasonRange.innerHTML = `
        <option
            value="selected"
            selected
        >
            ${label}
        </option>
    `;


    /*
       Disable it because the season selection has already
       happened on the previous page.

       This prevents a second "Last 5 Seasons" selector
       from overriding the original selection.
    */

    seasonRange.disabled = true;
}


/* ==========================================================
   GLOBAL DATA
========================================================== */

let currentData = null;


/* ==========================================================
   INITIALIZE DASHBOARD
========================================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeDashboard
);


async function initializeDashboard() {

    displayHeader();


    try {

        /* --------------------------------------------------
           VALIDATE TEAM
        -------------------------------------------------- */

        if (!team) {

            throw new Error(
                "No team was selected."
            );
        }


        /* --------------------------------------------------
           VALIDATE SEASONS
        -------------------------------------------------- */

        if (
            selectedSeasons.length === 0
        ) {

            throw new Error(
                "No seasons were selected. Please return to Team Analysis and select seasons."
            );
        }


        showLoading();


        /*
           IMPORTANT:

           We DO NOT call /api/team-seasons here.

           The exact seasons selected by the user are already
           present in the URL.
        */

        await loadDashboard();

    }


    catch (error) {

        console.error(
            "Dashboard initialization error:",
            error
        );


        showError(
            error.message
        );
    }
}


/* ==========================================================
   LOAD DASHBOARD DATA
========================================================== */

async function loadDashboard() {

    if (!team) {

        throw new Error(
            "No team was selected."
        );
    }


    if (
        selectedSeasons.length === 0
    ) {

        throw new Error(
            "No seasons were selected."
        );
    }


    /*
       SEND EXACT SELECTED SEASONS

       Example:

       seasons=2014,2015,2016,2017,2018,2019
    */

    const apiURL =
        `/api/team-multi-dashboard` +
        `?team=${encodeURIComponent(team)}` +
        `&seasons=${encodeURIComponent(
            selectedSeasons.join(",")
        )}`;


    console.log(
        "Loading team multi-season dashboard:",
        apiURL
    );


    const response =
        await fetch(apiURL);


    if (!response.ok) {

        throw new Error(
            `Could not load team multi-season data. (${response.status})`
        );
    }


    const data =
        await response.json();


    console.log(
        "Team Multi-Season Data:",
        data
    );


    currentData =
        data;


    /*
       EXPECTED API STRUCTURE:

       {
           overview: {...},

           batting_trends: [...],

           bowling_trends: [...],

           department_trends: [...],

           dependency_trends: [...],

           season_records: [...]
       }
    */


    const overview =
        data.overview || {};


    const battingTrends =
        data.batting_trends || [];


    const bowlingTrends =
        data.bowling_trends || [];


    const departmentTrends =
        data.department_trends || [];


    const dependencyTrends =
        data.dependency_trends || [];


    const seasonRecords =
        data.season_records || [];


    /* ------------------------------------------------------
       RENDER ALL SECTIONS
    ------------------------------------------------------ */

    renderOverview(
        overview
    );


    renderStrengthTrend(
        battingTrends,
        bowlingTrends
    );


    renderDepartmentTimeline(
        departmentTrends
    );


    renderDependencyTrend(
        dependencyTrends
    );


    renderSeasonTable(
        seasonRecords
    );


    renderEvolutionInsights(
        seasonRecords
    );


    hideLoading();
}


/* ==========================================================
   OVERVIEW
========================================================== */

function renderOverview(
    overview
) {

    const container =
        document.getElementById(
            "overview-grid"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    const cards = [

        {
            label:
                "Seasons Analysed",

            value:
                overview.seasons_analyzed ??
                overview.seasons_analysed ??
                selectedSeasons.length
        },


        {
            label:
                "Matches",

            value:
                overview.total_matches ??
                overview.matches ??
                0
        },


        {
            label:
                "Wins",

            value:
                overview.total_wins ??
                overview.wins ??
                0
        },


        {
            label:
                "Losses",

            value:
                overview.total_losses ??
                overview.losses ??
                0
        },


        {
            label:
                "Overall Win %",

            value:
                `${formatNumber(
                    overview.overall_win_percentage ??
                    overview.overall_win_percent ??
                    0
                )}%`
        },


        {
            label:
                "Total Runs",

            value:
                formatNumber(
                    overview.total_runs ??
                    0
                )
        },


        {
            label:
                "Total Wickets",

            value:
                formatNumber(
                    overview.total_wickets ??
                    0
                )
        }

    ];


    cards.forEach(
        card => {

            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "overview-card";


            element.innerHTML = `

                <span
                    class="overview-label"
                >
                    ${card.label}
                </span>


                <strong
                    class="overview-value"
                >
                    ${card.value}
                </strong>

            `;


            container.appendChild(
                element
            );
        }
    );
}


/* ==========================================================
   STRENGTH TREND
========================================================== */

function renderStrengthTrend(
    battingData,
    bowlingData
) {

    const container =
        document.getElementById(
            "strength-chart"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        (!battingData ||
            battingData.length === 0)
        &&
        (!bowlingData ||
            bowlingData.length === 0)
    ) {

        container.innerHTML =
            emptyMessage(
                "Strength trend data is unavailable."
            );

        return;
    }


    /*
       Keep the chart aligned with the exact seasons
       selected by the user.
    */

    const seasons =
        getAllSeasons(
            battingData || [],
            bowlingData || []
        );


    const values = [

        ...(battingData || [])
            .map(
                item =>
                    Number(item.score)
            ),

        ...(bowlingData || [])
            .map(
                item =>
                    Number(item.score)
            )

    ].filter(
        value =>
            Number.isFinite(value)
    );


    const maxValue =
        Math.max(
            100,
            ...values
        );


    const chart =
        document.createElement(
            "div"
        );


    chart.className =
        "simple-line-chart";


    /* ------------------------------------------------------
       LEGEND
    ------------------------------------------------------ */

    const legend =
        document.createElement(
            "div"
        );


    legend.className =
        "chart-legend";


    legend.innerHTML = `

        <span>

            <i
                class="legend-dot batting-dot"
            ></i>

            Batting Strength

        </span>


        <span>

            <i
                class="legend-dot bowling-dot"
            ></i>

            Bowling Strength

        </span>

    `;


    container.appendChild(
        legend
    );


    /* ------------------------------------------------------
       CHART BODY
    ------------------------------------------------------ */

    const body =
        document.createElement(
            "div"
        );


    body.className =
        "chart-columns";


    seasons.forEach(
        season => {

            const column =
                document.createElement(
                    "div"
                );


            column.className =
                "chart-column";


            const batting =
                findSeasonValue(
                    battingData || [],
                    season
                );


            const bowling =
                findSeasonValue(
                    bowlingData || [],
                    season
                );


            column.innerHTML = `

                <div
                    class="chart-bars"
                >

                    <div
                        class="bar batting-bar"
                        style="
                            height:
                            ${percentageHeight(
                                batting,
                                maxValue
                            )}%;
                        "
                    >

                        <span>
                            ${formatNullable(
                                batting
                            )}
                        </span>

                    </div>


                    <div
                        class="bar bowling-bar"
                        style="
                            height:
                            ${percentageHeight(
                                bowling,
                                maxValue
                            )}%;
                        "
                    >

                        <span>
                            ${formatNullable(
                                bowling
                            )}
                        </span>

                    </div>

                </div>


                <span
                    class="chart-season"
                >
                    ${season}
                </span>

            `;


            body.appendChild(
                column
            );
        }
    );


    chart.appendChild(
        body
    );


    container.appendChild(
        chart
    );
}


/* ==========================================================
   DEPARTMENT TIMELINE
========================================================== */

function renderDepartmentTimeline(
    data
) {

    const container =
        document.getElementById(
            "department-timeline"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        !data ||
        data.length === 0
    ) {

        container.innerHTML =
            emptyMessage(
                "Department profile data is unavailable."
            );

        return;
    }


    data.forEach(
        record => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "department-item";


            const profile =
                record.profile ||
                record.department_profile ||
                "Not Available";


            const profileClass =
                getProfileClass(
                    profile
                );


            item.innerHTML = `

                <div
                    class="department-season"
                >
                    ${record.season}
                </div>


                <div
                    class="
                        department-profile
                        ${profileClass}
                    "
                >
                    ${profile}
                </div>


                <div
                    class="department-scores"
                >

                    <span>

                        Batting

                        <strong>
                            ${formatNullable(
                                record.batting_strength
                            )}
                        </strong>

                    </span>


                    <span>

                        Bowling

                        <strong>
                            ${formatNullable(
                                record.bowling_strength
                            )}
                        </strong>

                    </span>

                </div>

            `;


            container.appendChild(
                item
            );
        }
    );
}


/* ==========================================================
   DEPENDENCY TREND
========================================================== */

function renderDependencyTrend(
    data
) {

    renderDependencyChart(
        "batting-dependency-chart",
        data,
        "batting_dependency",
        "Batting Dependency"
    );


    renderDependencyChart(
        "bowling-dependency-chart",
        data,
        "bowling_dependency",
        "Bowling Dependency"
    );
}


/* ==========================================================
   DEPENDENCY CHART
========================================================== */

function renderDependencyChart(
    elementId,
    data,
    key,
    label
) {

    const container =
        document.getElementById(
            elementId
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        !data ||
        data.length === 0
    ) {

        container.innerHTML =
            emptyMessage(
                `${label} data is unavailable.`
            );

        return;
    }


    data.forEach(
        record => {

            const rawValue =
                record[key];


            const value =
                Number(rawValue);


            const safeValue =
                Number.isFinite(value)
                    ? value
                    : 0;


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "dependency-row";


            row.innerHTML = `

                <div
                    class="dependency-row-header"
                >

                    <span>
                        ${record.season}
                    </span>


                    <strong>
                        ${formatNumber(
                            safeValue
                        )}%
                    </strong>

                </div>


                <div
                    class="dependency-track"
                >

                    <div
                        class="dependency-fill"
                        style="
                            width:
                            ${percentageHeight(
                                safeValue,
                                100
                            )}%;
                        "
                    ></div>

                </div>

            `;


            container.appendChild(
                row
            );
        }
    );
}


/* ==========================================================
   SEASON TABLE
========================================================== */

function renderSeasonTable(
    records
) {

    const tbody =
        document.getElementById(
            "season-table-body"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    if (
        !records ||
        records.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="10"
                    class="empty-table"
                >
                    No season data available.
                </td>

            </tr>

        `;

        return;
    }


    records.forEach(
        record => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>

                    <strong>
                        ${record.season}
                    </strong>

                </td>


                <td>
                    ${formatNumber(
                        record.matches_played
                    )}
                </td>


                <td>
                    ${formatNumber(
                        record.wins
                    )}
                </td>


                <td>
                    ${formatNumber(
                        record.losses
                    )}
                </td>


                <td>
                    ${formatNumber(
                        record.win_percentage
                    )}%
                </td>


                <td>
                    ${formatNumber(
                        record.total_runs
                    )}
                </td>


                <td>
                    ${formatNumber(
                        record.total_wickets
                    )}
                </td>


                <td>
                    ${formatNumber(
                        record.batting_dependency
                    )}%
                </td>


                <td>
                    ${formatNumber(
                        record.bowling_dependency
                    )}%
                </td>


                <td>

                    <span
                        class="
                            table-profile
                            ${getProfileClass(
                                record.department_profile
                            )}
                        "
                    >

                        ${
                            record.department_profile ||
                            "—"
                        }

                    </span>

                </td>

            `;


            tbody.appendChild(
                row
            );
        }
    );
}


/* ==========================================================
   EVOLUTION INSIGHTS
========================================================== */

function renderEvolutionInsights(
    records
) {

    const container =
        document.getElementById(
            "evolution-insights"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        !records ||
        records.length === 0
    ) {

        container.innerHTML =
            emptyMessage(
                "Not enough data to generate insights."
            );

        return;
    }


    const first =
        records[0];


    const latest =
        records[
            records.length - 1
        ];


    const insights = [];


    /* ------------------------------------------------------
       WIN RATE
    ------------------------------------------------------ */

    if (
        first.win_percentage !== null &&
        first.win_percentage !== undefined &&
        latest.win_percentage !== null &&
        latest.win_percentage !== undefined
    ) {

        const change =
            Number(
                latest.win_percentage
            ) -
            Number(
                first.win_percentage
            );


        if (
            Number.isFinite(change)
        ) {

            insights.push({

                title:
                    "Win Rate Movement",

                text:
                    `Win percentage changed from ` +
                    `${formatNumber(
                        first.win_percentage
                    )}% in ${first.season} ` +
                    `to ${formatNumber(
                        latest.win_percentage
                    )}% in ${latest.season}.`

            });
        }
    }


    /* ------------------------------------------------------
       RUNS
    ------------------------------------------------------ */

    if (
        first.total_runs !== null &&
        first.total_runs !== undefined &&
        latest.total_runs !== null &&
        latest.total_runs !== undefined
    ) {

        const change =
            Number(
                latest.total_runs
            ) -
            Number(
                first.total_runs
            );


        if (
            Number.isFinite(change)
        ) {

            insights.push({

                title:
                    "Batting Output",

                text:
                    `${latest.season} recorded ` +
                    `${formatNumber(
                        latest.total_runs
                    )} total runs, compared with ` +
                    `${formatNumber(
                        first.total_runs
                    )} in ${first.season}. ` +
                    `The difference is ` +
                    `${change >= 0 ? "+" : ""}` +
                    `${formatNumber(
                        change
                    )} runs.`

            });
        }
    }


    /* ------------------------------------------------------
       WICKETS
    ------------------------------------------------------ */

    if (
        first.total_wickets !== null &&
        first.total_wickets !== undefined &&
        latest.total_wickets !== null &&
        latest.total_wickets !== undefined
    ) {

        const change =
            Number(
                latest.total_wickets
            ) -
            Number(
                first.total_wickets
            );


        if (
            Number.isFinite(change)
        ) {

            insights.push({

                title:
                    "Bowling Output",

                text:
                    `${latest.season} recorded ` +
                    `${formatNumber(
                        latest.total_wickets
                    )} wickets, compared with ` +
                    `${formatNumber(
                        first.total_wickets
                    )} in ${first.season}. ` +
                    `The difference is ` +
                    `${change >= 0 ? "+" : ""}` +
                    `${formatNumber(
                        change
                    )} wickets.`

            });
        }
    }


    /* ------------------------------------------------------
       DEPARTMENT PROFILE
    ------------------------------------------------------ */

    if (
        first.department_profile &&
        latest.department_profile
    ) {

        insights.push({

            title:
                "Department Identity",

            text:
                `The team's department profile ` +
                `was "${first.department_profile}" ` +
                `in ${first.season} and ` +
                `"${latest.department_profile}" ` +
                `in ${latest.season}.`

        });
    }


    /* ------------------------------------------------------
       DEPENDENCY
    ------------------------------------------------------ */

    if (
        latest.batting_dependency !== null &&
        latest.batting_dependency !== undefined &&
        latest.bowling_dependency !== null &&
        latest.bowling_dependency !== undefined
    ) {

        insights.push({

            title:
                "Current Dependency",

            text:
                `In ${latest.season}, the top three ` +
                `batting contributors accounted for ` +
                `${formatNumber(
                    latest.batting_dependency
                )}% of batting output, while the ` +
                `top three bowlers accounted for ` +
                `${formatNumber(
                    latest.bowling_dependency
                )}% of wickets.`

        });
    }


    /* ------------------------------------------------------
       NO INSIGHTS
    ------------------------------------------------------ */

    if (
        insights.length === 0
    ) {

        container.innerHTML =
            emptyMessage(
                "Not enough change across seasons to generate insights."
            );

        return;
    }


    /* ------------------------------------------------------
       RENDER INSIGHTS
    ------------------------------------------------------ */

    insights.forEach(
        insight => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "insight-card";


            card.innerHTML = `

                <h3>
                    ${insight.title}
                </h3>


                <p>
                    ${insight.text}
                </p>

            `;


            container.appendChild(
                card
            );
        }
    );
}


/* ==========================================================
   GET ALL SEASONS FOR CHART
========================================================== */

function getAllSeasons(
    battingData,
    bowlingData
) {

    const seasons =
        new Set();


    /*
       Collect seasons available in the API data.
    */

    (battingData || []).forEach(
        item => {

            if (
                item.season !== undefined
            ) {

                seasons.add(
                    String(
                        item.season
                    )
                );
            }
        }
    );


    (bowlingData || []).forEach(
        item => {

            if (
                item.season !== undefined
            ) {

                seasons.add(
                    String(
                        item.season
                    )
                );
            }
        }
    );


    const available =
        Array.from(
            seasons
        );


    /*
       IMPORTANT:

       Return the user's selected seasons in the original
       selection order.

       This means the chart never adds an unselected season.
    */

    return selectedSeasons.filter(
        season =>
            available.includes(
                String(season)
            )
    );
}


/* ==========================================================
   FIND SEASON VALUE
========================================================== */

function findSeasonValue(
    data,
    season
) {

    const record =
        (data || []).find(
            item =>
                String(
                    item.season
                ) ===
                String(
                    season
                )
        );


    if (!record) {
        return null;
    }


    const value =
        Number(
            record.score
        );


    return Number.isFinite(value)
        ? value
        : null;
}


/* ==========================================================
   PERCENTAGE HEIGHT
========================================================== */

function percentageHeight(
    value,
    max
) {

    if (
        value === null ||
        value === undefined ||
        !Number.isFinite(
            Number(value)
        )
    ) {

        return 0;
    }


    if (
        !Number.isFinite(
            Number(max)
        ) ||
        Number(max) <= 0
    ) {

        return 0;
    }


    return Math.max(

        0,

        Math.min(

            100,

            (
                Number(value) /
                Number(max)
            ) * 100

        )

    );
}


/* ==========================================================
   FORMAT NUMBER
========================================================== */

function formatNumber(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === "" ||
        !Number.isFinite(
            Number(value)
        )
    ) {

        return "0";
    }


    return Number(
        value
    ).toLocaleString(
        "en-IN",
        {
            maximumFractionDigits: 2
        }
    );
}


/* ==========================================================
   FORMAT NULLABLE
========================================================== */

function formatNullable(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === "" ||
        !Number.isFinite(
            Number(value)
        )
    ) {

        return "—";
    }


    return formatNumber(
        value
    );
}


/* ==========================================================
   PROFILE CSS CLASS
========================================================== */

function getProfileClass(
    profile
) {

    if (!profile) {
        return "";
    }


    const normalized =
        String(profile)
            .toLowerCase()
            .replace(
                /\s+/g,
                "-"
            );


    if (
        normalized.includes(
            "batting"
        )
    ) {

        return "profile-batting";
    }


    if (
        normalized.includes(
            "bowling"
        )
    ) {

        return "profile-bowling";
    }


    if (
        normalized.includes(
            "balanced"
        )
    ) {

        return "profile-balanced";
    }


    return "";
}


/* ==========================================================
   EMPTY MESSAGE
========================================================== */

function emptyMessage(
    message
) {

    return `

        <div
            class="empty-state"
        >
            ${message}
        </div>

    `;
}


/* ==========================================================
   LOADING STATE
========================================================== */

function showLoading() {

    const loading =
        document.getElementById(
            "loading-state"
        );


    const error =
        document.getElementById(
            "error-state"
        );


    if (loading) {

        loading.style.display =
            "flex";
    }


    if (error) {

        error.style.display =
            "none";
    }
}


/* ==========================================================
   HIDE LOADING
========================================================== */

function hideLoading() {

    const loading =
        document.getElementById(
            "loading-state"
        );


    if (loading) {

        loading.style.display =
            "none";
    }
}


/* ==========================================================
   SHOW ERROR
========================================================== */

function showError(
    message
) {

    const loading =
        document.getElementById(
            "loading-state"
        );


    const errorState =
        document.getElementById(
            "error-state"
        );


    const errorMessage =
        document.getElementById(
            "error-message"
        );


    if (loading) {

        loading.style.display =
            "none";
    }


    if (errorState) {

        errorState.style.display =
            "block";
    }


    if (errorMessage) {

        errorMessage.textContent =
            message;
    }
}