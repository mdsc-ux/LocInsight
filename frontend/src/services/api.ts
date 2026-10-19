const API_URL = "http://localhost:3000/api";

export interface Category {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Equipment {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  category?: Category;
  status: "DISPONIVEL" | "ALUGADO" | "MANUTENCAO";
  serialNumber: string;
  quantity: number;
  manualUrl?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "CLIENT" | "ADMIN";
  points: number;
  createdAt: string;
}

export interface Rental {
  id: string;
  startDate: string;
  expectedReturn: string;
  actualReturn?: string;
  status: "ACTIVE" | "FINISHED";
  userId: string;
  user?: User;
  equipmentId: string;
  equipment?: Equipment;
  conditionOnReturn?: string;
  pointsEarned: number;
}

export interface Maintenance {
  id: string;
  equipmentId: string;
  equipment?: Equipment;
  type: string;
  cost: number;
  startDate: string;
  endDate?: string;
  description: string;
  partsReplaced?: string;
  createdAt: string;
  updatedAt: string;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const headers = new Headers(options.headers || {});
  
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || "Ocorreu um erro na requisição");
  }

  return json.data as T;
}

export const api = {
  // Login
  login: (email: string, password: string) => request<User>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }),

  // Seed
  seed: () => request<{ message: string }>("/seed", { method: "POST" }),

  // Categories
  getCategories: () => request<Category[]>("/categories"),
  createCategory: (name: string) => request<Category>("/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  }),

  // Equipments
  getEquipments: (filters: { search?: string; categoryId?: string; status?: string; public?: boolean } = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.categoryId) params.append("categoryId", filters.categoryId);
    if (filters.status) params.append("status", filters.status);
    if (filters.public !== undefined) params.append("public", String(filters.public));
    return request<Equipment[]>(`/equipments?${params.toString()}`);
  },
  getEquipmentById: (id: string) => request<Equipment>(`/equipments/${id}`),
  createEquipment: (formData: FormData) => request<Equipment>("/equipments", {
    method: "POST",
    body: formData,
  }),
  updateEquipment: (id: string, formData: FormData) => request<Equipment>(`/equipments/${id}`, {
    method: "PUT",
    body: formData,
  }),
  deleteEquipment: (id: string) => request<{ message: string }>(`/equipments/${id}`, {
    method: "DELETE",
  }),

  // Rentals
  getRentals: () => request<Rental[]>("/rentals"),
  createRental: (data: { equipmentId: string; expectedReturn: string; clientName: string; clientEmail: string }) => request<Rental>("/rentals", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  returnRental: (id: string, conditionOnReturn: "BOM" | "DANIFICADO") => request<{ rental: Rental; pointsEarned: number; nextEquipmentStatus: string }>(`/rentals/${id}/return`, {
    method: "POST",
    body: JSON.stringify({ conditionOnReturn }),
  }),

  // Maintenances
  getMaintenances: () => request<Maintenance[]>("/maintenances"),
  createMaintenance: (data: { equipmentId: string; type: string; cost: number; description: string; partsReplaced?: string }) => request<Maintenance>("/maintenances", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  finishMaintenance: (id: string, data: { cost?: number; partsReplaced?: string }) => request<Maintenance>(`/maintenances/${id}/finish`, {
    method: "POST",
    body: JSON.stringify(data),
  }),

  // Clients
  getClients: () => request<User[]>("/clients"),
  getClientById: (id: string) => request<User & { rentals: Rental[] }>(`/clients/${id}`),
  redeemPoints: (id: string, pointsToRedeem: number) => request<{ pointsRedeemed: number; discountValue: number; remainingPoints: number }>(`/clients/${id}/redeem`, {
    method: "POST",
    body: JSON.stringify({ pointsToRedeem }),
  }),

  // Users
  getUsers: () => request<User[]>("/users"),
  createUser: (data: { name: string; email: string; role: 'ADMIN' | 'CLIENT'; password: string }) => request<User>("/users", {
    method: "POST",
    body: JSON.stringify(data),
  }),
};

export default api;
