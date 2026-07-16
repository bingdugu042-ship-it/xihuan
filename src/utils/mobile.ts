/** 是否为触屏 / 手机类设备（用于移动端专属布局） */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.matchMedia('(max-width: 768px)').matches
  const ua = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  return (coarse && narrow) || ua
}

/** 布局视口高度（键盘弹出时 iOS 通常不变） */
export function getLayoutViewportHeight(): number {
  return window.innerHeight
}
