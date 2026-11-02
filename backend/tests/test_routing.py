import os
import sys

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.services.graph_service import graph_service

def test_routes():
    print("=== Testing Campus Routing Engine ===")
    
    # Test 1: Valid route gate_main -> central_library (accessible)
    r1 = graph_service.find_route("gate_main", "central_library", accessible_only=True)
    print("Test 1 (Valid Accessible Route):")
    print("  Success:", r1.success)
    print("  Distance:", r1.total_distance_meters, "meters")
    print("  Time:", r1.estimated_time_minutes, "minutes")
    print("  Steps count:", len(r1.steps))
    assert r1.success, "Test 1 failed: route should succeed"
    assert len(r1.steps) > 0, "Test 1 failed: steps should be > 0"
    for s in r1.steps:
        print(f"    Step {s.step_number}: {s.from_name} -> {s.to_name} ({s.distance_meters}m) | {s.instructions}")

    # Test 2: Accessible route avoids stairs
    # e_admin_library_stairs has stairs (160m), e_admin_library_ramp is step-free (195m)
    r_stairs = graph_service.find_route("admin_block", "central_library", accessible_only=False)
    r_ramp = graph_service.find_route("admin_block", "central_library", accessible_only=True)
    print("\nTest 2 (Stairs vs Accessible Ramp):")
    print("  Standard path:", r_stairs.path, "dist:", r_stairs.total_distance_meters)
    print("  Accessible path:", r_ramp.path, "dist:", r_ramp.total_distance_meters)
    assert not any(s.has_stairs for s in r_ramp.steps), "Accessible path must not include stairs"

    # Test 3: Identical source and destination
    r3 = graph_service.find_route("gate_main", "gate_main")
    print("\nTest 3 (Identical Origin/Destination):")
    print("  Success:", r3.success, "| Distance:", r3.total_distance_meters, "| Message:", r3.message)
    assert r3.success and r3.total_distance_meters == 0, "Identical route should have 0 distance"

    # Test 4: Invalid node
    r4 = graph_service.find_route("non_existent_node", "central_library")
    print("\nTest 4 (Invalid Node):")
    print("  Success:", r4.success, "| Warnings:", r4.warnings)
    assert not r4.success, "Invalid node should fail"

    # Test 5: Dynamic Obstacle and Detour
    # Block e_gate_admin and e_gate_cafe, which disconnects gate_main completely
    print("\nTest 5 (Dynamic Obstacle Reroute & Disconnection):")
    graph_service.set_obstacle("e_gate_admin", True, "Construction work")
    # Route from gate_main to central_library should now go via cafeteria -> student_center -> central_library
    r5 = graph_service.find_route("gate_main", "central_library")
    print("  Rerouted path via cafeteria:", r5.path)
    assert "cafeteria" in r5.path, "Reroute should bypass e_gate_admin via cafeteria"

    # Block e_gate_cafe too -> gate_main is now completely isolated
    graph_service.set_obstacle("e_gate_cafe", True, "Tree maintenance")
    r5_blocked = graph_service.find_route("gate_main", "central_library")
    print("  Completely blocked success:", r5_blocked.success, "| Warnings:", r5_blocked.warnings)
    assert not r5_blocked.success, "Isolated node must return success=False"

    # Clear obstacles
    graph_service.set_obstacle("e_gate_admin", False)
    graph_service.set_obstacle("e_gate_cafe", False)
    r5_cleared = graph_service.find_route("gate_main", "central_library")
    assert r5_cleared.success, "Route should succeed after clearing obstacles"
    print("  Cleared obstacles successfully, route restored.")

    # Test 6: Reverse path instruction coherence
    r6 = graph_service.find_route("central_library", "gate_main", accessible_only=True)
    print("\nTest 6 (Reverse Path Guidance):")
    for s in r6.steps:
        print(f"    Step {s.step_number}: {s.from_name} -> {s.to_name} ({s.distance_meters}m) | {s.instructions}")

    print("\n>>> All backend routing unit tests passed successfully! <<<")

if __name__ == "__main__":
    test_routes()

