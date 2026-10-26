import json
import os

RAW_DATA_FOLDER = "data/raw_data"
OUTPUT_FILE = "data/processed/player_match_stats.json"

output = []


for filename in os.listdir(RAW_DATA_FOLDER):

    if not filename.endswith(".json"):
        continue

    file_path = os.path.join(RAW_DATA_FOLDER, filename)

    with open(file_path, "r", encoding="utf-8") as file:
        match = json.load(file)


    season = str(match["info"]["season"])

    teams = match["info"]["teams"]

    match_players = match["info"]["players"]


    # Store statistics for every player in this match

    player_stats = {}


    for team, players in match_players.items():

        for player in players:

            player_stats[player] = {

                "player": player,

                "season": season,

                "match_id": filename.replace(".json", ""),

                "team": team,

                "opponent": (
                    teams[1]
                    if team == teams[0]
                    else teams[0]
                ),

                # Batting

                "runs": 0,

                "balls_faced": 0,

                "dismissed": False,

                "fours": 0,

                "sixes": 0,

                "batting_dot_balls": 0,

                "team_runs": 0,


                # Bowling

                "balls_bowled": 0,

                "runs_conceded": 0,

                "wickets": 0,

                "bowling_dot_balls": 0,

                "team_wickets_taken": 0

            }


    # ----------------------------------
    # PROCESS INNINGS
    # ----------------------------------

    for innings in match["innings"]:

        batting_team = innings["team"]

        bowling_team = (
            teams[1]
            if batting_team == teams[0]
            else teams[0]
        )


        innings_total_runs = 0

        innings_wickets = 0


        # ----------------------------------
        # FIRST PASS
        # Find team totals
        # ----------------------------------

        for over in innings["overs"]:

            for delivery in over["deliveries"]:

                innings_total_runs += (
                    delivery["runs"]["total"]
                )


                wickets = delivery.get(
                    "wickets",
                    []
                )


                innings_wickets += len(wickets)


        # Give team total to batting players

        for player in match_players[batting_team]:

            player_stats[player]["team_runs"] = (
                innings_total_runs
            )


        # Give wickets taken to bowling players

        for player in match_players[bowling_team]:

            player_stats[player]["team_wickets_taken"] = (
                innings_wickets
            )


        # ----------------------------------
        # SECOND PASS
        # Player statistics
        # ----------------------------------

        for over in innings["overs"]:

            for delivery in over["deliveries"]:


                batter = delivery["batter"]

                bowler = delivery["bowler"]

                extras = delivery.get(
                    "extras",
                    {}
                )


                # ==========================
                # BATTING
                # ==========================

                batter_runs = delivery["runs"]["batter"]


                player_stats[batter]["runs"] += (
                    batter_runs
                )


                # Balls faced

                if "wides" not in extras:

                    player_stats[batter]["balls_faced"] += 1


                # Boundaries

                if batter_runs == 4:

                    player_stats[batter]["fours"] += 1


                elif batter_runs == 6:

                    player_stats[batter]["sixes"] += 1


                # Batting dots

                if (
                    batter_runs == 0
                    and "wides" not in extras
                ):

                    player_stats[batter][
                        "batting_dot_balls"
                    ] += 1


                # ==========================
                # BOWLING
                # ==========================

                is_legal_delivery = (
                    "wides" not in extras
                    and "noballs" not in extras
                )


                if is_legal_delivery:

                    player_stats[bowler][
                        "balls_bowled"
                    ] += 1


                # Runs conceded

                total_runs = delivery["runs"]["total"]

                byes = extras.get("byes", 0)

                legbyes = extras.get("legbyes", 0)


                bowler_runs = (
                    total_runs
                    - byes
                    - legbyes
                )


                player_stats[bowler][
                    "runs_conceded"
                ] += bowler_runs


                # Bowling dots

                if (
                    is_legal_delivery
                    and total_runs == 0
                ):

                    player_stats[bowler][
                        "bowling_dot_balls"
                    ] += 1


                # ==========================
                # WICKETS
                # ==========================

                wickets = delivery.get(
                    "wickets",
                    []
                )


                for wicket in wickets:

                    dismissed_player = wicket["player_out"]

                    dismissal_kind = wicket["kind"]


                    # Batter dismissal status

                    not_out_dismissals = {

                        "retired hurt",

                        "obstructing the field",

                        "retired not out"

                    }


                    if (
                        dismissal_kind
                        not in not_out_dismissals
                    ):

                        player_stats[
                            dismissed_player
                        ]["dismissed"] = True


                    # Bowler wickets

                    bowler_wicket_kinds = {

                        "bowled",

                        "caught",

                        "caught and bowled",

                        "lbw",

                        "stumped",

                        "hit wicket"

                    }


                    if (
                        dismissal_kind
                        in bowler_wicket_kinds
                    ):

                        player_stats[bowler][
                            "wickets"
                        ] += 1


    # ----------------------------------
    # CALCULATE MATCH METRICS
    # ----------------------------------

    for player in player_stats.values():


        # ==========================
        # BATTING METRICS
        # ==========================

        if player["balls_faced"] > 0:

            player["strike_rate"] = round(

                (
                    player["runs"]
                    / player["balls_faced"]
                ) * 100,

                2
            )


            player["batting_dot_percentage"] = round(

                (
                    player["batting_dot_balls"]
                    / player["balls_faced"]
                ) * 100,

                2
            )


        else:

            player["strike_rate"] = None

            player["batting_dot_percentage"] = None


        # Batting contribution

        if player["team_runs"] > 0:

            player["batting_contribution_percentage"] = round(

                (
                    player["runs"]
                    / player["team_runs"]
                ) * 100,

                2
            )


        else:

            player["batting_contribution_percentage"] = None


        # ==========================
        # BOWLING METRICS
        # ==========================

        if player["balls_bowled"] > 0:

            player["economy_rate"] = round(

                (
                    player["runs_conceded"]
                    / player["balls_bowled"]
                ) * 6,

                2
            )


            player["bowling_dot_percentage"] = round(

                (
                    player["bowling_dot_balls"]
                    / player["balls_bowled"]
                ) * 100,

                2
            )


        else:

            player["economy_rate"] = None

            player["bowling_dot_percentage"] = None


        # Bowling contribution

        if player["team_wickets_taken"] > 0:

            player["bowling_contribution_percentage"] = round(

                (
                    player["wickets"]
                    / player["team_wickets_taken"]
                ) * 100,

                2
            )


        else:

            player["bowling_contribution_percentage"] = None


        output.append(player)


# ----------------------------------
# SORT OUTPUT
# ----------------------------------

output.sort(

    key=lambda item: (

        item["player"],

        item["season"],

        item["match_id"]

    )

)


# ----------------------------------
# SAVE OUTPUT
# ----------------------------------

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

    f"Successfully processed {len(output)} player-match records."

)