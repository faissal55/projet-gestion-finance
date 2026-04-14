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
import { InvoiceForm, type InvoiceFormData } from "@/components/invoices/invoice-form"
import { invoicesApi } from "@/lib/api"   // ← import centralisé
import type { Invoice } from "@/lib/types"
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter,
  FileText,
  RefreshCw,
  Send,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ─────────────────────────────────────────────────────────────────

interface InvoiceSummary {
  en_attente: { total: number; count: number }
  en_retard:  { total: number; count: number }
  payee:      { total: number; count: number }
}

// ─── Config ─────────────────────────────────────────────────────────────────

const statusConfig = {
  en_attente: {
    label: "En attente",
    icon: Clock,
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  payee: {
    label: "Payée",
    icon: CheckCircle,
    className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  },
  en_retard: {
    label: "En retard",
    icon: AlertCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
}

// ─── Skeletons ───────────────────────────────────────────────────────────────

function SummaryCardSkeleton() {
  return (
    <Card className="border-border/50 bg-card shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
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
        <TableCell key={i}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const [invoices, setInvoices]         = useState<Invoice[]>([])
  const [summary, setSummary]           = useState<InvoiceSummary | null>(null)
  const [searchQuery, setSearchQuery]   = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isFormOpen, setIsFormOpen]     = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)

  const [loadingInvoices, setLoadingInvoices] = useState(true)
  const [loadingSummary, setLoadingSummary]   = useState(true)
  const [loadingAction, setLoadingAction]     = useState<number | null>(null)

  const { toast } = useToast()

  // ── Fetchers ──

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true)
    try {
      const data = await invoicesApi.getSummary()
      setSummary(data)
    } catch {
      // non-bloquant
    } finally {
      setLoadingSummary(false)
    }
  }, [])

  const fetchInvoices = useCallback(async () => {
    setLoadingInvoices(true)
    try {
      const res = await invoicesApi.getAll({
        per_page: 50,
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchQuery.trim() && { search: searchQuery.trim() }),
      })
      setInvoices(res.data)
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err instanceof Error ? err.message : "Chargement impossible",
      })
    } finally {
      setLoadingInvoices(false)
    }
  }, [statusFilter, searchQuery, toast])

  // ── Effects ──

  useEffect(() => { fetchSummary() }, [fetchSummary])

  // Debounce search + reload on filter change
  useEffect(() => {
    const timer = setTimeout(() => fetchInvoices(), 400)
    return () => clearTimeout(timer)
  }, [fetchInvoices])

  // ── Actions ──

  const handleAddInvoice = async (data: InvoiceFormData) => {
    try {
      const res = await invoicesApi.create(data)
      setInvoices((prev) => [res.data, ...prev])
      fetchSummary()
      setIsFormOpen(false)
      toast({ title: "Facture créée avec succès" })
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err instanceof Error ? err.message : "Création impossible",
      })
      throw err // remonte pour que le form reste ouvert
    }
  }

  const handleEditInvoice = async (data: InvoiceFormData) => {
    if (!editingInvoice) return
    try {
      const res = await invoicesApi.update(editingInvoice.id, data)
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === editingInvoice.id ? res.data : inv))
      )
      fetchSummary()
      setEditingInvoice(null)
      setIsFormOpen(false)
      toast({ title: "Facture modifiée avec succès" })
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
      const res = await invoicesApi.markAsPaid(id)
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? res.data : inv))
      )
      fetchSummary()
      toast({ title: "Facture marquée comme payée" })
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

  const handleSendReminder = async (id: number) => {
    setLoadingAction(id)
    try {
      await invoicesApi.sendReminder(id)
      toast({ title: "Relance envoyée avec succès" })
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err instanceof Error ? err.message : "Envoi impossible",
      })
    } finally {
      setLoadingAction(null)
    }
  }

  const handleDelete = async (id: number) => {
    setLoadingAction(id)
    try {
      await invoicesApi.delete(id)
      setInvoices((prev) => prev.filter((inv) => inv.id !== id))
      fetchSummary()
      toast({ title: "Facture supprimée" })
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

  const openEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    setIsFormOpen(true)
  }

  const onFormClose = (open: boolean) => {
    setIsFormOpen(open)
    if (!open) setEditingInvoice(null)
  }

  // ── Render ──

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="ml-64">
        <AppHeader title="Factures" />
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
                        <p className="text-sm text-muted-foreground">En attente</p>
                        <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                          {(summary?.en_attente.total ?? 0).toLocaleString("fr-FR")} FCFA
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {summary?.en_attente.count ?? 0} facture(s)
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-amber-500/20" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">En retard</p>
                        <p className="text-xl font-bold text-destructive">
                          {(summary?.en_retard.total ?? 0).toLocaleString("fr-FR")} FCFA
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {summary?.en_retard.count ?? 0} facture(s)
                        </p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-destructive/20" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Payées</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                          {(summary?.payee.total ?? 0).toLocaleString("fr-FR")} FCFA
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {summary?.payee.count ?? 0} facture(s)
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500/20" />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Table Card */}
          <Card className="border-border/50 bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Liste des Factures</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => { fetchInvoices(); fetchSummary() }}
                  disabled={loadingInvoices}
                  title="Rafraîchir"
                >
                  <RefreshCw className={cn("h-4 w-4", loadingInvoices && "animate-spin")} />
                </Button>
                <Button onClick={() => { setEditingInvoice(null); setIsFormOpen(true) }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle Facture
                </Button>
              </div>
            </CardHeader>
            <CardContent>

              {/* Filters */}
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher une facture..."
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
                    <SelectItem value="en_attente">En attente</SelectItem>
                    <SelectItem value="payee">Payée</SelectItem>
                    <SelectItem value="en_retard">En retard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Échéance</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingInvoices ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRowSkeleton key={i} />
                      ))
                    ) : invoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                          Aucune facture trouvée
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoices.map((invoice) => {
                        const config = statusConfig[invoice.status]
                        const StatusIcon = config.icon
                        const isActing = loadingAction === invoice.id
                        const isOverdue =
                          invoice.status === "en_attente" &&
                          new Date(invoice.due_date) < new Date()

                        return (
                          <TableRow
                            key={invoice.id}
                            className={cn(isActing && "pointer-events-none opacity-50")}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                  <FileText className="h-4 w-4 text-primary" />
                                </div>
                                {invoice.client_name}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-[200px] truncate">
                              {invoice.description || "—"}
                            </TableCell>
                            <TableCell className={cn(isOverdue && "font-medium text-destructive")}>
                              {new Date(invoice.due_date).toLocaleDateString("fr-FR")}
                            </TableCell>
                            <TableCell>
                              <Badge className={cn("border", config.className)}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {config.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {invoice.amount.toLocaleString("fr-FR")} FCFA
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
                                    {invoice.status !== "payee" && (
                                      <DropdownMenuItem
                                        onSelect={(e) => {
                                          e.preventDefault()
                                          handleMarkAsPaid(invoice.id)
                                        }}
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Marquer comme payée
                                      </DropdownMenuItem>
                                    )}
                                    {invoice.status === "en_retard" && (
                                      <DropdownMenuItem
                                        onSelect={(e) => {
                                          e.preventDefault()
                                          handleSendReminder(invoice.id)
                                        }}
                                      >
                                        <Send className="mr-2 h-4 w-4" />
                                        Envoyer une relance
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onSelect={(e) => {
                                        e.preventDefault()
                                        openEdit(invoice)
                                      }}
                                    >
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Modifier
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onSelect={(e) => {
                                        e.preventDefault()
                                        handleDelete(invoice.id)
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

      <InvoiceForm
        open={isFormOpen}
        onOpenChange={onFormClose}
        onSubmit={editingInvoice ? handleEditInvoice : handleAddInvoice}
        invoice={editingInvoice ?? undefined}
      />
    </div>
  )
}
