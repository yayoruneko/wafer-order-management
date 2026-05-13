import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'
import TopNav from '../components/TopNav'
import { HeaderCell } from '../components/orders/Cell'
import OrderRow from '../components/orders/OrderRow'
import OrderConflictAccordion from '../components/orders/OrderConflictAccordion'
import OrderSlotsAccordion from '../components/orders/OrderSlotsAccordion'
import OrderFilters from '../components/orders/OrderFilters'
import PageBtn from '../components/orders/PageBtn'
import StatsCards from '../components/orders/StatsCards'
import FilterTabs from '../components/orders/FilterTabs'
import BulkActionBar from '../components/orders/BulkActionBar'
import DensityToggle from '../components/orders/DensityToggle'
import SortableHeader from '../components/orders/SortableHeader'
import Checkbox from '../components/orders/Checkbox'
import CancelOrderDialog from '../components/orders/CancelOrderDialog'
import useOrders from '../hooks/useOrders'
import useI18n from '../i18n/useI18n'
import {
  colWidths,
  densityHeader,
  styles,
} from '../styles/orderListStyles'

function buildPageWindow(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, current, current - 1, current + 1])
  const ordered = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out = []
  for (let i = 0; i < ordered.length; i++) {
    const p = ordered[i]
    const prev = ordered[i - 1]
    if (i > 0 && p - prev > 1) out.push(`gap-${prev}`)
    out.push(p)
  }
  return out
}

