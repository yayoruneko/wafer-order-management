export const createOrderStyles = {
  page: 'min-h-screen w-full bg-[#F5F1E8]',
  shell: 'mx-auto flex max-w-[760px] flex-col gap-6 px-8 py-8',

  // Header
  headerRow: 'flex items-start gap-4',
  backBtn:
    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
  backIcon: 'h-4 w-4',
  pageTitle: 'text-[28px] font-bold leading-tight text-stone-900',
  pageSubtitle: 'mt-1 text-sm text-stone-500',

  // Card
  card:
    'rounded-xl border border-stone-200/70 bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
  sectionTitle: 'text-[17px] font-semibold text-stone-900',
  sectionHint: 'mt-0.5 text-[13px] text-stone-500',
  divider: 'mt-5 mb-6 border-t border-stone-200/70',

  // Field
  field: 'flex flex-col gap-2',
  fieldGap: 'mt-5',
  label: 'text-[14px] font-medium text-stone-800',
  labelRow: 'flex items-baseline justify-between',
  labelHint: 'text-[12px] text-stone-400',
  helpText: 'text-[12px] text-stone-500',
  errorText:
    'inline-flex items-center gap-1.5 text-[13px] font-medium text-red-600',
  errorIcon: 'h-3.5 w-3.5',

  // Input shells
  inputBase:
    'flex h-11 w-full items-center rounded-md border border-stone-300 bg-white text-[14px] text-stone-800 transition focus-within:border-stone-500',
  inputBaseError:
    'flex h-11 w-full items-center rounded-md border border-red-500 bg-white text-[14px] text-stone-800 ring-2 ring-red-100',
  inputIconLeft: 'pl-3 pr-2 text-stone-400',
  inputText:
    'h-full w-full bg-transparent px-2 text-[14px] text-stone-800 placeholder:text-stone-400 outline-none',
  inputTextRight:
    'h-full w-full bg-transparent px-3 text-right text-[13px] text-stone-400 outline-none',
  inputCaret: 'pr-3 text-stone-400',
  inputCaretIcon: 'h-4 w-4',

  // Quantity stepper
  qtyRow: 'flex h-11 w-full items-center rounded-md border bg-white',
  qtyRowOk: 'border-stone-300 focus-within:border-stone-500',
  qtyRowErr: 'border-red-500 ring-2 ring-red-100',
  qtyInput:
    'h-full w-full bg-transparent px-3 text-[14px] text-stone-800 placeholder:text-stone-400 outline-none',
  qtyStepperWrap:
    'flex h-full flex-col border-l border-stone-200',
  qtyStepperBtn:
    'flex h-1/2 items-center justify-center px-2 text-stone-500 hover:bg-stone-50 hover:text-stone-800 transition',
  qtyStepperIcon: 'h-3 w-3',

  // Customer dropdown
  customerPanel:
    'mt-1 overflow-hidden rounded-md border border-stone-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)]',
  customerOption:
    'flex w-full items-center gap-3 px-3 py-2.5 text-left transition',
  customerOptionIdle: 'bg-white hover:bg-stone-50',
  customerOptionActive: 'bg-stone-100/80',
  customerLogo:
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[11px] font-bold uppercase text-white',
  customerInfo: 'flex flex-col leading-tight min-w-0',
  customerName: 'truncate text-[14px] font-medium text-stone-900',
  customerCode:
    'truncate text-[11px] font-mono uppercase tracking-wide text-stone-400',
  customerAddRow:
    'flex w-full items-center gap-2 border-t border-stone-200 bg-stone-50/60 px-3 py-2.5 text-left text-[13px] font-medium text-stone-700 hover:bg-stone-100 transition',
  customerAddIcon: 'h-4 w-4',
  customerEmpty:
    'px-3 py-3 text-[13px] text-stone-500',

  // Date picker
  dateBtn:
    'flex h-11 w-full cursor-pointer items-center rounded-md border border-stone-300 bg-white text-left transition focus:border-stone-500 focus:outline-none',
  dateBtnIcon:
    'flex h-full items-center pl-3 pr-2 text-stone-500 hover:text-stone-700 transition',
  dateValue: 'flex-1 px-1 text-[14px] text-stone-800',
  datePlaceholder: 'flex-1 px-1 text-[14px] text-stone-400',
  dateMeta: 'pr-3 text-[12px] text-stone-400',

  calPanel:
    'mt-1 w-[300px] rounded-md border border-stone-200 bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.08)]',
  calHeader: 'flex items-center justify-between px-1 pb-2',
  calTitle: 'text-[13px] font-semibold text-stone-900',
  calNavBtn:
    'inline-flex h-7 w-7 items-center justify-center rounded text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition',
  calNavIcon: 'h-4 w-4',
  calGrid: 'grid grid-cols-7 gap-0.5',
  calDow: 'flex h-7 items-center justify-center text-[10px] font-semibold uppercase text-stone-400',
  calDay:
    'flex h-8 items-center justify-center rounded text-[12px] text-stone-700 hover:bg-stone-100 transition',
  calDayMuted: 'text-stone-300',
  calDaySelected: 'bg-stone-900 text-white hover:bg-stone-900',
  calDayToday: 'ring-1 ring-stone-300',
  calDayDisabled: '!text-stone-500 cursor-not-allowed hover:bg-transparent',
  calFooter:
    'mt-2 flex items-center justify-between border-t border-stone-200 pt-2',
  calFootBtn:
    'inline-flex h-7 items-center rounded px-2 text-[12px] font-medium text-stone-600 hover:bg-stone-100 transition',

  // Info banner
  banner:
    'mt-6 flex items-start gap-2.5 rounded-md border border-amber-200/70 bg-amber-50/60 px-4 py-3',
  bannerIcon: 'mt-0.5 h-4 w-4 shrink-0 text-amber-600',
  bannerText: 'text-[13px] leading-relaxed text-amber-900/90',

  // Footer
  footer: 'mt-7 flex items-center justify-between border-t border-stone-200/70 pt-5',
  cancelBtn:
    'inline-flex h-10 items-center gap-2 rounded-md border border-stone-300 bg-white px-5 text-[14px] font-medium text-stone-700 hover:bg-stone-50 transition disabled:cursor-not-allowed disabled:opacity-50',
  submitBtn:
    'inline-flex h-10 items-center gap-2 rounded-md bg-stone-900 px-5 text-[14px] font-medium text-white hover:bg-stone-800 transition disabled:cursor-not-allowed disabled:opacity-40',
  submitIcon: 'h-4 w-4',

  // Modal
  modalScrim:
    'fixed inset-0 z-40 flex items-center justify-center bg-stone-900/40 px-4',
  modalCard:
    'w-full rounded-xl border border-stone-200 bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.18)]',
  modalTitle: 'text-[16px] font-semibold text-stone-900',
  modalHint: 'mt-0.5 text-[13px] text-stone-500',
  modalRow: 'mt-4 flex flex-col gap-2',
  modalLabel: 'text-[13px] font-medium text-stone-700',
  modalInput:
    'h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-[14px] text-stone-800 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none',
  modalActions: 'mt-5 flex items-center justify-end gap-2',

  // Schedule delay alert
  alertHeader: 'flex items-start gap-3',
  alertIconWrap:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50',
  alertIcon: 'h-5 w-5 text-red-500',
  alertTitle: 'text-[16px] font-semibold text-stone-900',
  alertSubtitle: 'mt-0.5 text-[13px] text-stone-500',
  alertBody: 'mt-4 text-[14px] leading-relaxed text-stone-700',

  alertCompare:
    'mt-5 rounded-lg border border-amber-200/70 bg-amber-50/60 px-4 py-4',
  alertCompareRow: 'flex items-center justify-between',
  alertCompareLabel:
    'inline-flex items-center gap-2 text-[13px] text-stone-700',
  alertCompareLabelDanger:
    'inline-flex items-center gap-2 text-[13px] font-medium text-red-600',
  alertCompareDate: 'text-[14px] font-medium text-stone-900',
  alertCompareDateDanger: 'text-[14px] font-semibold text-red-600',
  alertCompareIcon: 'h-4 w-4 text-stone-400',
  alertCompareIconDanger: 'h-4 w-4 text-red-500',
  alertCompareDivider:
    'my-3 flex items-center justify-center border-t border-dashed border-amber-300/70',
  alertDelayPill:
    '-my-3 inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-0.5 text-[12px] font-medium text-amber-800',
  alertDelayIcon: 'h-3 w-3',

  alertFootnote:
    'mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-stone-500',
  alertFootnoteIcon: 'mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400',

  alertActions:
    'mt-5 flex items-center justify-end gap-2 border-t border-stone-200/70 pt-4',
  alertAcceptBtn:
    'inline-flex h-10 items-center gap-2 rounded-md bg-stone-900 px-5 text-[14px] font-medium text-white hover:bg-stone-800 transition disabled:cursor-not-allowed disabled:opacity-60',
  alertAcceptIcon: 'h-4 w-4',
}

export const PRESET_COLORS = [
  '#76B900', '#ED1C24', '#0071C5', '#E60012',
  '#3253DC', '#1428A0', '#F59E0B', '#10B981',
  '#8B5CF6', '#EC4899',
]



