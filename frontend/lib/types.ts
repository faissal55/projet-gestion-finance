export interface Transaction {
  id: number
  type: "revenu" | "depense"
  category: string
  amount: number
  description: string
  date: string
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: number
  client_name: string
  amount: number
  due_date: string
  status: "en_attente" | "payee" | "en_retard"
  description: string
  created_at: string
  updated_at: string
}

export interface Debt {
  id: number
  creditor_name: string
  amount: number
  due_date: string
  status: "active" | "payee"
  description: string
  created_at: string
  updated_at: string
}

export interface Alert {
  id: number
  type: "budget" | "tresorerie" | "facture" | "dette"
  message: string
  severity: "info" | "warning" | "critical"
  is_read: boolean
  created_at: string
}

export interface DashboardStats {
  total_revenus: number
  total_depenses: number
  solde_tresorerie: number
  factures_en_attente: number
  dettes_actives: number
  variation_revenus: number
  variation_depenses: number
}

export interface ChartData {
  name: string
  revenus: number
  depenses: number
}

export interface CategoryData {
  name: string
  value: number
  fill: string
}