export default function OrderListPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const {
    orders,
    total,
    filteredTotal,
    page,
    pageSize,
    totalPages,
    stats,
    viewCounts,
    view,
    changeView,
    sortField,
    sortDir,
    toggleSort,
    selectedIds,
    selectedOrders,
    selectedCount,
    pageAllSelected,
    pageSomeSelected,
    toggleSelect,
    toggleSelectAllOnPage,
    clearSelection,
    cancelSelected,
    exportSelected,
    updateOrderField,
    density,
    setDensity,
    search,
    reset,
    goPage,
    prevPage,
    nextPage,
  } = useOrders()

  const tabs = useMemo(
    () => [
      { id: 'all', label: t.orderList.tabs.all, count: viewCounts.all },
      { id: 'delayed', label: t.orderList.tabs.delayed, count: viewCounts.delayed },
      {
        id: 'in_production',
        label: t.orderList.tabs.in_production,
        count: viewCounts.in_production,
      },
      { id: 'mine', label: t.orderList.tabs.mine, count: viewCounts.mine },
    ],
    [viewCounts, t],
  )

  const handleEdit = useCallback(
    (order) => navigate(`/orders/${order.id}/edit`),
    [navigate],
  )

  const [confirmState, setConfirmState] = useState(null)
  const [expandedIds, setExpandedIds] = useState(() => new Set())

  const toggleExpand = useCallback((id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleReviewDelay = useCallback(
    (order) => navigate(`/orders/${order.id}/edit`),
    [navigate],
  )

  const handleNotifyCustomer = useCallback(
    (order) => {
      toast.success(t.toast.notifiedCustomer(order.customerName, order.id), {
        id: `notify-${order.id}`,
      })
    },
    [t],
  )

  const cancelOrderImmediate = useCallback(
    (order) => {
      updateOrderField(order.id, { status: 'CANCELLED' })
      toast.success(t.toast.cancelOrderSuccess(order.id), {
        id: `cancel-${order.id}`,
      })
    },
    [updateOrderField, t],
  )

  const handleCancel = useCallback(
    (order) => {
      if (order.status === 'IN_PRODUCTION') {
        setConfirmState({ mode: 'single', order })
        return
      }
      cancelOrderImmediate(order)
    },
    [cancelOrderImmediate],
  )

  const handleCancelSelected = useCallback(() => {
    const n = selectedCount
    if (!n) return
    const inProd = selectedOrders.filter((o) => o.status === 'IN_PRODUCTION')
    if (inProd.length > 0) {
      setConfirmState({
        mode: 'bulk',
        inProductionOrders: inProd,
        totalSelected: n,
      })
      return
    }
    cancelSelected()
    toast.success(t.toast.bulkCancelSuccess(n), { id: 'bulk-cancel' })
  }, [cancelSelected, selectedCount, selectedOrders, t])

  const closeConfirm = useCallback(() => setConfirmState(null), [])

  const confirmCancel = useCallback(() => {
    if (!confirmState) return
    if (confirmState.mode === 'single') {
      cancelOrderImmediate(confirmState.order)
    } else {
      cancelSelected()
      toast.success(t.toast.bulkCancelSuccess(confirmState.totalSelected), {
        id: 'bulk-cancel',
      })
    }
    setConfirmState(null)
  }, [confirmState, cancelOrderImmediate, cancelSelected, t])

  const pageWindow = useMemo(
    () => buildPageWindow(page, totalPages),
    [page, totalPages],
  )

  const handleExportSelected = useCallback(() => {
    const n = selectedCount
    if (!n) {
      toast.error(t.toast.exportEmpty, { id: 'export' })
      return
    }
    exportSelected()
    toast.success(t.toast.exportSuccess(n), { id: 'export' })
  }, [exportSelected, selectedCount, t])

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <TopNav />
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.pageTitle}>{t.orderList.title}</h1>
            <p className={styles.pageSubtitle}>{t.orderList.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className={styles.primaryBtn}
              onClick={() => navigate('/orders/new')}
            >
              <Plus className={styles.plusIcon} />
              {t.orderList.createOrder}
            </button>
          </div>
        </div>

        <StatsCards
          total={stats.total}
          inProduction={stats.inProduction}
          delayed={stats.delayed}
          totalWafers={stats.totalWafers}
        />

        <FilterTabs tabs={tabs} activeId={view} onChange={changeView} />

        <OrderFilters onSearch={search} onReset={reset} />

        {selectedCount > 0 ? (
          <BulkActionBar
            count={selectedCount}
            onCancelSelected={handleCancelSelected}
            onExportSelected={handleExportSelected}
            onClear={clearSelection}
          />
        ) : (
          <div className="flex items-center justify-end">
            <DensityToggle value={density} onChange={setDensity} />
          </div>
        )}

        <div className={styles.tableWrap}>
          <div className={styles.tableBox}>
            <div
              className={`${styles.tableHeader} ${densityHeader[density]}`}
            >
              <HeaderCell className={`${colWidths.select} justify-center`}>
                <Checkbox
                  checked={pageAllSelected}
                  indeterminate={pageSomeSelected}
                  onChange={toggleSelectAllOnPage}
                  ariaLabel={t.orderList.selectAllOnPage}
                />
              </HeaderCell>
              <HeaderCell className={colWidths.id}>
                <SortableHeader
                  field="id"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={toggleSort}
                >
                  {t.orderList.columns.id}
                </SortableHeader>
              </HeaderCell>
              <HeaderCell className={colWidths.customer}>
                <SortableHeader
                  field="customerName"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={toggleSort}
                >
                  {t.orderList.columns.customer}
                </SortableHeader>
              </HeaderCell>
              <HeaderCell className={colWidths.qty}>
                <SortableHeader
                  field="qty"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={toggleSort}
                >
                  {t.orderList.columns.qty}
                </SortableHeader>
              </HeaderCell>
              <HeaderCell className={colWidths.status}>
                <SortableHeader
                  field="status"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={toggleSort}
                >
                  {t.orderList.columns.status}
                </SortableHeader>
              </HeaderCell>
              <HeaderCell className={colWidths.due}>
                <SortableHeader
                  field="dueDate"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={toggleSort}
                >
                  {t.orderList.columns.due}
                </SortableHeader>
              </HeaderCell>
              <HeaderCell className={colWidths.exp}>
                <SortableHeader
                  field="expected"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={toggleSort}
                >
                  {t.orderList.columns.expected}
                </SortableHeader>
              </HeaderCell>
              <HeaderCell className={colWidths.schedule}>
                <SortableHeader
                  field="delayedDays"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={toggleSort}
                >
                  {t.orderList.columns.schedule}
                </SortableHeader>
              </HeaderCell>
              <HeaderCell className={colWidths.actions}>
                <SortableHeader>{t.orderList.columns.actions}</SortableHeader>
              </HeaderCell>
            </div>

            {orders.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-stone-400">
                {t.orderList.emptyResults}
              </div>
            ) : (
              orders.map((o) => {
                const isCancelled = o.status === 'CANCELLED'
                const isDelayed = o.delayedDays > 0 && !isCancelled
                const isExpanded = expandedIds.has(o.id)
                const canExpand = !isCancelled
                return (
                  <div key={o.id} id={`conflict-${o.id}`}>
                    <OrderRow
                      order={o}
                      density={density}
                      selected={selectedIds.has(o.id)}
                      onToggleSelect={toggleSelect}
                      onEdit={handleEdit}
                      onCancel={handleCancel}
                      onUpdateField={updateOrderField}
                      expanded={isExpanded}
                      onToggleExpand={canExpand ? toggleExpand : undefined}
                    />
                    {canExpand && isExpanded ? (
                      <div id={`slots-${o.id}`}>
                        <OrderSlotsAccordion order={o} />
                        {isDelayed ? (
                          <OrderConflictAccordion
                            order={o}
                            onReviewDelay={handleReviewDelay}
                            onNotifyCustomer={handleNotifyCustomer}
                          />
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )
              })
            )}

            <div className={styles.footer}>
              <span className={styles.footerText}>
                {t.orderList.showing(
                  orders.length === 0 ? 0 : (page - 1) * pageSize + 1,
                  (page - 1) * pageSize + orders.length,
                  filteredTotal,
                  total,
                )}
              </span>
              <div className={styles.pagerBox}>
                <PageBtn
                  onClick={prevPage}
                  disabled={page <= 1}
                  ariaLabel={t.orderList.prevPageAria}
                >
                  {t.orderList.prev}
                </PageBtn>
                {pageWindow.map((item) =>
                  typeof item === 'number' ? (
                    <PageBtn
                      key={item}
                      active={item === page}
                      onClick={() => goPage(item)}
                      ariaLabel={t.orderList.pageAria(item)}
                    >
                      {item}
                    </PageBtn>
                  ) : (
                    <span
                      key={item}
                      className="inline-flex h-8 min-w-8 items-center justify-center px-1 text-xs text-stone-400"
                      aria-hidden="true"
                    >
                      …
                    </span>
                  ),
                )}
                <PageBtn
                  onClick={nextPage}
                  disabled={page >= totalPages}
                  ariaLabel={t.orderList.nextPageAria}
                >
                  {t.orderList.next}
                </PageBtn>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CancelOrderDialog
        open={!!confirmState}
        mode={confirmState?.mode || 'single'}
        order={confirmState?.order || null}
        inProductionOrders={confirmState?.inProductionOrders || []}
        totalSelected={confirmState?.totalSelected || 0}
        onClose={closeConfirm}
        onConfirm={confirmCancel}
      />
    </div>
  )
}
