import json
import os

RAW_DATA_FOLDER = "data/raw_data"
OUTPUT_FILE = "data/processed/players.json"

SEASON_MAPPING = {

    "2007/08": "2008",

    "2009/10": "2010",

    "2020/21": "2020"

}

players = {}

for filename in os.listdir(RAW_DATA_FOLDER):

    if not filename.endswith(".json"):
        continue

    file_path = os.path.join(RAW_DATA_FOLDER, filename)

    with open(file_path, "r", encoding="utf-8") as file:
        match = json.load(file)

    season = str(match["info"]["season"])
    season = SEASON_MAPPING.get(
        season,
        season
    )

    match_players = match["info"]["players"]

    for team, player_list in match_players.items():

        for player in player_list:

            if player not in players:
                players[player] = {
                    "name": player,
                    "seasons": set()
                }

            players[player]["seasons"].add(season)


player_list = []

for player in players.values():

    player["seasons"] = sorted(
        list(player["seasons"])
    )

    player_list.append(player)


player_list.sort(
    key=lambda player: player["name"]
)


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
        player_list,
        file,
        indent=4
    )


print(
    f"Successfully processed {len(player_list)} IPL players."
)