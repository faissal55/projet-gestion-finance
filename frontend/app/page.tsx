"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { ExpenseChart } from "@/components/dashboard/expense-chart"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { AlertsWidget } from "@/components/dashboard/alerts-widget"
import { mockDashboardStats } from "@/lib/mock-data"
import { dashboardApi } from "@/lib/api"
import { api } from "@/lib/api"
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  CreditCard
} from "lucide-react"

export default function HomePage() {
  const [stats, setStats] = useState(mockDashboardStats)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token") // ← clé correcte

    if (!token) {
      router.push("/login")
      return
    }

    // Injecter le token dans axios pour toutes les requêtes
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`

    fetchStats()
  }, [router])

  const fetchStats = async () => {
    try {
      const data = await dashboardApi.getStats()
      setStats({
        total_revenus: data.revenus_mois,
        total_depenses: data.depenses_mois,
        solde_tresorerie: data.solde_actuel,
        factures_en_attente: data.factures_en_attente,
        dettes_actives: data.dettes_actives,
        variation_revenus: data.variation_revenus,
        variation_depenses: data.variation_depenses,
      })
    } catch (error) {
      console.error("Erreur lors du chargement des stats:", error)
      // Garde les mock data en fallback
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="ml-64">
        <AppHeader title="Tableau de bord" />
        <main className="p-6">
          {/* Stats Grid */}
          <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <StatCard
              title="Revenus du mois"
              value={`${stats.total_revenus.toLocaleString("fr-FR")} FCFA`}
              change={stats.variation_revenus}
              icon={TrendingUp}
              variant="success"
            />
            <StatCard
              title="Dépenses du mois"
              value={`${stats.total_depenses.toLocaleString("fr-FR")} FCFA`}
              change={stats.variation_depenses}
              icon={TrendingDown}
              variant="danger"
            />
            <StatCard
              title="Solde Trésorerie"
              value={`${stats.solde_tresorerie.toLocaleString("fr-FR")} FCFA`}
              icon={Wallet}
              variant="default"
            />
            <StatCard
              title="Factures en attente"
              value={`${stats.factures_en_attente.toLocaleString("fr-FR")} FCFA`}
              icon={FileText}
              variant="warning"
            />
            <StatCard
              title="Dettes actives"
              value={`${stats.dettes_actives.toLocaleString("fr-FR")} FCFA`}
              icon={CreditCard}
              variant="danger"
            />
          </div>

          {/* Charts Row */}
          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <RevenueChart />
            <ExpenseChart />
          </div>

          {/* Bottom Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <RecentTransactions />
            <AlertsWidget />
          </div>
        </main>
      </div>
    </div>
  )
}
