import api from "./axios";

/**
 * States
 */
export const getStates = async () => {
    const res = await api.get("/config/state");
    return res.data;
};
