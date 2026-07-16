import type { LayoutTemplateId } from '@/types'

export interface LayoutSchemeMeta {
  id: LayoutTemplateId
  name: string
  subtitle: string
  keywords: string
  recommended?: boolean
}

export const LAYOUT_SCHEMES: LayoutSchemeMeta[] = [
  {
    id: 'classic',
    name: '经典布局',
    subtitle: '底部五栏导航 · 原版操作中心',
    keywords: '域界 / 沉浸 / 图鉴 / 手机 / 设置',
  },
  {
    id: 'scheme_a',
    name: '方案 A · 暗金赌场',
    subtitle: '三栏式 · 奢华私密仪式感',
    keywords: '暗底色 + 金色点缀 + 毛玻璃 + 衬线标题',
    recommended: true,
  },
  {
    id: 'scheme_b',
    name: '方案 B · 霓虹游域界',
    subtitle: '单栏全宽 + 浮动面板',
    keywords: '深蓝紫底 + 霓虹粉青 + 发光边框',
  },
  {
    id: 'scheme_c',
    name: '方案 C · 温泉旅馆',
    subtitle: '双栏式 · 纸质便签质感',
    keywords: '米白暖木 + 深棕文字 + 印章红',
  },
]

const STYLE_ID = 'layout-scheme-vars'

const SCHEME_CSS: Record<LayoutTemplateId, string> = {
  classic: '',
  scheme_a: `
:root[data-layout-scheme="scheme_a"] {
  --c-bg: #1a1a1e;
  --c-bg-soft: rgba(0,0,0,0.45);
  --c-surface: rgba(0,0,0,0.6);
  --c-text: #e8e4df;
  --c-text-dim: #a8a29e;
  --c-primary: #c9a96e;
  --c-primary-soft: rgba(201, 169, 110, 0.18);
  --c-accent: #c9a96e;
  --c-glass-border: rgba(201, 169, 110, 0.22);
  --c-border: rgba(201, 169, 110, 0.15);
  --c-bubble-mine: rgba(60, 55, 50, 0.85);
  --c-bubble-her: rgba(201, 169, 110, 0.12);
  --scheme-danger: #8b3a4a;
  --scheme-title-font: Georgia, "Noto Serif SC", serif;
  --bg-gradient: linear-gradient(180deg, #1b121e 0%, #1a1a1e 100%);
}`,
  scheme_b: `
:root[data-layout-scheme="scheme_b"] {
  --c-bg: #0a0e1a;
  --c-bg-soft: rgba(10, 14, 26, 0.8);
  --c-surface: rgba(12, 18, 36, 0.75);
  --c-text: #f0f4ff;
  --c-text-dim: #8b9dc4;
  --c-primary: #ff2d95;
  --c-primary-soft: rgba(255, 45, 149, 0.15);
  --c-accent: #00f0ff;
  --c-glass-border: rgba(0, 240, 255, 0.35);
  --c-border: rgba(255, 45, 149, 0.25);
  --c-bubble-mine: rgba(255, 45, 149, 0.2);
  --c-bubble-her: rgba(0, 240, 255, 0.1);
  --scheme-danger: #ff2d95;
  --scheme-title-font: "Courier New", monospace;
  --bg-gradient: linear-gradient(180deg, #0a0e1a 0%, #12082a 100%);
}`,
  scheme_c: `
:root[data-layout-scheme="scheme_c"] {
  --c-bg: #f5f0e6;
  --c-bg-soft: rgba(245, 240, 230, 0.9);
  --c-surface: rgba(255, 252, 245, 0.92);
  --c-text: #3c2415;
  --c-text-dim: #6b5344;
  --c-primary: #8b3a4a;
  --c-primary-soft: rgba(139, 58, 74, 0.12);
  --c-accent: #c9a96e;
  --c-glass-border: rgba(60, 36, 21, 0.15);
  --c-border: rgba(60, 36, 21, 0.12);
  --c-bubble-mine: rgba(139, 58, 74, 0.08);
  --c-bubble-her: rgba(255, 255, 255, 0.85);
  --scheme-danger: #8b3a4a;
  --scheme-title-font: "Noto Serif SC", "Songti SC", serif;
  --bg-gradient: linear-gradient(180deg, #faf6ee 0%, #f0e8d8 100%);
}`,
}

export function applyLayoutScheme(id: LayoutTemplateId): void {
  document.documentElement.dataset.layoutScheme = id
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  const css = SCHEME_CSS[id]
  if (!css) {
    if (el) el.remove()
    delete document.documentElement.dataset.layoutScheme
    return
  }
  if (!el) {
    el = document.createElement('style')
    el.id = STYLE_ID
    document.head.appendChild(el)
  }
  el.textContent = css
}
