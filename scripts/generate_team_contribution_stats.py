import json
import os
from collections import defaultdict


# ==========================================
# PATHS
# ==========================================

BATTING_STATS_FILE = "data/processed/batting_stats.json"
BOWLING_STATS_FILE = "data/processed/bowling_stats.json"
PLAYER_MATCH_STATS_FILE = "data/processed/player_match_stats.json"
RAW_DATA_FOLDER = "data/raw_data"
BOWLING_INDEX_FILE = "data/processed/bowling_index.json"

OUTPUT_FILE = "data/processed/team_contribution_stats.json"

# ==========================================
# NORMALIZE FRANCHISE NAMES
# ==========================================

FRANCHISE_NAME_MAPPING = {

    "Delhi Daredevils":
        "Delhi Capitals",

    "Kings XI Punjab":
        "Punjab Kings",

    "Royal Challengers Bangalore":
        "Royal Challengers Bengaluru",

    "Deccan Chargers":
        "Sunrisers Hyderabad",

    "Rising Pune Supergiants":
        "Rising Pune Supergiant"

}

# ==========================================
# NORMALIZE SEASONS
# ==========================================

SEASON_MAPPING = {

    "2007/08": "2008",

    "2009/10": "2010",

    "2020/21": "2020"

}


# ==========================================
# DEPARTMENT PROFILE SETTINGS
# ==========================================

# Department scores are calculated relative to other teams
# in the same IPL season. Each score is on a 0-100 scale.
#
# Batting: 40% scoring output, 30% scoring efficiency,
#          30% wicket preservation.
# Bowling: 40% wicket-taking, 35% run prevention,
#          25% dot-ball pressure.
#
# A difference of 10 points or more is required to call
# a team department-driven. Differences smaller than 10
# points are treated as balanced to avoid over-interpreting
# small statistical gaps.

BAT_DEPARTMENT_WEIGHTS = {
    "runs_per_innings": 0.40,
    "strike_rate": 0.30,
    "wickets_preserved": 0.30
}

BOWL_DEPARTMENT_WEIGHTS = {
    "wickets_per_innings": 0.40,
    "economy_rate": 0.35,
    "dot_ball_percentage": 0.25
}

DEPARTMENT_BALANCE_THRESHOLD = 10.0


# ==========================================
# LOAD DATA
# ==========================================

with open(
    BATTING_STATS_FILE,
    "r",
    encoding="utf-8"
) as file:

    batting_stats = json.load(file)


with open(
    BOWLING_STATS_FILE,
    "r",
    encoding="utf-8"
) as file:

    bowling_stats = json.load(file)


with open(
    PLAYER_MATCH_STATS_FILE,
    "r",
    encoding="utf-8"
) as file:

    player_match_stats = json.load(file)


with open(
    BOWLING_INDEX_FILE,
    "r",
    encoding="utf-8"
) as file:

    bowling_index = json.load(file)


# ==========================================
# BUILD BOWLING INDEX LOOKUP
# ==========================================

bowling_index_lookup = {}

for record in bowling_index:

    player = record["player"]

    season = str(record["season"])

    season = SEASON_MAPPING.get(
        season,
        season
    )

    bowling_index_lookup[(player, season)] = record


# ==========================================
# BUILD PLAYER → TEAM + SEASON MAPPING
# ==========================================

player_team_mapping = {}

for record in player_match_stats:

    player = record["player"]

    team = FRANCHISE_NAME_MAPPING.get(

        record["team"],

        record["team"]

    )

    season = str(record["season"])

    season = SEASON_MAPPING.get(

        season,

        season

    )

    key = (

        player,

        season

    )

    if key not in player_team_mapping:

        player_team_mapping[key] = team

# ==========================================
# BUILD TEAM-LEVEL DEPARTMENT METRICS
# ==========================================

# These metrics are calculated directly from the ball-by-ball
# data so that batting and bowling are evaluated at team level.

team_department_stats = defaultdict(
    lambda: {
        "matches": set(),
        "bat_innings": 0,
        "bat_runs": 0,
        "bat_legal_balls": 0,
        "bat_wickets_lost": 0,
        "bowl_innings": 0,
        "bowl_runs_conceded": 0,
        "bowl_legal_balls": 0,
        "bowl_wickets": 0,
        "bowl_dot_balls": 0
    }
)


