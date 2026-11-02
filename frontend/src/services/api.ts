import { API_BASE_URL } from '../utils/constants';
import type {
  HealthStatus,
  ModelStatus,
  CampusNode,
  CampusEdge,
  RouteResponse,
  DetectionResponse,
} from '../types';

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 5000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms.`);
    }
    throw err;
  }
}

export async function fetchBackendHealth(): Promise<HealthStatus> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/health`, {
    headers: { 'Accept': 'application/json' },
  }, 4000);
  if (!response.ok) {
    throw new Error(`Backend health check failed: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchModelStatus(): Promise<ModelStatus> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/model/status`, {
    headers: { 'Accept': 'application/json' },
  }, 4000);
  if (!response.ok) {
    throw new Error(`Failed to load model status: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchCampusNodes(): Promise<CampusNode[]> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/campus/nodes`, {}, 4000);
  if (!response.ok) {
    throw new Error(`Failed to load campus landmarks: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchCampusEdges(): Promise<CampusEdge[]> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/campus/edges`, {}, 4000);
  if (!response.ok) {
    throw new Error(`Failed to load campus pathways: ${response.statusText}`);
  }
  return response.json();
}

export async function calculateRoute(
  source: string,
  destination: string,
  accessibleOnly: boolean = true
): Promise<RouteResponse> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/campus/route`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      source,
      destination,
      accessible_only: accessibleOnly,
    }),
  }, 5000);
  if (!response.ok) {
    throw new Error(`Route calculation failed: ${response.statusText}`);
  }
  return response.json();
}

export async function updateCampusObstacle(
  edgeId: string,
  isBlocked: boolean,
  reason: string = 'Temporary maintenance'
): Promise<{ success: boolean; edge_id: string; is_blocked: boolean }> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/campus/obstacles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      edge_id: edgeId,
      is_blocked: isBlocked,
      reason,
    }),
  }, 4000);
  if (!response.ok) {
    throw new Error(`Failed to update pathway obstacle: ${response.statusText}`);
  }
  return response.json();
}

export async function detectFrame(
  imageBase64: string,
  confidenceThreshold: number = 0.35
): Promise<DetectionResponse> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/api/detect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      image: imageBase64,
      confidence_threshold: confidenceThreshold,
    }),
  }, 4000);
  if (!response.ok) {
    throw new Error(`Detection request failed: ${response.statusText}`);
  }
  return response.json();
}
