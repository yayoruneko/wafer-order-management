import { memo } from 'react'
import { styles } from '../../styles/orderListStyles'
import useI18n from '../../i18n/useI18n'

function DensityToggleBase({ value, onChange }) {
  const { t } = useI18n()
  return (
    <div className={styles.densityWrap} role="group" aria-label={t.density.label}>
      <button
        type="button"
        onClick={() => onChange?.('comfortable')}
        className={
          value === 'comfortable' ? styles.densityBtnActive : styles.densityBtn
        }
      >
        {t.density.comfortable}
      </button>
      <button
        type="button"
        onClick={() => onChange?.('compact')}
        className={
          value === 'compact' ? styles.densityBtnActive : styles.densityBtn
        }
      >
        {t.density.compact}
      </button>
    </div>
  )
}

export default memo(DensityToggleBase)