for filename in os.listdir(RAW_DATA_FOLDER):

    if not filename.endswith(".json"):
        continue

    file_path = os.path.join(
        RAW_DATA_FOLDER,
        filename
    )

    with open(
        file_path,
        "r",
        encoding="utf-8"
    ) as file:

        match = json.load(file)

    season = SEASON_MAPPING.get(
        str(match["info"]["season"]),
        str(match["info"]["season"])
    )

    teams = [
        FRANCHISE_NAME_MAPPING.get(team, team)
        for team in match["info"]["teams"]
    ]

    for innings in match.get("innings", []):

        batting_team = FRANCHISE_NAME_MAPPING.get(
            innings["team"],
            innings["team"]
        )

        bowling_team = next(
            (team for team in teams if team != batting_team),
            None
        )

        if bowling_team is None:
            continue

        batting_key = (batting_team, season)
        bowling_key = (bowling_team, season)

        team_department_stats[batting_key]["matches"].add(filename)
        team_department_stats[bowling_key]["matches"].add(filename)

        team_department_stats[batting_key]["bat_innings"] += 1
        team_department_stats[bowling_key]["bowl_innings"] += 1

        innings_total_runs = 0
        innings_legal_balls = 0
        innings_bowler_wickets = 0
        innings_dot_balls = 0

        for over in innings.get("overs", []):

            for delivery in over.get("deliveries", []):

                total_runs = delivery["runs"]["total"]
                extras = delivery.get("extras", {})

                innings_total_runs += total_runs

                is_legal_delivery = (
                    "wides" not in extras
                    and "noballs" not in extras
                )

                if is_legal_delivery:
                    innings_legal_balls += 1

                    if total_runs == 0:
                        innings_dot_balls += 1

                for wicket in delivery.get("wickets", []):

                    if wicket["kind"] in {
                        "bowled",
                        "caught",
                        "caught and bowled",
                        "lbw",
                        "stumped",
                        "hit wicket"
                    }:
                        innings_bowler_wickets += 1

        # Count wickets lost by the batting side. Dismissals that
        # do not represent a batting wicket are excluded.
        innings_wickets_lost = sum(
            1
            for over in innings.get("overs", [])
            for delivery in over.get("deliveries", [])
            for wicket in delivery.get("wickets", [])
            if wicket["kind"] not in {
                "retired hurt",
                "retired out",
                "obstructing the field"
            }
        )

        team_department_stats[batting_key]["bat_runs"] += innings_total_runs
        team_department_stats[batting_key]["bat_legal_balls"] += innings_legal_balls
        team_department_stats[batting_key]["bat_wickets_lost"] += innings_wickets_lost

        team_department_stats[bowling_key]["bowl_runs_conceded"] += innings_total_runs
        team_department_stats[bowling_key]["bowl_legal_balls"] += innings_legal_balls
        team_department_stats[bowling_key]["bowl_wickets"] += innings_bowler_wickets
        team_department_stats[bowling_key]["bowl_dot_balls"] += innings_dot_balls


# ==========================================
# PERCENTILE SCORING HELPERS
# ==========================================

def percentile_score(values, value, higher_is_better=True):

    """Return a 0-100 league-relative percentile score."""

    if len(values) <= 1:
        return 50.0

    less = sum(item < value for item in values)
    equal = sum(item == value for item in values)

    percentile = (
        (less + ((equal - 1) * 0.5))
        / (len(values) - 1)
    ) * 100

    if higher_is_better:
        return percentile

    return 100 - percentile


# ==========================================
# CALCULATE DEPARTMENT PROFILE
# ==========================================

team_department_profiles = {}

seasons = sorted({
    season
    for _, season in team_department_stats.keys()
})

