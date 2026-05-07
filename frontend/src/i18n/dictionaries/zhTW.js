const zhTW = {
  locale: 'zh-TW',

  common: {
    cancel: '取消',
    confirm: '確認',
    close: '關閉',
    today: '今天',
    submitting: '處理中…',
    search: '搜尋',
    reset: '重置',
    done: '完成',
    clear: '清除',
  },

  nav: {
    orders: '訂單',
    calendar: '行事曆',
    signOut: '登出',
    switchLanguage: '切換語言',
  },

  login: {
    appTagline: '晶圓訂單管理',
    welcome: '歡迎回來',
    subtitle: '登入以管理晶圓生產排程。',
    usernameLabel: '帳號或員工編號',
    passwordLabel: '密碼',
    rememberMe: '記住我',
    forgotPassword: '忘記密碼？',
    signIn: '登入',
    signingIn: '登入中…',
    or: '或',
    continueSso: '使用公司 SSO 繼續',
    needHelp: '需要協助？',
    contactIt: '聯絡 IT',
    requireAll: '請輸入帳號與密碼。',
    invalidCredentials: '帳號或密碼錯誤，請再試一次。',
    serviceUnavailable: '登入服務暫時無法使用，請稍後再試。',
    showPassword: '顯示密碼',
    hidePassword: '隱藏密碼',
    copyright: (year) => `© ${year} WOMS`,
  },

  toast: {
    loginSuccess: (name) => (name ? `歡迎回來，${name}` : '登入成功'),
    createOrderSuccess: '訂單建立成功',
    createOrderDelaySuccess: '已接受新交期並建立訂單',
    updateOrderSuccess: (id) => (id ? `訂單 ${id} 已更新` : '訂單已更新'),
    cancelOrderSuccess: (id) => (id ? `訂單 ${id} 已取消` : '訂單已取消'),
    bulkCancelSuccess: (n) => `已取消 ${n} 筆訂單`,
    exportSuccess: (n) => `已匯出 ${n} 筆訂單為 CSV`,
    exportEmpty: '請先選擇要匯出的訂單',
    genericError: '操作失敗，請稍後再試',
    notifiedCustomer: (customer, id) => `已通知 ${customer}（${id}）`,
    rescheduleAllTriggered: '已觸發全局重排排程',
  },

  cancelDialog: {
    titleSingle: '此訂單已在生產中！',
    titleBulk: '選取項目包含生產中訂單！',
    subtitleSingle: '取消此訂單將立即影響工廠排程',
    subtitleBulk: (n) => `共 ${n} 筆訂單已在生產中，取消將釋放已生產之產能`,
    body: '取消將釋放已生產之產能、影響其他排程訂單，且此操作無法復原。確定要繼續嗎？',
    affectedHeading: '受影響的生產中訂單',
    moreCount: (n) => `…以及其他 ${n} 筆`,
    bulkBreakdown: (inProd, total) =>
      `${total} 筆選取訂單中，有 ${inProd} 筆為生產中`,
    irreversibleNote: '此操作無法復原。',
    cancelBtn: '返回',
    confirmBtn: '確認取消訂單',
    confirmBtnBulk: (n) => `確認取消 ${n} 筆訂單`,
    closeAria: '關閉',
    waferUnit: '片',
  },

  orderList: {
    title: '晶圓訂單',
    subtitle: '管理所有客戶的生產排程',
    createOrder: '建立訂單',
    tabs: {
      all: '全部',
      delayed: '僅延遲',
      in_production: '生產中',
      mine: '我的訂單',
    },
    columns: {
      id: '訂單編號',
      customer: '客戶',
      qty: '數量',
      status: '狀態',
      due: '交期',
      expected: '預計',
      schedule: '排程',
      actions: '操作',
    },
    selectAllOnPage: '選取本頁全部',
    selectOrder: (id) => `選取訂單 ${id}`,
    editOrderAria: (id) => `編輯訂單 ${id}`,
    cancelOrderAria: (id) => `取消訂單 ${id}`,
    emptyResults: '沒有訂單符合篩選條件。',
    showing: (start, end, filtered, total) =>
      total === filtered
        ? `顯示 ${start}–${end} 筆 / 共 ${filtered} 筆訂單`
        : `顯示 ${start}–${end} 筆 / 共 ${filtered} 筆訂單（從 ${total} 筆篩選）`,
    prev: '上一頁',
    next: '下一頁',
    pageAria: (n) => `第 ${n} 頁`,
    prevPageAria: '上一頁',
    nextPageAria: '下一頁',
  },

  filters: {
    orderIdPlaceholder: '訂單編號',
    customerPlaceholder: '客戶名稱',
    dateRangePlaceholder: '日期區間',
    clearDateRangeAria: '清除日期區間',
    prevMonthAria: '上個月',
    nextMonthAria: '下個月',
    dowShort: ['日', '一', '二', '三', '四', '五', '六'],
  },

  bulk: {
    selected: (n) => `已選取 ${n} 筆訂單`,
    exportSelected: '匯出選取項目',
    cancelSelected: '取消選取項目',
    clearAria: '清除選取',
  },

  density: {
    label: '列高密度',
    comfortable: '舒適',
    compact: '緊湊',
  },

  stats: {
    totalOrders: '訂單總數',
    inProduction: '生產中',
    delayed: '延遲',
    totalWafers: '晶圓總片數',
  },

  statuses: {
    ALL: '全部狀態',
    IN_PRODUCTION: '生產中',
    SCHEDULED: '已排程',
    PENDING: '待處理',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
  },

  schedule: {
    onTrack: '準時',
    delayedDays: (d) => `延遲 ${d} 天`,
    showConflict: '展開衝突詳情',
    hideConflict: '收合衝突詳情',
  },

  editOrder: {
    breadcrumbRoot: '晶圓訂單',
    breadcrumbEdit: '編輯',
    backAria: '返回訂單列表',
    title: '編輯訂單',
    subtitle: '更新數量或交期。客戶與狀態無法在此頁面變更。',

    staleTitle: '其他使用者已修改此訂單',
    staleBodyPrefix: '由 ',
    staleBodySuffix: ' 編輯。請重新載入以查看最新資料，避免覆寫他人變更。',
    staleReload: '立即重新載入',

    readOnlyTag: '唯讀資訊',
    customerLabel: '客戶',
    statusLabel: '目前狀態',
    createdLabel: '建立於',
    lastEditLabel: '上次編輯',
    byLabel: '，由 ',

    editableTag: '可編輯欄位',
    qtyLabel: '數量（片）',
    qtyRange: (min, max) => `${min} – ${max.toLocaleString()}`,
    qtyHelp: (min, max) => `最小值：${min}；最大值：${max.toLocaleString()}`,
    qtyWithinRange: '數量符合範圍',
    qtyRequired: '必須輸入數量。',
    qtySuffix: '片',

    dueLabel: '客戶要求交期',
    leadTimeHelp: (min, max) => `生產通常需要 ${min}–${max} 週的前置時間`,

    scheduleWarning:
      '注意：修改數量或交期將釋放原廠區產能並觸發系統全局重排，可能導致最終排程日期變動。',

    cancelBtn: '取消',
    reloadBtn: '重新載入',
    reloadingBtn: '載入中…',
    saveBtn: '儲存變更',
    savingBtn: '儲存中…',
    saveDisabledTooltip: '儲存前需要重新載入',

    minutesAgo: (n) => `${n} 分鐘前`,
    inDays: (n) => `${n} 天後`,
  },

  createOrder: {
    backAria: '返回訂單列表',
    title: '建立新訂單',
    subtitle: '提交新的晶圓生產訂單至排程',
    sectionTitle: '訂單明細',
    sectionHint: '所有欄位皆為必填',
    customerLabel: '客戶',
    qtyLabel: '數量（片）',
    qtyHint: (min, max) => `${min} – ${max.toLocaleString()}`,
    qtyHelp: (min, max) => `最小值：${min}；最大值：${max.toLocaleString()}`,
    dueLabel: '客戶要求交期',
    leadTimeHelp: (min, max) => `生產通常需要 ${min}–${max} 週的前置時間`,
    infoBanner:
      '系統將自動計算 90 天內的廠區產能。若遭遇產能滿載，將會為您計算最早可達成的預計交期。',
    cancelBtn: '取消',
    submitBtn: '提交訂單',
    submittingBtn: '提交中…',
  },

  customerSelect: {
    placeholder: '搜尋並選擇客戶...',
    empty: (q) => `找不到符合「${q}」的客戶。`,
    addNew: '新增客戶',
    addNewWithName: (name) => `新增客戶「${name}」`,
  },

  addCustomer: {
    title: '新增客戶',
    hint: '新增的客戶將可用於後續訂單。',
    nameLabel: '客戶名稱',
    namePlaceholder: '例如：聯發科',
    codeLabel: '客戶代碼（選填）',
    codePlaceholder: '留空將自動產生',
    nameRequired: '請輸入客戶名稱。',
    cancel: '取消',
    add: '新增客戶',
  },

  datePicker: {
    placeholder: '選擇日期',
    openAria: '開啟日曆',
    prevMonthAria: '上個月',
    nextMonthAria: '下個月',
    today: '今天',
    close: '關閉',
    weeksOut: (w) => `約 ${w} 週後`,
    daysOut: (d) => `${d} 天後`,
    todayLabel: '今天',
    monthFormat: { month: 'long', year: 'numeric' },
    dateFormat: { month: 'short', day: 'numeric', year: 'numeric' },
    dowShort: ['日', '一', '二', '三', '四', '五', '六'],
  },

  quantity: {
    increase: '增加數量',
    decrease: '減少數量',
    invalidNumber: '請輸入有效的數字。',
    belowMin: (min, max) =>
      `數量低於下限。請輸入介於 ${min} 至 ${max.toLocaleString()} 之間的值。`,
    aboveMax: (min, max) =>
      `數量超過上限。請輸入介於 ${min} 至 ${max.toLocaleString()} 之間的值。`,
  },

  scheduleAlert: {
    title: '排程延誤通知',
    subtitle: '廠區產能已滿載',
    body: '目前廠區產能已滿，無法在原訂交期內完成此訂單。系統已計算最早可達成的排程，您是否接受新的預計交期？',
    requestedDate: '要求交期',
    earliestDate: '最早可達成日期',
    delayPill: (days) => `延後 ${days} 天`,
    defaultWarning: (n) =>
      `目前有 ${n} 筆訂單使用此產能時段，新日期為下一個可用的生產空檔。`,
    cancel: '取消訂單',
    accept: '接受新日期',
    cancelling: '取消中…',
    accepting: '處理中…',
  },

  calendar: {
    title: '生產行事曆',
    subtitle: '所有產線的每日晶圓產能',
    rescheduleAll: '重排所有訂單',
    footerHint: '點選日期以查看排定訂單 · 拖曳可重新排程',
    lastSync: (sec) => `${sec} 秒前同步`,
  },
}

export default zhTW
