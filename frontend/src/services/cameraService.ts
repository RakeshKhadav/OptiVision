import { api } from "@/lib/api";
import { Camera } from "@/types";

export const cameraService = {
  getCameras: async () => {
    const response = await api.get("/cameras");
    return response.data as Camera[];
  },

  getCameraById: async (id: number) => {
    const response = await api.get(`/cameras/${id}`);
    return response.data as Camera;
  },

  updateCamera: async (id: number, data: Partial<Camera>) => {
    const response = await api.patch(`/cameras/${id}`, data);
    return response.data as Camera;
  },
};
