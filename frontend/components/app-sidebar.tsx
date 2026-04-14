"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ArrowUpDown,
  FileText,
  CreditCard,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Wallet
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Tableau de bord", href: "/", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: ArrowUpDown },
  { name: "Factures", href: "/factures", icon: FileText },
  { name: "Dettes", href: "/dettes", icon: CreditCard },
  { name: "Rapports", href: "/rapports", icon: BarChart3 },
  { name: "Alertes", href: "/alertes", icon: Bell },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
            <Wallet className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">FinanceApp</h1>
            <p className="text-xs text-sidebar-foreground/60">Gestion simplifiee</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
             <div className="border-t border-sidebar-border p-3">
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <Settings className="h-5 w-5" />
            Paramètres
          </Link>
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem("token")
                if (token) {
                  await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/logout`, {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                  })
                }
              } catch (e) {
                // On continue même si l'appel échoue
              } finally {
                localStorage.removeItem("token")
                localStorage.removeItem("user")
                window.location.href = "/login"
              }
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <LogOut className="h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </div>
    </aside>
  )
}

