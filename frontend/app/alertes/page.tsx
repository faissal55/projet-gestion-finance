"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  Bell,
  BellOff,
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  Trash2,
  Settings,
  Wallet,
  FileText,
  CreditCard,
  TrendingDown,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type AlertSeverity = "critical" | "warning" | "info"
type AlertType = "budget" | "tresorerie" | "facture" | "dette"

interface Alert {
  id: number
  user_id: number
  type: AlertType
  message: string
  severity: AlertSeverity
  is_read: boolean
  created_at: string
  updated_at: string
}

interface AlertSummary {
  total: number
  unread: number
  critical: number
  warning: number
  info: number
}

// ─── Config mappings ──────────────────────────────────────────────────────────

const severityConfig: Record<AlertSeverity, {
  icon: React.ElementType
  bgClass: string
  borderClass: string
  textClass: string
  badgeClass: string
  label: string
}> = {
  critical: {
    icon: AlertTriangle,
    bgClass: "bg-destructive/10",
    borderClass: "border-destructive/30",
    textClass: "text-destructive",
    badgeClass: "border-destructive/40 text-destructive",
    label: "Critique",
  },
  warning: {
    icon: AlertCircle,
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30",
    textClass: "text-amber-600 dark:text-amber-400",
    badgeClass: "border-amber-500/40 text-amber-600 dark:text-amber-400",
    label: "Attention",
  },
  info: {
    icon: Info,
    bgClass: "bg-primary/10",
    borderClass: "border-primary/30",
    textClass: "text-primary",
    badgeClass: "border-primary/40 text-primary",
    label: "Info",
  },
}

const typeConfig: Record<AlertType, { icon: React.ElementType; label: string }> = {
  budget:     { icon: Wallet,       label: "Budget"      },
  tresorerie: { icon: TrendingDown, label: "Trésorerie"  },
  facture:    { icon: FileText,     label: "Facture"     },
  dette:      { icon: CreditCard,   label: "Dette"       },
}

const DEFAULT_ALERT_SETTINGS = [
  {
    id: "budget",
    title: "Alertes Budget",
    description: "Notifications lorsque vous dépassez 80% d'une catégorie budgétaire",
    enabled: true,
  },
  {
    id: "tresorerie",
    title: "Alertes Trésorerie",
    description: "Notifications pour les mouvements importants sur vos transactions",
    enabled: true,
  },
  {
    id: "facture",
    title: "Alertes Factures",
    description: "Notifications pour les factures en retard ou proches de l'échéance",
    enabled: true,
  },
  {
    id: "dette",
    title: "Alertes Dettes",
    description: "Notifications pour les échéances de dettes à venir",
    enabled: true,
  },
]

// ─── API helpers (appels directs Laravel, sans dépendre de alertsApi) ─────────

const BASE_URL = () => process.env.NEXT_PUBLIC_API_URL ?? ""
const authHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL()}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options?.headers ?? {}) },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.message ?? `HTTP ${res.status}`)
  }
  return res.json()
}

// GET /api/alerts?type=...&is_read=...&per_page=...
async function fetchAlertsApi(params: {
  type?: AlertType
  is_read?: boolean
  per_page?: number
}): Promise<{ data: Alert[]; total: number }> {
  const qs = new URLSearchParams()
  if (params.type    !== undefined) qs.set("type",     params.type)
  if (params.is_read !== undefined) qs.set("is_read",  String(params.is_read))
  qs.set("per_page", String(params.per_page ?? 50))

  // Laravel paginator retourne { data: [], total, ... }
  const json = await apiFetch<{ data?: Alert[]; total?: number } | Alert[]>(
    `/alerts?${qs.toString()}`
  )
  if (Array.isArray(json)) return { data: json, total: json.length }
  return {
    data:  (json as { data?: Alert[] }).data  ?? [],
    total: (json as { total?: number }).total ?? 0,
  }
}

// Le summary est calculé localement depuis les alertes chargées
// pour éviter le conflit de route Laravel /alerts/{alert} vs /alerts/summary

// POST /api/alerts/{id}/mark-read
const markAsReadApi = (id: number) =>
  apiFetch(`/alerts/${id}/mark-read`, { method: "POST" })

// POST /api/alerts/mark-all-read
const markAllAsReadApi = () =>
  apiFetch("/alerts/mark-all-read", { method: "POST" })

// DELETE /api/alerts/{id}
const deleteAlertApi = (id: number) =>
  apiFetch(`/alerts/${id}`, { method: "DELETE" })

// DELETE /api/alerts/read
const deleteReadApi = () =>
  apiFetch("/alerts/read", { method: "DELETE" })

// POST /api/alerts/generate — génère les alertes pour l'utilisateur connecté
const generateAlertsApi = () =>
  apiFetch("/alerts/generate", { method: "POST" })

// ─── Skeleton Components ──────────────────────────────────────────────────────

