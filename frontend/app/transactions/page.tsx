"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { TransactionForm, type TransactionFormData } from "./TransactionForm"
import type { Transaction } from "@/lib/types"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Pencil, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { api } from "@/lib/api"

export default function TransactionsPage() {
  const router = useRouter()

  // ---------- STATE ----------
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  // ---------- EFFECT: Vérification token ----------
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`
    fetchTransactions()
  }, [])

  // ---------- FETCH TRANSACTIONS ----------
  const fetchTransactions = async () => {
    try {
      const res = await api.get("/transactions")
      const data = res.data?.data || res.data
      setTransactions(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Erreur récupération transactions :", err)
      alert("Impossible de récupérer les transactions")
    }
  }

  // ---------- ADD / EDIT TRANSACTION ----------
  const handleSubmitTransaction = async (data: TransactionFormData) => {
    try {
      if (editingTransaction) {
        // Modifier transaction
        const res = await api.put(`/transactions/${editingTransaction.id}`, data)
        setTransactions(transactions.map(t => t.id === editingTransaction.id ? res.data : t))
        setEditingTransaction(null)
      } else {
        // Ajouter transaction
        const res = await api.post("/transactions", data)
        setTransactions([res.data, ...transactions])
      }
      setIsFormOpen(false)
    } catch (err) {
      console.error(err)
      alert("Erreur lors de la transaction")
    }
  }

  // ---------- DELETE TRANSACTION ----------
  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/transactions/${id}`)
      setTransactions(transactions.filter(t => t.id !== id))
    } catch (err) {
      console.error(err)
      alert("Erreur suppression transaction")
    }
  }

  // ---------- FILTRAGE ----------
  const filteredTransactions = transactions.filter(t => {
    const description = (t.description || "").toLowerCase()
    const category = (t.category || "").toLowerCase()
    const search = searchQuery.toLowerCase()
    const matchesSearch = description.includes(search) || category.includes(search)
    const matchesType = typeFilter === "all" || t.type === typeFilter
    return matchesSearch && matchesType
  })

  const totalRevenus = filteredTransactions
    .filter(t => t.type === "revenu")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0)

  const totalDepenses = filteredTransactions
    .filter(t => t.type === "depense")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0)

  // ---------- RENDER ----------
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="ml-64">
        <AppHeader title="Transactions" />
        <main className="p-6">
          {/* Summary Cards */}
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenus</p>
                  <p className="text-xl font-bold text-green-600">
                    +{totalRevenus.toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
                <ArrowUpRight className="h-8 w-8 text-green-200" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Dépenses</p>
                  <p className="text-xl font-bold text-red-600">
                    -{totalDepenses.toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
                <ArrowDownRight className="h-8 w-8 text-red-200" />
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <p className="text-sm text-muted-foreground">Solde Net</p>
                <p className={cn("text-xl font-bold", totalRevenus - totalDepenses >= 0 ? "text-green-600" : "text-red-600")}>
                  {(totalRevenus - totalDepenses).toLocaleString("fr-FR")} FCFA
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters + Table */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <CardTitle>Liste des Transactions</CardTitle>
              <Button onClick={() => { setEditingTransaction(null); setIsFormOpen(true) }}>
                <Plus className="mr-2 h-4 w-4" /> Nouvelle Transaction
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-4 flex-wrap">
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 min-w-[200px]"
                />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="revenu">Revenus</SelectItem>
                    <SelectItem value="depense">Dépenses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>{new Date(t.date).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell>{t.description}</TableCell>
                      <TableCell><Badge>{t.category}</Badge></TableCell>
                      <TableCell>{t.type === "revenu" ? "Revenu" : "Dépense"}</TableCell>
                      <TableCell>{t.amount.toLocaleString()} FCFA</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditingTransaction(t); setIsFormOpen(true) }}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500" onClick={() => handleDelete(t.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredTransactions.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">Aucune transaction trouvée</div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <TransactionForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmitTransaction}
        transaction={editingTransaction}
      />
    </div>
  )
}