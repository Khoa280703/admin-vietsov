import axios, { type AxiosInstance, type AxiosError } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor: Add JWT token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor: Handle token refresh and errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            try {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                refreshToken,
              });
              const { accessToken } = response.data;
              localStorage.setItem("accessToken", accessToken);
              // Retry original request
              if (error.config) {
                error.config.headers.Authorization = `Bearer ${accessToken}`;
                return this.client.request(error.config);
              }
            } catch (refreshError) {
              // Refresh failed, clear tokens and redirect to login
              localStorage.removeItem("accessToken");
              localStorage.removeItem("refreshToken");
              window.location.href = "/login";
            }
          } else {
            localStorage.removeItem("accessToken");
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  auth = {
    login: async (username: string, password: string) => {
      const response = await this.client.post("/auth/login", { username, password });
      if (response.data.accessToken && response.data.refreshToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
        localStorage.setItem("refreshToken", response.data.refreshToken);
      }
      return response.data;
    },
    logout: () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    },
    me: async () => {
      const response = await this.client.get("/auth/me");
      return response.data;
    },
    refresh: async (refreshToken: string) => {
      const response = await this.client.post("/auth/refresh", { refreshToken });
      if (response.data.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
      }
      return response.data;
    },
  };

  // Articles endpoints
  articles = {
    list: async (params?: {
      page?: number;
      limit?: number;
      status?: string;
      authorId?: number;
      categoryId?: number;
      tagId?: number;
    }) => {
      const response = await this.client.get("/articles", { params });
      return response.data;
    },
    getById: async (id: number) => {
      const response = await this.client.get(`/articles/${id}`);
      return response.data;
    },
    create: async (data: any) => {
      const response = await this.client.post("/articles", data);
      return response.data;
    },
    update: async (id: number, data: any) => {
      const response = await this.client.put(`/articles/${id}`, data);
      return response.data;
    },
    delete: async (id: number) => {
      const response = await this.client.delete(`/articles/${id}`);
      return response.data;
    },
    submit: async (id: number) => {
      const response = await this.client.post(`/articles/${id}/submit`);
      return response.data;
    },
    approve: async (id: number, notes?: string) => {
      const response = await this.client.post(`/articles/${id}/approve`, { notes });
      return response.data;
    },
    reject: async (id: number, notes?: string) => {
      const response = await this.client.post(`/articles/${id}/reject`, { notes });
      return response.data;
    },
    publish: async (id: number) => {
      const response = await this.client.post(`/articles/${id}/publish`);
      return response.data;
    },
    myArticles: async (params?: { page?: number; limit?: number; status?: string }) => {
      const response = await this.client.get("/articles/my-articles", { params });
      return response.data;
    },
  };

  ai = {
    generateContent: async (data: {
      prompt: string;
      contentJson: string;
      history?: Array<{ role: string; content: string }>;
    }) => {
      const response = await this.client.post("/ai/content", data);
      return response.data;
    },
  };

  // Categories endpoints
  categories = {
    list: async (type?: string) => {
      const response = await this.client.get("/categories", { params: { type } });
      return response.data;
    },
    getById: async (id: number) => {
      const response = await this.client.get(`/categories/${id}`);
      return response.data;
    },
    create: async (data: any) => {
      const response = await this.client.post("/categories", data);
      return response.data;
    },
    update: async (id: number, data: any) => {
      const response = await this.client.put(`/categories/${id}`, data);
      return response.data;
    },
    delete: async (id: number) => {
      const response = await this.client.delete(`/categories/${id}`);
      return response.data;
    },
    getTypes: async () => {
      const response = await this.client.get("/categories/types");
      return response.data;
    },
  };

  // Tags endpoints
  tags = {
    list: async (params?: { page?: number; limit?: number; search?: string }) => {
      const response = await this.client.get("/tags", { params });
      return response.data;
    },
    getById: async (id: number) => {
      const response = await this.client.get(`/tags/${id}`);
      return response.data;
    },
    create: async (data: any) => {
      const response = await this.client.post("/tags", data);
      return response.data;
    },
    update: async (id: number, data: any) => {
      const response = await this.client.put(`/tags/${id}`, data);
      return response.data;
    },
    delete: async (id: number) => {
      const response = await this.client.delete(`/tags/${id}`);
      return response.data;
    },
  };

  // Users endpoints
  users = {
    list: async (params?: { page?: number; limit?: number; roleId?: number; isActive?: boolean }) => {
      const response = await this.client.get("/users", { params });
      return response.data;
    },
    getById: async (id: number) => {
      const response = await this.client.get(`/users/${id}`);
      return response.data;
    },
    create: async (data: { username: string; email: string; password: string; fullName: string; roleId: number }) => {
      const response = await this.client.post("/users", data);
      return response.data;
    },
    update: async (id: number, data: Partial<{ username: string; email: string; fullName: string; roleId: number; isActive: boolean }>) => {
      const response = await this.client.put(`/users/${id}`, data);
      return response.data;
    },
    delete: async (id: number) => {
      const response = await this.client.delete(`/users/${id}`);
      return response.data;
    },
    assignRole: async (id: number, data: { roleId: number }) => {
      const response = await this.client.put(`/users/${id}/role`, data);
      return response.data;
    },
  };

  // Roles endpoints
  roles = {
    list: async () => {
      const response = await this.client.get("/roles");
      return response.data;
    },
    getById: async (id: number) => {
      const response = await this.client.get(`/roles/${id}`);
      return response.data;
    },
    create: async (data: { name: string; description?: string; permissions: string }) => {
      const response = await this.client.post("/roles", data);
      return response.data;
    },
    update: async (id: number, data: { name?: string; description?: string; permissions?: string }) => {
      const response = await this.client.put(`/roles/${id}`, data);
      return response.data;
    },
    delete: async (id: number) => {
      const response = await this.client.delete(`/roles/${id}`);
      return response.data;
    },
  };

  // Upload endpoints
  upload = {
    image: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const response = await this.client.post("/upload/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
  };

  // Dashboard endpoints
  dashboard = {
    getStatistics: async () => {
      const response = await this.client.get("/dashboard/statistics");
      return response.data;
    },
  };

  // Logs endpoints
  logs = {
    list: async (params?: {
      page?: number;
      limit?: number;
      userId?: number;
      action?: string;
      level?: string;
      module?: string;
      endpoint?: string;
      statusCode?: number;
      ipAddress?: string;
      searchText?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const response = await this.client.get("/logs", { params });
      return response.data;
    },
    getById: async (id: number) => {
      const response = await this.client.get(`/logs/${id}`);
      return response.data;
    },
    export: async (params?: {
      format?: "csv" | "json";
      userId?: number;
      action?: string;
      level?: string;
      module?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const response = await this.client.get("/logs/export", {
        params,
        responseType: params?.format === "csv" ? "blob" : "json",
      });
      return response.data;
    },
    getStats: async () => {
      const response = await this.client.get("/logs/stats");
      return response.data;
    },
  };
}

export const api = new ApiClient();
export default api;

