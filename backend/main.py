import os
import sys

# Ensure backend/ is on sys.path so imports work from both project root and Vercel
_backend_dir = os.path.dirname(os.path.abspath(__file__))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from services.data_loader import load_all
from routers import alarms, briefings, documents, incidents, cost_model

load_dotenv(os.path.join(_backend_dir, ".env"))

app = FastAPI(title="Meridian Incident Intelligence API")
app.state.data = load_all()

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(alarms.router, prefix="/api")
app.include_router(briefings.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(incidents.router, prefix="/api")
app.include_router(cost_model.router, prefix="/api")
