import { create } from "zustand";

interface Alert {
  id: number;
  type: string;
  severity: "HIGH" | "MEDIUM" | "NORMAL";
  message: string;
  snapshot: string;
  isResolved: boolean;
  cameraId: number;
  createdAt: string;
}

interface Camera {
  id: number;
  name: string;
  status: string;
  calibrationData: any;
}

interface DashboardState {
  // Camera State
  cameras: Camera[];
  activeCameraId: number | null;
  setCameras: (cameras: Camera[]) => void;
  setActiveCamera: (id: number) => void;

  // UI Toggles
  showTrails: boolean;
  isPrivacyMode: boolean;
  toggleTrails: () => void;
  setPrivacyMode: (val: boolean) => void;

  // Incident Timeline Data
  alerts: Alert[];
  addAlert: (alert: Alert) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  cameras: [],
  activeCameraId: null,

  setCameras: (cameras) => set((state) => ({ 
    cameras, 
    activeCameraId: state.activeCameraId || (cameras.length > 0 ? cameras[0].id : null) 
  })),

  setActiveCamera: (id) => set({ activeCameraId: id }),

  showTrails: false,
  isPrivacyMode: false,
  alerts: [],

  toggleTrails: () => set((state) => ({ showTrails: !state.showTrails })),

  setPrivacyMode: (val) => set({ isPrivacyMode: val }),

  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 50), // Keep last 50 for the timeline
    })),
}));
