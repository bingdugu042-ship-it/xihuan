import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ImageIcon, Camera, Sparkles } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useSessionStore } from '@/store/sessionStore'
import { useDataStore } from '@/store/dataStore'
import { useSettingsStore } from '@/store/settingsStore'
import { buildPhotoPromptFromChat, generateImage } from '@/ai/contentClient'

export function ImagePickerModal() {
  const open = useUIStore((s) => s.imagePickerOpen)
  const purpose = useUIStore((s) => s.imagePickerPurpose)
  const setOpen = useUIStore((s) => s.setImagePickerOpen)
  const showToast = useUIStore((s) => s.showToast)
  const appendUserMessage = useSessionStore((s) => s.appendUserMessage)
  const { activeSession } = useSessionStore()
  const { characters, regions } = useDataStore()
  const { settings } = useSettingsStore()
  const albumRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const title = purpose === 'photo' ? '拍照' : '发送图片'

  const onFile = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const caption = purpose === 'photo' ? '📷 给你看张照片' : '🖼️ 发送了一张图片'
      void appendUserMessage(caption, { imageUrl: dataUrl })
      setOpen(false)
    }
    reader.readAsDataURL(file)
  }

  const aiPhoto = () => {
    if (busy) return
    setBusy(true)
    showToast('正在拍照…', '根据最近对话生成画面')

    void (async () => {
      try {
        const charId = activeSession?.participantIds[0]
        const c = charId ? characters[charId] : null
        const region = activeSession ? regions[activeSession.regionId] : null
        const recent = (activeSession?.messages ?? [])
          .filter((m) => m.role === 'user' || m.role === 'character')
          .slice(-2)
          .map((m) => m.text)

        const prompt = buildPhotoPromptFromChat({
          characterName: c?.name,
          regionName: region?.name,
          recentLines: recent,
        })
        const url = await generateImage(settings, prompt, { source: 'photo' })
        await appendUserMessage('📷 AI 拍照', { imageUrl: url })
        showToast('拍照完成', '图片已存入相册')
        setOpen(false)
      } catch (e) {
        await appendUserMessage(`📷 拍照失败：${e instanceof Error ? e.message : '未知错误'}`)
        showToast('拍照失败', e instanceof Error ? e.message : '未知错误')
        setOpen(false)
      } finally {
        setBusy(false)
      }
    })()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[120]" style={{ background: 'rgba(0,0,0,0.55)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
          <motion.div className="glass-card fixed left-1/2 top-1/2 z-[121] w-[min(320px,90vw)] -translate-x-1/2 -translate-y-1/2 p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>{title}</h3>
              <button onClick={() => setOpen(false)} style={{ color: 'var(--c-text-dim)' }}><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-2">
              {purpose === 'photo' && (
                <button type="button" disabled={busy} onClick={aiPhoto} className="flex items-center gap-3 rounded-xl p-3 disabled:opacity-50" style={{ background: 'var(--c-primary-soft)', border: '1px solid var(--c-primary)' }}>
                  <Sparkles size={20} style={{ color: 'var(--c-primary)' }} />
                  <div className="text-left">
                    <p className="text-sm" style={{ color: 'var(--c-text)' }}>AI 拍照（生图）</p>
                    <p className="text-[10px]" style={{ color: 'var(--c-text-dim)' }}>根据最近一轮对话生成画面</p>
                  </div>
                </button>
              )}
              <button type="button" onClick={() => albumRef.current?.click()} className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'var(--c-bg-soft)', border: '1px solid var(--c-border)' }}>
                <ImageIcon size={20} style={{ color: 'var(--c-primary)' }} />
                <div className="text-left">
                  <p className="text-sm" style={{ color: 'var(--c-text)' }}>从相册选择</p>
                </div>
              </button>
              <button type="button" onClick={() => cameraRef.current?.click()} className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'var(--c-bg-soft)', border: '1px solid var(--c-border)' }}>
                <Camera size={20} style={{ color: 'var(--c-primary)' }} />
                <div className="text-left">
                  <p className="text-sm" style={{ color: 'var(--c-text)' }}>打开摄像头</p>
                </div>
              </button>
            </div>
            <input ref={albumRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
