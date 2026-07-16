const STYLE_ID = 'user-custom-css'

/** 注入用户自定义 CSS（覆盖主题）。传空串则移除。 */
export function injectUserCSS(css: string): void {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!css.trim()) {
    if (el) el.remove()
    return
  }
  if (!el) {
    el = document.createElement('style')
    el.id = STYLE_ID
    document.head.appendChild(el)
  }
  el.textContent = css
}

/** 读取本地 .css 文件为文本 */
export function readCSSFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })
}
