import os
from fastapi import APIRouter, HTTPException, Request
from backend.models.schemas import GenerateBriefingRequest
from backend.services.correlator import correlate
from backend.services.briefing_generator import generate_briefing

router = APIRouter()


@router.get("/briefing/{scenario_id}")
def get_briefing(scenario_id: str, request: Request):
    briefing = request.app.state.data["briefings"].get(scenario_id.upper())
    if not briefing:
        raise HTTPException(404, f"No pre-generated briefing for scenario {scenario_id}")
    return briefing


@router.post("/briefing/generate")
def generate(body: GenerateBriefingRequest, request: Request):
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(503, "OPENAI_API_KEY not configured — live generation unavailable")

    alarm = request.app.state.data["alarms"].get(body.alarm_id)
    if not alarm:
        raise HTTPException(404, f"Alarm {body.alarm_id} not found")

    ctx = correlate(body.alarm_id, request.app.state.data)
    return generate_briefing(ctx)
