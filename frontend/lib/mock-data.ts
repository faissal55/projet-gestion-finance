import type { Transaction, Invoice, Debt, Alert, DashboardStats, ChartData, CategoryData } from "./types"

export const mockTransactions: Transaction[] = [
  {
    id: 1,
    type: "revenu",
    category: "Ventes",
    amount: 15000,
    description: "Vente produits Mars",
    date: "2026-03-10",
    created_at: "2026-03-10T10:00:00Z",
    updated_at: "2026-03-10T10:00:00Z"
  },
  {
    id: 2,
    type: "depense",
    category: "Fournisseurs",
    amount: 5000,
    description: "Achat marchandises",
    date: "2026-03-09",
    created_at: "2026-03-09T14:30:00Z",
    updated_at: "2026-03-09T14:30:00Z"
  },
  {
    id: 3,
    type: "revenu",
    category: "Services",
    amount: 8500,
    description: "Prestation consulting",
    date: "2026-03-08",
    created_at: "2026-03-08T09:00:00Z",
    updated_at: "2026-03-08T09:00:00Z"
  },
  {
    id: 4,
    type: "depense",
    category: "Loyer",
    amount: 2500,
    description: "Loyer local commercial Mars",
    date: "2026-03-01",
    created_at: "2026-03-01T08:00:00Z",
    updated_at: "2026-03-01T08:00:00Z"
  },
  {
    id: 5,
    type: "depense",
    category: "Salaires",
    amount: 12000,
    description: "Salaires employes Mars",
    date: "2026-03-05",
    created_at: "2026-03-05T17:00:00Z",
    updated_at: "2026-03-05T17:00:00Z"
  },
  {
    id: 6,
    type: "revenu",
    category: "Ventes",
    amount: 22000,
    description: "Vente produits Fevrier",
    date: "2026-02-28",
    created_at: "2026-02-28T16:00:00Z",
    updated_at: "2026-02-28T16:00:00Z"
  },
  {
    id: 7,
    type: "depense",
    category: "Marketing",
    amount: 3000,
    description: "Campagne publicitaire",
    date: "2026-03-07",
    created_at: "2026-03-07T11:00:00Z",
    updated_at: "2026-03-07T11:00:00Z"
  },
  {
    id: 8,
    type: "revenu",
    category: "Autres",
    amount: 1500,
    description: "Remboursement assurance",
    date: "2026-03-06",
    created_at: "2026-03-06T10:00:00Z",
    updated_at: "2026-03-06T10:00:00Z"
  }
]

export const mockInvoices: Invoice[] = [
  {
    id: 1,
    client_name: "Entreprise ABC",
    amount: 12500,
    due_date: "2026-03-20",
    status: "en_attente",
    description: "Facture services consulting",
    created_at: "2026-03-01T10:00:00Z",
    updated_at: "2026-03-01T10:00:00Z"
  },
  {
    id: 2,
    client_name: "Societe XYZ",
    amount: 8000,
    due_date: "2026-02-28",
    status: "en_retard",
    description: "Vente materiel informatique",
    created_at: "2026-02-15T14:00:00Z",
    updated_at: "2026-03-01T09:00:00Z"
  },
  {
    id: 3,
    client_name: "Client Martin",
    amount: 3500,
    due_date: "2026-03-15",
    status: "payee",
    description: "Prestation maintenance",
    created_at: "2026-02-20T11:00:00Z",
    updated_at: "2026-03-10T15:00:00Z"
  },
  {
    id: 4,
    client_name: "Groupe DEF",
    amount: 25000,
    due_date: "2026-04-01",
    status: "en_attente",
    description: "Projet developpement web",
    created_at: "2026-03-05T09:00:00Z",
    updated_at: "2026-03-05T09:00:00Z"
  }
]

export const mockDebts: Debt[] = [
  {
    id: 1,
    creditor_name: "Banque Nationale",
    amount: 50000,
    due_date: "2026-12-31",
    status: "active",
    description: "Pret equipement",
    created_at: "2025-01-15T10:00:00Z",
    updated_at: "2026-03-01T10:00:00Z"
  },
  {
    id: 2,
    creditor_name: "Fournisseur Alpha",
    amount: 8500,
    due_date: "2026-03-25",
    status: "active",
    description: "Credit fournisseur 60 jours",
    created_at: "2026-01-25T14:00:00Z",
    updated_at: "2026-01-25T14:00:00Z"
  },
  {
    id: 3,
    creditor_name: "Credit-Bail Auto",
    amount: 15000,
    due_date: "2027-06-15",
    status: "active",
    description: "Leasing vehicule utilitaire",
    created_at: "2025-06-15T09:00:00Z",
    updated_at: "2026-03-01T09:00:00Z"
  }
]

export const mockAlerts: Alert[] = [
  {
    id: 1,
    type: "facture",
    message: "La facture de Societe XYZ (8 000 FCFA) est en retard de 12 jours",
    severity: "critical",
    is_read: false,
    created_at: "2026-03-12T08:00:00Z"
  },
  {
    id: 2,
    type: "tresorerie",
    message: "Votre tresorerie a baisse de 15% ce mois-ci",
    severity: "warning",
    is_read: false,
    created_at: "2026-03-11T10:00:00Z"
  },
  {
    id: 3,
    type: "dette",
    message: "Echeance dette Fournisseur Alpha dans 13 jours (8 500 FCFA)",
    severity: "info",
    is_read: true,
    created_at: "2026-03-10T09:00:00Z"
  },
  {
    id: 4,
    type: "budget",
    message: "Categorie Marketing: 85% du budget mensuel utilise",
    severity: "warning",
    is_read: false,
    created_at: "2026-03-09T14:00:00Z"
  }
]

export const mockDashboardStats: DashboardStats = {
  total_revenus: 47000,
  total_depenses: 22500,
  solde_tresorerie: 124500,
  factures_en_attente: 37500,
  dettes_actives: 73500,
  variation_revenus: 12.5,
  variation_depenses: -8.3
}

export const mockChartData: ChartData[] = [
  { name: "Jan", revenus: 35000, depenses: 28000 },
  { name: "Fev", revenus: 42000, depenses: 25000 },
  { name: "Mar", revenus: 47000, depenses: 22500 },
  { name: "Avr", revenus: 0, depenses: 0 },
  { name: "Mai", revenus: 0, depenses: 0 },
  { name: "Juin", revenus: 0, depenses: 0 }
]

export const mockCategoryData: CategoryData[] = [
  { name: "Fournisseurs", value: 5000, fill: "var(--color-chart-1)" },
  { name: "Salaires", value: 12000, fill: "var(--color-chart-2)" },
  { name: "Loyer", value: 2500, fill: "var(--color-chart-3)" },
  { name: "Marketing", value: 3000, fill: "var(--color-chart-4)" }
]

export const expenseCategories = [
  "Fournisseurs",
  "Salaires",
  "Loyer",
  "Marketing",
  "Transport",
  "Equipement",
  "Services",
  "Autres"
]

export const revenueCategories = [
  "Ventes",
  "Services",
  "Commissions",
  "Autres"
]
