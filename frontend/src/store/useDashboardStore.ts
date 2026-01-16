import { create } from "zustand";
import { Alert, Camera } from "@/types";
import { alertService } from "@/services/alertService";

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
  fetchAlertHistory: () => Promise<void>;
  resolveAlert: (id: number) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  cameras: [],
  activeCameraId: null,

  setCameras: (cameras) =>
    set((state) => ({
      cameras,
      activeCameraId:
        state.activeCameraId || (cameras.length > 0 ? cameras[0].id : null),
    })),

  setActiveCamera: (id) => set({ activeCameraId: id }),

  showTrails: false,
  isPrivacyMode: false,
  alerts: [],

  toggleTrails: () => set((state) => ({ showTrails: !state.showTrails })),

  setPrivacyMode: (val) => set({ isPrivacyMode: val }),

  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 50), // Keep last 50
    })),

  fetchAlertHistory: async () => {
    try {
      const history = await alertService.getAlerts();
      set({ alerts: history });
    } catch (error) {
      console.error("Failed to fetch alert history:", error);
    }
  },

  resolveAlert: async (id: number) => {
    // Optimistic update
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, isResolved: true } : a
      ),
    }));

    try {
      const updatedAlert = await alertService.resolveAlert(id);
      // Re-sync with server response in case there are other changes
      set((state) => ({
        alerts: state.alerts.map((a) => (a.id === id ? updatedAlert : a)),
      }));
    } catch (error) {
      console.error("Failed to resolve alert:", error);
      // Rollback on error could be implemented here, but simplistic for now
    }
  },
}));
