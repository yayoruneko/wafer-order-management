const en = {
  locale: 'en-US',

  common: {
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    today: 'Today',
    submitting: 'Working…',
    search: 'Search',
    reset: 'Reset',
    done: 'Done',
    clear: 'Clear',
  },

  nav: {
    orders: 'Orders',
    calendar: 'Calendar',
    users: 'Users',
    signOut: 'Sign out',
    switchLanguage: 'Switch language',
  },

  login: {
    appTagline: 'Wafer Order Mgmt',
    welcome: 'Welcome back',
    subtitle: 'Sign in to manage wafer production schedules.',
    usernameLabel: 'Username or employee ID',
    passwordLabel: 'Password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    signIn: 'Sign in',
    signingIn: 'Signing in…',
    or: 'or',
    continueSso: 'Continue with company SSO',
    needHelp: 'Need help?',
    contactIt: 'Contact IT',
    requireAll: 'Please enter both username and password.',
    invalidCredentials: 'Incorrect username or password. Please try again.',
    serviceUnavailable:
      'Login service is temporarily unavailable. Please try again later.',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    copyright: (year) => `© ${year} WOMS`,
  },

  toast: {
    loginSuccess: (name) => (name ? `Welcome back, ${name}` : 'Signed in'),
    createOrderSuccess: 'Order created',
    createOrderDelaySuccess: 'New due date accepted and order created',
    updateOrderSuccess: (id) => (id ? `Order ${id} updated` : 'Order updated'),
    cancelOrderSuccess: (id) =>
      id ? `Order ${id} cancelled` : 'Order cancelled',
    bulkCancelSuccess: (n) => `${n} orders cancelled`,
    exportSuccess: (n) => `Exported ${n} orders to CSV`,
    exportEmpty: 'Select orders to export first',
    genericError: 'Something went wrong. Please try again.',
    notifiedCustomer: (customer, id) => `Notified ${customer} (${id})`,
    rescheduleAllTriggered: 'Global rescheduling triggered',
  },

  cancelDialog: {
    titleSingle: 'This order is in production!',
    titleBulk: 'Selection includes orders in production!',
    subtitleSingle:
      'Cancelling this order will immediately impact factory scheduling',
    subtitleBulk: (n) =>
      `${n} orders are in production. Cancelling will release used capacity`,
    body: 'Cancelling will release used capacity, affect other scheduled orders, and cannot be undone. Continue?',
    affectedHeading: 'Affected in-production orders',
    moreCount: (n) => `…and ${n} more`,
    bulkBreakdown: (inProd, total) =>
      `${inProd} of ${total} selected orders are in production`,
    irreversibleNote: 'This action cannot be undone.',
    cancelBtn: 'Back',
    confirmBtn: 'Confirm cancel order',
    confirmBtnBulk: (n) => `Confirm cancel ${n} orders`,
    closeAria: 'Close',
    waferUnit: 'wafers',
  },

  orderList: {
    title: 'Wafer orders',
    subtitle: 'Manage production schedules across all customer orders',
    createOrder: 'Create order',
    tabs: {
      all: 'All',
      delayed: 'Delayed only',
      in_production: 'In production',
      mine: 'My orders',
    },
    columns: {
      id: 'Order ID',
      customer: 'Customer',
      qty: 'Qty',
      status: 'Status',
      due: 'Due Date',
      expected: 'Expected',
      schedule: 'Schedule',
      actions: 'Actions',
    },
    selectAllOnPage: 'Select all on page',
    selectOrder: (id) => `Select ${id}`,
    editOrderAria: (id) => `Edit order ${id}`,
    cancelOrderAria: (id) => `Cancel order ${id}`,
    emptyResults: 'No orders match your filters.',
    showing: (start, end, filtered, total) =>
      total === filtered
        ? `Showing ${start}–${end} of ${filtered} orders`
        : `Showing ${start}–${end} of ${filtered} orders (filtered from ${total})`,
    prev: 'Prev',
    next: 'Next',
    pageAria: (n) => `Page ${n}`,
    prevPageAria: 'Previous page',
    nextPageAria: 'Next page',
  },

  filters: {
    orderIdPlaceholder: 'Order ID',
    customerPlaceholder: 'Customer name',
    dateRangePlaceholder: 'Date range',
    clearDateRangeAria: 'Clear date range',
    prevMonthAria: 'Previous month',
    nextMonthAria: 'Next month',
    dowShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  },

  bulk: {
    selected: (n) => `${n} ${n === 1 ? 'order' : 'orders'} selected`,
    exportSelected: 'Export selected',
    cancelSelected: 'Cancel selected',
    clearAria: 'Clear selection',
  },

  density: {
    label: 'Row density',
    comfortable: 'Comfortable',
    compact: 'Compact',
  },

  stats: {
    totalOrders: 'Total orders',
    inProduction: 'In production',
    delayed: 'Delayed',
    totalWafers: 'Total wafers',
  },

  statuses: {
    ALL: 'All statuses',
    IN_PRODUCTION: 'In production',
    SCHEDULED: 'Scheduled',
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  },

  schedule: {
    onTrack: 'On track',
    delayedDays: (d) => `Delayed ${d}d`,
    showConflict: 'Show conflict details',
    hideConflict: 'Hide conflict details',
  },

  orderSlots: {
    title: 'Production schedule',
    summary: (days, qty) => `${days} day${days === 1 ? '' : 's'} · ${qty} wafers`,
    columns: {
      date: 'Date',
      qty: 'Quantity',
      share: 'Share',
    },
    empty: 'No production slots assigned yet.',
    loading: 'Loading schedule…',
    loadError: 'Could not load schedule. Please try again.',
    regionAria: (id) => `Production schedule for ${id}`,
    toggleShow: 'Show production dates',
    toggleHide: 'Hide production dates',
  },

  editOrder: {
    breadcrumbRoot: 'Wafer orders',
    breadcrumbEdit: 'Edit',
    backAria: 'Back to orders',
    title: 'Edit order',
    subtitle:
      'Update quantity or due date. Customer and status cannot be changed from this screen.',

    staleTitle: 'Another user has modified this order',
    staleBodyPrefix: 'Edited by ',
    staleBodySuffix:
      '. Reload to see the latest data and prevent overriding their changes.',
    staleReload: 'Reload now',

    readOnlyTag: 'READ-ONLY',
    customerLabel: 'Customer',
    statusLabel: 'Current status',
    createdLabel: 'Created',
    lastEditLabel: 'Last edit',
    byLabel: ' by ',

    editableTag: 'EDITABLE FIELDS',
    qtyLabel: 'Quantity (Wafers)',
    qtyRange: (min, max) => `${min} – ${max.toLocaleString()}`,
    qtyHelp: (min, max) =>
      `Minimum: ${min}, Maximum: ${max.toLocaleString()}`,
    qtyWithinRange: 'Within range',
    qtyRequired: 'Quantity is required.',
    qtySuffix: 'wafers',

    dueLabel: 'Customer requested due date',
    leadTimeHelp: (min, max) =>
      `Production typically requires ${min}–${max} weeks lead time`,

    scheduleWarning:
      'Note: changing quantity or due date will release the original factory capacity and trigger a global reschedule, which may shift the final scheduled date.',

    cancelBtn: 'Cancel',
    reloadBtn: 'Reload data',
    reloadingBtn: 'Reloading…',
    saveBtn: 'Save changes',
    savingBtn: 'Saving…',
    saveDisabledTooltip: 'Reload required before saving',

    minutesAgo: (n) => `${n} min ago`,
    inDays: (n) => `in ${n} days`,
  },

  createOrder: {
    backAria: 'Back to orders',
    title: 'Create new order',
    subtitle: 'Submit a new wafer production order to the schedule',
    sectionTitle: 'Order details',
    sectionHint: 'All fields are required',
    customerLabel: 'Customer',
    qtyLabel: 'Quantity (Wafers)',
    qtyHint: (min, max) => `${min} – ${max.toLocaleString()}`,
    qtyHelp: (min, max) =>
      `Minimum: ${min}, Maximum: ${max.toLocaleString()}`,
    dueLabel: 'Customer requested due date',
    leadTimeHelp: (min, max) =>
      `Production typically requires ${min}–${max} weeks lead time`,
    infoBanner:
      'The system will automatically check factory capacity for the next 90 days. If full, the earliest available expected date will be calculated for you.',
    cancelBtn: 'Cancel',
    submitBtn: 'Submit order',
    submittingBtn: 'Submitting…',
  },

  customerSelect: {
    placeholder: 'Search and select a customer...',
    empty: (q) => `No customers match "${q}".`,
    addNew: 'Add new customer',
    addNewWithName: (name) => `Add new customer "${name}"`,
  },

  addCustomer: {
    title: 'Add new customer',
    hint: 'Newly added customers will be available for future orders.',
    nameLabel: 'Customer name',
    namePlaceholder: 'e.g. MediaTek',
    codeLabel: 'Customer code (optional)',
    codePlaceholder: 'Auto-generated when blank',
    nameRequired: 'Customer name is required.',
    cancel: 'Cancel',
    add: 'Add customer',
  },

  datePicker: {
    placeholder: 'Pick a date',
    openAria: 'Open calendar',
    prevMonthAria: 'Previous month',
    nextMonthAria: 'Next month',
    today: 'Today',
    close: 'Close',
    weeksOut: (w) => `~${w} weeks out`,
    daysOut: (d) => `${d} days out`,
    todayLabel: 'Today',
    monthFormat: { month: 'long', year: 'numeric' },
    dateFormat: { month: 'short', day: 'numeric', year: 'numeric' },
    dowShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  },

  quantity: {
    increase: 'Increase quantity',
    decrease: 'Decrease quantity',
    invalidNumber: 'Please enter a valid number.',
    belowMin: (min, max) =>
      `Below minimum. Enter a value between ${min} and ${max.toLocaleString()}.`,
    aboveMax: (min, max) =>
      `Above maximum. Enter a value between ${min} and ${max.toLocaleString()}.`,
  },

  scheduleAlert: {
    title: 'Schedule delay notice',
    subtitle: 'Factory capacity is full',
    body: 'Factory capacity is full and this order cannot complete by the requested date. The earliest available date has been calculated. Accept the new expected date?',
    requestedDate: 'Requested date',
    earliestDate: 'Earliest available',
    delayPill: (days) => `+${days} days`,
    defaultWarning: (n) =>
      `${n} order(s) currently use this capacity window; the new date is the next available production slot.`,
    cancel: 'Cancel order',
    accept: 'Accept new date',
    cancelling: 'Cancelling…',
    accepting: 'Working…',
  },

  calendar: {
    title: 'Production calendar',
    subtitle: 'Daily wafer capacity across all production lines',
    rescheduleAll: 'Reschedule all',
    footerHint:
      'Click any day to view scheduled orders · Drag-and-drop to reschedule',
    lastSync: (sec) => `Last sync ${sec} sec ago`,
  },

  userAdmin: {
    title: 'User management',
    subtitle: 'Manage user roles and permissions',
    columns: {
      username: 'Username',
      displayName: 'Name',
      role: 'Role',
      createdAt: 'Created',
      actions: 'Actions',
    },
    roleLabels: {
      SUPER_ADMIN: 'Super admin',
      ADMIN: 'Admin',
      VIEWER: 'Viewer',
    },
    actions: {
      promote: 'Promote to admin',
      demote: 'Demote to viewer',
      pending: 'Working…',
    },
    badgeSelf: 'You',
    superLocked: 'Super admin role cannot be changed',
    loadError: 'Could not load users. Please try again.',
    forbiddenTitle: 'No access',
    forbiddenBody: 'Only super admins can change user roles.',
    backToOrders: 'Back to orders',
    toast: {
      promoteSuccess: (name) => `${name} promoted to admin`,
      demoteSuccess: (name) => `${name} demoted to viewer`,
      updateError: 'Failed to update user. Please try again.',
    },
    empty: 'No other users to manage.',
  },
}

export default en
