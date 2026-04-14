"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Transaction } from "@/lib/types"

export type TransactionFormData = {
  description: string
  amount: number
  category: string
  type: "revenu" | "depense"
  date: string
}

type TransactionFormProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: TransactionFormData) => void | Promise<void>
  transaction?: Transaction | null
}

export function TransactionForm({ open, onOpenChange, onSubmit, transaction }: TransactionFormProps) {
  const [form, setForm] = useState<TransactionFormData>({
    description: "",
    amount: 0,
    category: "",
    type: "depense",
    date: new Date().toISOString().split("T")[0] // format YYYY-MM-DD
  })

  // Pré-remplir le formulaire si on modifie une transaction
  useEffect(() => {
    if (transaction) {
      setForm({
        description: transaction.description || "",
        amount: transaction.amount || 0,
        category: transaction.category || "",
        type: transaction.type || "depense",
        date: transaction.date ? transaction.date.split("T")[0] : new Date().toISOString().split("T")[0]
      })
    } else {
      setForm({
        description: "",
        amount: 0,
        category: "",
        type: "depense",
        date: new Date().toISOString().split("T")[0]
      })
    }
  }, [transaction, open])

  const handleChange = (field: keyof TransactionFormData, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(form)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{transaction ? "Modifier Transaction" : "Nouvelle Transaction"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
          <div>
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={e => handleChange("description", e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Montant</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={e => handleChange("amount", Number(e.target.value))}
              required
            />
          </div>

          <div>
            <Label>Catégorie</Label>
            <Input
              value={form.category}
              onChange={e => handleChange("category", e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Type</Label>
            <Select value={form.type} onValueChange={value => handleChange("type", value as "revenu" | "depense")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenu">Revenu</SelectItem>
                <SelectItem value="depense">Dépense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={form.date}
              onChange={e => handleChange("date", e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">{transaction ? "Modifier" : "Ajouter"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}