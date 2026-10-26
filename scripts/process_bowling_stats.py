import json
import os
from collections import defaultdict


RAW_DATA_FOLDER = "data/raw_data"
OUTPUT_FILE = "data/processed/bowling_stats.json"


stats = defaultdict(
    lambda: {
        "matches": set(),
        "innings": 0,
        "balls_bowled": 0,
        "runs_conceded": 0,
        "wickets": 0,
        "dot_balls": 0
    }
)


# Dismissals credited to the bowler
BOWLER_WICKET_KINDS = {
    "bowled",
    "caught",
    "caught and bowled",
    "lbw",
    "stumped",
    "hit wicket"
}


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


    season = str(match["info"]["season"])


    # Process every innings

    for innings in match["innings"]:

        bowlers_used = set()


        for over in innings["overs"]:

            for delivery in over["deliveries"]:

                bowler = delivery["bowler"]

                player_key = (
                    bowler,
                    season
                )


                # -------------------------
                # MATCHES
                # -------------------------

                stats[player_key]["matches"].add(
                    filename
                )


                # -------------------------
                # INNINGS
                # -------------------------

                if bowler not in bowlers_used:

                    stats[player_key]["innings"] += 1

                    bowlers_used.add(bowler)


                extras = delivery.get(
                    "extras",
                    {}
                )


                # -------------------------
                # LEGAL BALLS
                # -------------------------

                # Wides and no-balls do not count
                # as legal deliveries

                is_legal_delivery = (
                    "wides" not in extras
                    and "noballs" not in extras
                )


                if is_legal_delivery:

                    stats[player_key]["balls_bowled"] += 1


                # -------------------------
                # RUNS CONCEDED
                # -------------------------

                total_runs = delivery["runs"]["total"]


                # Byes and leg byes are not
                # charged to the bowler

                byes = extras.get("byes", 0)

                legbyes = extras.get("legbyes", 0)


                bowler_runs = (
                    total_runs
                    - byes
                    - legbyes
                )


                stats[player_key]["runs_conceded"] += (
                    bowler_runs
                )


                # -------------------------
                # DOT BALLS
                # -------------------------

                # A bowling dot ball means:
                # legal delivery
                # and zero total runs

                if (
                    is_legal_delivery
                    and total_runs == 0
                ):

                    stats[player_key]["dot_balls"] += 1


                # -------------------------
                # WICKETS
                # -------------------------

                wickets = delivery.get(
                    "wickets",
                    []
                )


                for wicket in wickets:

                    dismissal_kind = wicket["kind"]


                    if dismissal_kind in BOWLER_WICKET_KINDS:

                        stats[player_key]["wickets"] += 1



# -------------------------------------
# CALCULATE FINAL STATISTICS
# -------------------------------------

output = []


for (player, season), player_stats in stats.items():


    balls_bowled = player_stats["balls_bowled"]

    runs_conceded = player_stats["runs_conceded"]

    wickets = player_stats["wickets"]

    dot_balls = player_stats["dot_balls"]


    # -------------------------
    # BOWLING AVERAGE
    # -------------------------

    if wickets > 0:

        bowling_average = (
            runs_conceded / wickets
        )

    else:

        bowling_average = None


    # -------------------------
    # BOWLING STRIKE RATE
    # -------------------------

    if wickets > 0:

        bowling_strike_rate = (
            balls_bowled / wickets
        )

    else:

        bowling_strike_rate = None


    # -------------------------
    # ECONOMY RATE
    # -------------------------

    if balls_bowled > 0:

        economy_rate = (
            runs_conceded / balls_bowled
        ) * 6

    else:

        economy_rate = 0


    # -------------------------
    # DOT BALL PERCENTAGE
    # -------------------------

    if balls_bowled > 0:

        dot_ball_percentage = (
            dot_balls / balls_bowled
        ) * 100

    else:

        dot_ball_percentage = 0


    output.append({

        "player": player,

        "season": season,

        "matches": len(
            player_stats["matches"]
        ),

        "innings": player_stats["innings"],

        "balls_bowled": balls_bowled,

        "runs_conceded": runs_conceded,

        "wickets": wickets,

        "bowling_average": (
            round(bowling_average, 2)
            if bowling_average is not None
            else None
        ),

        "bowling_strike_rate": (
            round(bowling_strike_rate, 2)
            if bowling_strike_rate is not None
            else None
        ),

        "economy_rate": round(
            economy_rate,
            2
        ),

        "dot_balls": dot_balls,

        "dot_ball_percentage": round(
            dot_ball_percentage,
            2
        )

    })


# Sort output by player and season

output.sort(
    key=lambda item: (
        item["player"],
        item["season"]
    )
)


# Create output folder if needed

os.makedirs(
    os.path.dirname(OUTPUT_FILE),
    exist_ok=True
)


# Save JSON

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
    f"Successfully processed {len(output)} player-season bowling records."
)