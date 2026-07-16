import { useEffect, useRef } from 'react'
import { getLayoutViewportHeight, isMobileDevice } from '@/utils/mobile'

/**
 * 移动端锁定布局高度，避免软键盘弹出时 100dvh 变小导致整页 scale 缩小。
 * 返回 ref，供 ViewportScaler 绑定到 host。
 */
export function useStableViewportHeight() {
  const hostRef = useRef<HTMLDivElement>(null)
  const stableHeightRef = useRef(getLayoutViewportHeight())

  useEffect(() => {
    if (!isMobileDevice()) return

    const syncHeight = () => {
      const host = hostRef.current
      if (!host) return
      const layoutH = getLayoutViewportHeight()
      stableHeightRef.current = Math.max(stableHeightRef.current, layoutH)
      host.style.height = `${stableHeightRef.current}px`
    }

    syncHeight()
    window.addEventListener('orientationchange', syncHeight)
    window.addEventListener('resize', syncHeight)

    return () => {
      window.removeEventListener('orientationchange', syncHeight)
      window.removeEventListener('resize', syncHeight)
    }
  }, [])

  return { hostRef, stableHeightRef }
}
