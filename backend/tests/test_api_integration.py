import os
import sys
import base64
import io
from PIL import Image

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import (
    read_root,
    health_check,
    get_model_status,
    detect_objects,
    get_campus_nodes,
    get_campus_edges,
    calculate_route,
    update_obstacle,
    FramePayload,
)
from app.models.schemas import RouteRequest, ObstacleReport
from fastapi import HTTPException

def create_sample_base64_image(color=(128, 128, 128)):
    img = Image.new("RGB", (320, 240), color=color)
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG")
    return "data:image/jpeg;base64," + base64.b64encode(buffer.getvalue()).decode("utf-8")

def test_full_api_suite():
    print("\n--- Running FastAPI Direct Integration Suite ---", flush=True)

    # 1. Root & Health Check
    root_data = read_root()
    assert root_data["status"] == "online"
    print("1. Root endpoint: OK", root_data["name"], flush=True)

    health_data = health_check()
    assert health_data.status == "ok"
    print("2. Health endpoint: OK, status=ok", flush=True)

    # 2. Vision Model Status
    model_data = get_model_status()
    assert model_data["is_loaded"] is True
    print(f"3. Model Status: Loaded={model_data['is_loaded']} on device={model_data['device']}", flush=True)

    # 3. Vision Detection with Valid Image
    img_b64 = create_sample_base64_image()
    detect_data = detect_objects(FramePayload(image=img_b64, confidence_threshold=0.35))
    assert detect_data.speech_summary == "Path clear in camera view."
    assert isinstance(detect_data.detections, list)
    print(f"4. Vision Detect (Blank Image): OK, {detect_data.processing_ms}ms, summary='{detect_data.speech_summary}'", flush=True)

    # 4. Vision Detect with Missing Image
    try:
        detect_objects(FramePayload(image=""))
        assert False, "Should have raised HTTPException 400"
    except HTTPException as e:
        assert e.status_code == 400
        print("5. Vision Detect (Empty Image): Correctly rejected with HTTP 400", flush=True)

    # 5. Campus Nodes & Edges
    nodes = get_campus_nodes()
    assert len(nodes) == 9
    print(f"6. Campus Nodes: OK, retrieved {len(nodes)} landmarks", flush=True)

    edges = get_campus_edges()
    assert len(edges) >= 11
    print(f"7. Campus Edges: OK, retrieved {len(edges)} walkways", flush=True)

    # 6. Route Calculation (Valid Route)
    route_data = calculate_route(RouteRequest(source="gate_main", destination="central_library", accessible_only=True))
    assert route_data.success is True
    assert route_data.total_distance_meters == 325.0
    assert len(route_data.steps) == 2
    print(f"8. Route (gate_main -> central_library): OK, distance={route_data.total_distance_meters}m, steps={len(route_data.steps)}", flush=True)

    # 7. Route Calculation (Identical Source and Destination)
    ident_data = calculate_route(RouteRequest(source="gate_main", destination="gate_main", accessible_only=True))
    assert ident_data.success is True
    assert ident_data.total_distance_meters == 0
    print("9. Route (Identical): OK, distance=0m, message:", ident_data.message, flush=True)

    # 8. Route Calculation (Invalid Source/Destination)
    inv_data = calculate_route(RouteRequest(source="invalid_point", destination="central_library", accessible_only=True))
    assert inv_data.success is False
    print("10. Route (Invalid Node): OK, success=False, warnings:", inv_data.warnings, flush=True)

    # 9. Dynamic Obstacle Reporting & Rerouting
    # Block e_gate_admin
    obs_res = update_obstacle(ObstacleReport(edge_id="e_gate_admin", is_blocked=True, reason="Pavement repair"))
    assert obs_res["is_blocked"] is True
    print("11. Obstacle Report: OK, edge 'e_gate_admin' blocked", flush=True)

    # Re-calculate route: should detour via cafeteria -> student_center -> central_library
    detour_data = calculate_route(RouteRequest(source="gate_main", destination="central_library", accessible_only=True))
    assert detour_data.success is True
    assert "cafeteria" in detour_data.path
    print(f"12. Detour Route: OK, bypassed blocked edge, path={detour_data.path}", flush=True)

    # Invalid Edge Obstacle
    try:
        update_obstacle(ObstacleReport(edge_id="non_existent_edge", is_blocked=True))
        assert False, "Should have raised HTTPException 404"
    except HTTPException as e:
        assert e.status_code == 404
        print("13. Obstacle (Non-existent edge): Correctly rejected with HTTP 404", flush=True)

    # Restore e_gate_admin
    update_obstacle(ObstacleReport(edge_id="e_gate_admin", is_blocked=False))
    print("14. Restored e_gate_admin obstacle state to unblocked", flush=True)

    print("\n>>> All 14 FastAPI integration test cases PASSED successfully! <<<\n", flush=True)

if __name__ == "__main__":
    test_full_api_suite()
