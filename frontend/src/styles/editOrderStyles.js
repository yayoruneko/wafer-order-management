export const editOrderStyles = {
  // Breadcrumb
  breadcrumb:
    'flex items-center gap-1.5 text-[13px] text-stone-500',
  breadcrumbCurrent: 'font-medium text-stone-900',
  breadcrumbSep: 'text-stone-300',

  // Header
  headerRow: 'flex items-start gap-4',
  backBtn:
    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
  backIcon: 'h-4 w-4',
  titleRow: 'flex items-center gap-3',
  title: 'text-[28px] font-bold leading-tight text-stone-900',
  idChip:
    'inline-flex items-center rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 font-mono text-[12px] text-stone-700',
  subtitle: 'mt-1 text-[14px] text-stone-500',

  // Stale banner
  staleBanner:
    'flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5',
  staleIconWrap:
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700',
  staleIcon: 'h-5 w-5',
  staleBody: 'flex-1 min-w-0',
  staleTitleRow: 'flex flex-wrap items-center gap-2',
  staleTitle: 'text-[14px] font-semibold text-amber-900',
  stalePill:
    'inline-flex items-center rounded-md bg-amber-200/60 px-2 py-0.5 font-mono text-[11px] text-amber-900',
  staleText: 'mt-0.5 text-[13px] leading-relaxed text-amber-900/85',
  staleEditor: 'font-semibold',
  staleReloadBtn:
    'inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-amber-700 px-4 text-[13px] font-semibold text-white hover:bg-amber-800 transition disabled:cursor-not-allowed disabled:opacity-60',
  staleReloadIcon: 'h-4 w-4',

  // Read-only block
  roCard:
    'rounded-xl border border-stone-200/70 bg-stone-50/70 px-5 py-4',
  roHeader: 'inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500',
  roHeaderIcon: 'h-3.5 w-3.5',
  roGrid: 'mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2',
  roLabel: 'text-[12px] font-medium text-stone-500',
  roCustomerRow: 'mt-1.5 flex items-center gap-3',
  roCustomerName: 'text-[15px] font-semibold leading-tight text-stone-900',
  roCustomerCode:
    'text-[11px] font-mono uppercase tracking-wide text-stone-400',
  roStatusRow: 'mt-1.5',
  roMetaDivider: 'mt-4 border-t border-dashed border-stone-200',
  roMeta:
    'mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-stone-500',
  roMetaStrong: 'font-medium text-stone-700',
  roMetaDot: 'text-stone-300',

  // Editable section
  editableHeader:
    'inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500',
  editableHeaderIcon: 'h-3.5 w-3.5',

  // Quantity wrapper with suffix
  qtySuffixWrap: 'relative',
  qtySuffix:
    'pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 text-[12px] text-stone-400',

  // Within-range help row
  helpRow: 'mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px]',
  helpRowText: 'text-stone-500',
  helpRowDot: 'text-stone-300',
  helpRowOk: 'inline-flex items-center gap-1 text-emerald-600',
  helpRowOkIcon: 'h-3.5 w-3.5',

  // Schedule warning notice (replaces the diff dashed-box)
  warningBox:
    'flex items-start gap-2.5 rounded-lg border border-stone-200/80 bg-stone-50 px-4 py-3',
  warningIcon: 'mt-0.5 h-4 w-4 shrink-0 text-stone-500',
  warningText: 'text-[13px] leading-relaxed text-stone-700',

  // Footer
  footer:
    'mt-7 flex items-center justify-between gap-3 border-t border-stone-200/70 pt-5',
  footerLeft: 'flex items-center gap-2',
  footerRight: 'flex items-center gap-2',
  reloadBtn:
    'inline-flex h-10 items-center gap-2 rounded-md border border-amber-300 bg-white px-4 text-[13px] font-medium text-amber-700 hover:bg-amber-50 transition disabled:cursor-not-allowed disabled:opacity-60',
  reloadBtnIcon: 'h-4 w-4',

  // Save tooltip wrapper
  saveWrap: 'relative',
  saveTooltip:
    'pointer-events-none absolute -top-9 right-0 inline-flex items-center rounded-md bg-stone-900 px-2.5 py-1 text-[11px] font-medium text-white shadow-md',
  saveTooltipArrow:
    'pointer-events-none absolute -top-1 right-6 h-2 w-2 rotate-45 bg-stone-900',
}
