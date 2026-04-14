"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
} from "recharts"
import { useToast } from "@/hooks/use-toast"
import { dashboardApi } from "@/lib/api"
import {
  Download,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Lightbulb,
  Loader2,
  RefreshCw,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Sparkles,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  solde_actuel: number
  revenus_mois: number
  depenses_mois: number
  variation_revenus: number
  variation_depenses: number
}

interface ChartDataPoint {
  name: string
  revenus: number
  depenses: number
  profit?: number
}

interface CategoryDataPoint {
  name: string
  value: number
  percentage: number
}

interface Recommendation {
  type: "warning" | "success" | "info"
  title: string
  description: string
  action: string
}

interface Invoice {
  id: string
  numero: string
  client: string
  montant: number
  date_emission: string
  date_echeance: string
  statut: "payee" | "en_attente" | "en_retard" | "annulee"
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
]

const TOOLTIP_STYLE = {
  backgroundColor: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  color: "var(--color-card-foreground)",
}

const formatFCFA = (value: unknown) =>
  `${Number(value ?? 0).toLocaleString("fr-FR")} FCFA`

// ─── Skeleton Components ──────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <Card className="border-border/50 bg-card shadow-sm">
      <CardContent className="p-4">
        <Skeleton className="mb-2 h-4 w-28" />
        <Skeleton className="h-8 w-36" />
        <Skeleton className="mt-1 h-4 w-16" />
      </CardContent>
    </Card>
  )
}

