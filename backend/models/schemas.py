from pydantic import BaseModel
from typing import Any, Optional


class SensorReading(BaseModel):
    timestamp: str
    value: float


class Sensor(BaseModel):
    sensor_id: str
    equipment_id: str
    zone: str
    type: str
    label: str
    unit: str
    threshold: float
    scenario: str
    readings: list[SensorReading]


class Alarm(BaseModel):
    alarm_id: str
    timestamp: str
    equipment_id: str
    zone: str
    type: str
    severity: str
    value: Optional[float] = None
    threshold: Optional[float] = None
    unit: Optional[str] = None
    message: str
    scenario: str


class Equipment(BaseModel):
    equipment_id: str
    name: str
    type: str
    zone: str
    model: str
    install_date: str
    last_maintenance: str
    chiller_loop: Optional[int] = None
    specs: dict[str, Any]


class Incident(BaseModel):
    incident_id: str
    date: str
    zone: str
    equipment: list[str]
    alarm_types: list[str]
    title: str
    root_cause: str
    symptoms: str
    resolution: str
    time_to_resolve_min: int
    parts_used: list[str]
    tools_used: list[str]
    lessons_learned: str
    similarity_basis: str


class DocumentSection(BaseModel):
    heading: str
    content: str


class Document(BaseModel):
    doc_id: str
    title: str
    type: str
    source: str
    equipment_tags: list[str]
    alarm_type_tags: list[str]
    last_updated: str
    version: str
    sections: list[DocumentSection]


class CostCalculateRequest(BaseModel):
    daily_alarm_volume: int = 200
    tokens_input_realistic: int = 15_000
    tokens_output_realistic: int = 500
    tokens_input_pessimistic: int = 80_000
    tokens_output_pessimistic: int = 1_500


class ModelCost(BaseModel):
    model: str
    price_in: float
    price_out: float
    monthly_cost_realistic: float
    monthly_cost_pessimistic: float
    cost_per_briefing_realistic: float
    cost_per_briefing_pessimistic: float


class CostProjection(BaseModel):
    inputs: CostCalculateRequest
    model_comparison: list[ModelCost]


class GenerateBriefingRequest(BaseModel):
    alarm_id: str
