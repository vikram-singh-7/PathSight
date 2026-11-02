export interface HealthStatus {
  status: string;
  version: string;
  timestamp: string;
  service: string;
}

export interface ModelStatus {
  model_name: string;
  is_loaded: boolean;
  device: string;
  load_error?: string | null;
  classes_tracked: number;
}

export interface Coordinates {
  x: number;
  y: number;
}

export interface CampusNode {
  id: string;
  name: string;
  category: string;
  description: string;
  coordinates: Coordinates;
}

export interface CampusEdge {
  id: string;
  source: string;
  target: string;
  distance_meters: number;
  path_type: string;
  has_tactile_paving: boolean;
  has_stairs: boolean;
  stair_count?: number;
  instructions: string;
  is_blocked: boolean;
  obstacle_reason?: string | null;
}

export interface RouteStep {
  step_number: number;
  from_node: string;
  to_node: string;
  from_name: string;
  to_name: string;
  distance_meters: number;
  instructions: string;
  path_type: string;
  has_stairs: boolean;
  has_tactile_paving: boolean;
}

export interface RouteResponse {
  success: boolean;
  source: string;
  destination: string;
  total_distance_meters: number;
  estimated_time_minutes: number;
  accessible_only: boolean;
  path: string[];
  steps: RouteStep[];
  warnings: string[];
  message?: string | null;
}

export interface DetectionItem {
  label: string;
  confidence: number;
  box: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0 to 1
  position: 'left' | 'center' | 'right';
  visual_proximity: 'approaching' | 'nearby' | 'distant';
  is_obstacle: boolean;
  advisory_text: string;
}

export interface DetectionResponse {
  timestamp: string;
  detections: DetectionItem[];
  primary_hazard?: string | null;
  speech_summary: string;
  processing_ms: number;
}

export interface Observation {
  id: string;
  timestamp: Date;
  text: string;
  type: 'obstacle' | 'route' | 'info' | 'system';
  isHazard: boolean;
}

export type ActiveTab = 'assist' | 'navigate' | 'settings';

export type TextSize = 'standard' | 'large' | 'xlarge';

export type ContrastMode = 'dark-navy' | 'high-contrast-yellow';

export interface UserSettings {
  textSize: TextSize;
  speechRate: number;
  speechVolume: number;
  contrastMode: ContrastMode;
  soundEarcons: boolean;
  autoSpeakObservations: boolean;
  detectionThrottleFps: number;
  confidenceThreshold: number;
}
