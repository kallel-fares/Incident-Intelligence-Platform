from fastapi import APIRouter, HTTPException, Request

router = APIRouter()

SEVERITY_ORDER = {"critical": 0, "warning": 1, "info": 2}


@router.get("/alarms")
def list_alarms(request: Request):
    alarms = list(request.app.state.data["alarms"].values())
    sensors = request.app.state.data["sensors"]

    # Group by scenario
    groups: dict[str, list] = {}
    for alarm in alarms:
        s = alarm["scenario"]
        groups.setdefault(s, []).append(alarm)

    # Sort alarms within each group by severity
    for s in groups:
        groups[s].sort(key=lambda a: SEVERITY_ORDER.get(a["severity"], 9))

    # Sort scenarios by worst severity
    def group_severity(s):
        return min(SEVERITY_ORDER.get(a["severity"], 9) for a in groups[s])

    ordered = sorted(groups.keys(), key=group_severity)

    return [
        {
            "scenario": s,
            "worst_severity": min(
                (a["severity"] for a in groups[s]),
                key=lambda sev: SEVERITY_ORDER.get(sev, 9),
            ),
            "alarms": groups[s],
        }
        for s in ordered
    ]


@router.get("/alarms/{alarm_id}")
def get_alarm(alarm_id: str, request: Request):
    alarm = request.app.state.data["alarms"].get(alarm_id)
    if not alarm:
        raise HTTPException(404, f"Alarm {alarm_id} not found")

    scenario = alarm["scenario"]
    sensors = [s for s in request.app.state.data["sensors"] if s["scenario"] == scenario]
    equipment = request.app.state.data["equipment"].get(alarm["equipment_id"])

    return {"alarm": alarm, "sensors": sensors, "equipment": equipment}
