import { memo } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, ListChecks, CalendarDays, Users } from 'lucide-react'
import useAuth from '../auth/useAuth'
import useI18n from '../i18n/useI18n'
import LangSwitcher from './LangSwitcher'

const tabBase =
  'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition'
const tabActive = 'bg-stone-900 text-white'
const tabIdle = 'text-stone-600 hover:bg-stone-100'

function TopNavBase() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { t } = useI18n()

  return (
    <div className="flex items-center justify-between">
      <nav aria-label="Primary" className="flex items-center gap-1">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `${tabBase} ${isActive ? tabActive : tabIdle}`
          }
        >
          <ListChecks className="h-4 w-4" />
          {t.nav.orders}
        </NavLink>
        <NavLink
          to="/calendar"
          className={({ isActive }) =>
            `${tabBase} ${isActive ? tabActive : tabIdle}`
          }
        >
          <CalendarDays className="h-4 w-4" />
          {t.nav.calendar}
        </NavLink>
        {user?.role === 'SUPER_ADMIN' ? (
          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `${tabBase} ${isActive ? tabActive : tabIdle}`
            }
          >
            <Users className="h-4 w-4" />
            {t.nav.users}
          </NavLink>
        ) : null}
      </nav>

      <div className="flex items-center gap-3">
        {user ? (
          <span className="text-sm text-stone-500">
            {user.displayName || user.username}
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
    </div>
  )
}

export default memo(TopNavBase)
