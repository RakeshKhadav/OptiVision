import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: `${API_URL}/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      console.log("Interceptor: Token found?", !!token);
      if (token) {
        // Use set for better compatibility with different Axios versions
        if (config.headers.set) {
          config.headers.set("Authorization", `Bearer ${token}`);
        } else {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
      }
    }
    return config;
  },
  (error) => {
    console.error("Interceptor request error:", error);
    return Promise.reject(error);
  }
);
