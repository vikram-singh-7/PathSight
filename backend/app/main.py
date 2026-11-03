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
    allow_origins=["*"] if "*" in settings.CORS_ORIGINS else settings.CORS_ORIGINS,
    allow_credentials=False if "*" in settings.CORS_ORIGINS else True,
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

# --- Mobile & Wireless Camera Endpoints ---

class MobileStreamPayload(BaseModel):
    image: str
    confidence_threshold: Optional[float] = Field(0.35, ge=0.1, le=0.9)
    device_name: Optional[str] = "Mobile Phone Camera"

latest_mobile_feed = {
    "image": None,
    "timestamp": None,
    "detections": [],
    "summary": "Waiting for mobile camera stream...",
    "processing_ms": 0,
    "device_name": "Mobile Phone Camera",
    "primary_hazard": None,
}

@app.post("/api/camera/stream_frame", tags=["Camera"])
def post_mobile_stream_frame(payload: MobileStreamPayload):
    """Receive live video frame from a smartphone camera and run YOLOv8 object detection."""
    global latest_mobile_feed
    if not payload.image:
        raise HTTPException(status_code=400, detail="Image base64 data is required.")

    result = vision_service.detect(
        base64_image=payload.image,
        confidence_threshold=payload.confidence_threshold or 0.35,
    )

    primary_hazard = None
    for item in result.detections:
        if item.is_obstacle and item.visual_proximity != "distant":
            primary_hazard = item.label
            break

    latest_mobile_feed = {
        "image": payload.image,
        "timestamp": datetime.utcnow().isoformat(),
        "detections": [d.dict() for d in result.detections],
        "summary": result.summary,
        "processing_ms": result.processing_time_ms,
        "device_name": payload.device_name or "Mobile Phone Camera",
        "primary_hazard": primary_hazard,
    }

    return {
        "status": "ok",
        "detections": latest_mobile_feed["detections"],
        "summary": result.summary,
        "processing_ms": result.processing_time_ms,
        "primary_hazard": primary_hazard,
    }

@app.get("/api/camera/latest_frame", tags=["Camera"])
def get_latest_mobile_stream_frame():
    """Retrieve the latest frame transmitted by the connected mobile phone."""
    if not latest_mobile_feed["image"]:
        return {
            "has_stream": False,
            "message": "No mobile camera stream active. Open the app on your phone and tap 'Use Phone as Camera'.",
        }
    return {
        "has_stream": True,
        **latest_mobile_feed,
    }

class IPCamFetchPayload(BaseModel):
    stream_url: str
    confidence_threshold: Optional[float] = Field(0.35, ge=0.1, le=0.9)

@app.post("/api/camera/detect_ipcam", tags=["Camera"])
def detect_from_ip_camera(payload: IPCamFetchPayload):
    """Fetch a single JPEG frame from an IP camera / DroidCam Wi-Fi URL and run YOLO detection."""
    import urllib.request
    import base64
    try:
        req = urllib.request.Request(
            payload.stream_url,
            headers={"User-Agent": "PathSight-Assistive/1.0"}
        )
        with urllib.request.urlopen(req, timeout=3.5) as response:
            image_bytes = response.read()
            b64_encoded = f"data:image/jpeg;base64,{base64.b64encode(image_bytes).decode('utf-8')}"

        result = vision_service.detect(
            base64_image=b64_encoded,
            confidence_threshold=payload.confidence_threshold or 0.35,
        )
        return {
            "success": True,
            "image": b64_encoded,
            "detections": result.detections,
            "summary": result.summary,
            "processing_time_ms": result.processing_time_ms,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch frame from camera URL: {str(e)}")

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
