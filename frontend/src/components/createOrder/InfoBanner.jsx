import { memo } from 'react'
import { Info } from 'lucide-react'
import { createOrderStyles as s } from '../../styles/createOrderStyles'

function InfoBannerBase({ children }) {
  return (
    <div className={s.banner} role="note">
      <Info className={s.bannerIcon} />
      <p className={s.bannerText}>{children}</p>
    </div>
  )
}

export default memo(InfoBannerBase)
