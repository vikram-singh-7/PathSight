from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional

from app.config import settings
from app.models.schemas import (
    HealthResponse,
    CampusNode,
    CampusEdge,
    RouteRequest,
    RouteResponse,
    ObstacleReport,
    DetectionResponse,
)
from app.services.graph_service import graph_service
from app.services.vision_service import vision_service

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="PathSight Assistive Navigation & Vision API (PS-15)",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FramePayload(BaseModel):
    image: str
    confidence_threshold: Optional[float] = Field(0.35, ge=0.1, le=0.9)

@app.get("/", tags=["Root"])
def read_root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "vision_model_ready": vision_service.is_loaded,
        "vision_device": vision_service.device,
        "campus_nodes_count": len(graph_service.nodes),
        "docs_url": "/docs",
    }

@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    return HealthResponse(
        status="ok",
        version=settings.VERSION,
        timestamp=datetime.utcnow(),
        service=settings.PROJECT_NAME,
    )

# --- Model & Vision Endpoints ---

@app.get("/api/model/status", tags=["Vision"])
def get_model_status():
    return vision_service.get_status()

@app.post("/api/detect", response_model=DetectionResponse, tags=["Vision"])
def detect_objects(payload: FramePayload):
    if not payload.image:
        raise HTTPException(status_code=400, detail="Image base64 data is required.")
    return vision_service.detect(
        base64_image=payload.image,
        confidence_threshold=payload.confidence_threshold or 0.35,
    )

# --- Campus Navigation Endpoints ---

@app.get("/api/campus/nodes", response_model=List[CampusNode], tags=["Campus"])
def get_campus_nodes():
    return graph_service.get_nodes()

@app.get("/api/campus/edges", response_model=List[CampusEdge], tags=["Campus"])
def get_campus_edges():
    return graph_service.get_edges()

@app.post("/api/campus/route", response_model=RouteResponse, tags=["Campus"])
def calculate_route(payload: RouteRequest):
    return graph_service.find_route(
        source=payload.source,
        destination=payload.destination,
        accessible_only=payload.accessible_only,
    )

@app.post("/api/campus/obstacles", tags=["Campus"])
def update_obstacle(payload: ObstacleReport):
    success = graph_service.set_obstacle(
        edge_id=payload.edge_id,
        is_blocked=payload.is_blocked,
        reason=payload.reason or "Maintenance",
    )
    if not success:
        raise HTTPException(status_code=404, detail="Edge ID not found in campus map.")
    return {
        "success": True,
        "edge_id": payload.edge_id,
        "is_blocked": payload.is_blocked,
        "reason": payload.reason,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
