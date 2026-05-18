import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ShieldCheck, ShieldAlert, ArrowLeft, Lock } from 'lucide-react'
import TopNav from '../components/TopNav'
import Spinner from '../components/createOrder/Spinner'
import useAuth from '../auth/useAuth'
import useI18n from '../i18n/useI18n'
import { listUsers, updateUserRole } from '../api/userApi'

const ROLE_BADGE = {
  SUPER_ADMIN:
    'inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[12px] font-semibold text-amber-800',
  ADMIN:
    'inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-[12px] font-semibold text-sky-800',
  VIEWER:
    'inline-flex items-center gap-1 rounded-full bg-stone-200/80 px-2.5 py-0.5 text-[12px] font-semibold text-stone-700',
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function UserAdminPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useI18n()
  const isSuper = user?.role === 'SUPER_ADMIN'

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [pendingId, setPendingId] = useState(null)

  useEffect(() => {
    if (!isSuper) return
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    listUsers()
      .then((data) => {
        if (!cancelled) setUsers(data)
      })
      .catch(() => {
        if (!cancelled) setLoadError(t.userAdmin.loadError)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isSuper, t])

  const sorted = useMemo(() => {
    const priority = { SUPER_ADMIN: 0, ADMIN: 1, VIEWER: 2 }
    return [...users].sort((a, b) => {
      const r = (priority[a.role] ?? 99) - (priority[b.role] ?? 99)
      if (r !== 0) return r
      return a.username.localeCompare(b.username)
    })
  }, [users])

  const handleChangeRole = useCallback(
    async (target, nextRole) => {
      if (target.role === 'SUPER_ADMIN') return
      setPendingId(target.id)
      try {
        await updateUserRole(target.id, nextRole)
        setUsers((prev) =>
          prev.map((u) => (u.id === target.id ? { ...u, role: nextRole } : u)),
        )
        const name = target.displayName || target.username
        if (nextRole === 'ADMIN') {
          toast.success(t.userAdmin.toast.promoteSuccess(name), {
            id: `user-${updated.id}`,
          })
        } else {
          toast.success(t.userAdmin.toast.demoteSuccess(name), {
            id: `user-${updated.id}`,
          })
        }
      } catch {
        toast.error(t.userAdmin.toast.updateError, {
          id: `user-${target.id}`,
        })
      } finally {
        setPendingId(null)
      }
    },
    [t],
  )

  if (!isSuper) {
    return (
      <div className="min-h-screen w-full bg-[#F5F1E8]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-8 py-7">
          <TopNav />
          <div className="mt-12 mx-auto flex max-w-[440px] flex-col items-center gap-4 rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-[18px] font-semibold text-stone-900">
                {t.userAdmin.forbiddenTitle}
              </h1>
              <p className="mt-2 text-[13px] text-stone-500">
                {t.userAdmin.forbiddenBody}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-stone-900 px-4 text-sm font-medium text-white hover:bg-stone-800 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.userAdmin.backToOrders}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#F5F1E8]">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-8 py-7">
        <TopNav />
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-bold leading-tight text-stone-900">
              {t.userAdmin.title}
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              {t.userAdmin.subtitle}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-stone-200/70 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="grid grid-cols-[180px_1fr_140px_140px_220px] items-center border-b border-stone-200/70 bg-[#EFEAE0]/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
            <span>{t.userAdmin.columns.username}</span>
            <span>{t.userAdmin.columns.displayName}</span>
            <span>{t.userAdmin.columns.role}</span>
            <span>{t.userAdmin.columns.createdAt}</span>
            <span className="text-right">{t.userAdmin.columns.actions}</span>
          </div>

          {loading ? (
            <div className="flex h-32 items-center justify-center text-sm text-stone-400">
              <Spinner className="mr-2 h-4 w-4" />
              {t.common.submitting}
            </div>
          ) : loadError ? (
            <div className="flex h-32 items-center justify-center text-sm text-red-500">
              {loadError}
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-stone-400">
              {t.userAdmin.empty}
            </div>
          ) : (
            sorted.map((u) => {
              const isSelf = user?.username === u.username
              const isLocked = u.role === 'SUPER_ADMIN'
              const isPending = pendingId === u.id
              const nextRole = u.role === 'ADMIN' ? 'VIEWER' : 'ADMIN'
              const actionLabel =
                u.role === 'ADMIN'
                  ? t.userAdmin.actions.demote
                  : t.userAdmin.actions.promote
              return (
                <div
                  key={u.id}
                  className="grid grid-cols-[180px_1fr_140px_140px_220px] items-center border-b border-stone-100 px-4 py-3 last:border-b-0 hover:bg-stone-50/50"
                >
                  <span className="text-[13px] font-medium text-stone-900">
                    {u.username}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-stone-800">
                      {u.displayName || u.username}
                    </span>
                    {isSelf ? (
                      <span className="rounded-full bg-stone-200/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-600">
                        {t.userAdmin.badgeSelf}
                      </span>
                    ) : null}
                  </div>
                  <span className={ROLE_BADGE[u.role] ?? ROLE_BADGE.VIEWER}>
                    {u.role === 'SUPER_ADMIN' ? (
                      <ShieldCheck className="h-3 w-3" />
                    ) : u.role === 'ADMIN' ? (
                      <ShieldAlert className="h-3 w-3" />
                    ) : null}
                    {t.userAdmin.roleLabels[u.role] ?? u.role}
                  </span>
                  <span className="text-[13px] text-stone-500">
                    {formatDate(u.createdAt)}
                  </span>
                  <div className="flex items-center justify-end">
                    {isLocked ? (
                      <span className="inline-flex items-center gap-1 text-[12px] text-stone-400">
                        <Lock className="h-3.5 w-3.5" />
                        {t.userAdmin.superLocked}
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleChangeRole(u, nextRole)}
                        className={
                          u.role === 'ADMIN'
                            ? 'inline-flex h-8 items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 text-[12px] font-medium text-stone-700 hover:bg-stone-50 transition disabled:cursor-not-allowed disabled:opacity-60'
                            : 'inline-flex h-8 items-center gap-1.5 rounded-md bg-stone-900 px-3 text-[12px] font-medium text-white hover:bg-stone-800 transition disabled:cursor-not-allowed disabled:opacity-60'
                        }
                      >
                        {isPending ? (
                          <>
                            <Spinner className="h-3.5 w-3.5" />
                            {t.userAdmin.actions.pending}
                          </>
                        ) : (
                          actionLabel
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
