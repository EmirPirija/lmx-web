"use client";

import Api from "@/api/AxiosInterceptors";

const BASE = "saved-searches";

export const savedSearchesApi = {
  list: ({ context = "ads" } = {}) => {
    return Api.get(BASE, { params: { context } });
  },

  create: ({ name, query_string, context = "ads" } = {}) => {
    return Api.post(BASE, { name, query_string, context });
  },

  update: ({ id, name } = {}) => {
    return Api.put(`${BASE}/${id}`, { name });
  },

  remove: ({ id } = {}) => {
    return Api.delete(`${BASE}/${id}`);
  },
};
