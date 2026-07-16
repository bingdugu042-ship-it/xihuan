import { useEffect, useState } from 'react'
import { isMobileDevice } from '@/utils/mobile'

export interface MobileKeyboardInset {
  /** 键盘遮挡底部高度（px） */
  bottomInset: number
  keyboardOpen: boolean
  /** visualViewport 可视高度 */
  vvHeight: number
  vvOffsetTop: number
}

function syncCssVars(inset: number, vvHeight: number, vvOffsetTop: number, open: boolean) {
  const root = document.documentElement
  root.style.setProperty('--kb-inset', `${inset}px`)
  root.style.setProperty('--vv-height', `${vvHeight}px`)
  root.style.setProperty('--vv-offset-top', `${vvOffsetTop}px`)
  root.classList.toggle('mobile-keyboard-open', open)
}

/** 键盘遮挡底部高度（visualViewport 与 layout 视口差值） */
export function useMobileKeyboardInset(): MobileKeyboardInset {
  const [bottomInset, setBottomInset] = useState(0)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const [vvHeight, setVvHeight] = useState(() =>
    typeof window !== 'undefined' ? Math.round(window.visualViewport?.height ?? window.innerHeight) : 0,
  )
  const [vvOffsetTop, setVvOffsetTop] = useState(0)

  useEffect(() => {
    if (!isMobileDevice()) return

    const vv = window.visualViewport
    if (!vv) return

    const update = () => {
      const layoutH = window.innerHeight
      const height = Math.round(vv.height)
      const top = Math.round(vv.offsetTop)
      // iOS/Android：键盘弹起后可视区变矮
      const inset = Math.max(0, Math.round(layoutH - height - top))
      const open = inset > 48 || (height > 0 && height < layoutH * 0.78)
      setBottomInset(inset)
      setKeyboardOpen(open)
      setVvHeight(height)
      setVvOffsetTop(top)
      syncCssVars(inset, height, top, open)
    }

    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    window.addEventListener('orientationchange', update)
    window.addEventListener('resize', update)

    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      window.removeEventListener('orientationchange', update)
      window.removeEventListener('resize', update)
      syncCssVars(0, window.innerHeight, 0, false)
    }
  }, [])

  return { bottomInset, keyboardOpen, vvHeight, vvOffsetTop }
}
