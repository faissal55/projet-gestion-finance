"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"

interface PasswordForm {
  current_password: string
  password: string
  password_confirmation: string
}

export default function SettingsPage() {
  const [form, setForm] = useState<PasswordForm>({
    current_password: "",
    password: "",
    password_confirmation: "",
  })
  const [errors, setErrors] = useState<Partial<PasswordForm & { general: string }>>({})
  const [saving, setSaving] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) { router.push("/login"); return }
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`
  }, [router])

  const update = (field: keyof PasswordForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => { const n = { ...prev }; delete n[field]; delete n.general; return n })
  }

  const validate = () => {
    const errs: typeof errors = {}
    if (!form.current_password) errs.current_password = "Mot de passe actuel requis"
    if (!form.password) errs.password = "Nouveau mot de passe requis"
    else if (form.password.length < 8) errs.password = "Minimum 8 caractères"
    if (!form.password_confirmation) errs.password_confirmation = "Confirmation requise"
    else if (form.password !== form.password_confirmation) errs.password_confirmation = "Les mots de passe ne correspondent pas"
    return errs
  }

  const handleSave = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSaving(true)
    setErrors({})
    try {
      await api.put("/user/password", {
        current_password: form.current_password,
        password: form.password,
        password_confirmation: form.password_confirmation,
      })
      setForm({ current_password: "", password: "", password_confirmation: "" })
      toast({ title: "Mot de passe mis à jour", description: "Votre mot de passe a été changé avec succès." })
    } catch (err: any) {
      if (err.response?.status === 422) {
        const serverErrors = err.response.data.errors ?? {}
        const mapped: typeof errors = {}
        Object.keys(serverErrors).forEach((k) => {
          (mapped as any)[k] = serverErrors[k][0]
        })
        setErrors(mapped)
      } else {
        setErrors({ general: "Une erreur est survenue. Veuillez réessayer." })
      }
    } finally {
      setSaving(false)
    }
  }

  // Indicateur de force
  const strength = (() => {
    const p = form.password
    if (!p) return null
    if (p.length < 6) return { label: "Faible", color: "bg-destructive", w: "w-1/4" }
    if (p.length < 8) return { label: "Moyen", color: "bg-yellow-500", w: "w-2/4" }
    if (p.length < 12 || !/[A-Z]/.test(p) || !/[0-9]/.test(p)) return { label: "Bien", color: "bg-blue-500", w: "w-3/4" }
    return { label: "Fort", color: "bg-emerald-500", w: "w-full" }
  })()

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Paramètres" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-2xl space-y-6">

            {/* Password section */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-5">
              <div>
                <h2 className="text-base font-semibold text-foreground">Changer le mot de passe</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Utilisez un mot de passe fort d'au moins 8 caractères.
                </p>
              </div>

              {/* Error banner */}
              {errors.general && (
                <div className="flex items-center gap-3 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
                  <svg className="w-4 h-4 text-destructive shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-destructive">{errors.general}</p>
                </div>
              )}

              {/* Current password */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Mot de passe actuel</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={form.current_password}
                    onChange={update("current_password")}
                    placeholder="••••••••"
                    className={`w-full rounded-lg border px-3 py-2.5 pr-10 text-sm bg-background text-foreground outline-none transition focus:ring-2 focus:ring-primary/30 ${errors.current_password ? "border-destructive" : "border-border"}`}
                  />
                  <EyeBtn show={showCurrent} toggle={() => setShowCurrent(!showCurrent)} />
                </div>
                {errors.current_password && <p className="mt-1 text-xs text-destructive">{errors.current_password}</p>}
              </div>

              {/* New password */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={form.password}
                    onChange={update("password")}
                    placeholder="Minimum 8 caractères"
                    className={`w-full rounded-lg border px-3 py-2.5 pr-10 text-sm bg-background text-foreground outline-none transition focus:ring-2 focus:ring-primary/30 ${errors.password ? "border-destructive" : "border-border"}`}
                  />
                  <EyeBtn show={showNew} toggle={() => setShowNew(!showNew)} />
                </div>
                {strength && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.w}`} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Force : <span className="text-foreground">{strength.label}</span>
                    </p>
                  </div>
                )}
                {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Confirmer le nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={form.password_confirmation}
                    onChange={update("password_confirmation")}
                    placeholder="••••••••"
                    className={`w-full rounded-lg border px-3 py-2.5 pr-10 text-sm bg-background text-foreground outline-none transition focus:ring-2 focus:ring-primary/30 ${errors.password_confirmation ? "border-destructive" : "border-border"}`}
                  />
                  <EyeBtn show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />
                </div>
                {errors.password_confirmation && <p className="mt-1 text-xs text-destructive">{errors.password_confirmation}</p>}
              </div>

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
                      Mise à jour...
                    </>
                  ) : "Mettre à jour le mot de passe"}
                </button>
              </div>
            </div>

       
            

          </div>
        </main>
      </div>
    </div>
  )
}

function EyeBtn({ show, toggle }: { show: boolean; toggle: () => void }) {
  return (
    <button
      type="button"
      onClick={toggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
    >
      {show ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  )
}
