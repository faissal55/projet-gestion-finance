"use client"

import { Bell, User, LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState, useCallback } from "react"

interface AppHeaderProps {
  title: string
}

interface Alert {
  id: number
  type: string
  message: string
  severity: "info" | "warning" | "critical"
  is_read: boolean
  created_at: string
}

export function AppHeader({ title }: AppHeaderProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [userName, setUserName]   = useState<string>("")
  const [alerts, setAlerts]       = useState<Alert[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // ── Charger les alertes réelles depuis l'API ──
  const loadAlerts = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ""
      const res = await fetch(`${BASE_URL}/alerts?per_page=20&is_read=false`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) return

      const json = await res.json()
      // Laravel paginator → { data: [...] } ou tableau direct
      const data: Alert[] = Array.isArray(json) ? json : (json?.data ?? [])
      setAlerts(data)
      setUnreadCount(data.filter((a) => !a.is_read).length)
    } catch {
      // non-bloquant
    }
  }, [])

  // ── Charger le nom utilisateur depuis localStorage ──
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user")
      if (stored) {
        const user = JSON.parse(stored)
        setUserName(user.name ?? "")
      }
    } catch {}
  }, [])

  // ── Charger les alertes au montage ──
  useEffect(() => { loadAlerts() }, [loadAlerts])

  // ── Logout ──
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token")
      if (token) {
        await api.post("/logout", {}, {
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
    } finally {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      delete api.defaults.headers.common["Authorization"]
      toast({ title: "Déconnexion réussie", description: "À bientôt !" })
      window.location.href = "/login"
    }
  }

  // ── Couleur selon sévérité ──
  const severityDot = (severity: Alert["severity"]) => {
    if (severity === "critical") return "bg-destructive"
    if (severity === "warning")  return "bg-amber-500"
    return "bg-primary"
  }

  // ── Initiales avatar ──
  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?"

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <DropdownMenu onOpenChange={(open) => { if (open) loadAlerts() }}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground font-medium">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs font-normal text-muted-foreground">
                  {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {alerts.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                Aucune nouvelle notification
              </div>
            ) : (
              alerts.slice(0, 4).map((alert) => (
                <DropdownMenuItem
                  key={alert.id}
                  className="flex items-start gap-2 p-3"
                  onClick={() => router.push("/alerts")}
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${severityDot(alert.severity)}`} />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium leading-snug line-clamp-2">
                      {alert.message}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center font-medium text-primary cursor-pointer"
              onClick={() => router.push("/alerts")}
            >
              Voir toutes les alertes →
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName || "Utilisateur"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="mr-2 h-4 w-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
