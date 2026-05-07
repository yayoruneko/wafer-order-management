export const DAILY_CAPACITY = 10000

export const FACTORIES = [
  { id: 'FAB-001', name: 'FAB-001', status: 'normal' },
  { id: 'FAB-002', name: 'FAB-002', status: 'normal' },
  { id: 'FAB-003', name: 'FAB-003', status: 'maintenance' },
]

export const productionCalendar = {
  'FAB-001': {
    '2026-04-27': { count: 5200 },
    '2026-04-28': { count: 6800 },
    '2026-04-29': { count: 7100 },
    '2026-04-30': { count: 8400 },
    '2026-05-01': { count: 5400 },
    '2026-05-02': { count: 3200 },
    '2026-05-03': { count: 2800 },
    '2026-05-04': { count: 7200 },
    '2026-05-05': { count: 6100 },
    '2026-05-06': { count: 7800 },
    '2026-05-07': { count: 8400 },
    '2026-05-08': { count: 9100 },
    '2026-05-09': { count: 4200 },
    '2026-05-10': { count: 3500 },
    '2026-05-11': { count: 7400 },
    '2026-05-12': { count: 8000 },
    '2026-05-13': { count: 9400 },
    '2026-05-14': { count: 5800 },
    '2026-05-15': { count: 6500 },
    '2026-05-16': { count: 3100 },
    '2026-05-17': { count: 2800 },
    '2026-05-18': { count: 9200 },
    '2026-05-19': { count: 9600 },
    '2026-05-20': { count: 10000 },
    '2026-05-21': {
      count: 10000,
      delayedOrders: [
        {
          id: 'WO-2026-118',
          customerCode: 'CUST-005',
          customerName: 'TSMC',
          customerColor: '#E60012',
          qty: 1800,
          requestedDate: '2026-05-21',
          rescheduledDate: '2026-05-25',
          delayDays: 4,
          scheduleWarning:
            '當日產能已達上限，原本排入此日的後段訂單需順延至最近可排日期。',
        },
      ],
    },
    '2026-05-22': { count: 9300 },
    '2026-05-23': { count: 5500 },
    '2026-05-24': { count: 3200 },
    '2026-05-25': { count: 7900 },
    '2026-05-26': { count: 8200 },
    '2026-05-27': { count: 9500 },
    '2026-05-28': {
      count: 10000,
      delayedOrders: [
        {
          id: 'WO-2026-126',
          customerCode: 'CUST-012',
          customerName: 'Samsung',
          customerColor: '#1428A0',
          qty: 2400,
          requestedDate: '2026-05-28',
          rescheduledDate: '2026-06-02',
          delayDays: 5,
          scheduleWarning:
            'FAB-001 在此日已滿載，系統自動將此筆訂單延後至下一個可排程日。',
        },
      ],
    },
    '2026-05-29': { count: 7100 },
    '2026-05-30': { count: 2400 },
    '2026-05-31': { count: 1800 },
  },
}

export const utilizationDelta = {
  'FAB-001': { vsPrevMonth: 4 },
}
