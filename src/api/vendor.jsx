import api from "./axios";

export const getVendorProfile = () => api.get("/vendor/profile/me");
export const registerBusiness = (fd) =>
  api.post("/vendor/profile/register-business", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const updateBusiness = (fd) =>
  api.put("/vendor/profile/update-business", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getVendorConcepts = () => api.get("/vendor/concept");
export const getConcept = (id) => api.get(`/vendor/concept/${id}`);
export const createConcept = (fd) =>
  api.post("/vendor/concept", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const updateConceptStatus = (id, status) =>
  api.patch(`/vendor/concept/${id}/status`, { status });

export const getMenuByConcept = (conceptId) =>
  api.get(`/vendor/menu/concept/${conceptId}`);
export const getMenuItem = (id) => api.get(`/vendor/menu/${id}`);
export const createMenuItem = (fd) =>
  api.post("/vendor/menu", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const updateMenuItem = (id, fd) =>
  api.patch(`/vendor/menu/${id}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const deleteMenuItem = (id) => api.delete(`/vendor/menu/${id}`);
export const addMenuRecipe = (menuItemId, body) =>
  api.post(`/vendor/menu/step/${menuItemId}`, body);
export const updateMenuRecipe = (id, body) =>
  api.patch(`/vendor/menu/step/${id}`, body);
export const deleteMenuRecipe = (id) => api.delete(`/vendor/menu/step/${id}`);

export const addMenuVariant = (menuItemId, body) =>
  api.post(`/vendor/menu/${menuItemId}/variants/add`, body);

export const removeMenuVariant = (variantId) =>
  api.delete(`/vendor/menu/variants/${variantId}`);

export const addMenuExtra = (menuItemId, body) =>
  api.post(`/vendor/menu/${menuItemId}/extras/add`, body);

export const removeMenuExtra = (extraId) =>
  api.delete(`/vendor/menu/extras/${extraId}`);

export const uploadMenuTutorial = (menuItemId, file) => {
  const fd = new FormData();
  fd.append("video", file);
  return api.post(`/vendor/menu/${menuItemId}/tutorial`, fd);
};

export const getConceptSummary = (conceptId, params) =>
  api.get(`/vendor/menu/concept/${conceptId}/summary`, { params });

export const updateConceptPackaging = (id, fd) =>
  api.patch(`/vendor/concept/${id}/packaging`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
