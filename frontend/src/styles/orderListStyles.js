export const statusBadge = {
  IN_PRODUCTION: {
    pill: 'bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  SCHEDULED: {
    pill: 'bg-sky-50 text-sky-700',
    dot: 'bg-sky-500',
  },
  PENDING: {
    pill: 'bg-stone-200/70 text-stone-600',
    dot: 'bg-stone-500',
  },
  COMPLETED: {
    pill: 'bg-emerald-100 text-emerald-800',
    dot: 'bg-emerald-700',
  },
  CANCELLED: {
    pill: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
  },
}

export const colWidths = {
  select: 'w-[44px]',
  id: 'w-[185px]',
  customer: 'w-[200px]',
  qty: 'w-[90px]',
  status: 'w-[140px]',
  due: 'w-[130px]',
  exp: 'w-[130px]',
  schedule: 'w-[120px]',
  createdBy: 'w-[130px]',
  actions: 'w-[100px]',
}

export const styles = {
  page: 'min-h-screen w-full bg-[#F5F1E8]',
  shell: 'mx-auto flex max-w-[1440px] flex-col gap-5 px-8 py-7',

  // Page header
  headerRow: 'flex items-start justify-between',
  pageTitle: 'text-[28px] font-bold leading-tight text-stone-900',
  pageSubtitle: 'mt-1 text-sm text-stone-500',
  primaryBtn:
    'inline-flex h-9 items-center gap-1.5 rounded-md bg-stone-900 px-4 text-sm font-medium text-white hover:bg-stone-800 transition',
  secondaryBtn:
    'inline-flex h-9 items-center rounded-md border border-stone-300 bg-white px-4 text-sm font-medium text-stone-700 hover:bg-stone-50 transition',
  ghostBtn:
    'inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-stone-600 hover:bg-stone-200/60 transition',

  // Stats cards
  statsGrid: 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4',
  statCard:
    'rounded-lg border border-stone-200/70 bg-[#EFEAE0]/60 px-5 py-4',
  statLabel: 'text-[13px] font-medium text-stone-500',
  statValue: 'mt-1 text-[28px] font-semibold leading-none text-stone-900',
  statValueGreen: 'mt-1 text-[28px] font-semibold leading-none text-emerald-700',
  statValueRed: 'mt-1 text-[28px] font-semibold leading-none text-red-600',

  // View tabs
  tabsBar: 'flex items-center gap-1 border-b border-stone-200/70 px-1',
  tabBtn:
    'relative -mb-px inline-flex h-9 items-center px-3 text-sm font-medium text-stone-500 hover:text-stone-800 transition',
  tabBtnActive:
    'relative -mb-px inline-flex h-9 items-center px-3 text-sm font-semibold text-stone-900 border-b-2 border-stone-900',
  tabCount:
    'ml-1.5 inline-flex items-center justify-center rounded-full bg-stone-200/70 px-1.5 py-px text-[11px] font-semibold text-stone-600',
  tabCountActive:
    'ml-1.5 inline-flex items-center justify-center rounded-full bg-stone-900 px-1.5 py-px text-[11px] font-semibold text-white',

  // Filter card
  filterCard:
    'rounded-lg border border-stone-200/70 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
  filterRow: 'flex flex-wrap items-center gap-3',
  filterRowSecond: 'mt-3 flex items-center gap-3',

  // Bulk action bar
  bulkBar:
    'flex items-center justify-between rounded-lg border border-stone-300 bg-stone-900 px-4 py-2.5 text-white shadow-md',
  bulkText: 'text-sm font-medium',
  bulkBtn:
    'inline-flex h-8 items-center gap-1.5 rounded-md bg-white/10 px-3 text-xs font-medium text-white hover:bg-white/20 transition',
  bulkBtnDanger:
    'inline-flex h-8 items-center gap-1.5 rounded-md bg-red-500 px-3 text-xs font-medium text-white hover:bg-red-600 transition',

  // Table
  tableWrap: '',
  tableBox:
    'mx-auto w-fit max-w-full overflow-hidden rounded-lg border border-stone-200/70 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
  tableHeader: 'flex items-center bg-[#EFEAE0]/70 border-b border-stone-200/70',
  headerCellText:
    'inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-wider text-stone-500',
  headerCellBtn:
    'inline-flex items-center gap-1 text-[12px] font-semibold uppercase tracking-wider text-stone-500 hover:text-stone-800 transition cursor-pointer',
  sortIcon: 'h-3 w-3 text-stone-400',
  sortIconActive: 'h-3 w-3 text-stone-900',

  cellBase: 'flex h-full items-center px-3',
  row: 'relative flex items-center border-b border-stone-100 bg-white last:border-b-0 hover:bg-stone-50/50 transition-colors',
  rowDelayed:
    'relative flex items-center border-b border-stone-100 bg-red-50/40 hover:bg-red-50/60 transition-colors',
  rowSelected: 'bg-amber-50/40',
  rowAccentDelayed:
    'absolute left-0 top-0 h-full w-[3px] bg-red-400',

  cellText: 'text-[13px] text-stone-800',
  cellTextStrong: 'text-[13px] font-medium text-stone-900',
  cellMuted: 'text-[13px] text-stone-400',
  cellRed: 'text-[13px] font-medium text-red-600',
  cellStrike: 'line-through text-stone-400',

  // Customer logo + name block
  customerBlock: 'flex items-center gap-2.5 min-w-0',
  customerLogo:
    'flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold uppercase text-white',
  customerNameWrap: 'flex flex-col leading-tight min-w-0',
  customerName: 'truncate text-[13px] font-medium text-stone-900',
  customerCode:
    'truncate text-[10px] font-mono uppercase tracking-wide text-stone-400',

  // Schedule cell
  schedOk: 'text-[13px] text-stone-400',
  schedDelayed:
    'inline-flex items-center gap-1 text-[13px] font-medium text-red-600',
  schedDelayedBtn:
    'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[13px] font-medium text-red-600 hover:bg-red-100/60 transition',
  schedDelayedIcon: 'h-3.5 w-3.5',
  schedExpandIcon: 'h-3.5 w-3.5 transition-transform',
  schedExpandIconOpen: 'h-3.5 w-3.5 rotate-180 transition-transform',

  // Conflict accordion
  conflictWrap:
    'relative border-b border-stone-100 bg-red-50/30 last:border-b-0',
  conflictAccent: 'absolute left-0 top-0 h-full w-[3px] bg-red-400',
  conflictInner: 'flex flex-col gap-3 pl-[82px] pr-5 py-4',
  conflictHeader: 'flex items-start gap-2.5',
  conflictIconWrap:
    'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600',
  conflictIcon: 'h-4 w-4',
  conflictTitle: 'text-[13px] font-semibold text-red-700',
  conflictBody: 'mt-0.5 max-w-[680px] text-[12.5px] leading-relaxed text-stone-700',
  conflictMetricsGrid:
    'grid grid-cols-1 gap-px overflow-hidden rounded-md border border-stone-200 bg-stone-200 sm:grid-cols-3',
  conflictMetricCell: 'flex flex-col gap-1 bg-white px-3 py-2.5',
  conflictMetricLabel:
    'text-[10px] font-semibold uppercase tracking-wider text-stone-400',
  conflictMetricValue: 'text-[13px] font-medium text-stone-800',
  conflictMetricValueDanger: 'text-[13px] font-semibold text-red-600',
  conflictMetricValueMono: 'text-[12px] font-mono font-medium text-stone-800',
  conflictFooter:
    'mt-1 flex flex-wrap items-center justify-between gap-3',
  conflictFootnote: 'text-[12px] text-stone-500',
  conflictActions: 'flex items-center gap-2',
  conflictBtnGhost:
    'inline-flex h-8 items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 text-[12px] font-medium text-stone-700 hover:bg-stone-50 transition',
  conflictBtnDanger:
    'inline-flex h-8 items-center gap-1.5 rounded-md border border-red-300 bg-white px-3 text-[12px] font-medium text-red-600 hover:bg-red-50 transition',
  conflictBtnIcon: 'h-3.5 w-3.5',

  // Order id expand chevron
  idCellRow: 'flex items-center gap-1.5 min-w-0',
  idExpandBtn:
    'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition',
  idExpandIcon: 'h-3.5 w-3.5 transition-transform',
  idExpandIconOpen: 'h-3.5 w-3.5 rotate-90 transition-transform',

  // Slot accordion
  slotsWrap:
    'relative border-b border-stone-100 bg-stone-50/70 last:border-b-0',
  slotsInner: 'flex flex-col gap-3 pl-[82px] pr-6 py-4',
  slotsTitle:
    'text-[11px] font-semibold uppercase tracking-wider text-stone-500',
  slotsSummary: 'text-[12px] text-stone-500',
  slotsTableHead:
    'grid grid-cols-3 gap-3 border-b border-stone-200 pb-1 text-center text-[11px] font-semibold uppercase tracking-wider text-stone-400',
  slotsRow:
    'grid grid-cols-3 items-center gap-3 border-b border-stone-100 py-1.5 last:border-b-0 text-center text-[13px] text-stone-800',
  slotsRowDate: 'font-medium text-stone-900',
  slotsRowQty: 'font-mono text-stone-800',
  slotsRowBar:
    'flex items-center justify-center gap-2 text-[11px] font-semibold',
  slotsBarTrack:
    'h-1.5 w-[120px] overflow-hidden rounded-full',
  slotsBarFill: 'h-full rounded-full',
  slotsEmpty: 'text-[12px] text-stone-400',
  slotsLoading:
    'inline-flex items-center gap-2 text-[12px] text-stone-400',
  slotsError: 'text-[12px] text-red-500',

  // Status pill
  statusPill:
    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium',
  statusDot: 'h-1.5 w-1.5 rounded-full',

  // Actions
  iconBtn:
    'inline-flex h-7 w-7 items-center justify-center rounded text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition',
  iconBtnDanger:
    'inline-flex h-7 w-7 items-center justify-center rounded text-stone-500 hover:bg-red-50 hover:text-red-600 transition',
  pencilIcon: 'h-4 w-4',
  closeIcon: 'h-4 w-4',
  plusIcon: 'h-4 w-4',

  // Inline edit
  inlineInput:
    'h-7 w-full rounded border border-stone-900 bg-white px-2 text-[13px] text-stone-900 outline-none',
  inlineCellHover:
    'cursor-text rounded px-1 -mx-1 hover:bg-stone-100 transition',
  inlineEditable:
    'cursor-text rounded px-1 -mx-1 border-b border-dotted border-stone-300 hover:bg-stone-100 hover:border-stone-400 transition',

  // Filter inputs
  filterInput:
    'h-9 w-[180px] rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-700 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none',
  filterSelect:
    'h-9 w-[180px] appearance-none rounded-md border border-stone-300 bg-white pl-3 pr-8 text-sm text-stone-700 focus:border-stone-500 focus:outline-none',
  filterSelectWrap: 'relative',
  filterSelectIcon:
    'pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400',

  // Footer + pagination
  footer: 'flex items-center justify-between border-t border-stone-200/70 bg-white px-4 py-3',
  footerText: 'text-[13px] text-stone-500',
  pagerBox: 'flex items-center gap-1',
  pageBtnBase:
    'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2.5 text-xs font-medium transition',
  pageBtnActive: 'bg-stone-900 text-white',
  pageBtnIdle:
    'border border-stone-300 bg-white text-stone-600 hover:bg-stone-50',

  // Checkbox
  checkbox:
    'h-4 w-4 cursor-pointer rounded border-stone-300 text-stone-900 focus:ring-stone-500',
}

