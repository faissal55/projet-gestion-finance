"use client"

import { useState, useEffect, useCallback } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { DebtForm, type DebtFormData } from "@/components/debts/debt-form"
import { debtsApi } from "@/lib/api"   // ← import centralisé
import type { Debt } from "@/lib/types"
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle,
  CreditCard,
  Filter,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface DebtSummary {
  active:   { total: number; count: number }
  paid:     { total: number; count: number }
  upcoming: { total: number; count: number; debts: Debt[] }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysUntilDue(dueDate: string): number {
  const due   = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function SummaryCardSkeleton() {
  return (
    <Card className="border-border/50 bg-card shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}

function TableRowSkeleton() {
  return (
    <TableRow>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableCell key={i}><Skeleton className="h-4 w-full" /></TableCell>
      ))}
    </TableRow>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DebtsPage() {
  const [debts, setDebts]             = useState<Debt[]>([])
  const [summary, setSummary]         = useState<DebtSummary | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isFormOpen, setIsFormOpen]   = useState(false)
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null)

  const [loadingDebts, setLoadingDebts]     = useState(true)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [loadingAction, setLoadingAction]   = useState<number | null>(null)

  const { toast } = useToast()

  // ── Fetchers ──

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true)
    try {
      const data = await debtsApi.getSummary()
      setSummary(data)
    } catch {
      // non-bloquant
    } finally {
      setLoadingSummary(false)
    }
  }, [])

  const fetchDebts = useCallback(async () => {
    setLoadingDebts(true)
    try {
      const res = await debtsApi.getAll({
        per_page: 50,
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchQuery.trim() && { search: searchQuery.trim() }),
      })
      setDebts(res.data)
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err instanceof Error ? err.message : "Chargement impossible",
      })
    } finally {
      setLoadingDebts(false)
    }
  }, [statusFilter, searchQuery, toast])

  // ── Effects ──

  useEffect(() => { fetchSummary() }, [fetchSummary])

  useEffect(() => {
    const timer = setTimeout(() => fetchDebts(), 400)
    return () => clearTimeout(timer)
  }, [fetchDebts])

  // ── Actions ──

  const handleAddDebt = async (data: DebtFormData) => {
    try {
      const res = await debtsApi.create(data)
      setDebts((prev) => [res.data, ...prev])
      fetchSummary()
      setIsFormOpen(false)
      toast({ title: "Dette enregistrée avec succès" })
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err instanceof Error ? err.message : "Création impossible",
      })
      throw err
    }
  }

  const handleEditDebt = async (data: DebtFormData) => {
    if (!editingDebt) return
    try {
      const res = await debtsApi.update(editingDebt.id, data)
      setDebts((prev) => prev.map((d) => (d.id === editingDebt.id ? res.data : d)))
      fetchSummary()
      setEditingDebt(null)
      setIsFormOpen(false)
      toast({ title: "Dette modifiée avec succès" })
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err instanceof Error ? err.message : "Modification impossible",
      })
      throw err
    }
  }

  const handleMarkAsPaid = async (id: number) => {
    setLoadingAction(id)
    try {
      const res = await debtsApi.markAsPaid(id)
      setDebts((prev) => prev.map((d) => (d.id === id ? res.data : d)))
      fetchSummary()
      toast({ title: "Dette marquée comme payée" })
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

  const handleDelete = async (id: number) => {
    setLoadingAction(id)
    try {
      await debtsApi.delete(id)
      setDebts((prev) => prev.filter((d) => d.id !== id))
      fetchSummary()
      toast({ title: "Dette supprimée" })
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

  const openEdit = (debt: Debt) => {
    setEditingDebt(debt)
    setIsFormOpen(true)
  }

  const onFormClose = (open: boolean) => {
    setIsFormOpen(open)
    if (!open) setEditingDebt(null)
  }

  // ── Derived ──

  const upcomingDebts = summary?.upcoming.debts ?? []

  // ── Render ──

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="ml-64">
        <AppHeader title="Dettes" />
        <main className="p-6">

          {/* Summary Cards */}
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            {loadingSummary ? (
              Array.from({ length: 3 }).map((_, i) => <SummaryCardSkeleton key={i} />)
            ) : (
              <>
                <Card className="border-border/50 bg-card shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Dettes actives</p>
                        <p className="text-xl font-bold text-destructive">
                          {(summary?.active.total ?? 0).toLocaleString("fr-FR")} FCFA
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {summary?.active.count ?? 0} dette(s)
                        </p>
                      </div>
                      <CreditCard className="h-8 w-8 text-destructive/20" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Échéances proches</p>
                        <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                          {(summary?.upcoming.total ?? 0).toLocaleString("fr-FR")} FCFA
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {summary?.upcoming.count ?? 0} dans les 30 jours
                        </p>
                      </div>
                      <Calendar className="h-8 w-8 text-amber-500/20" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Dettes remboursées</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                          {(summary?.paid.total ?? 0).toLocaleString("fr-FR")} FCFA
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {summary?.paid.count ?? 0} dette(s)
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500/20" />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Upcoming Debts Alert */}
          {!loadingSummary && upcomingDebts.length > 0 && (
            <Card className="mb-6 border-amber-500/50 bg-amber-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                  Échéances à venir
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingDebts.map((debt) => {
                    const daysUntil = getDaysUntilDue(debt.due_date)
                    return (
                      <div
                        key={debt.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-3"
                      >
                        <div>
                          <p className="font-medium">{debt.creditor_name}</p>
                          <p className="text-sm text-muted-foreground">{debt.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {debt.amount.toLocaleString("fr-FR")} FCFA
                          </p>
                          <p className={cn(
                            "text-xs",
                            daysUntil <= 7
                              ? "text-destructive"
                              : "text-amber-600 dark:text-amber-400"
                          )}>
                            Dans {daysUntil} jour{daysUntil > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Debts Table */}
          <Card className="border-border/50 bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Liste des Dettes</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => { fetchDebts(); fetchSummary() }}
                  disabled={loadingDebts}
                  title="Rafraîchir"
                >
                  <RefreshCw className={cn("h-4 w-4", loadingDebts && "animate-spin")} />
                </Button>
                <Button onClick={() => { setEditingDebt(null); setIsFormOpen(true) }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle Dette
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {/* Filters */}
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher une dette..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="payee">Payée</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Créancier</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Échéance</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingDebts ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRowSkeleton key={i} />
                      ))
                    ) : debts.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-12 text-center text-muted-foreground"
                        >
                          Aucune dette trouvée
                        </TableCell>
                      </TableRow>
                    ) : (
                      debts.map((debt) => {
                        const daysUntil = getDaysUntilDue(debt.due_date)
                        const isUrgent  = debt.status === "active" && daysUntil <= 30 && daysUntil >= 0
                        const isOverdue = debt.status === "active" && daysUntil < 0
                        const isActing  = loadingAction === debt.id

                        return (
                          <TableRow
                            key={debt.id}
                            className={cn(isActing && "pointer-events-none opacity-50")}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                                  <CreditCard className="h-4 w-4 text-destructive" />
                                </div>
                                {debt.creditor_name}
                              </div>
                            </TableCell>

                            <TableCell className="text-muted-foreground max-w-[180px] truncate">
                              {debt.description || "—"}
                            </TableCell>

                            <TableCell>
                              <div className={cn(
                                "text-sm",
                                isOverdue && "font-medium text-destructive",
                                isUrgent  && "font-medium text-amber-600 dark:text-amber-400"
                              )}>
                                {new Date(debt.due_date).toLocaleDateString("fr-FR")}
                                {isOverdue && (
                                  <span className="ml-1 text-xs">(En retard)</span>
                                )}
                                {isUrgent && (
                                  <span className="ml-1 text-xs">({daysUntil}j)</span>
                                )}
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge
                                className={cn(
                                  "border",
                                  debt.status === "active"
                                    ? "bg-destructive/10 text-destructive border-destructive/20"
                                    : "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                                )}
                              >
                                {debt.status === "active" ? "Active" : "Payée"}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-right font-semibold text-destructive">
                              {debt.amount.toLocaleString("fr-FR")} FCFA
                            </TableCell>

                            <TableCell onClick={(e) => e.stopPropagation()}>
                              {isActing ? (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              ) : (
                                <DropdownMenu modal={false}>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="z-50">
                                    {debt.status === "active" && (
                                      <DropdownMenuItem
                                        onSelect={(e) => {
                                          e.preventDefault()
                                          handleMarkAsPaid(debt.id)
                                        }}
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Marquer comme payée
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onSelect={(e) => {
                                        e.preventDefault()
                                        openEdit(debt)
                                      }}
                                    >
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Modifier
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onSelect={(e) => {
                                        e.preventDefault()
                                        handleDelete(debt.id)
                                      }}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Supprimer
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      <DebtForm
        open={isFormOpen}
        onOpenChange={onFormClose}
        onSubmit={editingDebt ? handleEditDebt : handleAddDebt}
        debt={editingDebt ?? undefined}
      />
    </div>
  )
}
