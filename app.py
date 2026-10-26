from flask import Flask, render_template, jsonify, request
import json
from pathlib import Path

app = Flask(__name__)


# ==========================================================
# HOME
# ==========================================================

@app.route("/")
def home():
    return render_template("index.html")

# ==========================================================
# PLAYER ANALYSIS
# ==========================================================

@app.route("/player")
def player():
    return render_template("player.html")


# ==========================================================
# PLAYER COMPARISON
# ==========================================================

@app.route("/compare")
def compare():
    return render_template("compare.html")


# ==========================================================
# TEAM
# ==========================================================

@app.route("/team")
def team():
    return render_template("team.html")


# ==========================================================
# PLAYERS API
# ==========================================================



# ==========================================================
# PLAYER DISPLAY-NAME / ALIAS MAPPING API
# ==========================================================

@app.route("/api/player-mapping")
def get_player_mapping():
    mapping_path = (
        Path(app.root_path)
        / "data"
        / "processed"
        / "player_mapping.json"
    )

    with mapping_path.open("r", encoding="utf-8") as file:
        mapping = json.load(file)

    return jsonify(mapping)

@app.route("/api/players")
def get_players():

    with open(
        "data/processed/players.json",
        "r",
        encoding="utf-8"
    ) as file:

        players = json.load(file)

    return jsonify(players)


# ==========================================================
# PLAYER REPORT PAGE
# ==========================================================

@app.route("/report")
def report():
    return render_template("report.html")


# ==========================================================
# PLAYER REPORT API
# ==========================================================


# ==========================================================
# PLAYER REPORT API
# ==========================================================

@app.route("/api/player-report")
def get_player_report():

    player_name = request.args.get("player")
    seasons_parameter = request.args.get("seasons")

    # ------------------------------------------------------
    # VALIDATION
    # ------------------------------------------------------

    if not player_name:
        return jsonify({
            "error": "Player name is required."
        }), 400

    if not seasons_parameter:
        return jsonify({
            "error": "At least one season is required."
        }), 400

    selected_seasons = seasons_parameter.split(",")

    # ------------------------------------------------------
    # LOAD BATTING INDEX
    # ------------------------------------------------------

    with open(
        "data/processed/batting_index.json",
        "r",
        encoding="utf-8"
    ) as file:
        batting_data = json.load(file)

    # ------------------------------------------------------
    # LOAD BOWLING INDEX
    # ------------------------------------------------------

    with open(
        "data/processed/bowling_index.json",
        "r",
        encoding="utf-8"
    ) as file:
        bowling_data = json.load(file)

    # ------------------------------------------------------
    # FIND BATTING RECORDS
    # ------------------------------------------------------

    batting_records = [
        record
        for record in batting_data
        if (
            record["player"] == player_name
            and record["season"] in selected_seasons
        )
    ]

    # ------------------------------------------------------
    # FIND BOWLING RECORDS
    # ------------------------------------------------------

    bowling_records = [
        record
        for record in bowling_data
        if (
            record["player"] == player_name
            and record["season"] in selected_seasons
        )
    ]

    # ------------------------------------------------------
    # SORT SEASON RECORDS
    # ------------------------------------------------------

    batting_records.sort(
        key=lambda record: record["season"]
    )

    bowling_records.sort(
        key=lambda record: record["season"]
    )

    # ------------------------------------------------------
    # OVERALL BATTING INDEX
    # ------------------------------------------------------

    if batting_records:
        overall_batting_index = round(
            sum(
                record["batting_index"]
                for record in batting_records
            ) / len(batting_records),
            2
        )
    else:
        overall_batting_index = None

    # ------------------------------------------------------
    # OVERALL BOWLING INDEX
    # ------------------------------------------------------

    if bowling_records:
        overall_bowling_index = round(
            sum(
                record["bowling_index"]
                for record in bowling_records
            ) / len(bowling_records),
            2
        )
    else:
        overall_bowling_index = None

    # ------------------------------------------------------
    # LOAD MATCH-LEVEL PERFORMANCE DATA
    # ------------------------------------------------------

    match_stats_path = (
        Path(app.root_path)
        / "data"
        / "processed"
        / "player_match_stats.json"
    )

    with match_stats_path.open(
        "r",
        encoding="utf-8"
    ) as file:
        match_stats = json.load(file)

    # ------------------------------------------------------
    # FILTER MATCHES FOR THE SELECTED PLAYER AND SEASONS
    # ------------------------------------------------------

    match_records = [
        record
        for record in match_stats
        if (
            record["player"] == player_name
            and str(record["season"]) in selected_seasons
        )
    ]

    # Sort by season and match ID
    match_records.sort(
        key=lambda record: (
            int(record["season"]),
            int(record["match_id"])
        )
    )

    # ------------------------------------------------------
    # RESPONSE
    # ------------------------------------------------------

    response = {
        "player": player_name,

        "selected_seasons": selected_seasons,

        "overall_batting_index": overall_batting_index,

        "overall_bowling_index": overall_bowling_index,

        "batting_records": batting_records,

        "bowling_records": bowling_records,

        # New: raw match-level statistics for the dashboard
        "match_records": match_records
    }

    return jsonify(response)

