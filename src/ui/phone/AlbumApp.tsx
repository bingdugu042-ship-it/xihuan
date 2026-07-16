import { useEffect, useState } from 'react'
import { Sparkles, Trash2, ImagePlus, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAlbumStore } from '@/store/albumStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useUIStore } from '@/store/uiStore'
import { generateImage } from '@/ai/contentClient'
import { PhoneAppShell } from './PhoneAppShell'

export function AlbumApp() {
  const { images, loaded, load, removeImage } = useAlbumStore()
  const { settings } = useSettingsStore()
  const showToast = useUIStore((s) => s.showToast)
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!loaded) void load()
  }, [loaded, load])

  const onGenerate = async () => {
    const p = prompt.trim()
    if (!p || generating) return
    setGenerating(true)
    showToast('正在生图…', '后台生成中，完成后会通知你')
    try {
      const url = await generateImage(settings, p, { source: 'album' })
      setPreview(url)
      showToast('图片已生成', '已保存至相册')
    } catch (e) {
      showToast('生图失败', e instanceof Error ? e.message : '未知错误')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <PhoneAppShell title="相册">
      <p className="mb-3 text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
        所有 AI 生成的图片都会保存在这里
      </p>

      <div className="glass-card mb-4 p-3">
        <p className="mb-2 flex items-center gap-1 text-xs" style={{ color: 'var(--c-text)' }}>
          <Sparkles size={14} /> AI 生图
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="描述你想生成的画面…"
          className="mb-2 w-full rounded-lg px-3 py-2 text-xs outline-none"
          style={{ background: 'var(--c-bg-soft)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
        />
        <button
          type="button"
          disabled={generating || !prompt.trim()}
          onClick={() => void onGenerate()}
          className="flex w-full items-center justify-center gap-1 rounded-lg py-2 text-sm disabled:opacity-50"
          style={{ background: 'var(--c-primary)', color: '#fff' }}
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
          {generating ? '生成中…' : '生成并保存'}
        </button>
      </div>

      {preview && (
        <div className="glass-card mb-4 overflow-hidden p-2">
          <img src={preview} alt="" className="w-full rounded-lg" />
        </div>
      )}

      {!loaded ? (
        <p className="text-center text-xs" style={{ color: 'var(--c-text-dim)' }}>加载中…</p>
      ) : images.length === 0 ? (
        <p className="text-center text-xs" style={{ color: 'var(--c-text-dim)' }}>
          还没有图片，聊天拍照、监控截图或上方生图后会出现在这里
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {images.map((img) => (
            <motion.div key={img.id} layout className="glass-card group relative overflow-hidden p-1">
              <button type="button" onClick={() => setPreview(img.url)} className="block w-full">
                <img src={img.url} alt="" className="aspect-square w-full rounded-lg object-cover" />
              </button>
              <button
                type="button"
                onClick={() => void removeImage(img.id)}
                className="absolute right-2 top-2 rounded-full p-1 opacity-0 transition-opacity group-hover:opacity-100"
                style={{ background: 'rgba(0,0,0,0.55)' }}
              >
                <Trash2 size={12} color="#fff" />
              </button>
              {img.prompt && (
                <p className="mt-1 truncate px-1 text-[9px]" style={{ color: 'var(--c-text-dim)' }}>
                  {img.prompt}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </PhoneAppShell>
  )
}
