"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string
  change?: number
  icon: LucideIcon
  variant?: "default" | "success" | "danger" | "warning"
}

export function StatCard({ title, value, change, icon: Icon, variant = "default" }: StatCardProps) {
  const variantStyles = {
    default: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    danger: "bg-destructive/10 text-destructive",
    warning: "bg-warning/10 text-warning"
  }

  return (
    <Card className="border-border/50 bg-card shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-card-foreground">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1">
                {change >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span
                  className={cn(
                    "text-sm font-medium",
                    change >= 0 ? "text-success" : "text-destructive"
                  )}
                >
                  {change >= 0 ? "+" : ""}{change}%
                </span>
                <span className="text-xs text-muted-foreground">vs mois dernier</span>
              </div>
            )}
          </div>
          <div className={cn("rounded-lg p-3", variantStyles[variant])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
