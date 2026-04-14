import api from "./axios";

export const getNotifications = async (page = 1, limit = 20) => {
  const response = await api.get(`/notification?page=${page}&limit=${limit}`);
  return response.data; // { success, data, message }
};

export const markAsRead = async (id) => {
  const response = await api.patch(`/notification/${id}/read`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await api.patch("/notification/read-all");
  return response.data;
};

export const getNotificationSettings = async () => {
  const response = await api.get("/notification/settings");
  return response.data;
};

export const updateNotificationSettings = async (data) => {
  const response = await api.patch("/notification/settings", data);
  return response.data;
};
