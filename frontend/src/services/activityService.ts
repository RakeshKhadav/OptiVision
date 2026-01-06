import { api } from "@/lib/api";

export interface ActivityStat {
  action: string;
  _sum: {
    duration: number | null;
  };
}

export interface StatsResponse {
  activityStats: ActivityStat[];
  alertStats: any[];
}

export const activityService = {
  getActivityStats: async () => {
    const response = await api.get("/activity/stats");
    return response.data;
  },

  getActivityLogs: async () => {
    const response = await api.get("/activity");
    return response.data;
  },
};
