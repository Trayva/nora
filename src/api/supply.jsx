import { addParamsToUrl } from "../utils";
import api from "./axios";

/**
 * Supplier Profile API
 */
export const getSupplier = async () => {
    const response = await api.get("/supplier/me");
    return response.data;
};

export const registerSupplier = async (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            formData.append(key, value);
        }
    });
    const response = await api.post("/supplier/register-business", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

export const updateSupplier = async (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            formData.append(key, value);
        }
    });
    const response = await api.put("/supplier/update-business", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};

export const addSupplierPrice = async (data) => {
    const response = await api.post("/library/ingredient/supplier-price", data);
    return response.data;
};

export const getMyPrices = async (page = 1, limit = 25, search, stateId) => {
    const response = await api.get(addParamsToUrl("/library/ingredient/supplier/my-prices", { page, limit, search, stateId }));
    return response.data.data;
};

/**
 * Supply Requests API
 */
export const getSupplyRequests = async () => {
    const response = await api.get("/supply");
    return response.data.data;
};

export const getSupplyRequestById = async (id) => {
    const response = await api.get(`/supply/${id}`);
    return response.data;
};

export const reviewSupplyRequest = async (id, data) => {
    const response = await api.patch(`/supply/${id}/review`, data);
    return response.data;
};

export const shipSupplyRequest = async (id) => {
    const response = await api.post(`/supply/${id}/ship`);
    return response.data;
};
