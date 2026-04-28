import apiClient from "./client";

export interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalAdmins: number;
  totalVisitors: number;
  totalUniversities: number;
  totalEstablishments: number;
  totalSpecialties: number;
}

export interface AdminUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: "STUDENT" | "ADMIN" | "VISITOR";
  actif: boolean;
  dateCreation: string;
  telephone: string | null;
}

export interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminUniversity {
  id: string;
  nom: string;
  ville: string;
  region: string;
  description?: string | null;
  siteweb?: string | null;
  adresse?: string | null;
  nomAr?: string | null;
}

export interface CreateUniversityData {
  nom: string;
  ville: string;
  region: string;
  description?: string;
  siteweb?: string;
}

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const res = await apiClient.get("/admin/stats");
    return res.data;
  },

  getUsers: async (page = 1, limit = 20, search?: string): Promise<UsersResponse> => {
    const params: Record<string, any> = { page, limit };
    if (search) params.search = search;
    const res = await apiClient.get("/admin/users", { params });
    return res.data;
  },

  toggleUserActive: async (userId: string): Promise<{ id: string; actif: boolean }> => {
    const res = await apiClient.put(`/admin/users/${userId}/toggle`);
    return res.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/admin/users/${userId}`);
  },

  exportBackup: async (): Promise<Blob> => {
    const res = await apiClient.get("/admin/export", { responseType: "blob" });
    return res.data;
  },

  createUniversity: async (data: CreateUniversityData): Promise<AdminUniversity> => {
    const res = await apiClient.post("/admin/universities", data);
    return res.data;
  },

  deleteUniversity: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/universities/${id}`);
  },
};
