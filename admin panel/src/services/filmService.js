import { getRequest, postRequest, deleteRequest, putRequest } from "../api/http";

export const getAllFilms = () => getRequest("shortfilms/");
export const createFilm = (data) => postRequest("shortfilms/", data);
export const updateFilm = (id, data) =>
  putRequest(`shortfilms/${id}/`, data);
export const deleteFilm = (id) =>
  deleteRequest(`shortfilms/${id}/`);