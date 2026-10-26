import json
import os
from collections import defaultdict


# ==========================================
# FILE PATHS
# ==========================================

BOWLING_STATS_FILE = "data/processed/bowling_stats.json"

MATCH_STATS_FILE = "data/processed/player_match_stats.json"

OUTPUT_FILE = "data/processed/bowling_index.json"


# ==========================================
# BOWLING INDEX SETTINGS
# ==========================================

MINIMUM_INNINGS = 7

MINIMUM_BALLS_BOWLED = 120


AVERAGE_WEIGHT = 0.15

STRIKE_RATE_WEIGHT = 0.15

ECONOMY_WEIGHT = 0.30

CONTRIBUTION_WEIGHT = 0.20

DOT_BALL_WEIGHT = 0.20


# ==========================================
# LOAD DATA
# ==========================================

with open(
    BOWLING_STATS_FILE,
    "r",
    encoding="utf-8"
) as file:

    bowling_stats = json.load(file)


with open(
    MATCH_STATS_FILE,
    "r",
    encoding="utf-8"
) as file:

    match_stats = json.load(file)


# ==========================================
# CALCULATE SEASON TEAM WICKET TOTALS
# ==========================================

season_contribution_data = defaultdict(
    lambda: {
        "player_wickets": 0,
        "team_wickets_taken": 0
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
        "player_wickets"
    ] += record["wickets"]


    season_contribution_data[key][
        "team_wickets_taken"
    ] += record["team_wickets_taken"]


# ==========================================
# ADD CONTRIBUTION TO BOWLING STATS
# ==========================================

qualified_bowlers = []


for record in bowling_stats:

    player = record["player"]

    season = record["season"]

    key = (
        player,
        season
    )


    contribution_data = (
        season_contribution_data[key]
    )


    player_wickets = contribution_data[
        "player_wickets"
    ]


    team_wickets_taken = contribution_data[
        "team_wickets_taken"
    ]


    if team_wickets_taken > 0:

        contribution_percentage = (

            player_wickets
            / team_wickets_taken

        ) * 100

    else:

        contribution_percentage = 0


    record[
        "team_wicket_contribution_percentage"
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

        record["balls_bowled"] >= MINIMUM_BALLS_BOWLED

    ):

        qualified_bowlers.append(record)


# ==========================================
# GROUP BOWLERS BY SEASON
# ==========================================

bowlers_by_season = defaultdict(list)


for bowler in qualified_bowlers:

    bowlers_by_season[
        bowler["season"]
    ].append(bowler)


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

        better_values = sum(

            1
            for other_value in all_values
            if other_value < value

        )

    else:

        better_values = sum(

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

        better_values

        +

        0.5 * equal_values

    ) / len(all_values) * 100


    return round(
        percentile,
        2
    )


# ==========================================
# CALCULATE BOWLING INDICES
# ==========================================

output = []


for season, bowlers in bowlers_by_season.items():


    # ======================================
    # METRIC DISTRIBUTIONS
    # ======================================

    averages = [

        bowler["bowling_average"]

        for bowler in bowlers

        if bowler["bowling_average"] is not None

    ]


    strike_rates = [

        bowler["bowling_strike_rate"]

        for bowler in bowlers

        if bowler["bowling_strike_rate"] is not None

    ]


    economy_rates = [

        bowler["economy_rate"]

        for bowler in bowlers

    ]


    contributions = [

        bowler[
            "team_wicket_contribution_percentage"
        ]

        for bowler in bowlers

    ]


    dot_ball_percentages = [

        bowler["dot_ball_percentage"]

        for bowler in bowlers

    ]


    # ======================================
    # CALCULATE PLAYER SCORES
    # ======================================

    for bowler in bowlers:


        average_score = calculate_percentile(

            bowler["bowling_average"],

            averages,

            higher_is_better=False

        )


        strike_rate_score = calculate_percentile(

            bowler["bowling_strike_rate"],

            strike_rates,

            higher_is_better=False

        )


        economy_score = calculate_percentile(

            bowler["economy_rate"],

            economy_rates,

            higher_is_better=False

        )


        contribution_score = calculate_percentile(

            bowler[
                "team_wicket_contribution_percentage"
            ],

            contributions,

            higher_is_better=True

        )


        dot_ball_score = calculate_percentile(

            bowler["dot_ball_percentage"],

            dot_ball_percentages,

            higher_is_better=True

        )


        # ==================================
        # FINAL BOWLING INDEX
        # ==================================

        bowling_index = (

            average_score
            * AVERAGE_WEIGHT

            +

            strike_rate_score
            * STRIKE_RATE_WEIGHT

            +

            economy_score
            * ECONOMY_WEIGHT

            +

            contribution_score
            * CONTRIBUTION_WEIGHT

            +

            dot_ball_score
            * DOT_BALL_WEIGHT

        )


        output.append({

            "player": bowler["player"],

            "season": season,


            # Qualification information

            "innings": bowler["innings"],

            "balls_bowled": bowler["balls_bowled"],

            "wickets": bowler["wickets"],


            # Raw metrics

            "bowling_average":
                bowler["bowling_average"],

            "bowling_strike_rate":
                bowler["bowling_strike_rate"],

            "economy_rate":
                bowler["economy_rate"],

            "team_wicket_contribution_percentage":
                bowler[
                    "team_wicket_contribution_percentage"
                ],

            "dot_ball_percentage":
                bowler["dot_ball_percentage"],


            # Normalized scores

            "average_score":
                average_score,

            "strike_rate_score":
                strike_rate_score,

            "economy_score":
                economy_score,

            "contribution_score":
                contribution_score,

            "dot_ball_score":
                dot_ball_score,


            # Final index

            "bowling_index": round(
                bowling_index,
                2
            )

        })


# ==========================================
# SORT OUTPUT
# ==========================================

output.sort(

    key=lambda item: (

        item["season"],

        -item["bowling_index"]

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

    f"Successfully processed {len(output)} qualified player-season bowling indices."

)