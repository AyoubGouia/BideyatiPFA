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

/** GET /api/etablissements/:id (includes université) */
export interface EtablissementDetail extends Etablissement {
  universite?: {
    id: string;
    nom: string;
    ville?: string | null;
    region?: string | null;
  };
}

export const etablissementApi = {
  getAll: async (): Promise<Etablissement[]> => {
    const response = await apiClient.get("/etablissements");
    return response.data;
  },

  getById: async (id: string): Promise<EtablissementDetail> => {
    const response = await apiClient.get<EtablissementDetail>(`/etablissements/${id}`);
    return response.data;
  },

  search: async (params: { q?: string; gouvernorat?: string; universiteId?: string }): Promise<Etablissement[]> => {
    const response = await apiClient.get("/etablissements/search", { params });
    return response.data;
  },

  /** Merge results of several search?q calls (dedupe by id, sort by nom). */
  searchByQueriesMerged: async (queries: string[]): Promise<Etablissement[]> => {
    const unique = [...new Set(queries.map(q => q.trim()).filter(Boolean))]
    if (unique.length === 0) return []
    const batches = await Promise.all(
      unique.map(q => etablissementApi.search({ q }))
    )
    const seen = new Set<string>()
    const out: Etablissement[] = []
    for (const rows of batches) {
      for (const e of rows) {
        if (seen.has(e.id)) continue
        seen.add(e.id)
        out.push(e)
      }
    }
    out.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
    return out
  },
};