# ==========================================================
# TEAMS API
# ==========================================================

@app.route("/api/teams")
def get_teams():

    with open(
        "data/processed/team_stats.json",
        "r",
        encoding="utf-8"
    ) as file:

        team_data = json.load(file)


    teams = sorted({

        record["team"]

        for record in team_data

    })


    return jsonify(teams)


# ==========================================================
# TEAM SEASONS API
# ==========================================================

@app.route("/api/team-seasons")
def get_team_seasons():

    team = request.args.get("team")


    if not team:

        return jsonify({
            "error": "Team is required."
        }), 400


    with open(
        "data/processed/team_stats.json",
        "r",
        encoding="utf-8"
    ) as file:

        team_stats = json.load(file)


    seasons = sorted({

        record["season"]

        for record in team_stats

        if record["team"] == team

    })


    return jsonify(seasons)


# ==========================================================
# TEAM SINGLE DASHBOARD API
# ==========================================================

@app.route("/api/team-dashboard")
def get_team_dashboard():

    team = request.args.get("team")
    season = request.args.get("season")


    # ------------------------------------------------------
    # VALIDATION
    # ------------------------------------------------------

    if not team or not season:

        return jsonify({
            "error":
                "Team and season are required."
        }), 400


    # ======================================================
    # SEASON NORMALIZATION
    # ======================================================

    SEASON_MAPPING = {

        "2007/08": "2008",

        "2009/10": "2010",

        "2020/21": "2020"

    }


    normalized_season = SEASON_MAPPING.get(

        str(season),

        str(season)

    )


    # ======================================================
    # LOAD DATASETS
    # ======================================================

    with open(
        "data/processed/team_stats.json",
        "r",
        encoding="utf-8"
    ) as file:

        team_stats = json.load(file)


    with open(
        "data/processed/team_contribution_stats.json",
        "r",
        encoding="utf-8"
    ) as file:

        contribution_stats = json.load(file)


    with open(
        "data/processed/batting_index.json",
        "r",
        encoding="utf-8"
    ) as file:

        batting_index = json.load(file)


    # ======================================================
    # FIND TEAM SUMMARY
    # ======================================================

    summary = next(

        (

            record

            for record in team_stats

            if (

                record["team"] == team

                and

                str(record["season"])
                == normalized_season

            )

        ),

        None

    )


    # ======================================================
    # FIND CONTRIBUTION RECORD
    # ======================================================

    contributions = next(

        (

            record

            for record in contribution_stats

            if (

                record["team"] == team

                and

                str(record["season"])
                == normalized_season

            )

        ),

        None

    )


    # ======================================================
    # VALIDATE DATA
    # ======================================================

    if summary is None or contributions is None:

        return jsonify({

            "error":
                "Team or season not found."

        }), 404


    # ======================================================
    # BUILD BATTING INDEX LOOKUP
    # ======================================================

    batting_index_lookup = {}


    for record in batting_index:

        record_season = SEASON_MAPPING.get(

            str(record["season"]),

            str(record["season"])

        )


        batting_index_lookup[

            (
                record["player"],
                record_season
            )

        ] = record


    # ======================================================
    # ENHANCE BATTING CONTRIBUTORS
    # ======================================================

    enhanced_batting = []


    for contributor in (

        contributions["batting"]["contributors"]

    ):

        player_name = contributor["player"]


        rec = batting_index_lookup.get(

            (
                player_name,
                normalized_season
            )

        )


        if rec:

            enhanced_batting.append({

                # ------------------------------------------
                # PLAYER
                # ------------------------------------------

                "player":
                    player_name,


                # ------------------------------------------
                # BASIC PERFORMANCE
                # ------------------------------------------

                "runs":
                    contributor.get(
                        "runs",
                        0
                    ),


                "contribution_percentage":
                    contributor.get(
                        "contribution_percentage",
                        0
                    ),


                # ------------------------------------------
                # BATTING INDEX DATA
                # ------------------------------------------

                "batting_average":
                    rec.get(
                        "batting_average"
                    ),


                "strike_rate":
                    rec.get(
                        "strike_rate"
                    ),


                "batting_index":
                    rec.get(
                        "batting_index"
                    ),


                # ------------------------------------------
                # MILESTONES
                # ------------------------------------------

                "fifties":
                    contributor.get(
                        "fifties",
                        0
                    ),


                "hundreds":
                    contributor.get(
                        "hundreds",
                        0
                    ),


                # ------------------------------------------
                # BATTING BEHAVIOUR
                # ------------------------------------------

                "dot_ball_percentage":
                    contributor.get(
                        "dot_ball_percentage",
                        0
                    ),


                "boundary_percentage":
                    contributor.get(
                        "boundary_percentage",
                        0
                    )

            })


    # ======================================================
    # SORT BATTING CONTRIBUTORS
    # ======================================================

    enhanced_batting.sort(

        key=lambda player:
            player.get(
                "contribution_percentage",
                0
            ),

        reverse=True

    )


    # ======================================================
    # TOP 5 BATTERS
    # ======================================================

    enhanced_batting = enhanced_batting[:5]


    # ======================================================
    # BOWLING DATA
    # ======================================================

    bowling_data = contributions.get(

        "bowling",

        {}

    )


    # ======================================================
    # DEPARTMENT PROFILE
    # ======================================================

    department_profile = contributions.get(

        "department_profile",

        {}

    )


    # ======================================================
    # FINAL RESPONSE
    # ======================================================

    return jsonify({

        "team":
            team,


        "season":
            normalized_season,


        "summary":
            summary,


        "batting": {

            "top_3_dependency_percentage":
                contributions["batting"].get(
                    "top_3_dependency_percentage",
                    0
                ),

            "contributors":
                enhanced_batting

        },


        "bowling":
            bowling_data,


        "department_profile":
            department_profile

    })


