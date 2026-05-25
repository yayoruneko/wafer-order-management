import { memo, useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LogOut,
  ListChecks,
  CalendarDays,
  Users,
  BarChart3,
  Menu,
  X,
} from 'lucide-react'
import useAuth from '../auth/useAuth'
import useI18n from '../i18n/useI18n'
import LangSwitcher from './LangSwitcher'

const itemBase =
  'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition'
const itemActive = 'bg-stone-900 text-white'
const itemIdle = 'text-stone-600 hover:bg-stone-100'

const ROLE_BADGE = {
  SUPER_ADMIN: 'bg-amber-100 text-amber-800',
  ADMIN: 'bg-sky-100 text-sky-800',
  VIEWER: 'bg-stone-200/80 text-stone-600',
}

function TopNavBase() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const navItems = [
    { to: '/', end: true, icon: ListChecks, label: t.nav.orders },
    { to: '/calendar', end: false, icon: CalendarDays, label: t.nav.calendar },
  ]
  if (user?.role === 'SUPER_ADMIN') {
    navItems.push({
      to: '/admin/users',
      end: false,
      icon: Users,
      label: t.nav.users,
    })
    navItems.push({
      to: '/admin/stats',
      end: false,
      icon: BarChart3,
      label: t.nav.stats,
    })
  }

  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t.nav.openMenu}
        aria-expanded={open}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
      >
        <Menu className="h-4 w-4" />
        {t.nav.menu}
      </button>

      <div className="flex items-center gap-3">
        {user ? (
          <span className="flex items-center gap-2 text-sm text-stone-500">
            {user.displayName || user.username}
            {user.role ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  ROLE_BADGE[user.role] ?? ROLE_BADGE.VIEWER
                }`}
              >
                {t.userAdmin.roleLabels[user.role] ?? user.role}
              </span>
            ) : null}
          </span>
        ) : null}
        <LangSwitcher />
        <button
          type="button"
          onClick={() => {
            logout()
            navigate('/login', { replace: true })
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
        >
          <LogOut className="h-4 w-4" />
          {t.nav.signOut}
        </button>
      </div>

      <div
        onClick={close}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-stone-900/30 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        aria-label="Primary"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col gap-1 border-r border-stone-200 bg-white p-4 shadow-xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px] font-semibold uppercase tracking-wider text-stone-400">
            {t.nav.menu}
          </span>
          <button
            type="button"
            onClick={close}
            aria-label={t.nav.closeMenu}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {navItems.map(({ to, end, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={close}
            className={({ isActive }) =>
              `${itemBase} ${isActive ? itemActive : itemIdle}`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </aside>
    </div>
  )
}

export default memo(TopNavBase)
