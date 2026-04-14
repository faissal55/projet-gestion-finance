"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { useEffect, useState } from "react"
import { dashboardApi } from "@/lib/api"
import { Loader2 } from "lucide-react"

interface ChartPoint {
  name: string
  revenus: number
  depenses: number
}

export function RevenueChart() {
  const [data, setData]       = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const raw = await dashboardApi.getChartData()
        const items: ChartPoint[] = (Array.isArray(raw) ? raw : []).map(
          (d: Record<string, unknown>) => ({
            name:     String(d["name"] ?? ""),
            revenus:  Number(d["revenus"]  ?? 0),
            depenses: Number(d["depenses"] ?? 0),
          })
        )
        setData(items)
      } catch (error) {
        console.error("Erreur chargement graphique:", error)
        setData([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <Card className="border-border/50 bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-card-foreground">
          Évolution Revenus vs Dépenses
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            Aucune donnée disponible
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDepenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--color-chart-2)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)"
                  fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)"
                  fontSize={12} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    color: "var(--color-card-foreground)",
                  }}
                  formatter={(value: number) => [`${value.toLocaleString("fr-FR")} FCFA`, ""]}
                />
                <Legend />
                <Area type="monotone" dataKey="revenus"  name="Revenus"
                  stroke="var(--color-chart-1)" strokeWidth={2}
                  fillOpacity={1} fill="url(#colorRevenus)" />
                <Area type="monotone" dataKey="depenses" name="Dépenses"
                  stroke="var(--color-chart-2)" strokeWidth={2}
                  fillOpacity={1} fill="url(#colorDepenses)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
