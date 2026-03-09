import api from "./axios";

export const searchIngredients = (params) =>
  api.get("/library/ingredient", { params: { returnPrep: true, ...params } });

export const getVendorExtras = (vendorId) =>
  api.get(`/library/recipe/extra/vendor/${vendorId}`);

export const createIngredient = (formData) =>
  api.post("/library/ingredient", formData);

export const getExtra = (id) => api.get(`/library/recipe/extra/${id}`);

export const createExtra = (body) =>
  api.post("/library/recipe/extra", JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });

export const deleteExtra = (id) => api.delete(`/library/recipe/extra/${id}`);

export const addExtraStep = (body) =>
  api.post("/library/recipe/extra/add-step", body);

export const updateExtraStep = (id, body) =>
  api.patch(`/library/recipe/extra/update-step/${id}`, body);

export const deleteExtraStep = (id) =>
  api.delete(`/library/recipe/extra/step/${id}`);

export const calcExtra = (id, stateId) =>
  api.get(`/library/calculation/extra/${id}/calc`, {
    params: { ...(stateId && { stateId }) },
  });

export const calcMenu = (id, stateId) =>
  api.get(`/library/calculation/menu/${id}/calc`, {
    params: { ...(stateId && { stateId }) },
  });

// Machinery
export const searchMachineries = (params) =>
  api.get("/library/machinery", { params });

export const createMachinery = (formData) =>
  api.post("/library/machinery", formData);

export const getMachineriesForConcept = (conceptId) =>
  api.get(`/library/machinery/concept/${conceptId}`);

export const addMachineryToConcept = (conceptId, body) =>
  api.post(`/library/machinery/concept/${conceptId}/add`, body);

export const removeMachineryFromConcept = (conceptId, machineryId) =>
  api.delete(`/library/machinery/concept/${conceptId}/${machineryId}`);
