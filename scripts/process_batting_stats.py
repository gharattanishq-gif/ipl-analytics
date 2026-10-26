import json
import os
from collections import defaultdict

RAW_DATA_FOLDER = "data/raw_data"
OUTPUT_FILE = "data/processed/batting_stats.json"


# Stores batting statistics for each player and season
stats = defaultdict(
    lambda: {
        "matches": set(),
        "innings": 0,
        "runs": 0,
        "balls_faced": 0,
        "dismissals": 0,
        "fours": 0,
        "sixes": 0,
        "dot_balls": 0,
        "fifties": 0,
        "hundreds": 0
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


    season = str(match["info"]["season"])


    # Process every innings in the match

    for innings in match["innings"]:

        players_batted = set()
        innings_runs = defaultdict(int)


        for over in innings["overs"]:

            for delivery in over["deliveries"]:

                batter = delivery["batter"]

                player_key = (
                    batter,
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

                if batter not in players_batted:

                    stats[player_key]["innings"] += 1

                    players_batted.add(batter)


                # -------------------------
                # RUNS
                # -------------------------

                batter_runs = delivery["runs"]["batter"]

                stats[player_key]["runs"] += batter_runs
                innings_runs[batter] += batter_runs


                # -------------------------
                # BALLS FACED
                # -------------------------

                extras = delivery.get("extras", {})


                # Wides do not count as balls faced

                if "wides" not in extras:

                    stats[player_key]["balls_faced"] += 1


                # -------------------------
                # BOUNDARIES
                # -------------------------

                if batter_runs == 4:

                    stats[player_key]["fours"] += 1


                elif batter_runs == 6:

                    stats[player_key]["sixes"] += 1


                # -------------------------
                # DOT BALLS
                # -------------------------

                if (
                    batter_runs == 0
                    and "wides" not in extras
                ):

                    stats[player_key]["dot_balls"] += 1


                # -------------------------
                # DISMISSALS
                # -------------------------

                wickets = delivery.get(
                    "wickets",
                    []
                )


                for wicket in wickets:

                    if wicket["player_out"] != batter:
                        continue


                    dismissal_kind = wicket["kind"]


                    not_out_dismissals = [

                        "retired hurt",

                        "obstructing the field",

                        "retired not out"

                    ]


                    if dismissal_kind not in not_out_dismissals:

                        stats[player_key]["dismissals"] += 1


        # -------------------------
        # FIFTIES & HUNDREDS
        # -------------------------

        for batter, runs in innings_runs.items():

            player_key = (batter, season)

            if runs >= 100:
                stats[player_key]["hundreds"] += 1
            elif runs >= 50:
                stats[player_key]["fifties"] += 1


# -------------------------------------
# CALCULATE FINAL STATISTICS
# -------------------------------------

output = []


for (player, season), player_stats in stats.items():


    runs = player_stats["runs"]

    balls_faced = player_stats["balls_faced"]

    dismissals = player_stats["dismissals"]

    dot_balls = player_stats["dot_balls"]

    fours = player_stats["fours"]

    sixes = player_stats["sixes"]


    # Batting Average

    if dismissals > 0:

        batting_average = (
            runs / dismissals
        )

    else:

        batting_average = None


    # Strike Rate

    if balls_faced > 0:

        strike_rate = (
            runs / balls_faced
        ) * 100

    else:

        strike_rate = 0


    # Dot Ball Percentage

    if balls_faced > 0:

        dot_ball_percentage = (
            dot_balls / balls_faced
        ) * 100

    else:

        dot_ball_percentage = 0


    # Boundary Percentage
    # Percentage of the batter's runs scored through fours and sixes.

    boundary_runs = (fours * 4) + (sixes * 6)

    if runs > 0:

        boundary_percentage = (
            boundary_runs / runs
        ) * 100

    else:

        boundary_percentage = 0


    output.append({

        "player": player,

        "season": season,

        "matches": len(
            player_stats["matches"]
        ),

        "innings": player_stats["innings"],

        "runs": runs,

        "balls_faced": balls_faced,

        "dismissals": dismissals,

        "batting_average": (
            round(batting_average, 2)
            if batting_average is not None
            else None
        ),

        "strike_rate": round(
            strike_rate,
            2
        ),

        "fours": player_stats["fours"],

        "sixes": player_stats["sixes"],

        "fifties": player_stats["fifties"],

        "hundreds": player_stats["hundreds"],

        "dot_balls": dot_balls,

        "dot_ball_percentage": round(
            dot_ball_percentage,
            2
        ),

        "boundary_percentage": round(
            boundary_percentage,
            2
        )

    })


# Sort by player and season

output.sort(
    key=lambda item: (
        item["player"],
        item["season"]
    )
)


# Create output folder if required

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
    f"Successfully processed {len(output)} player-season batting records."
)