function ChartSkeleton({ height = 400 }: { height?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg bg-muted/30"
      style={{ height }}
    >
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}

// ─── Invoice Status Badge ─────────────────────────────────────────────────────

function InvoiceStatusBadge({ statut }: { statut: Invoice["statut"] }) {
  const config = {
    payee:      { label: "Payée",       icon: CheckCircle2, className: "bg-green-500/10 text-green-600 border-green-500/30" },
    en_attente: { label: "En attente",  icon: Clock,        className: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
    en_retard:  { label: "En retard",   icon: AlertTriangle,className: "bg-destructive/10 text-destructive border-destructive/30" },
    annulee:    { label: "Annulée",     icon: XCircle,      className: "bg-muted text-muted-foreground border-border" },
  }
  const { label, icon: Icon, className } = config[statut]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}

// ─── AI Recommendation Card ───────────────────────────────────────────────────

// Résout le texte d'action → { tab: string | null, route: string | null }
// tab : bascule l'onglet sur la même page
// route : navigue vers une autre page
function resolveAction(action: string): { tab: string | null; route: string | null } {
  const a = action.toLowerCase()
  if (a.includes("facture"))                                             return { tab: "factures",     route: null }
  if (a.includes("catégorie") || a.includes("categorie") || a.includes("répartition")) return { tab: "repartition", route: null }
  if (a.includes("comparaison"))                                         return { tab: "comparaison",  route: null }
  if (a.includes("évolution") || a.includes("evolution"))               return { tab: "evolution",    route: null }
  if (a.includes("dette"))                                               return { tab: null, route: "/dettes" }
  if (a.includes("tableau"))                                             return { tab: null, route: "/dashboard" }
  // Analyser / voir les rapports / revenus → onglet évolution
  return { tab: "evolution", route: null }
}

function RecommendationCard({
  rec,
  onTabChange,
}: {
  rec: Recommendation
  onTabChange: (tab: string) => void
}) {
  const router = useRouter()
  const styles = {
    warning: "border-amber-500/50 bg-amber-500/5",
    success: "border-green-500/50 bg-green-500/5",
    info:    "border-primary/50 bg-primary/5",
  }

  const handleAction = () => {
    const { tab, route } = resolveAction(rec.action)
    if (tab) {
      onTabChange(tab)
      // Scroll vers les onglets
      document.querySelector("[role=tablist]")?.scrollIntoView({ behavior: "smooth", block: "start" })
    } else if (route) {
      router.push(route)
    }
  }

  return (
    <div className={`rounded-lg border p-4 ${styles[rec.type]}`}>
      <div className="mb-1 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <h4 className="font-semibold text-sm">{rec.title}</h4>
      </div>
      <p className="text-sm text-muted-foreground">{rec.description}</p>
      <Button
        variant="link"
        className="mt-2 h-auto p-0 text-sm"
        onClick={handleAction}
      >
        {rec.action}
      </Button>
    </div>
  )
}

// ─── Normalise le statut Laravel → valeur union Invoice["statut"] ─────────────

function normalizeStatut(status: string): Invoice["statut"] {
  const map: Record<string, Invoice["statut"]> = {
    paid:       "payee",
    payee:      "payee",
    pending:    "en_attente",
    en_attente: "en_attente",
    overdue:    "en_retard",
    en_retard:  "en_retard",
    cancelled:  "annulee",
    canceled:   "annulee",
    annulee:    "annulee",
  }
  return map[status.toLowerCase()] ?? "en_attente"
}

// ─── Fetch invoices depuis GET /api/invoices (Laravel apiResource) ────────────

async function fetchInvoicesFromApi(): Promise<Invoice[]> {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ""
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  const res = await fetch(`${BASE_URL}/invoices`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const json = await res.json()

  // Laravel peut retourner un tableau direct ou un objet paginé { data: [...] }
  const raw: Record<string, unknown>[] = Array.isArray(json)
    ? json
    : Array.isArray((json as Record<string, unknown>)["data"])
      ? (json as Record<string, unknown[]>)["data"] as Record<string, unknown>[]
      : []

  // Normalise les champs Laravel → interface Invoice
  // Champs possibles : invoice_number|numero, client_name|client,
  //                    amount|montant, issue_date|date_emission,
  //                    due_date|date_echeance, status|statut
  return raw.map((inv) => ({
    id:            String(inv["id"] ?? ""),
    numero:        String(inv["invoice_number"] ?? inv["numero"]         ?? ""),
    client:        String(inv["client_name"]    ?? inv["client"]         ?? ""),
    montant:       Number(inv["amount"]         ?? inv["montant"]        ?? 0),
    date_emission: String(inv["issue_date"]     ?? inv["date_emission"]  ?? ""),
    date_echeance: String(inv["due_date"]       ?? inv["date_echeance"]  ?? ""),
    statut:        normalizeStatut(String(inv["status"] ?? inv["statut"] ?? "")),
  }))
}

// ─── Fetch recommendations depuis GET /dashboard/recommendations (Laravel) ────

async function generateAIRecommendations(
  _stats: DashboardStats,
  _categoryData: CategoryDataPoint[],
  _invoices: Invoice[]
): Promise<Recommendation[]> {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ""
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  const response = await fetch(`${BASE_URL}/dashboard/recommendations`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const data = await response.json()
  const recs = Array.isArray(data) ? data : (data?.recommendations ?? [])
  if (!Array.isArray(recs) || recs.length === 0) throw new Error("Réponse vide")
  return recs
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [period, setPeriod] = useState("mensuel")

  const [stats, setStats]               = useState<DashboardStats | null>(null)
  const [chartData, setChartData]       = useState<ChartDataPoint[]>([])
  const [categoryData, setCategoryData] = useState<CategoryDataPoint[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [invoices, setInvoices]         = useState<Invoice[]>([])
  const [invoiceFilter, setInvoiceFilter] = useState<Invoice["statut"] | "toutes">("toutes")

  const [loadingStats, setLoadingStats]         = useState(true)
  const [loadingChart, setLoadingChart]         = useState(true)
  const [loadingCategory, setLoadingCategory]   = useState(true)
  const [loadingRec, setLoadingRec]             = useState(true)
  const [loadingInvoices, setLoadingInvoices]   = useState(true)
  const [exporting, setExporting]               = useState(false)
  const [activeTab, setActiveTab]               = useState("evolution")

  const { toast } = useToast()

  // ── Fetchers ──

  const fetchStats = useCallback(async () => {
    setLoadingStats(true)
    try {
      const data = await dashboardApi.getStats()
      setStats({
        solde_actuel:       Number(data.solde_actuel       ?? 0),
        revenus_mois:       Number(data.revenus_mois       ?? 0),
        depenses_mois:      Number(data.depenses_mois      ?? 0),
        variation_revenus:  Number(data.variation_revenus  ?? 0),
        variation_depenses: Number(data.variation_depenses ?? 0),
      })
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Erreur stats",
        description: err instanceof Error ? err.message : "Impossible de charger les statistiques",
      })
    } finally {
      setLoadingStats(false)
    }
  }, [toast])

  const fetchChartData = useCallback(async (currentPeriod: string) => {
    setLoadingChart(true)
    try {
      // Convertit la période en nombre de mois pour l'API
      const monthsMap: Record<string, number> = {
        hebdomadaire: 1,
        mensuel:      6,
        trimestriel:  3,
        annuel:       12,
      }
      const months = monthsMap[currentPeriod] ?? 6
      const data = await dashboardApi.getChartData(months)
      setChartData(
        (Array.isArray(data) ? data : []).map((d) => ({
          name:     String(d.name     ?? ""),
          revenus:  Number(d.revenus  ?? 0),
          depenses: Number(d.depenses ?? 0),
          profit:   Number(d.revenus  ?? 0) - Number(d.depenses ?? 0),
        }))
      )
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Erreur graphique",
        description: err instanceof Error ? err.message : "Impossible de charger le graphique",
      })
    } finally {
      setLoadingChart(false)
    }
  }, [toast])

  const fetchCategoryData = useCallback(async () => {
    setLoadingCategory(true)
    try {
      const raw = await dashboardApi.getExpensesByCategory()
      const safeRaw: Record<string, unknown>[] = Array.isArray(raw)
        ? (raw as Record<string, unknown>[])
        : []
      const total = safeRaw.reduce(
        (s, c) => s + Number(c["amount"] ?? c["value"] ?? 0),
        0
      )
      setCategoryData(
        safeRaw.map((c) => ({
          name:       String(c["category"] ?? c["name"] ?? ""),
          value:      Number(c["amount"]   ?? c["value"] ?? 0),
          percentage: total > 0
            ? Math.round((Number(c["amount"] ?? c["value"] ?? 0) / total) * 100)
            : 0,
        }))
      )
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Erreur catégories",
        description: err instanceof Error ? err.message : "Impossible de charger les catégories",
      })
    } finally {
      setLoadingCategory(false)
    }
  }, [toast])

  const fetchInvoices = useCallback(async () => {
    setLoadingInvoices(true)
    try {
      const data = await fetchInvoicesFromApi()
      setInvoices(data)
    } catch {
      setInvoices([])
    } finally {
      setLoadingInvoices(false)
    }
  }, [])

  // ── AI Recommendations ────────────────────────────────────────────────────────
  // Appelé dès que stats est chargé. categoryData et invoices sont optionnels
  // pour ne pas bloquer si ces endpoints retournent vide.

  const fetchRecommendations = useCallback(async (
    currentStats: DashboardStats,
    currentCategoryData: CategoryDataPoint[],
    currentInvoices: Invoice[]
  ) => {
    setLoadingRec(true)
    try {
      const recs = await generateAIRecommendations(currentStats, currentCategoryData, currentInvoices)
      setRecommendations(recs)
    } catch (err) {
      console.error("Recommandations IA :", err)
      // Recommandations calculées localement depuis les vraies données
      const enRetard  = currentInvoices.filter((i) => i.statut === "en_retard")
      const marge = currentStats.revenus_mois > 0
        ? ((currentStats.revenus_mois - currentStats.depenses_mois) / currentStats.revenus_mois) * 100
        : 0
      const topCategorie = currentCategoryData.sort((a, b) => b.value - a.value)[0]

      const recs: Recommendation[] = []

      if (enRetard.length > 0) {
        const montantRetard = enRetard.reduce((s, i) => s + i.montant, 0)
        recs.push({
          type: "warning",
          title: `${enRetard.length} facture(s) en retard`,
          description: `${montantRetard.toLocaleString("fr-FR")} FCFA non récupérés. Relancez vos clients pour améliorer votre trésorerie.`,
          action: "Voir les factures en retard →",
        })
      }

      if (marge >= 20) {
        recs.push({
          type: "success",
          title: "Bonne marge nette",
          description: `Votre marge est de ${marge.toFixed(1)}% ce mois-ci. Maintenez cette dynamique en fidélisant vos clients.`,
          action: "Analyser les revenus →",
        })
      } else if (marge < 10 && currentStats.revenus_mois > 0) {
        recs.push({
          type: "warning",
          title: "Marge faible ce mois",
          description: `Votre marge nette est de ${marge.toFixed(1)}%. Réduire les dépenses ou augmenter les revenus améliorerait votre rentabilité.`,
          action: "Voir les dépenses →",
        })
      }

      if (topCategorie) {
        recs.push({
          type: "info",
          title: `Dépense dominante : ${topCategorie.name}`,
          description: `Cette catégorie représente ${topCategorie.percentage}% de vos dépenses (${topCategorie.value.toLocaleString("fr-FR")} FCFA). Un audit pourrait libérer de la trésorerie.`,
          action: "Analyser les catégories →",
        })
      }

      if (recs.length === 0) {
        recs.push({
          type: "info",
          title: "Situation stable",
          description: "Vos finances sont équilibrées ce mois-ci. Continuez à suivre vos flux régulièrement.",
          action: "Voir le tableau de bord →",
        })
      }

      setRecommendations(recs)
    } finally {
      setLoadingRec(false)
    }
  }, [])

  // ── Effects ──

  // Chargement initial
  useEffect(() => {
    fetchStats()
    fetchChartData(period)
    fetchCategoryData()
    fetchInvoices()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Recharge uniquement le graphique quand la période change
  useEffect(() => {
    fetchChartData(period)
  }, [period]) // eslint-disable-line react-hooks/exhaustive-deps

  // Déclenche les recommandations dès que stats + les 2 chargements secondaires sont terminés
  // On utilise loadingCategory et loadingInvoices comme signaux de fin de chargement
  useEffect(() => {
    if (stats && !loadingCategory && !loadingInvoices) {
      fetchRecommendations(stats, categoryData, invoices)
    }
  }, [stats, loadingCategory, loadingInvoices, categoryData, invoices, fetchRecommendations])

  // ── Refresh all ──

  const refreshAll = () => {
    fetchStats()
    fetchChartData(period)
    fetchCategoryData()
    fetchInvoices()
  }

  // ── Export CSV côté client ──

  const handleExport = async () => {
    setExporting(true)
    try {
      if (activeTab === "factures") {
        // Export des factures
        if (filteredInvoices.length === 0) {
          toast({ title: "Aucune facture à exporter" })
          return
        }
        const headers = ["N° Facture", "Client", "Montant (FCFA)", "Date émission", "Date échéance", "Statut"]
        const rows = filteredInvoices.map((inv) => [
          inv.numero,
          inv.client,
          inv.montant,
          inv.date_emission,
          inv.date_echeance,
          inv.statut,
        ])
        const csvContent = [headers, ...rows].map((r) => r.join(";")).join("\n")
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
        const url  = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `factures-${period}-${new Date().toISOString().slice(0, 10)}.csv`
        link.click()
        URL.revokeObjectURL(url)
      } else {
        // Export des données graphiques
        if (chartData.length === 0) {
          toast({ title: "Aucune donnée à exporter" })
          return
        }
        const headers = ["Période", "Revenus (FCFA)", "Dépenses (FCFA)", "Profit (FCFA)"]
        const rows = chartData.map((d) => [d.name, d.revenus, d.depenses, d.profit ?? d.revenus - d.depenses])
        const csvContent = [headers, ...rows].map((r) => r.join(";")).join("\n")
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
        const url  = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `rapport-${period}-${new Date().toISOString().slice(0, 10)}.csv`
        link.click()
        URL.revokeObjectURL(url)
      }
      toast({ title: "Export réussi" })
    } finally {
      setExporting(false)
    }
  }

  // ── Derived values ──

  const profitNet = stats ? stats.revenus_mois - stats.depenses_mois : null
  const marge     = stats && stats.revenus_mois > 0
    ? ((stats.revenus_mois - stats.depenses_mois) / stats.revenus_mois) * 100
    : 0

  const filteredInvoices = invoiceFilter === "toutes"
    ? invoices
    : invoices.filter((inv) => inv.statut === invoiceFilter)

  const invoiceStats = {
    total:      invoices.length,
    payees:     invoices.filter((i) => i.statut === "payee").length,
    enRetard:   invoices.filter((i) => i.statut === "en_retard").length,
    montantDu:  invoices.filter((i) => i.statut !== "payee" && i.statut !== "annulee")
                        .reduce((s, i) => s + i.montant, 0),
  }

  // ── Render ──

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="ml-64">
        <AppHeader title="Rapports & Analyses" />
        <main className="p-6">

          {/* ── Header Controls ── */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hebdomadaire">Hebdomadaire</SelectItem>
                  <SelectItem value="mensuel">Mensuel</SelectItem>
                  <SelectItem value="trimestriel">Trimestriel</SelectItem>
                  <SelectItem value="annuel">Annuel</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" onClick={refreshAll} title="Rafraîchir">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <Button
              onClick={handleExport}
              disabled={exporting || (activeTab !== "factures" && chartData.length === 0)}
            >
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Exporter {activeTab === "factures" ? "les factures" : "le rapport"}
            </Button>
          </div>

          {/* ── Summary Stats ── */}
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            {loadingStats ? (
              Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
            ) : stats ? (
              <>
                <Card className="border-border/50 bg-card shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Revenus du mois</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {stats.revenus_mois.toLocaleString("fr-FR")} FCFA
                        </p>
                        <div className="mt-1 flex items-center gap-1 text-sm text-green-600">
                          <TrendingUp className="h-4 w-4" />
                          <span>+{stats.variation_revenus}%</span>
                        </div>
                      </div>
                      <ArrowUpRight className="h-10 w-10 text-green-500/20" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Dépenses du mois</p>
                        <p className="text-2xl font-bold text-destructive">
                          {stats.depenses_mois.toLocaleString("fr-FR")} FCFA
                        </p>
                        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <TrendingDown className="h-4 w-4" />
                          <span>{stats.variation_depenses}%</span>
                        </div>
                      </div>
                      <ArrowDownRight className="h-10 w-10 text-destructive/20" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card shadow-sm">
                  <CardContent className="p-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Profit net</p>
                      <p className="text-2xl font-bold text-primary">
                        {profitNet !== null ? profitNet.toLocaleString("fr-FR") : "—"} FCFA
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">Marge : {marge.toFixed(1)}%</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card shadow-sm">
                  <CardContent className="p-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Solde trésorerie</p>
                      <p className="text-2xl font-bold text-card-foreground">
                        {stats.solde_actuel.toLocaleString("fr-FR")} FCFA
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">Disponible</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>

          {/* ── Charts + Factures Tabs ── */}
          <Tabs defaultValue="evolution" className="mb-6" onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="evolution">Évolution</TabsTrigger>
              <TabsTrigger value="repartition">Répartition</TabsTrigger>
              <TabsTrigger value="comparaison">Comparaison</TabsTrigger>
              <TabsTrigger value="factures" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Factures
                {invoiceStats.enRetard > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                    {invoiceStats.enRetard}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ── Évolution ── */}
            <TabsContent value="evolution">
              <Card className="border-border/50 bg-card shadow-sm">
                <CardHeader>
                  <CardTitle>Évolution des flux financiers</CardTitle>
                  <CardDescription>
                    {period === "hebdomadaire" && "Revenus et dépenses sur les 4 dernières semaines"}
                    {period === "mensuel"      && "Revenus, dépenses et profit sur les 6 derniers mois"}
                    {period === "trimestriel"  && "Revenus et dépenses sur les 3 derniers mois"}
                    {period === "annuel"       && "Revenus et dépenses sur les 12 derniers mois"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingChart ? (
                    <ChartSkeleton />
                  ) : chartData.length === 0 ? (
                    <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                      Aucune donnée disponible
                    </div>
                  ) : (
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorRevenu" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorDepense" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="var(--color-chart-2)" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                          <XAxis dataKey="name" stroke="var(--color-muted-foreground)" />
                          <YAxis stroke="var(--color-muted-foreground)" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: number) => [formatFCFA(value)]} />
                          <Legend />
                          <Area type="monotone" dataKey="revenus"  name="Revenus"  stroke="var(--color-chart-1)" fill="url(#colorRevenu)"  strokeWidth={2} />
                          <Area type="monotone" dataKey="depenses" name="Dépenses" stroke="var(--color-chart-2)" fill="url(#colorDepense)" strokeWidth={2} />
                          <Line type="monotone" dataKey="profit"   name="Profit"   stroke="var(--color-chart-3)" strokeWidth={2} dot={{ fill: "var(--color-chart-3)" }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Répartition ── */}
            <TabsContent value="repartition">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-border/50 bg-card shadow-sm">
                  <CardHeader>
                    <CardTitle>Répartition des dépenses</CardTitle>
                    <CardDescription>Par catégorie (mois en cours)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingCategory ? (
                      <ChartSkeleton height={300} />
                    ) : categoryData.length === 0 ? (
                      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                        Aucune donnée disponible
                      </div>
                    ) : (
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                              {categoryData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: number) => [formatFCFA(value)]} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card shadow-sm">
                  <CardHeader>
                    <CardTitle>Détails par catégorie</CardTitle>
                    <CardDescription>Montants et pourcentages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingCategory ? (
                      <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-2 w-full rounded-full" />
                          </div>
                        ))}
                      </div>
                    ) : categoryData.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucune donnée</p>
                    ) : (
                      <div className="space-y-4">
                        {categoryData.map((category, index) => (
                          <div key={category.name} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="font-medium">{category.name}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-semibold">{category.value.toLocaleString("fr-FR")} FCFA</span>
                                <span className="ml-2 text-sm text-muted-foreground">({category.percentage}%)</span>
                              </div>
                            </div>
                            <div className="h-2 rounded-full bg-muted">
                              <div
                                className="h-2 rounded-full transition-all duration-500"
                                style={{ width: `${category.percentage}%`, backgroundColor: COLORS[index % COLORS.length] }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── Comparaison ── */}
            <TabsContent value="comparaison">
              <Card className="border-border/50 bg-card shadow-sm">
                <CardHeader>
                  <CardTitle>Comparaison Revenus vs Dépenses</CardTitle>
                  <CardDescription>
                    {period === "hebdomadaire" && "Sur les 4 dernières semaines"}
                    {period === "mensuel"      && "Sur les 6 derniers mois"}
                    {period === "trimestriel"  && "Sur les 3 derniers mois"}
                    {period === "annuel"       && "Sur les 12 derniers mois"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingChart ? (
                    <ChartSkeleton />
                  ) : chartData.length === 0 ? (
                    <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                      Aucune donnée disponible
                    </div>
                  ) : (
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                          <XAxis dataKey="name" stroke="var(--color-muted-foreground)" />
                          <YAxis stroke="var(--color-muted-foreground)" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: number) => [formatFCFA(value)]} />
                          <Legend />
                          <Bar dataKey="revenus"  name="Revenus"  fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="depenses" name="Dépenses" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Factures ── */}
            <TabsContent value="factures">
              {/* Résumé factures */}
              <div className="mb-4 grid gap-4 md:grid-cols-4">
                {loadingInvoices ? (
                  Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
                ) : (
                  <>
                    <Card className="border-border/50 bg-card shadow-sm">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Total factures</p>
                        <p className="text-2xl font-bold">{invoiceStats.total}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-border/50 bg-card shadow-sm">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Payées</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{invoiceStats.payees}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-border/50 bg-card shadow-sm">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">En retard</p>
                        <p className="text-2xl font-bold text-destructive">{invoiceStats.enRetard}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-border/50 bg-card shadow-sm">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Montant dû</p>
                        <p className="text-2xl font-bold text-amber-600">{invoiceStats.montantDu.toLocaleString("fr-FR")} FCFA</p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>

              <Card className="border-border/50 bg-card shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Analyse des factures
                      </CardTitle>
                      <CardDescription>Suivi et statut de toutes vos factures</CardDescription>
                    </div>
                    <Select value={invoiceFilter} onValueChange={(v) => setInvoiceFilter(v as typeof invoiceFilter)}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Filtrer par statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="toutes">Toutes</SelectItem>
                        <SelectItem value="payee">Payées</SelectItem>
                        <SelectItem value="en_attente">En attente</SelectItem>
                        <SelectItem value="en_retard">En retard</SelectItem>
                        <SelectItem value="annulee">Annulées</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingInvoices ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : filteredInvoices.length === 0 ? (
                    <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
                      <FileText className="h-10 w-10 opacity-30" />
                      <p>Aucune facture pour ce filtre</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/50 text-left text-muted-foreground">
                            <th className="pb-3 pr-4 font-medium">N° Facture</th>
                            <th className="pb-3 pr-4 font-medium">Client</th>
                            <th className="pb-3 pr-4 font-medium text-right">Montant</th>
                            <th className="pb-3 pr-4 font-medium">Émission</th>
                            <th className="pb-3 pr-4 font-medium">Échéance</th>
                            <th className="pb-3 font-medium">Statut</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {filteredInvoices.map((inv) => (
                            <tr key={inv.id} className="group hover:bg-muted/30 transition-colors">
                              <td className="py-3 pr-4 font-mono font-medium text-xs">{inv.numero}</td>
                              <td className="py-3 pr-4 font-medium">{inv.client}</td>
                              <td className="py-3 pr-4 text-right font-semibold tabular-nums">
                                {inv.montant.toLocaleString("fr-FR")} FCFA
                              </td>
                              <td className="py-3 pr-4 text-muted-foreground">
                                {new Date(inv.date_emission).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                              </td>
                              <td className="py-3 pr-4 text-muted-foreground">
                                {new Date(inv.date_echeance).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                              </td>
                              <td className="py-3">
                                <InvoiceStatusBadge statut={inv.statut} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* ── Recommandations IA ── */}
          {!loadingRec && recommendations.length > 0 && (
            <Card className="border-border/50 bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Recommandations intelligentes
                  <Badge variant="secondary" className="ml-1 text-xs">IA</Badge>
                </CardTitle>
                <CardDescription>
                  Analyse personnalisée de vos flux financiers et factures par Claude AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {recommendations.map((rec, index) => (
                    <RecommendationCard
                      key={index}
                      rec={rec}
                      onTabChange={(tab) => {
                        setActiveTab(tab)
                        // Force le Tabs component à changer d'onglet via un ref
                        const trigger = document.querySelector<HTMLButtonElement>(
                          `[role=tab][data-value="${tab}"]`
                        ) ?? document.querySelector<HTMLButtonElement>(
                          `[role=tab][value="${tab}"]`
                        )
                        trigger?.click()
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {loadingRec && (
            <Card className="border-border/50 bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
                  Analyse IA en cours…
                </CardTitle>
                <CardDescription>Claude analyse vos données financières</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 md:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-lg border border-border/50 p-4">
                      <Skeleton className="mb-2 h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="mt-1 h-4 w-5/6" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </main>
      </div>
    </div>
  )
}
