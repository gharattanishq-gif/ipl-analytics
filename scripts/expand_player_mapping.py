
import json
import os

PLAYERS_FILE = "data/processed/players.json"
MAPPING_FILE = "data/processed/player_mapping.json"

# Load all players from our dataset
with open(PLAYERS_FILE, "r", encoding="utf-8") as file:
    players = json.load(file)

# Load our existing mapping, if available
if os.path.exists(MAPPING_FILE):
    with open(MAPPING_FILE, "r", encoding="utf-8") as file:
        existing_mapping = json.load(file)
else:
    existing_mapping = {}

expanded_mapping = {}

for player in players:
    canonical_name = player["name"]
    existing = existing_mapping.get(canonical_name, {})

    # Support both the new object format and the older list format
    if isinstance(existing, dict):
        display_name = existing.get("display_name", canonical_name)
        old_aliases = existing.get("aliases", [])
    elif isinstance(existing, list):
        display_name = canonical_name
        old_aliases = existing
    else:
        display_name = canonical_name
        old_aliases = []

    # Always include the canonical and display names as searchable aliases
    aliases = [
        canonical_name,
        display_name,
        *old_aliases
    ]

    # Remove duplicates without changing the original order
    unique_aliases = []
    seen = set()

    for alias in aliases:
        if not isinstance(alias, str):
            continue

        alias = alias.strip()
        if alias and alias.casefold() not in seen:
            unique_aliases.append(alias)
            seen.add(alias.casefold())

    expanded_mapping[canonical_name] = {
        "display_name": display_name,
        "aliases": unique_aliases
    }

# Save the expanded mapping
os.makedirs(os.path.dirname(MAPPING_FILE), exist_ok=True)

with open(MAPPING_FILE, "w", encoding="utf-8") as file:
    json.dump(
        expanded_mapping,
        file,
        indent=2,
        ensure_ascii=False
    )

print(f"Players in dataset: {len(players)}")
print(f"Players in mapping: {len(expanded_mapping)}")
print(f"Mapping saved to: {MAPPING_FILE}")
