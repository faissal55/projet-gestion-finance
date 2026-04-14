"use client"

import { useState } from "react"
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

interface InvoiceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: InvoiceFormData) => void
}

export interface InvoiceFormData {
  client_name: string
  amount: number
  due_date: string
  status: "en_attente" | "payee" | "en_retard"
  description: string
}

export function InvoiceForm({ open, onOpenChange, onSubmit }: InvoiceFormProps) {
  const [clientName, setClientName] = useState("")
  const [amount, setAmount] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [status, setStatus] = useState<"en_attente" | "payee" | "en_retard">("en_attente")
  const [description, setDescription] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      client_name: clientName,
      amount: parseFloat(amount),
      due_date: dueDate,
      status,
      description
    })
    // Reset form
    setClientName("")
    setAmount("")
    setDueDate("")
    setStatus("en_attente")
    setDescription("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouvelle Facture</DialogTitle>
          <DialogDescription>
            Enregistrez une nouvelle facture client
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="client_name">Nom du client</Label>
              <Input
                id="client_name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Entreprise ABC"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Montant (FCFA)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Date d&apos;echeance</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as "en_attente" | "payee" | "en_retard")}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="payee">Payee</SelectItem>
                  <SelectItem value="en_retard">En retard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description de la facture..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
