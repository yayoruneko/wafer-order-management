import { memo } from 'react'
import { createOrderStyles as s } from '../../styles/createOrderStyles'

function FormFieldBase({ label, hint, error, helpText, children, className = '' }) {
  return (
    <div className={`${s.field} ${className}`}>
      <div className={s.labelRow}>
        <label className={s.label}>{label}</label>
        {hint ? <span className={s.labelHint}>{hint}</span> : null}
      </div>
      {children}
      {error ? (
        <span className={s.errorText}>
          <svg
            viewBox="0 0 16 16"
            className={s.errorIcon}
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zm-.75 3.5h1.5v4h-1.5V5zm0 5.5h1.5V12h-1.5v-1.5z" />
          </svg>
          {error}
        </span>
      ) : null}
      {helpText ? <span className={s.helpText}>{helpText}</span> : null}
    </div>
  )
}

export default memo(FormFieldBase)
