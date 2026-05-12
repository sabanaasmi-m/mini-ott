import { getRequest, postRequest, putRequest, deleteRequest } from "../api/http";

export const getUsers = () => getRequest("users/");
export const createUser = (data) => postRequest("users/", data);
export const updateUser = (id, data) => putRequest(`users/${id}/`, data);
export const deleteUser = (id) => deleteRequest(`users/${id}/`);