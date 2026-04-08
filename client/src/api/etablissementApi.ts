import apiClient from "./client";

export interface Etablissement {
  id: string;
  code: number;
  nom: string;
  nomAr?: string;
  website?: string;
  gouvernorat?: string;
  type?: string;
  lat?: number;
  lon?: number;
  universiteId: string;
}

export const etablissementApi = {
  getAll: async (): Promise<Etablissement[]> => {
    const response = await apiClient.get("/etablissements");
    return response.data;
  },

  getById: async (id: string): Promise<Etablissement> => {
    const response = await apiClient.get(`/etablissements/${id}`);
    return response.data;
  },

  search: async (params: { q?: string; gouvernorat?: string; universiteId?: string }): Promise<Etablissement[]> => {
    const response = await apiClient.get("/etablissements/search", { params });
    return response.data;
  },
};
