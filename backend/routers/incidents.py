from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/incidents")
def list_incidents(request: Request):
    return request.app.state.data["incidents"]
