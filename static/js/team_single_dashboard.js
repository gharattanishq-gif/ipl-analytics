// ======================================================
// GET TEAM + SEASON FROM URL
// ======================================================

const params = new URLSearchParams(
    window.location.search
);

const team = params.get("team");
const season = params.get("season");


// ======================================================
// INITIAL HEADER
// ======================================================

document.getElementById(
    "team-name"
).textContent = team;

document.getElementById(
    "season-name"
).textContent = `Season ${season}`;

loadDashboard();


// ======================================================
// LOAD DASHBOARD DATA
// ======================================================

async function loadDashboard() {

    try {

        const response = await fetch(
            `/api/team-dashboard?team=${encodeURIComponent(team)}&season=${encodeURIComponent(season)}`
        );

        if (!response.ok) {
            throw new Error("Failed to load dashboard data.");
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }


        // ==================================================
        // TEAM SUMMARY
        // ==================================================

        const summary = data.summary;

        document.getElementById(
            "matches-played"
        ).textContent = summary.matches_played;

        document.getElementById(
            "wins"
        ).textContent = summary.wins;

        document.getElementById(
            "losses"
        ).textContent = summary.losses;

        document.getElementById(
            "win-percentage"
        ).textContent =
            summary.win_percentage + "%";

        document.getElementById(
            "total-runs"
        ).textContent =
            summary.total_runs;

        document.getElementById(
            "total-wickets"
        ).textContent =
            summary.total_wickets_taken;


        // ==================================================
        // BATTING
        // ==================================================

        renderBattingCards(
            data.batting?.contributors
        );


        // ==================================================
        // BOWLING
        // ==================================================

        renderBowlingCards(
            data.bowling?.top_5_contributors
        );


        // ==================================================
        // TEAM DEPARTMENT PROFILE
        // ==================================================

        renderDepartmentProfile(
            data.department_profile
        );

    }

    catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

        document.getElementById(
            "batting-cards"
        ).innerHTML = `
            <p>Unable to load dashboard data.</p>
        `;

        document.getElementById(
            "bowling-cards"
        ).innerHTML = `
            <p>Unable to load dashboard data.</p>
        `;

        document.getElementById(
            "dependency-content"
        ).innerHTML = `
            <p>Unable to load department profile.</p>
        `;
    }
}


// ======================================================
// RENDER TOP 5 BATTING CONTRIBUTORS
// ======================================================

function renderBattingCards(players) {

    const container =
        document.getElementById(
            "batting-cards"
        );

    container.innerHTML = "";


    if (!players || players.length === 0) {

        container.innerHTML = `
            <p>No batting contribution data available.</p>
        `;

        return;
    }


    players.forEach(player => {

        // ----------------------------------------------
        // INDEX BADGE
        // ----------------------------------------------

        let badgeClass = "very-good";

        if (
            player.batting_index != null &&
            player.batting_index >= 90
        ) {

            badgeClass = "elite";

        }

        else if (
            player.batting_index != null &&
            player.batting_index >= 80
        ) {

            badgeClass = "excellent";

        }


        const battingIndex =
            player.batting_index != null
                ? Number(player.batting_index).toFixed(2)
                : "N/A";


        // ----------------------------------------------
        // CARD
        // ----------------------------------------------

        container.innerHTML += `

            <div class="player-card">

                <div class="card-header">

                    <h3>
                        ${player.player}
                    </h3>

                    <span class="index-badge ${badgeClass}">
                        ${battingIndex}
                    </span>

                </div>


                <div class="player-stat">
                    <span>Runs</span>
                    <span>
                        ${player.runs ?? "N/A"}
                    </span>
                </div>


                <div class="player-stat">
                    <span>Average</span>
                    <span>
                        ${player.batting_average ?? "N/A"}
                    </span>
                </div>


                <div class="player-stat">
                    <span>Strike Rate</span>
                    <span>
                        ${player.strike_rate ?? "N/A"}
                    </span>
                </div>


                <div class="player-stat">
                    <span>Contribution</span>
                    <span>
                        ${player.contribution_percentage ?? "N/A"}%
                    </span>
                </div>


                <div class="player-stat">
                    <span>Dot Ball %</span>
                    <span>
                        ${player.dot_ball_percentage ?? "N/A"}%
                    </span>
                </div>


                <div class="player-stat">
                    <span>Boundary %</span>
                    <span>
                        ${player.boundary_percentage ?? "N/A"}%
                    </span>
                </div>

            </div>

        `;

    });

}


// ======================================================
// RENDER TOP 5 BOWLING CONTRIBUTORS
// ======================================================