for season in seasons:

    season_records = [
        (key, stats)
        for key, stats in team_department_stats.items()
        if key[1] == season
    ]

    metric_rows = []

    for (team, _), stats in season_records:

        bat_innings = stats["bat_innings"]
        bowl_innings = stats["bowl_innings"]

        runs_per_innings = (
            stats["bat_runs"] / bat_innings
            if bat_innings > 0
            else 0
        )

        batting_strike_rate = (
            stats["bat_runs"]
            / stats["bat_legal_balls"]
            * 100
            if stats["bat_legal_balls"] > 0
            else 0
        )

        wickets_lost_per_innings = (
            stats["bat_wickets_lost"] / bat_innings
            if bat_innings > 0
            else 0
        )

        wickets_per_innings = (
            stats["bowl_wickets"] / bowl_innings
            if bowl_innings > 0
            else 0
        )

        economy_rate = (
            stats["bowl_runs_conceded"]
            / stats["bowl_legal_balls"]
            * 6
            if stats["bowl_legal_balls"] > 0
            else 99
        )

        dot_ball_percentage = (
            stats["bowl_dot_balls"]
            / stats["bowl_legal_balls"]
            * 100
            if stats["bowl_legal_balls"] > 0
            else 0
        )

        metric_rows.append({
            "team": team,
            "runs_per_innings": runs_per_innings,
            "batting_strike_rate": batting_strike_rate,
            "wickets_lost_per_innings": wickets_lost_per_innings,
            "wickets_per_innings": wickets_per_innings,
            "economy_rate": economy_rate,
            "dot_ball_percentage": dot_ball_percentage
        })

    runs_values = [row["runs_per_innings"] for row in metric_rows]
    sr_values = [row["batting_strike_rate"] for row in metric_rows]
    wickets_lost_values = [row["wickets_lost_per_innings"] for row in metric_rows]
    wicket_values = [row["wickets_per_innings"] for row in metric_rows]
    economy_values = [row["economy_rate"] for row in metric_rows]
    dot_values = [row["dot_ball_percentage"] for row in metric_rows]

    for row in metric_rows:

        run_score = percentile_score(
            runs_values,
            row["runs_per_innings"]
        )

        sr_score = percentile_score(
            sr_values,
            row["batting_strike_rate"]
        )

        preservation_score = percentile_score(
            wickets_lost_values,
            row["wickets_lost_per_innings"],
            higher_is_better=False
        )

        wicket_score = percentile_score(
            wicket_values,
            row["wickets_per_innings"]
        )

        economy_score = percentile_score(
            economy_values,
            row["economy_rate"],
            higher_is_better=False
        )

        dot_score = percentile_score(
            dot_values,
            row["dot_ball_percentage"]
        )

        batting_strength = (
            run_score * BAT_DEPARTMENT_WEIGHTS["runs_per_innings"]
            + sr_score * BAT_DEPARTMENT_WEIGHTS["strike_rate"]
            + preservation_score * BAT_DEPARTMENT_WEIGHTS["wickets_preserved"]
        )

        bowling_strength = (
            wicket_score * BOWL_DEPARTMENT_WEIGHTS["wickets_per_innings"]
            + economy_score * BOWL_DEPARTMENT_WEIGHTS["economy_rate"]
            + dot_score * BOWL_DEPARTMENT_WEIGHTS["dot_ball_percentage"]
        )

        batting_strength = round(batting_strength, 2)
        bowling_strength = round(bowling_strength, 2)
        department_difference = round(
            batting_strength - bowling_strength,
            2
        )

        if department_difference >= DEPARTMENT_BALANCE_THRESHOLD:
            profile = "Batting-driven"
        elif department_difference <= -DEPARTMENT_BALANCE_THRESHOLD:
            profile = "Bowling-driven"
        else:
            profile = "Balanced"

        team_department_profiles[(row["team"], season)] = {
            "batting_strength_score": batting_strength,
            "bowling_strength_score": bowling_strength,
            "department_difference": department_difference,
            "profile": profile,
            "methodology": {
                "comparison": "Relative to teams in the same IPL season",
                "batting_weights": {
                    "runs_per_innings": 40,
                    "strike_rate": 30,
                    "wicket_preservation": 30
                },
                "bowling_weights": {
                    "wickets_per_innings": 40,
                    "economy_rate": 35,
                    "dot_ball_percentage": 25
                },
                "balanced_threshold": 10
            }
        }


# ==========================================
# TEAM-SEASON STORAGE
# ==========================================

team_contributions = defaultdict(
    lambda: {
        "batting": [],
        "bowling": []
    }
)


# ==========================================
# PROCESS BATTING STATISTICS
# ==========================================

for record in batting_stats:

    player = record["player"]

    season = str(
        record["season"]
    )

    season = SEASON_MAPPING.get(
        season,
        season
    )

    mapping_key = (
        player,
        season
    )


    team = player_team_mapping.get(
        mapping_key
    )


    if team is None:

        continue


    team_key = (
        team,
        season
    )


    team_contributions[
    team_key
]["batting"].append({
    "player": player,
    "runs": record["runs"],
    "fifties": record.get("fifties", 0),
    "hundreds": record.get("hundreds", 0),
    "dot_ball_percentage": record.get("dot_ball_percentage", 0),
    "boundary_percentage": record.get("boundary_percentage", 0)
})

# ==========================================
# PROCESS BOWLING STATISTICS
# ==========================================

