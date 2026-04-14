"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { dashboardApi } from "@/lib/api"

interface Transaction {
  id: number
  description: string
  amount: number
  type: "revenu" | "depense"
  category: string
  date: string
}

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const raw = await dashboardApi.getRecentTransactions()
        const items: Transaction[] = (Array.isArray(raw) ? raw : []).map(
          (t: Record<string, unknown>) => ({
            id:          Number(t["id"] ?? 0),
            description: String(t["description"] ?? t["note"] ?? "Transaction"),
            amount:      Number(t["amount"] ?? 0),
            // Laravel stocke "revenu" ou "depense" dans le champ type
            type:        (String(t["type"] ?? "depense").toLowerCase().startsWith("rev")
                           ? "revenu" : "depense") as "revenu" | "depense",
            category:    String(t["category"] ?? ""),
            date:        String(t["date"] ?? t["created_at"] ?? ""),
          })
        )
        setTransactions(items)
      } catch (error) {
        console.error("Erreur chargement transactions:", error)
        setTransactions([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <Card className="border-border/50 bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-card-foreground">
          Transactions Récentes
        </CardTitle>
        <a href="/transactions" className="text-sm font-medium text-primary hover:underline">
          Voir tout
        </a>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Aucune transaction récente
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 5).map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between rounded-lg border border-border/50 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    transaction.type === "revenu" ? "bg-green-500/10" : "bg-destructive/10"
                  )}>
                    {transaction.type === "revenu" ? (
                      <ArrowUpRight className="h-5 w-5 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-semibold",
                    transaction.type === "revenu" ? "text-green-600" : "text-destructive"
                  )}>
                    {transaction.type === "revenu" ? "+" : "-"}
                    {transaction.amount.toLocaleString("fr-FR")} FCFA
                  </p>
                  {transaction.category && (
                    <Badge variant="secondary" className="text-xs">
                      {transaction.category}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