# ==========================================================
# SINGLE TEAM DASHBOARD PAGE
# ==========================================================

@app.route("/team/single")
def team_single():

    return render_template(
        "team_single_dashboard.html"
    )


# ==========================================================
# MULTI TEAM DASHBOARD
# ==========================================================

@app.route("/team/multi")
def team_multi():

    return render_template(
        "team_multi_dashboard.html"
    )

# ==========================================================
# TEAM MULTI-SEASON DASHBOARD API
# ==========================================================

@app.route("/api/team-multi-dashboard")
def get_team_multi_dashboard():

    team = request.args.get("team")
    seasons_parameter = request.args.get("seasons")

    # ------------------------------------------------------
    # VALIDATION
    # ------------------------------------------------------

    if not team:
        return jsonify({
            "error": "Team is required."
        }), 400

    if not seasons_parameter:
        return jsonify({
            "error": "At least one season is required."
        }), 400

    selected_seasons = [
        season.strip()
        for season in seasons_parameter.split(",")
        if season.strip()
    ]

    if not selected_seasons:
        return jsonify({
            "error": "At least one valid season is required."
        }), 400


    # ======================================================
    # SEASON NORMALIZATION
    # ======================================================

    SEASON_MAPPING = {
        "2007/08": "2008",
        "2009/10": "2010",
        "2020/21": "2020"
    }


    normalized_seasons = [
        SEASON_MAPPING.get(
            str(season),
            str(season)
        )
        for season in selected_seasons
    ]


    # ======================================================
    # LOAD DATASETS
    # ======================================================

    with open(
        "data/processed/team_stats.json",
        "r",
        encoding="utf-8"
    ) as file:
        team_stats = json.load(file)


    with open(
        "data/processed/team_contribution_stats.json",
        "r",
        encoding="utf-8"
    ) as file:
        contribution_stats = json.load(file)


    # ======================================================
    # BUILD TEAM-SEASON LOOKUPS
    # ======================================================

    team_stats_lookup = {}

    for record in team_stats:

        record_team = record.get("team")

        record_season = SEASON_MAPPING.get(
            str(record.get("season")),
            str(record.get("season"))
        )

        team_stats_lookup[
            (
                record_team,
                record_season
            )
        ] = record


    contribution_lookup = {}

    for record in contribution_stats:

        record_team = record.get("team")

        record_season = SEASON_MAPPING.get(
            str(record.get("season")),
            str(record.get("season"))
        )

        contribution_lookup[
            (
                record_team,
                record_season
            )
        ] = record


    # ======================================================
    # BUILD SEASON RECORDS
    # ======================================================

    season_records = []

    for season in normalized_seasons:

        summary = team_stats_lookup.get(
            (
                team,
                season
            )
        )

        contributions = contribution_lookup.get(
            (
                team,
                season
            )
        )


        # --------------------------------------------------
        # Skip seasons for which the team has no data
        # --------------------------------------------------

        if summary is None:
            continue


        if contributions is None:
            contributions = {}


        batting_data = contributions.get(
            "batting",
            {}
        )

        bowling_data = contributions.get(
            "bowling",
            {}
        )

        department_profile = contributions.get(
            "department_profile",
            {}
        )


        # --------------------------------------------------
        # TEAM SUMMARY
        # --------------------------------------------------

        matches_played = summary.get(
            "matches_played",
            0
        )

        wins = summary.get(
            "wins",
            0
        )

        losses = summary.get(
            "losses",
            0
        )

        win_percentage = summary.get(
            "win_percentage",
            0
        )


        # --------------------------------------------------
        # BATTING
        # --------------------------------------------------

        total_runs = summary.get(
            "total_runs",
            batting_data.get(
                "total_player_runs",
                0
            )
        )

        batting_dependency = batting_data.get(
            "top_3_dependency_percentage",
            0
        )


        # --------------------------------------------------
        # BOWLING
        # --------------------------------------------------

        total_wickets = summary.get(
            "total_wickets_taken",
            bowling_data.get(
                "total_player_wickets",
                0
            )
        )

        bowling_dependency = bowling_data.get(
            "top_3_dependency_percentage",
            0
        )


        # --------------------------------------------------
        # DEPARTMENT PROFILE
        # --------------------------------------------------

        batting_strength = department_profile.get(
            "batting_strength_score"
        )

        bowling_strength = department_profile.get(
            "bowling_strength_score"
        )

        profile = department_profile.get(
            "profile"
        )


        # --------------------------------------------------
        # SEASON RECORD
        # --------------------------------------------------

        season_records.append({

            "season": season,

            "matches_played":
                matches_played,

            "wins":
                wins,

            "losses":
                losses,

            "win_percentage":
                win_percentage,

            "total_runs":
                total_runs,

            "total_wickets":
                total_wickets,

            "batting_dependency":
                batting_dependency,

            "bowling_dependency":
                bowling_dependency,

            "batting_strength":
                batting_strength,

            "bowling_strength":
                bowling_strength,

            "department_profile":
                profile
        })


    # ======================================================
    # SORT CHRONOLOGICALLY
    # ======================================================

    season_records.sort(
        key=lambda record:
            int(record["season"])
            if str(record["season"]).isdigit()
            else 9999
    )


    # ======================================================
    # VALIDATE RESULTS
    # ======================================================

    if not season_records:
        return jsonify({
            "error":
                "No data found for the selected team and seasons."
        }), 404


    # ======================================================
    # MULTI-SEASON OVERVIEW
    # ======================================================

    total_matches = sum(
        record["matches_played"]
        for record in season_records
    )

    total_wins = sum(
        record["wins"]
        for record in season_records
    )

    total_losses = sum(
        record["losses"]
        for record in season_records
    )

    total_runs = sum(
        record["total_runs"]
        for record in season_records
    )

    total_wickets = sum(
        record["total_wickets"]
        for record in season_records
    )


    overall_win_percentage = (
        round(
            (
                total_wins
                / total_matches
            ) * 100,
            2
        )
        if total_matches > 0
        else 0
    )


    # ======================================================
    # STRENGTH TRENDS
    # ======================================================

    batting_strength_trend = []

    bowling_strength_trend = []

    for record in season_records:

        if record["batting_strength"] is not None:

            batting_strength_trend.append({
                "season":
                    record["season"],

                "score":
                    record["batting_strength"]
            })


        if record["bowling_strength"] is not None:

            bowling_strength_trend.append({
                "season":
                    record["season"],

                "score":
                    record["bowling_strength"]
            })


    # ======================================================
    # DEPARTMENT TREND
    # ======================================================

    department_trend = []

    for record in season_records:

        department_trend.append({

            "season":
                record["season"],

            "profile":
                record["department_profile"],

            "batting_strength":
                record["batting_strength"],

            "bowling_strength":
                record["bowling_strength"]
        })


    # ======================================================
    # DEPENDENCY TRENDS
    # ======================================================

    dependency_trend = []

    for record in season_records:

        dependency_trend.append({

            "season":
                record["season"],

            "batting_dependency":
                record["batting_dependency"],

            "bowling_dependency":
                record["bowling_dependency"]
        })


    # ======================================================
    # FINAL RESPONSE
    # ======================================================

    return jsonify({

        "team":
            team,

        "seasons":
            [
                record["season"]
                for record in season_records
            ],

        "overview": {

            "seasons_analyzed":
                len(season_records),

            "total_matches":
                total_matches,

            "total_wins":
                total_wins,

            "total_losses":
                total_losses,

            "overall_win_percentage":
                overall_win_percentage,

            "total_runs":
                total_runs,

            "total_wickets":
                total_wickets
        },

        "season_records":
            season_records,

        "batting_trends":
            batting_strength_trend,

        "bowling_trends":
            bowling_strength_trend,

        "department_trends":
            department_trend,

        "dependency_trends":
            dependency_trend
    })

