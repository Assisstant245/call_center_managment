import API from "axios";
import { clearSession, getToken } from "./session";

export const API_URL: string =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const axios = API.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

axios.interceptors.request.use((request) => {
  const token = getToken();

  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }

  return request;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Expired / invalid token: drop the session and go to the login page
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("auth/login")
    ) {
      clearSession();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  },
);

export default axios;
