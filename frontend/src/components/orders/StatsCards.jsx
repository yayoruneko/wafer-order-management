import { memo } from 'react'
import { styles } from '../../styles/orderListStyles'
import useI18n from '../../i18n/useI18n'

function StatsCardsBase({ total, inProduction, delayed, totalWafers }) {
  const { t, lang } = useI18n()
  const fmt = (n) => n.toLocaleString(lang === 'en' ? 'en-US' : 'zh-TW')
  return (
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <div className={styles.statLabel}>{t.stats.totalOrders}</div>
        <div className={styles.statValue}>{fmt(total)}</div>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statLabel}>{t.stats.inProduction}</div>
        <div className={styles.statValueGreen}>{fmt(inProduction)}</div>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statLabel}>{t.stats.delayed}</div>
        <div className={styles.statValueRed}>{fmt(delayed)}</div>
      </div>
      <div className={styles.statCard}>
        <div className={styles.statLabel}>{t.stats.totalWafers}</div>
        <div className={styles.statValue}>{fmt(totalWafers)}</div>
      </div>
    </div>
  )
}

export default memo(StatsCardsBase)
