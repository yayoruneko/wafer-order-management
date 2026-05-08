import { memo } from 'react'
import { styles } from '../../styles/orderListStyles'

function FilterTabsBase({ tabs, activeId, onChange }) {
  return (
    <div className={styles.tabsBar}>
      {tabs.map((tab) => {
        const active = tab.id === activeId
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange?.(tab.id)}
            className={active ? styles.tabBtnActive : styles.tabBtn}
          >
            {tab.label}
            <span className={active ? styles.tabCountActive : styles.tabCount}>
              {tab.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default memo(FilterTabsBase)
