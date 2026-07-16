import { useMobileKeyboardInset } from '@/hooks/useMobileKeyboardInset'

/** 挂载 hook，确保全局 --kb-inset / mobile-keyboard-open 始终同步 */
export function MobileKeyboardBodySync() {
  useMobileKeyboardInset()
  return null
}