# ==========================================================
# COMPARISON REPORT PAGE
# ==========================================================

@app.route("/comparison-report")
def comparison_report():

    return render_template(
        "comparison-report.html"
    )


# ==========================================================
# COMPARISON REPORT API
# ==========================================================

@app.route("/api/comparison-report")
def comparison_report_api():

    player_a = request.args.get("playerA")

    player_b = request.args.get("playerB")


    seasons_a_raw = request.args.get(
        "seasonsA",
        ""
    )


    seasons_b_raw = request.args.get(
        "seasonsB",
        ""
    )


    comparison_type = request.args.get(
        "type"
    )


    # ======================================================
    # VALIDATION
    # ======================================================

    if not player_a or not player_b:

        return jsonify({

            "error":
                "Both players are required."

        }), 400


    seasons_a = [

        season.strip()

        for season in seasons_a_raw.split(",")

        if season.strip()

    ]


    seasons_b = [

        season.strip()

        for season in seasons_b_raw.split(",")

        if season.strip()

    ]


    if not seasons_a or not seasons_b:

        return jsonify({

            "error":
                "Seasons must be selected for both players."

        }), 400


    if len(seasons_a) != len(seasons_b):

        return jsonify({

            "error":
                "Both players must have an equal number of selected seasons."

        }), 400


    if comparison_type not in [

        "batting",
        "bowling",
        "both"

    ]:

        return jsonify({

            "error":
                "Invalid comparison type."

        }), 400


    # ======================================================
    # LOAD BASE STATISTICS
    # ======================================================

    with open(
        "data/processed/batting_stats.json",
        "r",
        encoding="utf-8"
    ) as file:

        batting_data = json.load(file)


    with open(
        "data/processed/bowling_stats.json",
        "r",
        encoding="utf-8"
    ) as file:

        bowling_data = json.load(file)


    # ======================================================
    # GET SELECTED RECORDS
    # ======================================================

    def get_selected_records(

        dataset,
        player,
        selected_seasons

    ):

        return [

            record

            for record in dataset

            if (

                record["player"] == player

                and

                record["season"]
                in selected_seasons

            )

        ]


    # ======================================================
    # AGGREGATE BATTING
    # ======================================================

    def aggregate_batting(

        player,
        selected_seasons

    ):

        records = get_selected_records(

            batting_data,
            player,
            selected_seasons

        )


        if not records:

            return None


        matches = sum(

            record["matches"]

            for record in records

        )


        innings = sum(

            record["innings"]

            for record in records

        )


        runs = sum(

            record["runs"]

            for record in records

        )


        balls_faced = sum(

            record["balls_faced"]

            for record in records

        )


        dismissals = sum(

            record["dismissals"]

            for record in records

        )


        fours = sum(

            record["fours"]

            for record in records

        )


        sixes = sum(

            record["sixes"]

            for record in records

        )


        dot_balls = sum(

            record["dot_balls"]

            for record in records

        )


        # --------------------------------------------------
        # BATTING AVERAGE
        # --------------------------------------------------

        batting_average = (

            runs / dismissals

            if dismissals > 0

            else None

        )


        # --------------------------------------------------
        # STRIKE RATE
        # --------------------------------------------------

        strike_rate = (

            (runs / balls_faced) * 100

            if balls_faced > 0

            else 0

        )


        # --------------------------------------------------
        # DOT BALL %
        # --------------------------------------------------

        dot_ball_percentage = (

            (dot_balls / balls_faced) * 100

            if balls_faced > 0

            else 0

        )


        # --------------------------------------------------
        # BOUNDARY FREQUENCY
        # --------------------------------------------------

        boundary_frequency = (

            ((fours + sixes) / balls_faced) * 100

            if balls_faced > 0

            else 0

        )


        return {

            "player":
                player,

            "selected_seasons":
                selected_seasons,

            "qualified":
                len(records)
                == len(selected_seasons),

            "available_seasons": [

                record["season"]

                for record in records

            ],

            "matches":
                matches,

            "innings":
                innings,

            "runs":
                runs,

            "balls_faced":
                balls_faced,

            "dismissals":
                dismissals,

            "batting_average": (

                round(
                    batting_average,
                    2
                )

                if batting_average is not None

                else None

            ),

            "strike_rate":
                round(
                    strike_rate,
                    2
                ),

            "fours":
                fours,

            "sixes":
                sixes,

            "dot_balls":
                dot_balls,

            "dot_ball_percentage":
                round(
                    dot_ball_percentage,
                    2
                ),

            "boundary_frequency":
                round(
                    boundary_frequency,
                    2
                )

        }


    # ======================================================
    # AGGREGATE BOWLING
    # ======================================================

    def aggregate_bowling(

        player,
        selected_seasons

    ):

        records = get_selected_records(

            bowling_data,
            player,
            selected_seasons

        )


        if not records:

            return None


        matches = sum(

            record["matches"]

            for record in records

        )


        innings = sum(

            record["innings"]

            for record in records

        )


        balls_bowled = sum(

            record["balls_bowled"]

            for record in records

        )


        runs_conceded = sum(

            record["runs_conceded"]

            for record in records

        )


        wickets = sum(

            record["wickets"]

            for record in records

        )


        dot_balls = sum(

            record["dot_balls"]

            for record in records

        )


        # --------------------------------------------------
        # BOWLING AVERAGE
        # --------------------------------------------------

        bowling_average = (

            runs_conceded / wickets

            if wickets > 0

            else None

        )


        # --------------------------------------------------
        # BOWLING STRIKE RATE
        # --------------------------------------------------

        bowling_strike_rate = (

            balls_bowled / wickets

            if wickets > 0

            else None

        )


        # --------------------------------------------------
        # ECONOMY
        # --------------------------------------------------

        economy_rate = (

            (runs_conceded / balls_bowled) * 6

            if balls_bowled > 0

            else 0

        )


        # --------------------------------------------------
        # DOT BALL %
        # --------------------------------------------------

        dot_ball_percentage = (

            (dot_balls / balls_bowled) * 100

            if balls_bowled > 0

            else 0

        )


        return {

            "player":
                player,

            "selected_seasons":
                selected_seasons,

            "qualified":
                len(records)
                == len(selected_seasons),

            "available_seasons": [

                record["season"]

                for record in records

            ],

            "matches":
                matches,

            "innings":
                innings,

            "balls_bowled":
                balls_bowled,

            "runs_conceded":
                runs_conceded,

            "wickets":
                wickets,

            "bowling_average": (

                round(
                    bowling_average,
                    2
                )

                if bowling_average is not None

                else None

            ),

            "bowling_strike_rate": (

                round(
                    bowling_strike_rate,
                    2
                )

                if bowling_strike_rate is not None

                else None

            ),

            "economy_rate":
                round(
                    economy_rate,
                    2
                ),

            "dot_balls":
                dot_balls,

            "dot_ball_percentage":
                round(
                    dot_ball_percentage,
                    2
                )

        }


    # ======================================================
    # BUILD RESPONSE
    # ======================================================

    response = {

        "playerA": {

            "name":
                player_a,

            "seasons":
                seasons_a

        },


        "playerB": {

            "name":
                player_b,

            "seasons":
                seasons_b

        },


        "comparisonType":
            comparison_type,


        "batting":
            None,


        "bowling":
            None

    }


    # ======================================================
    # BATTING COMPARISON
    # ======================================================

    if comparison_type in [

        "batting",
        "both"

    ]:

        response["batting"] = {

            "playerA":
                aggregate_batting(

                    player_a,
                    seasons_a

                ),

            "playerB":
                aggregate_batting(

                    player_b,
                    seasons_b

                )

        }


    # ======================================================
    # BOWLING COMPARISON
    # ======================================================

    if comparison_type in [

        "bowling",
        "both"

    ]:

        response["bowling"] = {

            "playerA":
                aggregate_bowling(

                    player_a,
                    seasons_a

                ),

            "playerB":
                aggregate_bowling(

                    player_b,
                    seasons_b

                )

        }


    return jsonify(response)


# ==========================================================
# RUN FLASK
# ==========================================================

if __name__ == "__main__":

    app.run(
        debug=True
    )