import { api } from "@/lib/api";
import { Alert } from "@/types";

export const alertService = {
  getAlerts: async (params?: { start?: string; end?: string }) => {
    const response = await api.get("/alerts", { params });
    return response.data.data as Alert[];
  },

  resolveAlert: async (id: number) => {
    const response = await api.patch(`/alerts/${id}/resolve`);
    return response.data.data as Alert;
  },
};
