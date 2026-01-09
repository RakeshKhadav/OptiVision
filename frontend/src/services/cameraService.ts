import { api } from "@/lib/api";

export interface Camera {
  id: number;
  name: string;
  status: string;
  calibrationData: any;
}

export const cameraService = {
  getCameras: async () => {
    const response = await api.get("/cameras");
    return response.data;
  },

  getCameraById: async (id: number) => {
    const response = await api.get(`/cameras/${id}`);
    return response.data;
  },

  updateCamera: async (id: number, data: any) => {
    const response = await api.patch(`/cameras/${id}`, data);
    return response.data;
  },
};
