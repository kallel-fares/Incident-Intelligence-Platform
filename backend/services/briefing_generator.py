import json
import os

PRICE_INPUT_PER_M = 0.05
PRICE_OUTPUT_PER_M = 0.40

SYSTEM_PROMPT = (
    "You are an expert data center operations advisor generating concise field team briefings. "
    "Be direct and actionable. Return a single JSON object matching this schema exactly:\n"
    '{"summary": str, "severity_assessment": str, "probable_causes": [{"cause": str, "confidence": str, "basis": str}], '
    '"correlated_signals": [{"signal": str, "relevance": str}], '
    '"similar_incidents": [{"incident_id": str, "summary": str, "date": str}], '
    '"recommended_actions": [{"step": int, "action": str, "reason": str}], '
    '"required_tools": [str], "required_parts": [str], '
    '"relevant_documents": [{"doc_id": str, "section": str}], '
    '"estimated_resolution_time": str, "escalation": str}'
)


def _build_prompt(ctx: dict) -> str:
    alarm = ctx["alarm"]
    active_alarms = ctx["active_alarms"]
    equipment = ctx["equipment"]
    sensors = ctx["anomalous_sensors"]
    incidents = ctx["matching_incidents"]
    docs = ctx["relevant_docs"]

    lines = ["ACTIVE ALARM(S):"]
    for a in active_alarms:
        lines.append(
            f"  [{a['alarm_id']}] {a['timestamp']} | {a['equipment_id']} ({a['zone']}) | "
            f"{a['type']} | severity={a['severity']} | {a['message']}"
            + (f" | value={a['value']}{a['unit']}" if a["value"] is not None else "")
        )

    lines.append("\nEQUIPMENT SPECS:")
    if equipment:
        lines.append(f"  {equipment.get('equipment_id')} — {equipment.get('name')} ({equipment.get('model')})")
        for k, v in equipment.get("specs", {}).items():
            lines.append(f"    {k}: {v}")

    lines.append("\nANOMALOUS SENSOR READINGS (last reading vs threshold):")
    for s in sensors[:8]:
        last = s["readings"][-1]
        lines.append(
            f"  {s['sensor_id']} ({s['label']}): {last['value']}{s['unit']} "
            f"[threshold: {s['threshold']}{s['unit']}] at {last['timestamp']}"
        )
        if len(s["readings"]) >= 3:
            trend = [r["value"] for r in s["readings"][-5:]]
            lines.append(f"    trend (last 5 readings): {trend}")

    lines.append("\nSIMILAR PAST INCIDENTS:")
    for inc in incidents:
        lines.append(f"  [{inc['incident_id']}] {inc['date']} — {inc['title']}")
        lines.append(f"    Root cause: {inc['root_cause']}")
        lines.append(f"    Resolution: {inc['resolution']}")
        lines.append(f"    Match basis: {inc['similarity_basis']}")

    lines.append("\nRELEVANT DOCUMENTATION:")
    for doc in docs[:5]:
        lines.append(f"  [{doc['doc_id']}] {doc['title']} ({doc['type']})")
        for section in doc["sections"][:2]:
            excerpt = section["content"][:400]
            lines.append(f"    §{section['heading']}: {excerpt}")

    return "\n".join(lines)


def generate_briefing(ctx: dict) -> dict:
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set")

    from openai import OpenAI
    client = OpenAI(api_key=api_key)

    prompt = _build_prompt(ctx)

    response = client.responses.create(
        model="gpt-5-nano",
        input=prompt,
        instructions=SYSTEM_PROMPT,
        reasoning={"effort": "low"},
    )

    text = response.output_text
    tokens_in = response.usage.input_tokens
    tokens_out = response.usage.output_tokens
    cost = (tokens_in / 1_000_000 * PRICE_INPUT_PER_M) + (tokens_out / 1_000_000 * PRICE_OUTPUT_PER_M)

    try:
        briefing_data = json.loads(text)
    except json.JSONDecodeError:
        # Extract JSON from markdown code block if present
        import re
        match = re.search(r"```(?:json)?\s*([\s\S]+?)```", text)
        if match:
            briefing_data = json.loads(match.group(1))
        else:
            briefing_data = {"summary": text, "raw": True}

    return {
        "scenario": ctx["scenario"],
        "alarm_ids": [a["alarm_id"] for a in ctx["active_alarms"]],
        "generated_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
        "model_used": "gpt-5-nano",
        "tokens_in": tokens_in,
        "tokens_out": tokens_out,
        "estimated_cost_usd": round(cost, 6),
        "briefing": briefing_data,
    }
