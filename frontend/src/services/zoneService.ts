import { api } from "@/lib/api";

export interface Zone {
  id: number;
  name: string;
  type: "DANGER" | "SAFE" | "RESTRICTED";
  coordinates: string;
  cameraId: number;
}

export const zoneService = {
  getZones: async () => {
    const response = await api.get("/zones");
    return response.data.data;
  },

  createZone: async (zoneData: any) => {
    const response = await api.post("/zones", zoneData);
    return response.data.data;
  },

  deleteZone: async (id: number) => {
    const response = await api.delete(`/zones/${id}`);
    return response.data.data;
  },
};
