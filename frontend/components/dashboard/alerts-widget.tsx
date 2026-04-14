"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"

interface Alert {
  id: number
  type: string
  message: string
  severity: "critical" | "warning" | "info"
  is_read: boolean
  created_at: string
}

const severityConfig = {
  critical: { icon: AlertTriangle, className: "bg-destructive/10 text-destructive border-destructive/20" },
  warning:  { icon: AlertCircle,  className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  info:     { icon: Info,         className: "bg-primary/10 text-primary border-primary/20" },
}

export function AlertsWidget() {
  const router = useRouter()
  const [alerts, setAlerts]       = useState<Alert[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading]     = useState(true)

  const loadAlerts = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ""
      const res = await fetch(`${BASE_URL}/alerts?per_page=4`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const json = await res.json()
      const data: Alert[] = Array.isArray(json) ? json : (json?.data ?? [])
      setAlerts(data)
      setUnreadCount(data.filter((a) => !a.is_read).length)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadAlerts() }, [loadAlerts])

  return (
    <Card className="border-border/50 bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-card-foreground">Alertes</CardTitle>
        {unreadCount > 0 && (
          <Badge variant="destructive">{unreadCount} non lue{unreadCount > 1 ? "s" : ""}</Badge>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-sm text-muted-foreground">
            <Info className="mb-2 h-8 w-8 opacity-30" />
            Aucune alerte pour le moment
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const config = severityConfig[alert.severity] ?? severityConfig.info
              const Icon = config.icon
              return (
                <div
                  key={alert.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-opacity hover:opacity-80",
                    config.className,
                    alert.is_read && "opacity-60"
                  )}
                  onClick={() => router.push("/alerts")}
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug line-clamp-2">{alert.message}</p>
                    <p className="mt-1 text-xs opacity-70">
                      {new Date(alert.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        
      </CardContent>
    </Card>
  )
}
