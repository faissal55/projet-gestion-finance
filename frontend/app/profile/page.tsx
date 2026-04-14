"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"

interface User {
  id: number
  name: string
  email: string
  company_name?: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [form, setForm] = useState({ name: "", email: "", company_name: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const { toast } = useToast()

  // Charger l'utilisateur depuis l'API
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) { router.push("/login"); return }

    api.defaults.headers.common["Authorization"] = `Bearer ${token}`

    api.get("/user")
      .then((res) => {
        const u = res.data
        setUser(u)
        setForm({ name: u.name ?? "", email: u.email ?? "", company_name: u.company_name ?? "" })
        // Mettre à jour le cache local
        localStorage.setItem("user", JSON.stringify(u))
      })
      .catch(() => {
        router.push("/login")
      })
      .finally(() => setLoading(false))
  }, [router])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = "Le nom est requis"
    if (!form.email) errs.email = "L'email est requis"
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Email invalide"
    return errs
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSaving(true)
    setErrors({})
    try {
      const res = await api.put("/user/profile", {
        name: form.name,
        email: form.email,
        company_name: form.company_name || null,
      })
      const updated = res.data.user
      setUser(updated)
      localStorage.setItem("user", JSON.stringify(updated))
      toast({ title: "Profil mis à jour", description: "Vos informations ont été sauvegardées." })
    } catch (err: any) {
      if (err.response?.status === 422) {
        const serverErrors = err.response.data.errors ?? {}
        const mapped: Record<string, string> = {}
        Object.keys(serverErrors).forEach((k) => { mapped[k] = serverErrors[k][0] })
        setErrors(mapped)
      } else {
        toast({ title: "Erreur", description: "Impossible de mettre à jour le profil.", variant: "destructive" })
      }
    } finally {
      setSaving(false)
    }
  }

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n })
  }

  // Initiales avatar
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?"

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Profil" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-2xl space-y-6">

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <>
                {/* Avatar card */}
                <div className="rounded-xl border border-border bg-card p-6 flex items-center gap-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold shrink-0">
                    {initials}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">{user?.name}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    {user?.company_name && (
                      <p className="text-xs text-muted-foreground mt-0.5">{user.company_name}</p>
                    )}
                  </div>
                </div>

                {/* Edit form */}
                <div className="rounded-xl border border-border bg-card p-6 space-y-5">
                  <h2 className="text-base font-semibold text-foreground">Informations personnelles</h2>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Nom complet</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={update("name")}
                      className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-background text-foreground outline-none transition focus:ring-2 focus:ring-primary/30 ${errors.name ? "border-destructive" : "border-border"}`}
                    />
                    {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Adresse email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={update("email")}
                      className={`w-full rounded-lg border px-3 py-2.5 text-sm bg-background text-foreground outline-none transition focus:ring-2 focus:ring-primary/30 ${errors.email ? "border-destructive" : "border-border"}`}
                    />
                    {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
                  </div>

                  {/* Company */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Entreprise <span className="text-muted-foreground font-normal">(optionnel)</span>
                    </label>
                    <input
                      type="text"
                      value={form.company_name}
                      onChange={update("company_name")}
                      className="w-full rounded-lg border border-border px-3 py-2.5 text-sm bg-background text-foreground outline-none transition focus:ring-2 focus:ring-primary/30"
                    />
                    {errors.company_name && <p className="mt-1 text-xs text-destructive">{errors.company_name}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Enregistrement...
                        </>
                      ) : "Enregistrer les modifications"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
