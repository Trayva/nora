export const addParamsToUrl = (url, params) => {
    const paramsString = Object.entries(params)
        .filter(([_, value]) => value !== null && value !== undefined)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");
    return `${url}?${paramsString}`;
};