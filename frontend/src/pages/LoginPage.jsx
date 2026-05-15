import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Crosshair,
} from 'lucide-react'
import useAuth from '../auth/useAuth'
import useI18n from '../i18n/useI18n'
import LangSwitcher from '../components/LangSwitcher'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated } = useAuth()
  const { t } = useI18n()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = location.state?.from?.pathname || '/'

  useEffect(() => {
    if (isAuthenticated) navigate(redirectTo, { replace: true })
  }, [isAuthenticated, navigate, redirectTo])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError(t.login.requireAll)
      return
    }

    setSubmitting(true)
    try {
      const resolved = await login({ username: username.trim(), password, remember })
      toast.success(t.toast.loginSuccess(resolved?.displayName || resolved?.username), {
        id: 'login',
      })
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const status = err?.response?.status
      if (status === 401 || status === 400) {
        setError(t.login.invalidCredentials)
      } else {
        setError(t.login.serviceUnavailable)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const inputBase =
    'h-11 w-full rounded-lg border border-stone-300 bg-white pl-10 pr-3 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-black focus:ring-1 focus:ring-black'

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#F5F1E8]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(120,113,108,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(120,113,108,0.08) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="absolute right-4 top-4 z-10">
        <LangSwitcher />
      </div>

      <main className="relative flex min-h-screen w-full items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px] rounded-2xl bg-white p-10 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-900 text-white">
              <Crosshair className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-semibold tracking-wide text-stone-900">
                WOMS
              </div>
              <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone-400">
                {t.login.appTagline}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h1 className="text-[28px] font-bold leading-tight text-stone-900">
              {t.login.welcome}
            </h1>
            <p className="mt-1.5 text-sm text-stone-500">{t.login.subtitle}</p>
          </div>

          <form className="mt-7 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-username"
                className="text-[13px] font-medium text-stone-700"
              >
                {t.login.usernameLabel}
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.chen@fab2"
                  className={inputBase}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login-password"
                className="text-[13px] font-medium text-stone-700"
              >
                {t.login.passwordLabel}
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputBase} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? t.login.hidePassword : t.login.showPassword
                  }
                  className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-stone-700 select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-stone-300 text-stone-900 focus:ring-stone-500 accent-stone-900"
                />
                {t.login.rememberMe}
              </label>
              <a
                href="#"
                className="text-sm font-medium text-stone-700 underline underline-offset-2 hover:text-stone-900"
              >
                {t.login.forgotPassword}
              </a>
            </div>

            <div
              className="min-h-[44px]"
              role="alert"
              aria-live="polite"
            >
              {error ? (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <span className="leading-snug">{error}</span>
                </div>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-stone-900 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? t.login.signingIn : t.login.signIn}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>

            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.12em] text-stone-400">
              <span className="h-px flex-1 bg-stone-200" />
              {t.login.or}
              <span className="h-px flex-1 bg-stone-200" />
            </div>

            <button
              type="button"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white text-sm font-medium text-stone-800 transition hover:bg-stone-50"
            >
              <Lock className="h-4 w-4" />
              {t.login.continueSso}
            </button>
          </form>
        </div>
      </main>

      <footer className="relative flex items-center justify-between px-8 pb-6 text-[12px] text-stone-400">
        <div className="font-mono">v2.4.1 · Fab 2 cluster</div>
        <div>
          {t.login.copyright(new Date().getFullYear())} · {t.login.needHelp}{' '}
          <a
            href="#"
            className="text-stone-600 underline underline-offset-2 hover:text-stone-900"
          >
            {t.login.contactIt}
          </a>
        </div>
      </footer>
    </div>
  )
}
