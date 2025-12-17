from fastapi import APIRouter
from models.schemas import CostCalculateRequest
from services.cost_calculator import calculate

router = APIRouter()


@router.get("/cost-model")
def get_default_projection():
    return calculate(CostCalculateRequest())


@router.post("/cost-model/calculate")
def custom_projection(req: CostCalculateRequest):
    return calculate(req)
