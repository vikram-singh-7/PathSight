import json
import heapq
import os
from typing import Dict, List, Optional, Tuple
from app.models.schemas import CampusNode, CampusEdge, RouteStep, RouteResponse

class CampusGraphService:
    def __init__(self, data_path: Optional[str] = None):
        if data_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            data_path = os.path.join(base_dir, "data", "campus_map.json")
        self.data_path = data_path
        self.nodes: Dict[str, CampusNode] = {}
        self.edges: Dict[str, CampusEdge] = {}
        self.adjacency: Dict[str, List[str]] = {}
        self.load_graph()

    def load_graph(self):
        with open(self.data_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.nodes = {n["id"]: CampusNode(**n) for n in data["nodes"]}
        self.edges = {e["id"]: CampusEdge(**e) for e in data["edges"]}
        self.build_adjacency()

    def build_adjacency(self):
        self.adjacency = {node_id: [] for node_id in self.nodes}
        for edge_id, edge in self.edges.items():
            if edge.source in self.adjacency:
                self.adjacency[edge.source].append(edge_id)
            # Bidirectional campus pathways
            if edge.target in self.adjacency:
                self.adjacency[edge.target].append(edge_id)

    def get_nodes(self) -> List[CampusNode]:
        return list(self.nodes.values())

    def get_edges(self) -> List[CampusEdge]:
        return list(self.edges.values())

    def set_obstacle(self, edge_id: str, is_blocked: bool, reason: str = "Maintenance"):
        if edge_id in self.edges:
            self.edges[edge_id].is_blocked = is_blocked
            self.edges[edge_id].obstacle_reason = reason if is_blocked else None
            return True
        return False

    def find_route(self, source: str, destination: str, accessible_only: bool = True) -> RouteResponse:
        if source not in self.nodes or destination not in self.nodes:
            return RouteResponse(
                success=False,
                source=source,
                destination=destination,
                total_distance_meters=0,
                estimated_time_minutes=0,
                accessible_only=accessible_only,
                path=[],
                steps=[],
                warnings=["Invalid source or destination node specified."],
                message="Source or destination was not found on the campus map."
            )

        if source == destination:
            return RouteResponse(
                success=True,
                source=source,
                destination=destination,
                total_distance_meters=0,
                estimated_time_minutes=0,
                accessible_only=accessible_only,
                path=[source],
                steps=[],
                message="You are already at the selected destination."
            )

        # Priority queue for Dijkstra: (distance, current_node_id, path_nodes, path_edges)
        pq: List[Tuple[float, str, List[str], List[CampusEdge]]] = [(0.0, source, [source], [])]
        visited: Dict[str, float] = {}
        warnings: List[str] = []

        while pq:
            cost, u, path_nodes, path_edges = heapq.heappop(pq)

            if u in visited and visited[u] <= cost:
                continue
            visited[u] = cost

            if u == destination:
                # Build steps
                steps: List[RouteStep] = []
                for idx, edge in enumerate(path_edges):
                    from_id = path_nodes[idx]
                    to_id = path_nodes[idx + 1]
                    from_name_clean = self.nodes[from_id].name.replace(" (Sample)", "")
                    to_name_clean = self.nodes[to_id].name.replace(" (Sample)", "")

                    if from_id == edge.source:
                        step_instruction = edge.instructions
                    else:
                        stair_warn = " Route includes stairs." if edge.has_stairs else " Step-free pathway."
                        tactile_info = " Follow tactile paving" if edge.has_tactile_paving else " Follow walkway"
                        step_instruction = f"Proceed from {from_name_clean} towards {to_name_clean} for {int(edge.distance_meters)} meters.{tactile_info}.{stair_warn}"

                    steps.append(
                        RouteStep(
                            step_number=idx + 1,
                            from_node=from_id,
                            to_node=to_id,
                            from_name=self.nodes[from_id].name,
                            to_name=self.nodes[to_id].name,
                            distance_meters=edge.distance_meters,
                            instructions=step_instruction,
                            path_type=edge.path_type,
                            has_stairs=edge.has_stairs,
                            has_tactile_paving=edge.has_tactile_paving
                        )
                    )

                # Physical distance sum in meters (unweighted by preference penalties)
                actual_distance = sum(edge.distance_meters for edge in path_edges)
                # Estimated walking time assuming ~1.1 meters/second (~66m/min) for cautious navigation
                time_mins = round(actual_distance / 66.0, 1)

                return RouteResponse(
                    success=True,
                    source=source,
                    destination=destination,
                    total_distance_meters=round(actual_distance, 1),
                    estimated_time_minutes=time_mins,
                    accessible_only=accessible_only,
                    path=path_nodes,
                    steps=steps,
                    warnings=warnings,
                    message=f"Optimal {'accessible ' if accessible_only else ''}route calculated."
                )

            for edge_id in self.adjacency.get(u, []):
                edge = self.edges[edge_id]
                
                # Check dynamic obstacle blocking
                if edge.is_blocked:
                    continue

                # Check accessibility constraint
                if accessible_only and edge.has_stairs:
                    continue

                v = edge.target if edge.source == u else edge.source
                edge_cost = edge.distance_meters

                # Add slight preference for tactile paving
                if not edge.has_tactile_paving:
                    edge_cost *= 1.15

                new_cost = cost + edge_cost

                if v not in visited or new_cost < visited.get(v, float('inf')):
                    heapq.heappush(
                        pq,
                        (new_cost, v, path_nodes + [v], path_edges + [edge])
                    )

        # Fallback if accessible route wasn't found but standard route exists
        if accessible_only:
            standard_route = self.find_route(source, destination, accessible_only=False)
            if standard_route.success:
                standard_route.warnings.append(
                    "Note: Step-free accessible path is currently unavailable. This route contains stairs or uneven paving."
                )
                return standard_route

        return RouteResponse(
            success=False,
            source=source,
            destination=destination,
            total_distance_meters=0,
            estimated_time_minutes=0,
            accessible_only=accessible_only,
            path=[],
            steps=[],
            warnings=["No navigable path found between the selected locations due to pathway blockages."],
            message="No pathway is currently accessible between these points."
        )

# Global singleton
graph_service = CampusGraphService()

