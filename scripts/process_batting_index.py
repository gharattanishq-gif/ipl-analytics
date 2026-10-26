import json
import os
from collections import defaultdict


# ==========================================
# FILE PATHS
# ==========================================

BATTING_STATS_FILE = "data/processed/batting_stats.json"

MATCH_STATS_FILE = "data/processed/player_match_stats.json"

OUTPUT_FILE = "data/processed/batting_index.json"


# ==========================================
# BATTING INDEX SETTINGS
# ==========================================

MINIMUM_INNINGS = 7

MINIMUM_BALLS_FACED = 100


AVERAGE_WEIGHT = 0.20

STRIKE_RATE_WEIGHT = 0.30

CONTRIBUTION_WEIGHT = 0.25

DOT_BALL_CONTROL_WEIGHT = 0.25


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
    MATCH_STATS_FILE,
    "r",
    encoding="utf-8"
) as file:

    match_stats = json.load(file)


# ==========================================
# CALCULATE SEASON TEAM RUN TOTALS
# ==========================================

season_contribution_data = defaultdict(
    lambda: {
        "player_runs": 0,
        "team_runs": 0
    }
)


for record in match_stats:

    player = record["player"]

    season = record["season"]


    key = (
        player,
        season
    )


    season_contribution_data[key][
        "player_runs"
    ] += record["runs"]


    season_contribution_data[key][
        "team_runs"
    ] += record["team_runs"]


# ==========================================
# ADD CONTRIBUTION TO BATTING STATS
# ==========================================

qualified_batters = []


for record in batting_stats:

    player = record["player"]

    season = record["season"]


    key = (
        player,
        season
    )


    contribution_data = (
        season_contribution_data[key]
    )


    player_runs = contribution_data[
        "player_runs"
    ]


    team_runs = contribution_data[
        "team_runs"
    ]


    if team_runs > 0:

        contribution_percentage = (

            player_runs
            / team_runs

        ) * 100

    else:

        contribution_percentage = 0


    record[
        "team_contribution_percentage"
    ] = round(
        contribution_percentage,
        2
    )


    # ======================================
    # QUALIFICATION FILTER
    # ======================================

    if (

        record["innings"] >= MINIMUM_INNINGS

        and

        record["balls_faced"] >= MINIMUM_BALLS_FACED

    ):

        qualified_batters.append(record)


# ==========================================
# GROUP BATTERS BY SEASON
# ==========================================

batters_by_season = defaultdict(list)


for batter in qualified_batters:

    batters_by_season[
        batter["season"]
    ].append(batter)


# ==========================================
# PERCENTILE FUNCTION
# ==========================================

def calculate_percentile(
    value,
    all_values,
    higher_is_better=True
):

    if len(all_values) <= 1:

        return 100.0


    if higher_is_better:

        lower_values = sum(

            1
            for other_value in all_values
            if other_value < value

        )

    else:

        lower_values = sum(

            1
            for other_value in all_values
            if other_value > value

        )


    equal_values = sum(

        1
        for other_value in all_values
        if other_value == value

    )


    percentile = (

        lower_values

        +

        0.5 * equal_values

    ) / len(all_values) * 100


    return round(
        percentile,
        2
    )


# ==========================================
# CALCULATE BATTING INDICES
# ==========================================

output = []


for season, batters in batters_by_season.items():


    # Collect metric distributions

    averages = [

        batter["batting_average"]

        for batter in batters

        if batter["batting_average"] is not None

    ]


    strike_rates = [

        batter["strike_rate"]

        for batter in batters

    ]


    contributions = [

        batter["team_contribution_percentage"]

        for batter in batters

    ]


    dot_ball_percentages = [

        batter["dot_ball_percentage"]

        for batter in batters

    ]


    # ======================================
    # CALCULATE PLAYER SCORES
    # ======================================

    for batter in batters:


        average_score = calculate_percentile(

            batter["batting_average"],

            averages,

            higher_is_better=True

        )


        strike_rate_score = calculate_percentile(

            batter["strike_rate"],

            strike_rates,

            higher_is_better=True

        )


        contribution_score = calculate_percentile(

            batter["team_contribution_percentage"],

            contributions,

            higher_is_better=True

        )


        dot_ball_control_score = calculate_percentile(

            batter["dot_ball_percentage"],

            dot_ball_percentages,

            higher_is_better=False

        )


        # ==================================
        # FINAL BATTING INDEX
        # ==================================

        batting_index = (

            average_score
            * AVERAGE_WEIGHT

            +

            strike_rate_score
            * STRIKE_RATE_WEIGHT

            +

            contribution_score
            * CONTRIBUTION_WEIGHT

            +

            dot_ball_control_score
            * DOT_BALL_CONTROL_WEIGHT

        )


        output.append({

            "player": batter["player"],

            "season": season,


            # Qualification information

            "innings": batter["innings"],

            "runs": batter["runs"],

            "balls_faced": batter["balls_faced"],


            # Raw metrics

            "batting_average":
                batter["batting_average"],

            "strike_rate":
                batter["strike_rate"],

            "team_contribution_percentage":
                batter[
                    "team_contribution_percentage"
                ],

            "dot_ball_percentage":
                batter["dot_ball_percentage"],


            # Normalized scores

            "average_score":
                average_score,

            "strike_rate_score":
                strike_rate_score,

            "contribution_score":
                contribution_score,

            "dot_ball_control_score":
                dot_ball_control_score,


            # Final index

            "batting_index": round(
                batting_index,
                2
            )

        })


# ==========================================
# SORT OUTPUT
# ==========================================

output.sort(

    key=lambda item: (

        item["season"],

        -item["batting_index"]

    )

)


# ==========================================
# SAVE OUTPUT
# ==========================================

os.makedirs(

    os.path.dirname(OUTPUT_FILE),

    exist_ok=True

)


with open(

    OUTPUT_FILE,

    "w",

    encoding="utf-8"

) as file:

    json.dump(

        output,

        file,

        indent=4

    )


print(

    f"Successfully processed {len(output)} qualified player-season batting indices."

)