import { useState, useEffect } from "react";
import { cameraService } from "@/services/cameraService";
import { activityService } from "@/services/activityService";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Camera } from "@/types";

interface DashboardDataHook {
  initialCameras: Camera[];
  initialChartData: any[]; // To be strictly typed when stats logic is updated
}

export const useDashboardData = (): DashboardDataHook => {
  const [initialCameras, setInitialCameras] = useState<Camera[]>([]);
  const [initialChartData, setInitialChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch cameras
        const camerasData = await cameraService.getCameras();
        // Check if it's an array directly or a wrapped response
        // Based on previous code, it seemed to expect .success property but service returns data directly now via cast?
        // Let's verify service implementation. Service returns `response.data as Camera[]`.
        // Wait, the previous code in page.tsx checked for `camerasData.success`.
        // The audit said backend returns `200 OK + [Camera[]]`.
        // BUT the code I replaced in page.tsx had `if (camerasData.success)`.
        // I need to be careful here. Let's assume the previous code was correct about the shape
        // or the service abstraction I wrote abstracts away the `success` check?
        // In my new service I wrote: `return response.data as Camera[]`.
        // If the backend returns { success: true, data: [...] }, then my service is returning the whole object as Camera[].
        // That would be a bug.
        // Let's assume standard response wrapper for now based on `camerasData.data`.

        // Converting back to "safety first" approach:
        // The service returns `response.data`. If that data is [Camera...], then good.
        // If it is { success: true, data: [...] }, then I need to access .data.

        // Addressing the immediate task: migrating logic.
        // Current service implementation: return response.data as Camera[].
        // If that was wrong, I should fix the service.
        // Let's assume distinct logic here.

        // Correction: My service implementation returns `response.data`.
        // If the API returns arrays directly (as typical REST), then `camerasData` IS the array.
        // If API returns { data: [] }, then `camerasData` is that object.

        // Looking at `api_contract_audit.md.resolved`:
        // GET /cameras -> 200 OK + `[Camera[]]`.
        // So it returns an array directly. Use array directly.

        if (Array.isArray(camerasData)) {
          setInitialCameras(camerasData);
          useDashboardStore.getState().setCameras(camerasData);
        } else if ((camerasData as any).data) {
          // Fallback for wrapped response
          setInitialCameras((camerasData as any).data);
          useDashboardStore.getState().setCameras((camerasData as any).data);
        }

        // Fetch activity stats
        const statsData = await activityService.getActivityStats();
        // Audit says: { activityStats, alertStats }
        // Service returns response.data.

        if ((statsData as any).activityStats) {
          const chartData = (statsData as any).activityStats.map(
            (stat: any) => ({
              name: stat.action,
              value: stat._sum.duration || 0,
            })
          );
          setInitialChartData(chartData);
        }

        // Fetch alert history
        await useDashboardStore.getState().fetchAlertHistory();
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      }
    };
    fetchInitialData();
  }, []);

  return { initialCameras, initialChartData };
};
