import { useEffect, useState } from 'react'
import { isMobileDevice } from '@/utils/mobile'

/** 响应式移动端判定（随窗口 / 指针类型变化） */
export function useIsMobileLayout(): boolean {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' ? isMobileDevice() : true,
  )

  useEffect(() => {
    const update = () => setMobile(isMobileDevice())
    update()
    const mqs = [
      window.matchMedia('(max-width: 768px)'),
      window.matchMedia('(pointer: coarse)'),
    ]
    mqs.forEach((mq) => mq.addEventListener('change', update))
    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('resize', update)
    return () => {
      mqs.forEach((mq) => mq.removeEventListener('change', update))
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
    }
  }, [])

  return mobile
}
