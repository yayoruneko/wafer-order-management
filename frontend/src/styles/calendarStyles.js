export const loadStyles = {
  normal: {
    accent: 'bg-emerald-500',
    bar: 'bg-emerald-500',
    barDim: 'bg-emerald-200/70',
    cellBg: 'bg-white',
    cellOuter: 'border-l-[3px] border-emerald-500',
    countText: 'text-stone-900',
    label: '正常',
    legendDot: 'bg-emerald-500',
  },
  nearFull: {
    accent: 'bg-orange-500',
    bar: 'bg-orange-500',
    barDim: 'bg-orange-200/70',
    cellBg: 'bg-orange-50/40',
    cellOuter: 'border-l-[3px] border-orange-500',
    countText: 'text-stone-900',
    label: '接近滿載',
    legendDot: 'bg-orange-500',
  },
  full: {
    accent: 'bg-red-500',
    bar: 'bg-red-500',
    barDim: 'bg-red-200/80',
    cellBg: 'bg-red-50/70',
    cellOuter: 'border-l-[3px] border-red-500',
    countText: 'text-red-600',
    label: '滿載',
    legendDot: 'bg-red-500',
  },
}

export const calendarStyles = {
  page: 'min-h-screen w-full bg-[#F5F1E8]',
  shell: 'mx-auto flex max-w-[1280px] flex-col gap-5 px-8 py-7',

  headerRow: 'flex items-start justify-between',
  pageTitle: 'text-[28px] font-bold leading-tight text-stone-900',
  pageSubtitle: 'mt-1 text-sm text-stone-500',
  rescheduleBtn:
    'inline-flex h-10 items-center gap-2 rounded-md bg-stone-900 px-4 text-sm font-medium text-white hover:bg-stone-800 transition shadow-[0_1px_2px_rgba(0,0,0,0.05)]',
  rescheduleIcon: 'h-4 w-4',

  // Stats grid
  statsGrid: 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4',
  statCard:
    'rounded-lg border border-stone-200/70 bg-[#EFEAE0]/60 px-5 py-4',
  statLabel: 'text-[13px] font-medium text-stone-500',
  statRow: 'mt-1 flex items-baseline gap-2',
  statValue: 'text-[28px] font-semibold leading-none text-stone-900',
  statValueRed: 'text-[28px] font-semibold leading-none text-red-600',
  statValueOrange: 'text-[28px] font-semibold leading-none text-orange-600',
  statHint: 'text-[12px] font-medium text-stone-500',
  statDeltaUp: 'text-[12px] font-medium text-emerald-600',
  statDeltaDown: 'text-[12px] font-medium text-red-600',

  // Toolbar
  toolbar:
    'flex items-center justify-between gap-3 rounded-lg border border-stone-200/70 bg-white px-3 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
  toolbarLeft: 'flex items-center gap-2',
  toolbarMid: 'flex items-center gap-3',
  toolbarRight: 'flex items-center gap-3',
  navBtn:
    'inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 transition',
  navIcon: 'h-4 w-4',
  monthLabel: 'min-w-[120px] text-center text-[15px] font-semibold text-stone-900',
  todayBtn:
    'inline-flex h-9 items-center rounded-md border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 hover:bg-stone-50 transition',
  factoryLabel: 'text-[13px] font-medium text-stone-500',
  factoryWrap: 'relative',
  factoryBtn:
    'inline-flex h-9 items-center gap-2 rounded-md border border-stone-200 bg-white pl-3 pr-2 text-sm text-stone-700 hover:bg-stone-50 transition',
  factoryDot: 'h-1.5 w-1.5 rounded-full',
  factoryCaret: 'h-4 w-4 text-stone-400',
  factoryMenu:
    'absolute left-0 top-[calc(100%+4px)] z-20 w-[160px] overflow-hidden rounded-md border border-stone-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)]',
  factoryItem:
    'flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-stone-700 hover:bg-stone-50 transition',
  factoryItemActive: 'bg-stone-100/80 font-medium',

  viewSwitch: 'inline-flex items-center rounded-md border border-stone-200 bg-white p-0.5',
  viewBtn:
    'inline-flex h-7 items-center rounded px-3 text-[12px] font-medium text-stone-500 hover:text-stone-800 transition',
  viewBtnActive:
    'inline-flex h-7 items-center rounded bg-stone-900 px-3 text-[12px] font-semibold text-white',
  legendItem: 'inline-flex items-center gap-1.5 text-[12px] text-stone-500',
  legendDot: 'h-1.5 w-1.5 rounded-full',

  // Grid
  gridWrap:
    'overflow-hidden rounded-lg border border-stone-200/70 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
  weekdayRow:
    'grid grid-cols-7 border-b border-stone-200/70 bg-[#EFEAE0]/70',
  weekdayCell:
    'px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-stone-500',
  monthGrid: 'grid grid-cols-7',

  cellOuter:
    'relative flex h-[120px] flex-col gap-2 border-b border-r border-stone-200/70 px-3 py-2.5 transition',
  cellOuterClickable: 'cursor-pointer hover:brightness-[0.98]',
  cellHeaderRow: 'flex items-center justify-between',
  cellDayNum: 'text-[14px] font-semibold text-stone-800',
  cellDayNumMuted: 'text-[14px] font-semibold text-stone-300',
  cellDayNumDanger: 'text-[14px] font-bold text-red-600',
  cellTodayPill:
    'inline-flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-[12px] font-bold text-white',
  cellTodayLabel: 'text-[10px] font-semibold uppercase tracking-wider text-stone-400',
  cellAlertIconWrap:
    'inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_2px_6px_rgba(220,38,38,0.35)]',
  cellAlertIcon: 'h-3.5 w-3.5',

  cellCount: 'text-[12px] font-medium leading-none',
  cellCountMuted: 'text-[12px] font-medium leading-none text-stone-300',
  cellTag: 'text-[10px] font-bold uppercase tracking-wider text-red-600',

  cellBar: 'absolute bottom-0 left-0 h-1 w-full overflow-hidden bg-stone-100',
  cellBarFill: 'h-full transition-all',

  // Footer hint
  footerHint:
    'flex items-center justify-between text-[12px] text-stone-500',

  // Popover (rendered inside Modal's p-6 card)
  popoverHeader: 'flex items-start justify-between gap-3',
  popoverTitleWrap: 'flex items-center gap-3',
  popoverIconWrap:
    'inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600',
  popoverIconWrapNeutral:
    'inline-flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-700',
  popoverIcon: 'h-5 w-5',
  popoverTitle: 'text-[16px] font-semibold text-stone-900',
  popoverSubtitle: 'mt-0.5 text-[12px] text-stone-500',
  popoverCloseBtn:
    'inline-flex h-8 w-8 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100 transition',
  popoverCloseIcon: 'h-4 w-4',

  popoverBody: 'mt-4 flex max-h-[55vh] flex-col gap-3 overflow-y-auto',
  orderCard:
    'rounded-lg border border-stone-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
  orderCardRow: 'flex items-center justify-between gap-3',
  orderCardCustomer: 'flex items-center gap-2.5 min-w-0',
  orderCardLogo:
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[10px] font-bold uppercase text-white',
  orderCardId: 'text-[13px] font-mono font-semibold text-stone-900',
  orderCardName: 'text-[12px] text-stone-500',
  orderDelayPill:
    'inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600',
  orderDelayPillIcon: 'h-3 w-3',
  orderOnTrackPill:
    'inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700',
  orderDateGrid: 'mt-3 grid grid-cols-2 gap-3 rounded-md bg-stone-50 px-3 py-2.5',
  orderDateLabel: 'text-[11px] font-medium uppercase tracking-wider text-stone-400',
  orderDateValue: 'mt-0.5 text-[13px] font-medium text-stone-800',
  orderDateValueDanger: 'mt-0.5 text-[13px] font-medium text-red-600',
  orderQty: 'mt-2 text-[12px] text-stone-500',
  orderReason:
    'mt-3 flex items-start gap-2 rounded-md bg-amber-50/70 px-3 py-2 text-[12px] text-stone-700',
  orderReasonIcon: 'mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600',

  popoverFooter: 'mt-5 flex items-center justify-end gap-2',
  popoverGhostBtn:
    'inline-flex h-9 items-center rounded-md border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 hover:bg-stone-50 transition',
}
