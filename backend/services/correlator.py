from datetime import datetime, timezone


def correlate(alarm_id: str, state: dict) -> dict:
    alarm = state["alarms"].get(alarm_id)
    if not alarm:
        raise ValueError(f"Alarm {alarm_id} not found")

    scenario = alarm["scenario"]
    equipment_id = alarm["equipment_id"]
    zone = alarm["zone"]

    equipment = state["equipment"].get(equipment_id, {})
    equip_type = equipment.get("type", "")

    # For Scenario C, grab all alarms in the scenario
    if scenario == "C":
        active_alarms = [a for a in state["alarms"].values() if a["scenario"] == "C"]
    else:
        active_alarms = [alarm]

    # Sensors: all sensors tagged to this scenario
    scenario_sensors = [s for s in state["sensors"] if s["scenario"] == scenario]

    # Flag anomalous sensors (last reading exceeds threshold)
    anomalous_sensors = []
    for sensor in scenario_sensors:
        if sensor["readings"]:
            last_val = sensor["readings"][-1]["value"]
            if last_val > sensor["threshold"]:
                anomalous_sensors.append(sensor)

    # Past incidents: match by equipment, zone, or alarm type
    alarm_types = {a["type"] for a in active_alarms}
    equipment_ids = {a["equipment_id"] for a in active_alarms}
    zones = {a["zone"] for a in active_alarms}

    matching_incidents = []
    for inc in state["incidents"]:
        score = 0
        if any(e in inc["equipment"] for e in equipment_ids):
            score += 3
        if inc["zone"] in zones or any(z in inc["zone"] for z in zones):
            score += 2
        if any(t in inc["alarm_types"] for t in alarm_types):
            score += 1
        if score >= 2:
            matching_incidents.append({"incident": inc, "score": score})

    matching_incidents.sort(key=lambda x: x["score"], reverse=True)
    matched_incidents = [m["incident"] for m in matching_incidents[:3]]

    # Documents: match by equipment tag or alarm type tag
    relevant_docs = []
    for doc in state["documents"].values():
        tag_match = (
            equip_type in doc["equipment_tags"]
            or equipment_id in doc["equipment_tags"]
            or any(t in doc["alarm_type_tags"] for t in alarm_types)
        )
        if tag_match:
            relevant_docs.append(doc)

    # Scenario C: add chiller schematic explicitly
    if scenario == "C":
        chiller_doc = state["documents"].get("SCHEMATIC-CHILLER")
        if chiller_doc and chiller_doc not in relevant_docs:
            relevant_docs.insert(0, chiller_doc)
        crit_sop = state["documents"].get("SOP-CRIT-001")
        if crit_sop and crit_sop not in relevant_docs:
            relevant_docs.insert(1, crit_sop)

    return {
        "alarm": alarm,
        "active_alarms": active_alarms,
        "equipment": equipment,
        "scenario": scenario,
        "anomalous_sensors": anomalous_sensors,
        "matching_incidents": matched_incidents,
        "relevant_docs": relevant_docs[:6],
    }
