"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const validate = () => {
    const newErrors: typeof errors = {}
    if (!email) newErrors.email = "L'email est requis"
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email invalide"
    if (!password) newErrors.password = "Le mot de passe est requis"
    return newErrors
  }

  const handleLogin = async () => {
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setLoading(true)
    setErrors({})
    try {
      const res = await api.post("/login", { email, password })
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
          email: serverErrors.email?.[0],
          general: serverErrors.email?.[0] || "Les identifiants sont incorrects.",
        })
      } else if (err.response?.status === 401) {
        setErrors({ general: "Email ou mot de passe incorrect." })
      } else {
        setErrors({ general: "Une erreur est survenue. Veuillez réessayer." })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin()
  }

  return (
    <div className="relative min-h-screen flex font-sans overflow-hidden">

      {/* ── Image de fond plein écran ── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/acceuil.png')" }}
      />

      {/* ── Dégradé par-dessus l'image pour assombrir et créer de la profondeur ── */}
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

      {/* ── Contenu splitté : gauche branding / droite formulaire ── */}
      <div className="relative z-10 flex w-full">

        {/* ── Côté gauche : branding (visible sur grands écrans) ── */}
        <div className="hidden lg:flex flex-col justify-between w-1/2 p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">FinanceApp</span>
          </div>

          {/* Tagline centrale */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/70 text-xs font-medium">Gestion financière simplifiée</span>
            </div>
            <h2 className="text-4xl font-bold text-white leading-tight">
              Prenez le contrôle<br />
              de vos <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">finances</span>
            </h2>
            <p className="text-white/50 text-base leading-relaxed max-w-sm">
              Suivez vos transactions, gérez vos factures et analysez vos dépenses en temps réel.
            </p>
          </div>

          {/* Stats bas de page */}
          <div className="flex gap-8">
            {[
              { value: "100%", label: "Sécurisé" },
              { value: "24/7", label: "Disponible" },
              { value: "∞", label: "Transactions" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-white font-bold text-xl">{stat.value}</p>
                <p className="text-white/40 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Côté droit : formulaire ── */}
        <div className="flex flex-1 lg:w-1/2 items-center justify-center p-6">
          <div className="w-full max-w-md">

            {/* Logo mobile */}
            <div className="flex lg:hidden items-center gap-2 justify-center mb-8">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-white font-bold tracking-tight">FinanceApp</span>
            </div>

            {/* Card glassmorphism */}
            <div className="bg-white/8 border border-white/12 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl shadow-black/40">

              {/* Header */}
              <div className="mb-7">
                <h1 className="text-2xl font-bold text-white tracking-tight">Bienvenue 👋</h1>
                <p className="text-white/40 text-sm mt-1">Connectez-vous à votre espace financier</p>
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

              {/* Fields */}
              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-white/50 text-xs font-semibold mb-2 uppercase tracking-widest">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined, general: undefined })) }}
                    onKeyDown={handleKeyDown}
                    placeholder="vous@exemple.com"
                    className={`w-full bg-white/6 border rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm outline-none transition-all duration-200
                      focus:bg-white/10 focus:border-violet-500/70 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15)]
                      ${errors.email ? "border-red-500/50 bg-red-500/5" : "border-white/12 hover:border-white/20"}`}
                  />
                  {errors.email && <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1"><span>⚠</span>{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-white/50 text-xs font-semibold mb-2 uppercase tracking-widest">Mot de passe</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined, general: undefined })) }}
                      onKeyDown={handleKeyDown}
                      placeholder="••••••••"
                      className={`w-full bg-white/6 border rounded-xl px-4 py-3 pr-11 text-white placeholder-white/20 text-sm outline-none transition-all duration-200
                        focus:bg-white/10 focus:border-violet-500/70 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15)]
                        ${errors.password ? "border-red-500/50 bg-red-500/5" : "border-white/12 hover:border-white/20"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? (
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
                  </div>
                  {errors.password && <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1"><span>⚠</span>{errors.password}</p>}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleLogin}
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
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    Se connecter
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

              {/* Register link */}
              <p className="text-center text-white/35 text-sm">
                Pas encore de compte ?{" "}
                <Link href="/register" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors underline underline-offset-2 decoration-violet-500/40 hover:decoration-violet-400">
                  Créer un compte
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
