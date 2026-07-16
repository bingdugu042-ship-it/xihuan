import { motion } from 'framer-motion'
import { useSettingsStore } from '../../store/settingsStore'

export function AgeGate() {
  const { settings, updateUI } = useSettingsStore()

  if (settings.ui.ageConfirmed) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-[100] flex flex-col items-center justify-center px-8 text-center"
      style={{ background: 'rgba(8,5,8,0.96)', backdropFilter: 'blur(10px)' }}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex max-w-sm flex-col items-center"
      >
        <p
          className="text-3xl tracking-widest"
          style={{ fontFamily: 'var(--font-dialogue)', color: '#d4b56a' }}
        >
          西幻万人迷
        </p>
        <p className="mt-2 text-sm" style={{ color: '#a89888' }}>
          艾尔茜利恩 · 成年向冒险之书
        </p>

        <div
          className="mt-6 w-full rounded-2xl p-4 text-left text-[13px] leading-relaxed"
          style={{ border: '1px solid rgba(212,181,106,0.3)', color: '#f5e6d3' }}
        >
          <p>本作包含明确成人向虚构互动（18+）：</p>
          <ul className="mt-2 list-disc pl-4" style={{ color: '#a89888' }}>
            <li>西幻乙游 / 后宫收编 / 轻跑团骰子分歧</li>
            <li>纯前端运行，存档在本地浏览器</li>
            <li>可用命令控制节奏与回溯</li>
          </ul>
        </div>

        <p className="mt-4 text-xs" style={{ color: '#a89888' }}>
          请确认您已年满 18 周岁
        </p>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => updateUI({ ageConfirmed: true })}
            className="rounded-xl px-5 py-2.5 text-sm tracking-wide"
            style={{ background: 'linear-gradient(135deg,#d4b56a,#a67c3a)', color: '#1a0f12' }}
          >
            我已满 18 岁，翻开书卷
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
