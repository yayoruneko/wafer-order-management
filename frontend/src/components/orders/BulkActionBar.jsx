import { memo } from 'react'
import { Download, X } from 'lucide-react'
import { styles } from '../../styles/orderListStyles'
import useI18n from '../../i18n/useI18n'

function BulkActionBarBase({ count, onCancelSelected, onExportSelected, onClear }) {
  const { t } = useI18n()
  return (
    <div className={styles.bulkBar}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-7 w-7 items-center justify-center rounded text-white/70 hover:bg-white/10 hover:text-white"
          aria-label={t.bulk.clearAria}
        >
          <X className="h-4 w-4" />
        </button>
        <span className={styles.bulkText}>{t.bulk.selected(count)}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExportSelected}
          className={styles.bulkBtn}
        >
          <Download className="h-3.5 w-3.5" />
          {t.bulk.exportSelected}
        </button>
        <button
          type="button"
          onClick={onCancelSelected}
          className={styles.bulkBtnDanger}
        >
          {t.bulk.cancelSelected}
        </button>
      </div>
    </div>
  )
}

export default memo(BulkActionBarBase)
