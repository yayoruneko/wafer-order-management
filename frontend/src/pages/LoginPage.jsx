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
  const isDemo = import.meta.env.VITE_USE_MOCK_AUTH !== 'false'

  const quickLogin = async (uname) => {
    setError('')
    setSubmitting(true)
    try {
      const resolved = await login({
        username: uname,
        password: 'demo',
        remember,
      })
      toast.success(
        t.toast.loginSuccess(resolved?.displayName || resolved?.username),
        { id: 'login' },
      )
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const status = err?.response?.status
      setError(
        status === 401 || status === 400
          ? t.login.invalidCredentials
          : t.login.serviceUnavailable,
      )
    } finally {
      setSubmitting(false)
    }
  }

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
                title={t.login.demoOnly}
                onClick={(e) => e.preventDefault()}
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
              onClick={() => {
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
                window.location.href = `${baseUrl}/oauth2/authorization/google`;
              }}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white text-[13px] font-semibold text-stone-700 transition hover:bg-stone-50 hover:border-stone-400"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {t.login.continueSso}
            </button>
            {isDemo ? (
              <div className="mt-1 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-3">
                <div className="text-[12px] font-semibold text-stone-700">
                  {t.login.demo.title}
                </div>
                <div className="mt-0.5 text-[11px] text-stone-500">
                  {t.login.demo.note}
                </div>
                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  {[
                    { u: 'super', label: t.login.demo.super },
                    { u: 'admin', label: t.login.demo.admin },
                    { u: 'viewer', label: t.login.demo.viewer },
                  ].map(({ u, label }) => (
                    <button
                      key={u}
                      type="button"
                      disabled={submitting}
                      onClick={() => quickLogin(u)}
                      className="inline-flex h-9 flex-col items-center justify-center rounded-md border border-stone-300 bg-white px-2 text-[12px] font-medium text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {label}
                      <span className="font-mono text-[10px] text-stone-400">
                        {u}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </form>
        </div>
      </main>

      <footer className="relative flex items-center justify-between px-8 pb-6 text-[12px] text-stone-400">
        <div className="font-mono">v2.4.1 · Fab 2 cluster</div>
        <div>
          {t.login.copyright(new Date().getFullYear())} · {t.login.needHelp}{' '}
          <a
            href="#"
            title={t.login.demoOnly}
            onClick={(e) => e.preventDefault()}
            className="text-stone-600 underline underline-offset-2 hover:text-stone-900"
          >
            {t.login.contactIt}
          </a>
        </div>
      </footer>
    </div>
  )
}
