from models.schemas import CostCalculateRequest, CostProjection, ModelCost

# USD per million tokens.
#
# Only the first row is a real, quoted price: it is the model this system actually calls
# (see services/briefing_generator.py). The other two rows are deliberately unnamed,
# illustrative price tiers used to show how briefing cost scales if you swap in a larger
# model — they are not quotes for any specific vendor's model, and published prices change.
# Check current vendor pricing before citing these numbers anywhere that matters.
MODELS = [
    {"model": "gpt-5-nano (in use)",      "price_in": 0.05,  "price_out": 0.40},
    {"model": "Mid-tier (illustrative)",  "price_in": 1.00,  "price_out": 5.00},
    {"model": "Frontier (illustrative)",  "price_in": 5.00,  "price_out": 25.00},
]


def _monthly(price_in: float, price_out: float, tokens_in: int, tokens_out: int, daily_volume: int) -> float:
    cost_per_briefing = (tokens_in * price_in + tokens_out * price_out) / 1_000_000
    return round(cost_per_briefing * daily_volume * 30, 2)


def _per_briefing(price_in: float, price_out: float, tokens_in: int, tokens_out: int) -> float:
    return round((tokens_in * price_in + tokens_out * price_out) / 1_000_000, 6)


def calculate(req: CostCalculateRequest) -> CostProjection:
    comparison = [
        ModelCost(
            model=m["model"],
            price_in=m["price_in"],
            price_out=m["price_out"],
            monthly_cost_realistic=_monthly(m["price_in"], m["price_out"], req.tokens_input_realistic, req.tokens_output_realistic, req.daily_alarm_volume),
            monthly_cost_pessimistic=_monthly(m["price_in"], m["price_out"], req.tokens_input_pessimistic, req.tokens_output_pessimistic, req.daily_alarm_volume),
            cost_per_briefing_realistic=_per_briefing(m["price_in"], m["price_out"], req.tokens_input_realistic, req.tokens_output_realistic),
            cost_per_briefing_pessimistic=_per_briefing(m["price_in"], m["price_out"], req.tokens_input_pessimistic, req.tokens_output_pessimistic),
        )
        for m in MODELS
    ]

    return CostProjection(inputs=req, model_comparison=comparison)
