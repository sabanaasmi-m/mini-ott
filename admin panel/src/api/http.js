import api from "./axios";

export const getRequest = (url) => api.get(url);

export const postRequest = (url, data, isForm = false) =>
    api.post(url, data, {
        headers: isForm ? { "Content-Type": "multipart/form-data" } : {},
    });

export const putRequest = (url, data, isForm = false) =>
    api.put(url, data, {
        headers: isForm ? { "Content-Type": "multipart/form-data" } : {},
    });

export const deleteRequest = (url) => api.delete(url);
