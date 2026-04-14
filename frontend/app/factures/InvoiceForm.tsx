"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import type { Invoice } from "@/lib/types"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface InvoiceFormData {
  client_name: string
  amount: number
  due_date: string
  status: "en_attente" | "payee" | "en_retard"
  description?: string
}

export interface InvoiceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** onSubmit doit throw en cas d'erreur pour garder le formulaire ouvert */
  onSubmit: (data: InvoiceFormData) => Promise<void>
  invoice?: Invoice | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toInputDate(dateStr: string): string {
  if (!dateStr) return ""
  // Gère "2024-12-31" ou "2024-12-31T00:00:00.000000Z"
  return dateStr.split("T")[0]
}

// ─── Component ───────────────────────────────────────────────────────────────

export const InvoiceForm = ({
  open,
  onOpenChange,
  onSubmit,
  invoice,
}: InvoiceFormProps) => {
  const [clientName, setClientName]   = useState("")
  const [amount, setAmount]           = useState<number | "">("")
  const [dueDate, setDueDate]         = useState("")
  const [status, setStatus]           = useState<InvoiceFormData["status"]>("en_attente")
  const [description, setDescription] = useState("")
  const [loading, setLoading]         = useState(false)
  const [errors, setErrors]           = useState<Partial<Record<keyof InvoiceFormData, string>>>({})

  // Pré-remplit le formulaire en mode édition, reset en mode création
  useEffect(() => {
    if (open) {
      if (invoice) {
        setClientName(invoice.client_name)
        setAmount(invoice.amount)
        setDueDate(toInputDate(invoice.due_date))
        setStatus(invoice.status)
        setDescription(invoice.description ?? "")
      } else {
        setClientName("")
        setAmount("")
        setDueDate("")
        setStatus("en_attente")
        setDescription("")
      }
      setErrors({})
    }
  }, [invoice, open])

  // ── Validation côté client ──

  const validate = (): boolean => {
    const newErrors: typeof errors = {}
    if (!clientName.trim()) newErrors.client_name = "Le nom du client est requis"
    if (amount === "" || Number(amount) <= 0)
      newErrors.amount = "Le montant doit être supérieur à 0"
    if (!dueDate) newErrors.due_date = "La date d'échéance est requise"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ── Submit ──

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await onSubmit({
        client_name: clientName.trim(),
        amount: Number(amount),
        due_date: dueDate,
        status,
        description: description.trim() || undefined,
      })
      // Si onSubmit ne throw pas → succès → le parent ferme le dialog
    } catch {
      // onSubmit a throw → on garde le formulaire ouvert (toast géré par le parent)
    } finally {
      setLoading(false)
    }
  }

  // ── Render ──

  const isEditing = Boolean(invoice)

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier la facture" : "Nouvelle facture"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Nom du client */}
          <div className="grid gap-1.5">
            <Label htmlFor="client_name">Nom du client</Label>
            <Input
              id="client_name"
              placeholder="ex. Acme Corp"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              disabled={loading}
              className={errors.client_name ? "border-destructive" : ""}
            />
            {errors.client_name && (
              <p className="text-xs text-destructive">{errors.client_name}</p>
            )}
          </div>

          {/* Montant */}
          <div className="grid gap-1.5">
            <Label htmlFor="amount">Montant (FCFA)</Label>
            <Input
              id="amount"
              type="number"
              min={0}
              placeholder="ex. 150000"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value === "" ? "" : Number(e.target.value))
              }
              disabled={loading}
              className={errors.amount ? "border-destructive" : ""}
            />
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount}</p>
            )}
          </div>

          {/* Échéance */}
          <div className="grid gap-1.5">
            <Label htmlFor="due_date">Date d'échéance</Label>
            <Input
              id="due_date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={loading}
              className={errors.due_date ? "border-destructive" : ""}
            />
            {errors.due_date && (
              <p className="text-xs text-destructive">{errors.due_date}</p>
            )}
          </div>

          {/* Statut */}
          <div className="grid gap-1.5">
            <Label>Statut</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as InvoiceFormData["status"])}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="payee">Payée</SelectItem>
                <SelectItem value="en_retard">En retard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="grid gap-1.5">
            <Label htmlFor="description">Description (optionnelle)</Label>
            <Input
              id="description"
              placeholder="ex. Prestation de services — mars 2026"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Modification..." : "Création..."}
              </>
            ) : isEditing ? "Modifier" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
