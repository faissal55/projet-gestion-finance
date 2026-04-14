"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { useEffect, useState } from "react"
import { dashboardApi } from "@/lib/api"
import { Loader2 } from "lucide-react"

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
]

interface CategoryItem {
  name: string
  value: number
}

export function ExpenseChart() {
  const [data, setData]       = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const raw = await dashboardApi.getExpensesByCategory()
        const items: CategoryItem[] = (Array.isArray(raw) ? raw : []).map(
          (item: Record<string, unknown>) => ({
            name:  String(item["category"] ?? item["name"] ?? ""),
            value: Number(item["amount"]   ?? item["value"] ?? 0),
          })
        )
        setData(items.filter((i) => i.value > 0))
      } catch (error) {
        console.error("Erreur chargement catégories:", error)
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
          Répartition des Dépenses
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            Aucune dépense ce mois-ci
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    color: "var(--color-card-foreground)",
                  }}
                  formatter={(value: number) => [
                    `${value.toLocaleString("fr-FR")} FCFA`, ""
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
