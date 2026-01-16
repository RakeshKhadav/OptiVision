export interface Alert {
  id: number;
  type: string;
  severity: "HIGH" | "MEDIUM" | "NORMAL";
  message: string;
  snapshot: string;
  isResolved: boolean;
  cameraId: number;
  createdAt: string;
}

export interface CalibrationData {
  pitch?: number;
  yaw?: number;
  roll?: number;
  height?: number;
  fov?: number;
  // Homography points
  video?: number[][];
  map?: number[][];
}

export interface Camera {
  id: number;
  name: string;
  status: string;
  calibrationData: CalibrationData;
}

export interface Zone {
  id: number;
  name: string;
  type: "DANGER" | "SAFE" | "RESTRICTED";
  coordinates: string; // JSON string of {x, y}[]
  cameraId: number;
}

export interface ActivityStat {
  action: string;
  _sum: {
    duration: number | null;
  };
}

export interface Detection {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
  track_id: number;
  workerId?: string; // Optional identifier if matched
}

export interface ActivityLog {
  id: number;
  workerId: string;
  action: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  cameraId: number;
}
