import api from "./axios";

export const getProfile = async () => {
  const response = await api.get("/account/profile");
  console.log(response);
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put("/account/profile", data, {
    headers: { 
      "Content-Type": "multipart/form-data",
    },
    // Force HTTP/1.1 behavior by disabling keep-alive on large payloads
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });
  return response.data;
};

export const updateUserRoles = async (userId, roles) => {
  const response = await api.put(`/account/${userId}/roles`, { roles });
  return response.data;
};

export const adminUpdateUser = async (userId, data) => {
  const response = await api.put(`/account/${userId}`, data);
  return response.data;
};

export const unlockAccount = async (userId) => {
  const response = await api.put(`/account/${userId}/unlock`);
  return response.data;
};