for record in bowling_stats:

    player = record["player"]

    season = str(
        record["season"]
    )
    
    season = SEASON_MAPPING.get(
        season,
        season
    )


    mapping_key = (
        player,
        season
    )


    team = player_team_mapping.get(
        mapping_key
    )


    if team is None:

        continue


    team_key = (
        team,
        season
    )


    team_contributions[
        team_key
    ]["bowling"].append({

        "player":
            player,

        "wickets":
            record["wickets"]

    })


# ==========================================
# BUILD FINAL OUTPUT
# ==========================================

output = []


for (
    team,
    season
), contribution_data in team_contributions.items():


    # ======================================
    # BATTING CONTRIBUTIONS
    # ======================================

    batting_players = contribution_data[
        "batting"
    ]


    batting_players.sort(

        key=lambda player:
            player["runs"],

        reverse=True

    )


    total_player_runs = sum(

        player["runs"]

        for player in batting_players

    )


    batting_contributors = []


    for player in batting_players:

        contribution_percentage = (

            (
                player["runs"]
                / total_player_runs
            ) * 100

            if total_player_runs > 0

            else 0

        )


        batting_contributors.append({
    "player": player["player"],
    "runs": player["runs"],
    "fifties": player.get("fifties", 0),
    "hundreds": player.get("hundreds", 0),
    "dot_ball_percentage": player.get("dot_ball_percentage", 0),
    "boundary_percentage": player.get("boundary_percentage", 0),
    "contribution_percentage": round(
        contribution_percentage,
        2
    )
})
    top_3_batting_runs = sum(

        player["runs"]

        for player
        in batting_players[:3]

    )


    batting_dependency_percentage = (

        (
            top_3_batting_runs
            / total_player_runs
        ) * 100

        if total_player_runs > 0

        else 0

    )


    # ======================================
    # BOWLING CONTRIBUTIONS
    # ======================================

    bowling_players = contribution_data[
        "bowling"
    ]


    bowling_players.sort(

        key=lambda player:
            player["wickets"],

        reverse=True

    )


    total_player_wickets = sum(

        player["wickets"]

        for player in bowling_players

    )


    bowling_contributors = []


    for player in bowling_players:

        contribution_percentage = (

            (
                player["wickets"]
                / total_player_wickets
            ) * 100

            if total_player_wickets > 0

            else 0

        )


        index_record = bowling_index_lookup.get(
            (
                player["player"],
                season
            )
        )

        contributor = {

            "player":
                player["player"],

            "wickets":
                player["wickets"],

            "contribution_percentage":
                round(
                    contribution_percentage,
                    2
                )

        }

        if index_record is not None:

            contributor.update({

                "innings":
                    index_record["innings"],

                "balls_bowled":
                    index_record["balls_bowled"],

                "bowling_average":
                    index_record["bowling_average"],

                "bowling_strike_rate":
                    index_record["bowling_strike_rate"],

                "economy_rate":
                    index_record["economy_rate"],

                "dot_ball_percentage":
                    index_record["dot_ball_percentage"],

                "bowling_index":
                    index_record["bowling_index"]

            })

        bowling_contributors.append(contributor)


    top_3_bowling_wickets = sum(

        player["wickets"]

        for player
        in bowling_players[:3]

    )


    bowling_dependency_percentage = (

        (
            top_3_bowling_wickets
            / total_player_wickets
        ) * 100

        if total_player_wickets > 0

        else 0

    )


    # ======================================
    # ADD TEAM-SEASON RECORD
    # ======================================

    output.append({

        "team":
            team,

        "season":
            season,

        "batting": {

            "total_player_runs":
                total_player_runs,

            "top_3_dependency_percentage":
                round(
                    batting_dependency_percentage,
                    2
                ),

            "contributors":
                batting_contributors

        },


        "bowling": {

            "total_player_wickets":
                total_player_wickets,

            "top_3_dependency_percentage":
                round(
                    bowling_dependency_percentage,
                    2
                ),

            "top_5_contributors":
                bowling_contributors[:5],

            "contributors":
                bowling_contributors

        },

        "department_profile":
            team_department_profiles.get(
                (team, season),
                {}
            )

    })


# ==========================================
# SORT OUTPUT
# ==========================================

output.sort(

    key=lambda record: (

        record["season"],

        record["team"]

    )

)


# ==========================================
# SAVE OUTPUT
# ==========================================

with open(
    OUTPUT_FILE,
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        output,
        file,
        indent=4,
        ensure_ascii=False
    )


# ==========================================
# COMPLETION MESSAGE
# ==========================================

print(
    f"Generated {len(output)} "
    f"team contribution records."
)


print(
    f"Saved to {OUTPUT_FILE}"
)
