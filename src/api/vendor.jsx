import api from "./axios";

/**
 * Vendor Profile API
 */
export const getMyVendor = async () => {
    const response = await api.get("/vendor/profile/me");
    return response.data;
};

export const registerBusiness = async (data) => {
    // Use FormData if files are present
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            formData.append(key, value);
        }
    });
    const response = await api.post("/vendor/profile/register-business", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

export const updateBusiness = async (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            formData.append(key, value);
        }
    });
    const response = await api.put("/vendor/profile/update-business", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

/**
 * Concept API
 */
export const getVendorConcepts = async () => {
    const response = await api.get("/vendor/concept");
    return response.data;
};

export const createConcept = async (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            formData.append(key, value);
        }
    });
    const response = await api.post("/vendor/concept", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

export const updateConceptStatus = async (id, status) => {
    const response = await api.patch(`/vendor/concept/${id}/status`, { status });
    return response.data;
};

export const getConceptById = async (id) => {
    const response = await api.get(`/vendor/concept/${id}`);
    return response.data;
};

/**
 * Menu API
 */
export const createMenuItem = async (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            formData.append(key, value);
        }
    });
    const response = await api.post("/vendor/menu", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

export const updateMenuItem = async (id, data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            formData.append(key, value);
        }
    });
    const response = await api.patch(`/vendor/menu/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

export const getMenuItemsByConcept = async (conceptId) => {
    const response = await api.get(`/vendor/menu/concept/${conceptId}`);
    return response.data;
};

export const getMenuItemById = async (id) => {
    const response = await api.get(`/vendor/menu/${id}`);
    return response.data;
};

export const deleteMenuItem = async (id) => {
    const response = await api.delete(`/vendor/menu/${id}`);
    return response.data;
};

/**
 * Menu Recipe (Steps) API
 */
export const addMenuRecipe = async (menuItemId, data) => {
    const response = await api.post(`/vendor/menu/step/${menuItemId}`, data);
    return response.data;
};

export const updateMenuRecipe = async (id, data) => {
    const response = await api.patch(`/vendor/menu/step/${id}`, data);
    return response.data;
};

export const deleteMenuRecipe = async (id) => {
    const response = await api.delete(`/vendor/menu/step/${id}`);
    return response.data;
};
