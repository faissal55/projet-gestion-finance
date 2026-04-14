// Configuration de l'API Laravel
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Injecter le token automatiquement sur chaque requête axios
api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Fonction pour ajouter le token manuellement si besoin
export const setAuthToken = (token: string) => {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

// Helper pour les requetes fetch natives
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Une erreur est survenue" }));
    throw new Error(error.message || `Erreur ${response.status}`);
  }

  return response.json();
}

// ============ AUTH ============
export const authApi = {
  login: (email: string, password: string) =>
    fetchApi<{ user: any; token: string }>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    company_name?: string;
  }) =>
    fetchApi<{ user: any; token: string }>("/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () =>
    fetchApi<{ message: string }>("/logout", { method: "POST" }),

  getUser: () =>
    fetchApi<any>("/user"),
};

// ============ DASHBOARD ============
export const dashboardApi = {
  // GET /dashboard/stats
  getStats: () =>
    fetchApi<{
      solde_actuel: number;
      revenus_mois: number;
      depenses_mois: number;
      factures_en_attente: number;
      dettes_actives: number;
      variation_solde: number;
      variation_revenus: number;
      variation_depenses: number;
    }>("/dashboard/stats"),

  // GET /dashboard/chart-data?months=6 → { name, revenus, depenses }[]
  getChartData: (months: number = 6) =>
    fetchApi<Array<{ name: string; revenus: number; depenses: number }>>(
      `/dashboard/chart-data?months=${months}`
    ),

  // GET /dashboard/expenses-by-category → { category, amount, percentage }[]
  getExpensesByCategory: () =>
    fetchApi<Array<{ category: string; amount: number; percentage: number }>>(
      "/dashboard/expenses-by-category"
    ),

  // GET /dashboard/recent-transactions
  getRecentTransactions: (limit: number = 5) =>
    fetchApi<Array<any>>(`/dashboard/recent-transactions?limit=${limit}`),

  // GET /dashboard/recent-alerts
  getRecentAlerts: () =>
    fetchApi<Array<any>>("/dashboard/recent-alerts"),

  // GET /dashboard/recommendations
  getRecommendations: () =>
    fetchApi<Array<{
      type: "warning" | "success" | "info";
      title: string;
      description: string;
      action: string;
    }>>("/dashboard/recommendations"),
};

// ============ TRANSACTIONS ============
export const transactionsApi = {
  getAll: (params?: {
    type?: "revenu" | "depense";
    category?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    return fetchApi<{
      data: Array<any>;
      meta: { current_page: number; last_page: number; total: number };
    }>(`/transactions?${searchParams.toString()}`);
  },

  getOne: (id: number) =>
    fetchApi<{ data: any }>(`/transactions/${id}`),

  create: (data: {
    type: "revenu" | "depense";
    amount: number;
    category: string;
    description?: string;
    date: string;
    payment_method?: string;
    reference?: string;
  }) =>
    fetchApi<{ data: any; message: string }>("/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<any>) =>
    fetchApi<{ data: any; message: string }>(`/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchApi<{ message: string }>(`/transactions/${id}`, { method: "DELETE" }),

  getStats: () =>
    fetchApi<any>("/transactions/stats"),
};

// ============ FACTURES ============
export const invoicesApi = {
  getAll: (params?: {
    status?: string;
    search?: string;       // ← ajouté
    per_page?: number;     // ← ajouté
    date_from?: string;
    date_to?: string;
    page?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    return fetchApi<{
      data: Array<any>;
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    }>(`/invoices?${searchParams.toString()}`);
  },

  getSummary: () =>
    fetchApi<{
      en_attente: { total: number; count: number };
      en_retard:  { total: number; count: number };
      payee:      { total: number; count: number };
    }>("/invoices/summary"),

  getOne: (id: number) =>
    fetchApi<{ data: any }>(`/invoices/${id}`),

  create: (data: {
    client_name: string;
    amount: number;
    due_date: string;
    status?: string;
    description?: string;
  }) =>
    fetchApi<{ data: any; message: string }>("/invoices", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<any>) =>
    fetchApi<{ data: any; message: string }>(`/invoices/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchApi<{ message: string }>(`/invoices/${id}`, { method: "DELETE" }),

  markAsPaid: (id: number) =>
    fetchApi<{ data: any; message: string }>(`/invoices/${id}/mark-paid`, { method: "POST" }),

  sendReminder: (id: number) =>
    fetchApi<{ message: string }>(`/invoices/${id}/send-reminder`, { method: "POST" }),
};

// ============ DETTES ============
export const debtsApi = {
  getSummary: () =>
    fetchApi<{
      active:   { total: number; count: number };
      paid:     { total: number; count: number };
      upcoming: { total: number; count: number; debts: any[] };
    }>("/debts/summary"),

  getAll: (params?: {
    type?: "payable" | "receivable";
    status?: string;
    search?: string;    // ← ajouté
    per_page?: number;  // ← ajouté
    page?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    return fetchApi<{
      data: Array<any>;
      meta: { current_page: number; last_page: number; total: number };
    }>(`/debts?${searchParams.toString()}`);
  },

  getOne: (id: number) =>
    fetchApi<{ data: any }>(`/debts/${id}`),

  create: (data: {
    type: "payable" | "receivable";
    creditor_name: string;
    amount: number;
    due_date: string;
    description?: string;
  }) =>
    fetchApi<{ data: any; message: string }>("/debts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<any>) =>
    fetchApi<{ data: any; message: string }>(`/debts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchApi<{ message: string }>(`/debts/${id}`, { method: "DELETE" }),

  addPayment: (id: number, amount: number) =>
    fetchApi<{ data: any; message: string }>(`/debts/${id}/payment`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),

  markAsPaid: (id: number) =>
    fetchApi<{ data: any; message: string }>(`/debts/${id}/mark-paid`, { method: "POST" }),
};

// ============ ALERTES ============
export const alertsApi = {
  getAll: (params?: { type?: string; is_read?: boolean; per_page?: number; page?: number }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    return fetchApi<{
      data: Array<any>;
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    }>(`/alerts?${searchParams.toString()}`);
  },

  getSummary: () =>
    fetchApi<{
      total: number;
      unread: number;
      critical: number;
      warning: number;
      info: number;
    }>("/alerts/summary"),

  markAsRead: (id: number) =>
    fetchApi<{ message: string }>(`/alerts/${id}/mark-read`, { method: "POST" }),

  markAllAsRead: () =>
    fetchApi<{ message: string }>("/alerts/mark-all-read", { method: "POST" }),

  delete: (id: number) =>
    fetchApi<{ message: string }>(`/alerts/${id}`, { method: "DELETE" }),

  deleteRead: () =>
    fetchApi<{ message: string }>("/alerts/read", { method: "DELETE" }),
};

// ============ RAPPORTS ============
export const reportsApi = {
  getMonthly: (year: number, month: number) =>
    fetchApi<any>(`/reports/monthly?year=${year}&month=${month}`),

  getYearly: (year: number) =>
    fetchApi<any>(`/reports/yearly?year=${year}`),

  getCustom: (dateFrom: string, dateTo: string) =>
    fetchApi<any>(`/reports/custom?date_from=${dateFrom}&date_to=${dateTo}`),

  exportPdf: (type: string, params: any) => {
    const searchParams = new URLSearchParams(params);
    return `${API_BASE_URL}/reports/export/pdf?type=${type}&${searchParams.toString()}`;
  },

  exportExcel: (type: string, params: any) => {
    const searchParams = new URLSearchParams(params);
    return `${API_BASE_URL}/reports/export/excel?type=${type}&${searchParams.toString()}`;
  },
};
