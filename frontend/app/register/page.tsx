"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"

interface FormErrors {
  name?: string
  email?: string
  password?: string
  password_confirmation?: string
  company_name?: string
  general?: string
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    company_name: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    setErrors(prev => ({ ...prev, [field]: undefined, general: undefined }))
  }

  const validate = (): FormErrors => {
    const errs: FormErrors = {}
    if (!form.name.trim()) errs.name = "Le nom est requis"
    if (!form.email) errs.email = "L'email est requis"
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Email invalide"
    if (!form.password) errs.password = "Le mot de passe est requis"
    else if (form.password.length < 8) errs.password = "Minimum 8 caractères"
    if (!form.password_confirmation) errs.password_confirmation = "Veuillez confirmer le mot de passe"
    else if (form.password !== form.password_confirmation) errs.password_confirmation = "Les mots de passe ne correspondent pas"
    return errs
  }

  const handleRegister = async () => {
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
      }
      if (form.company_name.trim()) payload.company_name = form.company_name.trim()

      const res = await api.post("/register", payload)
      const { token, user } = res.data

      localStorage.clear()
      localStorage.setItem("token", token)
      localStorage.setItem("user", JSON.stringify(user))
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`

      window.location.href = "/"
    } catch (err: any) {
      if (err.response?.status === 422) {
        const serverErrors = err.response.data.errors || {}
        setErrors({
          name: serverErrors.name?.[0],
          email: serverErrors.email?.[0],
          password: serverErrors.password?.[0],
          company_name: serverErrors.company_name?.[0],
          general: !Object.keys(serverErrors).length
            ? "Données invalides. Vérifiez le formulaire."
            : undefined,
        })
      } else {
        setErrors({ general: "Une erreur est survenue. Veuillez réessayer." })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleRegister()
  }

  const passwordStrength = (() => {
    const p = form.password
    if (!p) return null
    if (p.length < 6) return { label: "Faible", color: "bg-red-500", width: "w-1/4" }
    if (p.length < 8) return { label: "Moyen", color: "bg-yellow-500", width: "w-2/4" }
    if (p.length < 12 || !/[A-Z]/.test(p) || !/[0-9]/.test(p)) return { label: "Bien", color: "bg-blue-500", width: "w-3/4" }
    return { label: "Fort", color: "bg-emerald-500", width: "w-full" }
  })()

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 font-sans overflow-hidden">

      {/* ── Image de fond — même que le login ── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/acceuil.png')" }}
      />

      {/* ── Dégradé par-dessus l'image ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-violet-950/60" />

      {/* ── Grain texture subtil ── */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Card glassmorphism — même style que le login */}
        <div className="bg-white/8 border border-white/12 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl shadow-black/40">

          {/* Header */}
          <div className="mb-7">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-white font-bold text-lg tracking-tight">FinanceApp</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Créer un compte</h1>
            <p className="text-white/40 text-sm mt-1">Rejoignez-nous en quelques secondes</p>
          </div>

          {/* Error banner */}
          {errors.general && (
            <div className="mb-5 flex items-center gap-3 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-400 text-sm">{errors.general}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Name */}
            <Field label="Nom complet" error={errors.name}>
              <input
                type="text"
                value={form.name}
                onChange={update("name")}
                onKeyDown={handleKeyDown}
                placeholder="Jean Dupont"
                className={inputClass(!!errors.name)}
              />
            </Field>

            {/* Email */}
            <Field label="Email" error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={update("email")}
                onKeyDown={handleKeyDown}
                placeholder="vous@exemple.com"
                className={inputClass(!!errors.email)}
              />
            </Field>

            {/* Company (optional) */}
            <Field label={<>Entreprise <span className="text-white/20 normal-case font-normal">(optionnel)</span></>}>
              <input
                type="text"
                value={form.company_name}
                onChange={update("company_name")}
                onKeyDown={handleKeyDown}
                placeholder="Nom de votre entreprise"
                className={inputClass(!!errors.company_name)}
              />
            </Field>

            {/* Password */}
            <Field label="Mot de passe" error={errors.password}>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={update("password")}
                  onKeyDown={handleKeyDown}
                  placeholder="Minimum 8 caractères"
                  className={inputClass(!!errors.password) + " pr-11"}
                />
                <EyeToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
              </div>
              {passwordStrength && (
                <div className="mt-2">
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color} ${passwordStrength.width}`} />
                  </div>
                  <p className="text-xs text-white/30 mt-1">Force : <span className="text-white/50">{passwordStrength.label}</span></p>
                </div>
              )}
            </Field>

            {/* Confirm password */}
            <Field label="Confirmer le mot de passe" error={errors.password_confirmation}>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={form.password_confirmation}
                  onChange={update("password_confirmation")}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  className={inputClass(!!errors.password_confirmation) + " pr-11"}
                />
                <EyeToggle show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
              </div>
            </Field>
          </div>

          {/* Submit */}
          <button
            onClick={handleRegister}
            disabled={loading}
            className="mt-6 w-full relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500
              disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl text-sm
              transition-all duration-200 flex items-center justify-center gap-2
              shadow-lg shadow-violet-900/40 hover:shadow-violet-900/60 hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Inscription...
              </>
            ) : (
              <>
                Créer mon compte
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-white/20 text-xs font-medium">ou</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          <p className="text-center text-white/35 text-sm">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors underline underline-offset-2 decoration-violet-500/40 hover:decoration-violet-400">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: React.ReactNode; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-white/50 text-xs font-semibold mb-2 uppercase tracking-widest">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1"><span>⚠</span>{error}</p>}
    </div>
  )
}

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
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

function inputClass(hasError: boolean) {
  return `w-full bg-white/6 border rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm outline-none transition-all duration-200 focus:bg-white/10 focus:border-violet-500/70 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15)] ${hasError ? "border-red-500/50 bg-red-500/5" : "border-white/12 hover:border-white/20"}`
}
