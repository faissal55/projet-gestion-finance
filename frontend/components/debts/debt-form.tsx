"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import type { Debt } from "@/lib/types"

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DebtFormData {
  type:           "payable" | "receivable"   // requis par lib/api.ts
  creditor_name:  string
  amount:         number
  due_date:       string
  status:         "active" | "payee"
  description?:   string
}

export interface DebtFormProps {
  open:           boolean
  onOpenChange:   (open: boolean) => void
  onSubmit:       (data: DebtFormData) => Promise<void>
  debt?:          Debt                        // undefined = création, Debt = édition
}

// ── Component ──────────────────────────────────────────────────────────────────

export function DebtForm({ open, onOpenChange, onSubmit, debt }: DebtFormProps) {
  const isEditing = !!debt

  const [creditorName, setCreditorName] = useState("")
  const [amount,       setAmount]       = useState("")
  const [dueDate,      setDueDate]      = useState("")
  const [type,         setType]         = useState<"payable" | "receivable">("payable")
  const [status,       setStatus]       = useState<"active" | "payee">("active")
  const [description,  setDescription]  = useState("")
  const [loading,      setLoading]      = useState(false)

  // Pré-remplir le formulaire en mode édition
  useEffect(() => {
    if (debt) {
      setCreditorName(debt.creditor_name ?? "")
      setAmount(String(debt.amount ?? ""))
      setDueDate(debt.due_date?.slice(0, 10) ?? "")
      setType((debt as any).type ?? "payable")
      setStatus((debt.status as "active" | "payee") ?? "active")
      setDescription(debt.description ?? "")
    } else {
      setCreditorName("")
      setAmount("")
      setDueDate("")
      setType("payable")
      setStatus("active")
      setDescription("")
    }
  }, [debt, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        type,
        creditor_name: creditorName,
        amount:        parseFloat(amount),
        due_date:      dueDate,
        status,
        description:   description || undefined,
      })
      onOpenChange(false)
    } catch {
      // l'erreur est gérée dans le parent
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier la dette" : "Nouvelle Dette"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations de la dette"
              : "Enregistrez une nouvelle dette ou crédit"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">

            {/* Créancier */}
            <div className="space-y-2">
              <Label htmlFor="creditor_name">Nom du créancier</Label>
              <Input
                id="creditor_name"
                value={creditorName}
                onChange={(e) => setCreditorName(e.target.value)}
                placeholder="Banque Nationale"
                required
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as "payable" | "receivable")}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payable">À payer (dette)</SelectItem>
                  <SelectItem value="receivable">À recevoir (créance)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Montant + Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant (FCFA)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Date d&apos;échéance</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Statut */}
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as "active" | "payee")}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="payee">Payée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description de la dette..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : isEditing ? "Modifier" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