function renderBowlingCards(players) {

    const container =
        document.getElementById(
            "bowling-cards"
        );

    container.innerHTML = "";


    if (!players || players.length === 0) {

        container.innerHTML = `
            <p>No bowling contribution data available.</p>
        `;

        return;
    }


    players.forEach(player => {

        // ----------------------------------------------
        // INDEX BADGE
        // ----------------------------------------------

        let badgeClass = "very-good";

        if (
            player.bowling_index != null &&
            player.bowling_index >= 90
        ) {

            badgeClass = "elite";

        }

        else if (
            player.bowling_index != null &&
            player.bowling_index >= 80
        ) {

            badgeClass = "excellent";

        }


        const bowlingIndex =
            player.bowling_index != null
                ? Number(player.bowling_index).toFixed(2)
                : "N/A";


        // ----------------------------------------------
        // CARD
        // ----------------------------------------------

        container.innerHTML += `

            <div class="player-card">

                <div class="card-header">

                    <h3>
                        ${player.player}
                    </h3>

                    <span class="index-badge ${badgeClass}">
                        ${bowlingIndex}
                    </span>

                </div>


                <div class="player-stat">
                    <span>Wickets</span>
                    <span>
                        ${player.wickets ?? "N/A"}
                    </span>
                </div>


                <div class="player-stat">
                    <span>Average</span>
                    <span>
                        ${player.bowling_average ?? "N/A"}
                    </span>
                </div>


                <div class="player-stat">
                    <span>Strike Rate</span>
                    <span>
                        ${player.bowling_strike_rate ?? "N/A"}
                    </span>
                </div>


                <div class="player-stat">
                    <span>Economy</span>
                    <span>
                        ${player.economy_rate ?? "N/A"}
                    </span>
                </div>


                <div class="player-stat">
                    <span>Contribution</span>
                    <span>
                        ${player.contribution_percentage ?? "N/A"}%
                    </span>
                </div>


                <div class="player-stat">
                    <span>Dot Ball %</span>
                    <span>
                        ${player.dot_ball_percentage ?? "N/A"}%
                    </span>
                </div>

            </div>

        `;

    });

}


// ======================================================
// RENDER TEAM DEPARTMENT PROFILE
// ======================================================

function renderDepartmentProfile(profile) {

    const container =
        document.getElementById(
            "dependency-content"
        );

    container.innerHTML = "";


    if (
        !profile ||
        profile.batting_strength_score == null ||
        profile.bowling_strength_score == null
    ) {

        container.innerHTML = `
            <p>
                Department profile data is not available.
            </p>
        `;

        return;
    }


    const battingScore =
        Number(
            profile.batting_strength_score
        );

    const bowlingScore =
        Number(
            profile.bowling_strength_score
        );

    const difference =
        Number(
            profile.department_difference
        );


    const departmentProfile =
        profile.profile || "Balanced";


    // ----------------------------------------------
    // PROFILE CSS CLASS
    // ----------------------------------------------

    let profileClass = "balanced";


    if (
        departmentProfile === "Batting-driven"
    ) {

        profileClass = "batting-driven";

    }

    else if (
        departmentProfile === "Bowling-driven"
    ) {

        profileClass = "bowling-driven";

    }


    // ----------------------------------------------
    // RENDER
    // ----------------------------------------------

    container.innerHTML = `

        <div class="department-profile">


            <!-- SUMMARY -->

            <div class="department-summary">

                <div>

                    <p class="department-label">
                        Team Profile
                    </p>

                    <h3
                        class="department-title ${profileClass}"
                    >
                        ${departmentProfile}
                    </h3>

                </div>


                <div class="department-difference">

                    <span>
                        Department Gap
                    </span>

                    <strong>
                        ${Math.abs(difference).toFixed(2)} pts
                    </strong>

                </div>

            </div>


            <!-- DEPARTMENT BARS -->

            <div class="department-bars">


                <!-- BATTING -->

                <div class="department-bar-row">

                    <div class="department-bar-label">

                        <span>
                            Batting Strength
                        </span>

                        <strong>
                            ${battingScore.toFixed(2)}
                        </strong>

                    </div>


                    <div class="department-bar-track">

                        <div
                            class="department-bar batting-bar"
                            style="
                                width: ${Math.min(
                                    Math.max(battingScore, 0),
                                    100
                                )}%;
                            "
                        ></div>

                    </div>

                </div>


                <!-- BOWLING -->

                <div class="department-bar-row">

                    <div class="department-bar-label">

                        <span>
                            Bowling Strength
                        </span>

                        <strong>
                            ${bowlingScore.toFixed(2)}
                        </strong>

                    </div>


                    <div class="department-bar-track">

                        <div
                            class="department-bar bowling-bar"
                            style="
                                width: ${Math.min(
                                    Math.max(bowlingScore, 0),
                                    100
                                )}%;
                            "
                        ></div>

                    </div>

                </div>

            </div>


            <!-- METHODOLOGY -->

            <div class="department-method-note">

                Scores are league-relative:
                each department is compared with
                the other teams in the same IPL season.
                A difference of less than 10 points
                is classified as Balanced.

            </div>


        </div>

    `;
}