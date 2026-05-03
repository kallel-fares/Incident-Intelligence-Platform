import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent.parent / "data"


def _load(filename: str) -> list:
    with open(DATA_DIR / filename, encoding="utf-8") as f:
        return json.load(f)


def load_all() -> dict:
    equipment = {e["equipment_id"]: e for e in _load("equipment.json")}
    sensors = _load("sensors.json")
    alarms = {a["alarm_id"]: a for a in _load("alarms.json")}
    incidents = _load("incidents.json")
    documents = {d["doc_id"]: d for d in _load("documents.json")}
    briefings = {b["scenario"]: b for b in _load("briefings.json")}

    return {
        "equipment": equipment,
        "sensors": sensors,
        "alarms": alarms,
        "incidents": incidents,
        "documents": documents,
        "briefings": briefings,
    }
