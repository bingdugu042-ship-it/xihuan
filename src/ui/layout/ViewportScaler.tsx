import { useRef, useState, useLayoutEffect } from 'react'
import { useSettingsStore } from '@/store/settingsStore'
import { useStableViewportHeight } from '@/hooks/useStableViewportHeight'
import { useMobileKeyboardInset } from '@/hooks/useMobileKeyboardInset'
import { getLayoutViewportHeight, isMobileDevice } from '@/utils/mobile'

/** 全局视口缩放：宽高 + scale，并自动 fit 屏幕避免裁切底部导航 */
export function ViewportScaler({ children }: { children: React.ReactNode }) {
  const { chatWidth, chatHeight, chatScale } = useSettingsStore((s) => s.settings.ui)
  const { hostRef: stableHostRef, stableHeightRef } = useStableViewportHeight()
  const { keyboardOpen, vvHeight, vvOffsetTop } = useMobileKeyboardInset()
  const hostRef = useRef<HTMLDivElement>(null)
  const [fitScale, setFitScale] = useState(1)
  const [mobileHeight, setMobileHeight] = useState<number | null>(null)
  const mobile = isMobileDevice()

  useLayoutEffect(() => {
    const calc = () => {
      const host = hostRef.current
      if (!host) return
      const pad = mobile ? 0 : 8
      const availW = host.clientWidth - pad || window.innerWidth - pad
      const layoutH = Math.max(stableHeightRef.current, getLayoutViewportHeight())

      if (mobile) {
        // 键盘弹起：用可视高度，输入框始终落在可见区
        const h = keyboardOpen && vvHeight > 0 ? vvHeight : layoutH
        setMobileHeight(Math.max(240, Math.round(h - pad)))
        // 铺满屏宽；用户缩放仍生效
        setFitScale(1)
        return
      }

      setMobileHeight(null)
      const sx = availW / Math.max(chatWidth, 1)
      const sy = (host.clientHeight - pad) / Math.max(chatHeight, 1)
      setFitScale(Math.min(sx, sy, 1))
    }
    calc()
    const ro = new ResizeObserver(calc)
    if (hostRef.current) ro.observe(hostRef.current)
    window.addEventListener('resize', calc)
    window.visualViewport?.addEventListener('resize', calc)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', calc)
      window.visualViewport?.removeEventListener('resize', calc)
    }
  }, [chatWidth, chatHeight, mobile, stableHeightRef, keyboardOpen, vvHeight])

  const effectiveScale = mobile ? Math.min(chatScale, 1.15) * fitScale : chatScale * fitScale

  const setHostRef = (el: HTMLDivElement | null) => {
    hostRef.current = el
    stableHostRef.current = el
    if (el && mobile) {
      const h =
        keyboardOpen && vvHeight > 0
          ? vvHeight
          : Math.max(stableHeightRef.current, getLayoutViewportHeight())
      el.style.height = `${Math.round(h)}px`
      el.style.marginTop = keyboardOpen && vvOffsetTop > 0 ? `${vvOffsetTop}px` : '0'
    }
  }

  return (
    <div
      ref={setHostRef}
      className={`viewport-host${mobile ? ' viewport-host--mobile' : ''}${keyboardOpen ? ' viewport-host--kb' : ''}`}
    >
      <div
        className="viewport-scaler"
        style={{
          width: mobile ? '100%' : chatWidth,
          maxWidth: mobile ? '100vw' : undefined,
          height: mobile ? mobileHeight ?? '100%' : chatHeight,
          transform:
            mobile && Math.abs(effectiveScale - 1) < 0.02
              ? undefined
              : `scale(${effectiveScale})`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
