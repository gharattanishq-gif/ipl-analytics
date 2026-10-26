import os
import json
from collections import defaultdict


RAW_DATA_FOLDER = "data/raw_data"
OUTPUT_FILE = "data/processed/team_stats.json"


# ==========================================
# NORMALIZE FRANCHISE NAMES
# ==========================================

FRANCHISE_NAME_MAPPING = {

    # Delhi
    "Delhi Daredevils":
        "Delhi Capitals",

    # Punjab
    "Kings XI Punjab":
        "Punjab Kings",

    # Bengaluru
    "Royal Challengers Bangalore":
        "Royal Challengers Bengaluru",

    # Hyderabad (your chosen design)
    "Deccan Chargers":
        "Sunrisers Hyderabad",

    # Dataset inconsistency
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

team_stats = defaultdict(
    lambda: {
        "matches_played": 0,
        "wins": 0,
        "losses": 0,
        "ties": 0,
        "no_results": 0,
        "total_runs": 0,
        "total_wickets_taken": 0
    }
)


BOWLER_WICKET_TYPES = {
    "bowled",
    "caught",
    "caught and bowled",
    "lbw",
    "stumped",
    "hit wicket"
}


# ==========================================
# PROCESS RAW MATCH FILES
# ==========================================

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


    info = match["info"]


    # ======================================
    # NORMALIZE SEASON
    # ======================================

    season = str(info["season"])
 
    season = SEASON_MAPPING.get(

        season,

        season

    )

      # ======================================
    # NORMALIZE TEAM NAMES
    # ======================================

    teams = [

        FRANCHISE_NAME_MAPPING.get(
            team,
            team
        )

        for team in info["teams"]

    ]


    # ======================================
    # MATCH OUTCOME
    # ======================================

    outcome = info.get(
        "outcome",
        {}
    )


    winner = outcome.get("winner")

    if winner is not None:

        winner = FRANCHISE_NAME_MAPPING.get(
            winner,
            winner
        )


    result = outcome.get("result")


    # ======================================
    # RECORD MATCH RESULT
    # ======================================

    for team in teams:

        key = (
            team,
            season
        )


        team_stats[
            key
        ]["matches_played"] += 1


        # No-result match

        if result == "no result":

            team_stats[
                key
            ]["no_results"] += 1


        # Tied match

        elif result == "tie":

            team_stats[
                key
            ]["ties"] += 1


        # Match has a winner

        elif winner is not None:

            if team == winner:

                team_stats[
                    key
                ]["wins"] += 1

            else:

                team_stats[
                    key
                ]["losses"] += 1


        # Unknown / exceptional outcome

        else:

            team_stats[
                key
            ]["no_results"] += 1


    # ======================================
    # PROCESS INNINGS
    # ======================================

    for innings in match.get(
        "innings",
        []
    ):

        batting_team = FRANCHISE_NAME_MAPPING.get(

            innings["team"],

            innings["team"]

        )


        bowling_team = next(

            team

            for team in teams

            if team != batting_team

        )


        batting_key = (
            batting_team,
            season
        )


        bowling_key = (
            bowling_team,
            season
        )


        # ==================================
        # PROCESS OVERS
        # ==================================

        for over in innings.get(
            "overs",
            []
        ):


            # ==============================
            # PROCESS DELIVERIES
            # ==============================

            for delivery in over.get(
                "deliveries",
                []
            ):


                # ==========================
                # TEAM RUNS
                # ==========================

                team_runs = delivery[
                    "runs"
                ]["total"]


                team_stats[
                    batting_key
                ]["total_runs"] += team_runs


                # ==========================
                # TEAM WICKETS TAKEN
                # ==========================

                for wicket in delivery.get(
                    "wickets",
                    []
                ):

                    wicket_type = wicket[
                        "kind"
                    ]


                    if (
                        wicket_type
                        in BOWLER_WICKET_TYPES
                    ):

                        team_stats[
                            bowling_key
                        ][
                            "total_wickets_taken"
                        ] += 1


# ==========================================
# BUILD FINAL OUTPUT
# ==========================================

output = []


for (
    team,
    season
), stats in team_stats.items():


    matches_played = stats[
        "matches_played"
    ]


    wins = stats["wins"]


    win_percentage = (

        (wins / matches_played) * 100

        if matches_played > 0

        else 0

    )

    output.append({

        "team":
            team,

        "season":
            season,

        "matches_played":
            matches_played,

        "wins":
            wins,

        "losses":
            stats["losses"],

        "ties":
            stats["ties"],

        "no_results":
            stats["no_results"],

        "win_percentage":
            round(
                win_percentage,
                2
            ),

        "total_runs":
            stats["total_runs"],

        "total_wickets_taken":
            stats[
                "total_wickets_taken"
            ]

    })


# ==========================================
# SORT RECORDS
# ==========================================

output.sort(

    key=lambda record: (

        record["season"],

        record["team"]

    )

)


# ==========================================
# VALIDATE RECORDS
# ==========================================

invalid_records = []


for record in output:

    accounted_matches = (

        record["wins"]

        + record["losses"]

        + record["ties"]

        + record["no_results"]

    )


    if (
        accounted_matches
        != record["matches_played"]
    ):

        invalid_records.append(
            record
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
    f"team-season records."
)


print(
    f"Saved to {OUTPUT_FILE}"
)


if invalid_records:

    print(
        f"WARNING: Found "
        f"{len(invalid_records)} "
        f"invalid records."
    )

else:

    print(
        "Validation successful: "
        "all match totals are consistent."
    )

    