export const dateRangePickerStyles = {
  wrap: 'relative',
  trigger:
    'flex h-9 w-[220px] items-center gap-2 rounded-md border border-stone-300 bg-white pl-3 pr-2 text-sm text-stone-700 hover:bg-stone-50 transition focus:border-stone-500 focus:outline-none',
  triggerActive: 'border-stone-500',
  triggerIcon: 'h-4 w-4 shrink-0 text-stone-400',
  triggerValue: 'flex-1 truncate text-left text-[13px] text-stone-800',
  triggerPlaceholder: 'flex-1 truncate text-left text-[13px] text-stone-400',
  clearBtn:
    'inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition',
  clearIcon: 'h-3.5 w-3.5',

  panel:
    'absolute left-0 z-30 mt-1 w-[300px] rounded-md border border-stone-200 bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.08)]',
  calHeader: 'flex items-center justify-between px-1 pb-2',
  calTitle: 'text-[13px] font-semibold text-stone-900',
  calNavBtn:
    'inline-flex h-7 w-7 items-center justify-center rounded text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition',
  calNavIcon: 'h-4 w-4',
  calGrid: 'grid grid-cols-7 gap-0.5',
  calDow:
    'flex h-7 items-center justify-center text-[10px] font-semibold uppercase text-stone-400',
  calDay:
    'flex h-8 items-center justify-center rounded text-[12px] text-stone-700 hover:bg-stone-100 transition',
  calDayEdge: 'bg-stone-900 text-white hover:bg-stone-900',
  calDayWithin: 'bg-stone-100 text-stone-900 rounded-none hover:bg-stone-200',
  calDayPreview:
    'bg-stone-50 text-stone-700 rounded-none hover:bg-stone-100',
  calDayToday: 'ring-1 ring-stone-300',
  calFooter:
    'mt-2 flex items-center justify-between border-t border-stone-200 pt-2',
  calFootBtn:
    'inline-flex h-7 items-center rounded px-2 text-[12px] font-medium text-stone-600 hover:bg-stone-100 transition',
}

export const dimmedText = (cancelled) =>
  cancelled ? 'text-stone-400' : 'text-stone-900'

export function formatDate(iso, locale = 'en-US') {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatQty(n) {
  if (n == null || n === '') return ''
  const num = typeof n === 'number' ? n : Number(String(n).replace(/,/g, ''))
  if (Number.isNaN(num)) return String(n)
  return num.toLocaleString('en-US')
}
