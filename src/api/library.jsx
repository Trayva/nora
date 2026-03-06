import api from "./axios";

const addParamsToUrl = (url, params) => {
    const query = Object.entries(params)
        .filter(([_, v]) => v !== null && v !== undefined)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join("&");
    return query ? `${url}?${query}` : url;
};

/**
 * Ingredients
 */
export const getAllIngredients = async (page = 1, limit = 20, search) => {
    const res = await api.get(addParamsToUrl("/library/ingredient", { page, limit, search }));
    console.log(res)
    return res.data;
};

export const getIngredient = async (id) => {
    const res = await api.get(`/library/ingredient/${id}`);
    return res.data;
};

export const createIngredient = async (data) => {
    const res = await api.post("/library/ingredient", data, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
};

/**
 * Ingredient Mapping & Prices
 */
export const getVendorIngredients = async () => {
    const res = await api.get("/library/ingredient/map");
    return res.data;
};

export const mapVendorIngredient = async (data) => {
    const res = await api.post("/library/ingredient/map", data);
    return res.data;
};

export const updateVendorIngredientPrice = async (id, data) => {
    const res = await api.patch(`/library/ingredient/map/${id}`, data);
    return res.data;
};

export const deleteVendorIngredient = async (id) => {
    const res = await api.delete(`/library/ingredient/map/${id}/delete`);
    return res.data;
};

export const getSupplierPrices = async (ingredientId) => {
    const res = await api.get(`/library/ingredient/${ingredientId}/supplier-prices`);
    return res.data;
};

/**
 * Prep Items
 */
export const getVendorPreps = async (vendorId) => {
    const res = await api.get(`/library/recipe/vendor/${vendorId}`);
    return res.data;
};

export const getPrepItem = async (id) => {
    const res = await api.get(`/library/recipe/prep/${id}`);
    return res.data;
};

export const createPrepItem = async (data) => {
    const res = await api.post("/library/recipe/prep", data);
    return res.data;
};

export const deletePrepItem = async (id) => {
    const res = await api.delete(`/library/recipe/prep/${id}`);
    return res.data;
};

/**
 * Recipe Steps
 */
export const addRecipeStep = async (data) => {
    const res = await api.post("/library/recipe/step", data);
    return res.data;
};

export const updateRecipeStep = async (id, data) => {
    const res = await api.patch(`/library/recipe/step/${id}`, data);
    return res.data;
};

export const deleteRecipeStep = async (id) => {
    const res = await api.delete(`/library/recipe/step/${id}`);
    return res.data;
};

/**
 * Calculations & Prices
 */
export const calculatePrepCost = async (id) => {
    const res = await api.get(`/library/calculation/prep/${id}/calc`);
    return res.data;
};

export const calculateMenuCost = async (id) => {
    const res = await api.get(`/library/calculation/menu/${id}/calc`);
    return res.data;
};

export const getMenuPrice = async (id) => {
    const res = await api.get(`/library/price/menu/${id}`);
    return res.data;
};

export const getPrepPrice = async (id) => {
    const res = await api.get(`/library/price/prep/${id}`);
    return res.data;
};
