import { memo } from 'react'
import { styles } from '../../styles/orderListStyles'

function PageBtnBase({ children, active = false, disabled = false, onClick, ariaLabel }) {
  const variant = active ? styles.pageBtnActive : styles.pageBtnIdle
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={active ? 'page' : undefined}
      className={`${styles.pageBtnBase} ${variant} disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  )
}

export default memo(PageBtnBase)