function SummaryCardSkeleton() {
  return (
    <Card className="border-border/50 bg-card shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-12" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}

function AlertItemSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-border/50 p-4">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AlertsPage() {
  const router = useRouter()

  // allAlerts = toutes les alertes sans filtre (sert à calculer le summary)
  const [allAlerts, setAllAlerts] = useState<Alert[]>([])
  // alerts = alertes filtrées selon l'onglet actif
  const [alerts, setAlerts]       = useState<Alert[]>([])
  const [settings, setSettings]   = useState(DEFAULT_ALERT_SETTINGS)
  const [activeTab, setActiveTab] = useState("all")

  const [loading, setLoading]             = useState(true)
  const [loadingAction, setLoadingAction] = useState<number | string | null>(null)
  const [generating, setGenerating]       = useState(false)

  // Summary calculé depuis allAlerts (jamais filtré)
  const summary: AlertSummary = {
    total:    allAlerts.length,
    unread:   allAlerts.filter((a) => !a.is_read).length,
    critical: allAlerts.filter((a) => !a.is_read && a.severity === "critical").length,
    warning:  allAlerts.filter((a) => !a.is_read && a.severity === "warning").length,
    info:     allAlerts.filter((a) => !a.is_read && a.severity === "info").length,
  }

  const { toast } = useToast()

  // ── Fetcher unique ──
  // Un seul appel charge TOUTES les alertes, le filtrage se fait côté client.
  // Évite les conflits de routes Laravel et les doubles requêtes.

  const loadAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchAlertsApi({ per_page: 200 })
      setAllAlerts(res.data)
      setAlerts(res.data) // onglet "all" par défaut
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible de charger les alertes",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Filtre les alertes côté client quand l'onglet change
  const applyFilter = useCallback((tab: string, source: Alert[]) => {
    if (tab === "all")    return source
    if (tab === "unread") return source.filter((a) => !a.is_read)
    return source.filter((a) => a.type === tab)
  }, [])

  // ── Effects ──

  useEffect(() => { loadAlerts() }, [loadAlerts])

  useEffect(() => {
    setAlerts(applyFilter(activeTab, allAlerts))
  }, [activeTab, allAlerts, applyFilter])

  // ── Actions ──

  const markAsRead = async (id: number) => {
    setLoadingAction(id)
    try {
      await markAsReadApi(id)
      setAllAlerts((prev) => prev.map((a) => a.id === id ? { ...a, is_read: true } : a))
      toast({ title: "Alerte marquée comme lue" })
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err instanceof Error ? err.message : "Action impossible",
      })
    } finally {
      setLoadingAction(null)
    }
  }

  const markAllAsRead = async () => {
    setLoadingAction("all")
    try {
      await markAllAsReadApi()
      setAllAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })))
      toast({ title: "Toutes les alertes marquées comme lues" })
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err instanceof Error ? err.message : "Action impossible",
      })
    } finally {
      setLoadingAction(null)
    }
  }

  const deleteAlert = async (id: number) => {
    setLoadingAction(id)
    try {
      await deleteAlertApi(id)
      setAllAlerts((prev) => prev.filter((a) => a.id !== id))
      toast({ title: "Alerte supprimée" })
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err instanceof Error ? err.message : "Suppression impossible",
      })
    } finally {
      setLoadingAction(null)
    }
  }

  const deleteReadAlerts = async () => {
    setLoadingAction("deleteRead")
    try {
      await deleteReadApi()
      setAllAlerts((prev) => prev.filter((a) => !a.is_read))
      toast({ title: "Alertes lues supprimées" })
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err instanceof Error ? err.message : "Action impossible",
      })
    } finally {
      setLoadingAction(null)
    }
  }

  const toggleSetting = (id: string) => {
    setSettings((prev) => prev.map((s) => s.id === id ? { ...s, enabled: !s.enabled } : s))
  }

  const handleRefresh = () => { loadAlerts() }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await generateAlertsApi()
      toast({ title: "Alertes générées", description: "Les nouvelles alertes ont été créées." })
      await loadAlerts()
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err instanceof Error ? err.message : "Impossible de générer les alertes",
      })
    } finally {
      setGenerating(false)
    }
  }

  // ── Derived values ──
  const unreadCount   = summary.unread
  const criticalCount = summary.critical
  const warningCount  = summary.warning
  const readCount     = summary.total - summary.unread
  const hasReadAlerts = allAlerts.some((a) => a.is_read)

  // ── Render ──

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="ml-64">
        <AppHeader title="Alertes" />
        <main className="p-6">

          {/* ── Summary Cards ── */}
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SummaryCardSkeleton key={i} />)
            ) : (
              <>
                <Card className="border-border/50 bg-card shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total non lues</p>
                        <p className="text-2xl font-bold">{unreadCount}</p>
                      </div>
                      <Bell className="h-8 w-8 text-primary/20" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Critiques</p>
                        <p className="text-2xl font-bold text-destructive">{criticalCount}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-destructive/20" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Attention</p>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{warningCount}</p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-amber-500/20" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Lues</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{readCount}</p>
                      </div>
                      <Check className="h-8 w-8 text-green-500/20" />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">

            {/* ── Alerts List ── */}
            <div className="lg:col-span-2">
              <Card className="border-border/50 bg-card shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Gérez vos alertes et notifications</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleRefresh}
                      disabled={loading}
                      title="Rafraîchir"
                    >
                      <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerate}
                      disabled={generating}
                      title="Analyser et générer les alertes"
                    >
                      {generating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Bell className="mr-2 h-4 w-4" />
                      )}
                      Générer
                    </Button>
                    {unreadCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={markAllAsRead}
                        disabled={loadingAction === "all"}
                      >
                        {loadingAction === "all" ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        Tout marquer comme lu
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  {/* CORRECTION : chaque TabsContent doit avoir une value unique.
                      On utilise un seul TabsContent "actif" pour éviter le bug
                      où changer d'onglet ne recharge pas la liste. */}
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4 flex-wrap h-auto gap-1">
                      <TabsTrigger value="all">
                        Toutes
                        {summary && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {summary.total}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="unread">
                        Non lues
                        {unreadCount > 0 && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            {unreadCount}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="budget">Budget</TabsTrigger>
                      <TabsTrigger value="facture">Factures</TabsTrigger>
                      <TabsTrigger value="tresorerie">Trésorerie</TabsTrigger>
                      <TabsTrigger value="dette">Dettes</TabsTrigger>
                    </TabsList>

                    {/* Un seul TabsContent qui se met à jour selon activeTab */}
                    {["all","unread","budget","facture","tresorerie","dette"].map((tab) => (
                      <TabsContent key={tab} value={tab} className="mt-0">
                        <div className="space-y-3">
                          {loading ? (
                            Array.from({ length: 4 }).map((_, i) => <AlertItemSkeleton key={i} />)
                          ) : alerts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                              <BellOff className="mb-4 h-12 w-12 opacity-40" />
                              <p className="text-sm">Aucune alerte dans cette catégorie</p>
                            </div>
                          ) : (
                            alerts.map((alert) => {
                              const severityConf = severityConfig[alert.severity] ?? severityConfig.info
                              const typeConf     = typeConfig[alert.type]         ?? typeConfig.facture
                              const SeverityIcon = severityConf.icon
                              const TypeIcon     = typeConf.icon
                              const isActing     = loadingAction === alert.id

                              return (
                                <div
                                  key={alert.id}
                                  className={cn(
                                    "flex items-start gap-4 rounded-lg border p-4 transition-all duration-200",
                                    severityConf.bgClass,
                                    severityConf.borderClass,
                                    alert.is_read && "opacity-55",
                                    isActing && "pointer-events-none opacity-40"
                                  )}
                                >
                                  <div className={cn(
                                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                                    severityConf.bgClass
                                  )}>
                                    <SeverityIcon className={cn("h-5 w-5", severityConf.textClass)} />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        <TypeIcon className="mr-1 h-3 w-3" />
                                        {typeConf.label}
                                      </Badge>
                                      <Badge
                                        variant="outline"
                                        className={cn("text-xs", severityConf.badgeClass)}
                                      >
                                        {severityConf.label}
                                      </Badge>
                                      {!alert.is_read && (
                                        <span className="h-2 w-2 rounded-full bg-primary" />
                                      )}
                                    </div>
                                    <p className="mt-2 text-sm font-medium leading-snug">
                                      {alert.message}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {new Date(alert.created_at).toLocaleDateString("fr-FR", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>

                                  <div className="flex shrink-0 gap-1">
                                    {isActing ? (
                                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                    ) : (
                                      <>
                                        {!alert.is_read && (
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => markAsRead(alert.id)}
                                            title="Marquer comme lu"
                                          >
                                            <Check className="h-4 w-4" />
                                          </Button>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => deleteAlert(alert.id)}
                                          title="Supprimer"
                                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>

                  {/* Supprimer les alertes lues */}
                  {hasReadAlerts && (
                    <div className="mt-4 border-t border-border/50 pt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={deleteReadAlerts}
                        disabled={loadingAction === "deleteRead"}
                      >
                        {loadingAction === "deleteRead" ? (
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-3 w-3" />
                        )}
                        Supprimer les alertes lues
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Right Column ── */}
            <div className="space-y-6">

              {/* Paramètres d'alertes */}
              <Card className="border-border/50 bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Paramètres d&apos;alertes
                  </CardTitle>
                  <CardDescription>
                    Configurez vos préférences de notification
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {settings.map((setting) => (
                      <div
                        key={setting.id}
                        className="flex items-start justify-between rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/30"
                      >
                        <div className="flex-1 pr-4">
                          <h4 className="text-sm font-medium">{setting.title}</h4>
                          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                            {setting.description}
                          </p>
                        </div>
                        <Switch
                          checked={setting.enabled}
                          onCheckedChange={() => toggleSetting(setting.id)}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions rapides — avec navigation fonctionnelle */}
              <Card className="border-border/50 bg-card shadow-sm">
                <CardHeader>
                  <CardTitle>Actions rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push("/factures?filtre=en_retard")}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Relancer les factures en retard
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push("/dettes")}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Voir les dettes à payer
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push("/rapports?tab=repartition")}
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Analyser le budget
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
