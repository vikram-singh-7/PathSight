from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

class HealthResponse(BaseModel):
    status: str = Field(..., example="ok")
    version: str = Field(..., example="0.1.0")
    timestamp: datetime
    service: str = Field(..., example="PathSight Assistive Navigation API")

class Coordinates(BaseModel):
    x: float
    y: float

class CampusNode(BaseModel):
    id: str
    name: str
    category: str
    description: str
    coordinates: Coordinates

class CampusEdge(BaseModel):
    id: str
    source: str
    target: str
    distance_meters: float
    path_type: str
    has_tactile_paving: bool
    has_stairs: bool
    stair_count: Optional[int] = 0
    instructions: str
    is_blocked: bool = False
    obstacle_reason: Optional[str] = None

class RouteRequest(BaseModel):
    source: str
    destination: str
    accessible_only: bool = True

class RouteStep(BaseModel):
    step_number: int
    from_node: str
    to_node: str
    from_name: str
    to_name: str
    distance_meters: float
    instructions: str
    path_type: str
    has_stairs: bool
    has_tactile_paving: bool

class RouteResponse(BaseModel):
    success: bool
    source: str
    destination: str
    total_distance_meters: float
    estimated_time_minutes: float
    accessible_only: bool
    path: List[str]
    steps: List[RouteStep]
    warnings: List[str] = []
    message: Optional[str] = None

class ObstacleReport(BaseModel):
    edge_id: str
    is_blocked: bool
    reason: Optional[str] = "Temporary Maintenance / Obstruction"

class DetectionItem(BaseModel):
    label: str
    confidence: float
    box: List[float]  # [ymin, xmin, ymax, xmax] normalized (0 to 1)
    position: str     # 'left', 'center', 'right'
    visual_proximity: str  # 'approaching', 'nearby', 'distant'
    is_obstacle: bool
    advisory_text: str

class DetectionResponse(BaseModel):
    timestamp: datetime
    detections: List[DetectionItem]
    primary_hazard: Optional[str] = None
    speech_summary: str
    processing_ms: float
