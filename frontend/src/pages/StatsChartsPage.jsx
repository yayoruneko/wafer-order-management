import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Lock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ComposedChart,
  Area,
  Line,
} from 'recharts'
import TopNav from '../components/TopNav'
import Spinner from '../components/createOrder/Spinner'
import useAuth from '../auth/useAuth'
import useI18n from '../i18n/useI18n'
import useProductionCalendar from '../hooks/useProductionCalendar'
import { getOrders } from '../api/orderApi'

const STATUS_ORDER = [
  'PENDING',
  'SCHEDULED',
  'IN_PRODUCTION',
  'COMPLETED',
  'CANCELLED',
]
const STATUS_COLOR = {
  PENDING: '#a8a29e',
  SCHEDULED: '#0ea5e9',
  IN_PRODUCTION: '#10b981',
  COMPLETED: '#047857',
  CANCELLED: '#ef4444',
}
const DELAY_COLOR = ['#10b981', '#fbbf24', '#f59e0b', '#ef4444']

const card =
  'flex flex-col gap-3 rounded-lg border border-stone-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
const cardTitle = 'text-[14px] font-semibold text-stone-800'

export default function StatsChartsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useI18n()
  const isSuper = user?.role === 'SUPER_ADMIN'

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const {
    monthAnchor,
    monthGrid,
    goToPrevMonth,
    goToNextMonth,
  } = useProductionCalendar()

  useEffect(() => {
    if (!isSuper) return
    let cancelled = false
    getOrders()
      .then(({ data }) => {
        if (!cancelled) setOrders(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isSuper])

  const monthLabel = monthAnchor.toLocaleDateString(
    t.locale,
    t.calendar.monthFormat,
  )

  const statusData = useMemo(() => {
    const counts = {}
    for (const o of orders) counts[o.status] = (counts[o.status] ?? 0) + 1
    return STATUS_ORDER.filter((s) => counts[s] > 0).map((s) => ({
      key: s,
      name: t.statuses[s] ?? s,
      value: counts[s],
    }))
  }, [orders, t])

  const delayData = useMemo(() => {
    const b = { onTime: 0, d1_3: 0, d4_7: 0, d8: 0 }
    for (const o of orders) {
      if (o.status === 'CANCELLED') continue
      const dd = o.delayDays ?? 0
      if (dd <= 0) b.onTime += 1
      else if (dd <= 3) b.d1_3 += 1
      else if (dd <= 7) b.d4_7 += 1
      else b.d8 += 1
    }
    const lb = t.statsCharts.delayBuckets
    return [
      { name: lb.onTime, value: b.onTime },
      { name: lb.d1_3, value: b.d1_3 },
      { name: lb.d4_7, value: b.d4_7 },
      { name: lb.d8, value: b.d8 },
    ]
  }, [orders, t])

  const customerData = useMemo(() => {
    const m = {}
    for (const o of orders) {
      if (o.status === 'CANCELLED') continue
      const name = o.customerName || o.customerCode || '—'
      m[name] = (m[name] ?? 0) + (o.quantity ?? 0)
    }
    return Object.entries(m)
      .map(([name, wafers]) => ({ name, wafers }))
      .sort((a, b) => b.wafers - a.wafers)
      .slice(0, 8)
  }, [orders])

  const creatorData = useMemo(() => {
    const m = {}
    for (const o of orders) {
      const name = o.createdByUsername || t.statsCharts.unassigned
      m[name] = (m[name] ?? 0) + 1
    }
    return Object.entries(m)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [orders, t])

  const trendData = useMemo(
    () =>
      monthGrid
        .filter((c) => c.inMonth)
        .map((c) => ({
          d: c.day,
          used: c.count,
          cap: c.capacity,
          util: Math.round(c.utilization * 100),
        })),
    [monthGrid],
  )

  const nf = useMemo(
    () => new Intl.NumberFormat(t.locale),
    [t.locale],
  )

  if (!isSuper) {
    return (
      <div className="min-h-screen w-full bg-[#F5F1E8]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-8 py-7">
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
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-stone-900 px-4 text-sm font-medium text-white transition hover:bg-stone-800"
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
      <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-8 py-7">
        <TopNav />
        <div>
          <h1 className="text-[28px] font-bold leading-tight text-stone-900">
            {t.statsCharts.title}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {t.statsCharts.subtitle}
          </p>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center gap-2 text-sm text-stone-400">
            <Spinner className="h-4 w-4" />
            {t.statsCharts.loading}
          </div>
        ) : error ? (
          <div className="flex h-64 items-center justify-center text-sm text-red-500">
            {t.statsCharts.loadError}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className={card}>
              <div className={cardTitle}>{t.statsCharts.statusDist}</div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {statusData.map((e) => (
                      <Cell key={e.key} fill={STATUS_COLOR[e.key] ?? '#a8a29e'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => `${nf.format(v)} ${t.statsCharts.ordersUnit}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className={card}>
              <div className="flex items-center justify-between">
                <span className={cardTitle}>{t.statsCharts.dailyUtil}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={goToPrevMonth}
                    aria-label={t.calendar.prevMonthAria}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-stone-200 text-stone-600 transition hover:bg-stone-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="min-w-[110px] text-center text-[13px] font-medium text-stone-700">
                    {monthLabel}
                  </span>
                  <button
                    type="button"
                    onClick={goToNextMonth}
                    aria-label={t.calendar.nextMonthAria}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-stone-200 text-stone-600 transition hover:bg-stone-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="d" tick={{ fontSize: 11 }} />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => nf.format(v)}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="used"
                    name={t.statsCharts.used}
                    stroke="#0ea5e9"
                    fill="#bae6fd"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="cap"
                    name={t.statsCharts.capacity}
                    stroke="#78716c"
                    strokeDasharray="5 4"
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="util"
                    name={t.statsCharts.utilizationPct}
                    stroke="#ef4444"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className={card}>
              <div className={cardTitle}>{t.statsCharts.delayDist}</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={delayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => nf.format(v)}
                  />
                  <Tooltip
                    formatter={(v) => `${nf.format(v)} ${t.statsCharts.ordersUnit}`}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {delayData.map((e, i) => (
                      <Cell key={e.name} fill={DELAY_COLOR[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className={card}>
              <div className={cardTitle}>{t.statsCharts.customerTop}</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={customerData}
                  layout="vertical"
                  margin={{ left: 24 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => nf.format(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(v) => `${nf.format(v)} ${t.statsCharts.wafersUnit}`}
                  />
                  <Bar
                    dataKey="wafers"
                    fill="#0ea5e9"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className={`${card} lg:col-span-2`}>
              <div className={cardTitle}>{t.statsCharts.creatorWorkload}</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={creatorData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => nf.format(v)}
                  />
                  <Tooltip
                    formatter={(v) => `${nf.format(v)} ${t.statsCharts.ordersUnit}`}
                  />
                  <Bar
                    dataKey="value"
                    fill="#44403c"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
