import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({ baseURL: BASE_URL });

// Endpoints that should never trigger refresh or auto-logout
const AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh-token",
  "/auth/logout",
  "/auth/logout-all",
  "/auth/request-verification",
  "/auth/verify-otp",
  "/auth/forgot-password",
];

const isAuthEndpoint = (url = "") =>
  AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));

//Helpers

const getAuth = () => JSON.parse(localStorage.getItem("trayva-auth") || "{}");

const setAuth = (token, refreshToken) => {
  const current = getAuth();
  localStorage.setItem(
    "trayva-auth",
    JSON.stringify({ ...current, token, refreshToken }),
  );
};

const clearAuth = () => {
  localStorage.clear();
  window.location.href = "/auth/login";
};

//Request Interceptor
// Attach access token to every request automatically

api.interceptors.request.use(
  (config) => {
    const { token } = getAuth();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor
// On 401: try refreshing the access token once, then retry the original request.
// If refresh also fails → logout.

let isRefreshing = false;
// Queue of failed requests waiting for the new token
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't attempt refresh for auth endpoints or non-401 errors
    if (
      isAuthEndpoint(originalRequest?.url) ||
      error.response?.status !== 401
    ) {
      return Promise.reject(error);
    }

    // Prevent infinite retry loop
    if (originalRequest._retry) {
      clearAuth();
      return Promise.reject(error);
    }

    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    // Start refresh
    originalRequest._retry = true;
    isRefreshing = true;

    const { refreshToken } = getAuth();

    if (!refreshToken) {
      clearAuth();
      return Promise.reject(error);
    }

    try {
      const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data.data;

      // Save the new tokens
      setAuth(accessToken, newRefreshToken || refreshToken);

      // Update the header for the original request and retry it
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      processQueue(null, accessToken);

      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed → log user out
      processQueue(refreshError, null);
      clearAuth();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
