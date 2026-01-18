import { api } from "@/lib/api";

export const userService = {
  login: async (credentials: any) => {
    const response = await api.post("/users/login", credentials);
    return response.data;
  },

  register: async (userData: any) => {
    const response = await api.post("/users/register", userData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get("/users/me");
    return response.data;
  },
};
