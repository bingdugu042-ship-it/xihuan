import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useState } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useCustomRegionStore } from '@/store/customRegionStore'
import { useDataStore } from '@/store/dataStore'

export function WorldTreeModal() {
  const open = useUIStore((s) => s.worldTreeModalOpen)
  const setOpen = useUIStore((s) => s.setWorldTreeModalOpen)
  const add = useCustomRegionStore((s) => s.add)
  const { characters } = useDataStore()
  const charList = Object.values(characters)
  const showToast = useUIStore((s) => s.showToast)

  const [name, setName] = useState('')
  const [premise, setPremise] = useState('')
  const [mapNote, setMapNote] = useState('')
  const [mapStyle, setMapStyle] = useState('')
  const [mapX, setMapX] = useState('50')
  const [mapY, setMapY] = useState('50')
  const [participantIds, setParticipantIds] = useState<string[]>([])

  const toggleChar = (id: string) => {
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const submit = async () => {
    if (!name.trim()) {
      showToast('请填写地点名称')
      return
    }
    await add({
      name: name.trim(),
      premise: premise.trim() || `线下·${name.trim()}。`,
      participantIds,
      type: participantIds.length > 1 ? 'group' : 'private',
      mapNote: mapNote.trim() || undefined,
      mapStyle: mapStyle.trim() || undefined,
      mapX: Math.min(100, Math.max(0, Number(mapX) || 50)),
      mapY: Math.min(100, Math.max(0, Number(mapY) || 50)),
      worldbook: [
        `【自定义地点 · ${name.trim()}】`,
        `位置/角标：${mapNote.trim() || '未标注'}`,
        `样式：${mapStyle.trim() || '未定'}`,
        premise.trim() || `旅者可在此游玩；AI 须严格读取本地点。`,
      ].join('\n'),
    })
    setName('')
    setPremise('')
    setMapNote('')
    setMapStyle('')
    setParticipantIds([])
    setOpen(false)
    showToast('自定义地点已创建', '地图与出发冒险可进入')
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[120]"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            className="glass-card fixed left-1/2 top-1/2 z-[121] max-h-[85vh] w-[92%] max-w-[400px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium">添加自定义地点</h3>
              <button type="button" onClick={() => setOpen(false)} className="p-1">
                <X size={18} />
              </button>
            </div>
            <p className="mb-2 text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
              填写名称与坐标后，会钉在大地图上；点钉即可进入聊天（AI 读取地点世界书）。
            </p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="地点名称，如：地下酒窖"
              className="mb-2 w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--c-bg-soft)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
            />
            <textarea
              value={premise}
              onChange={(e) => setPremise(e.target.value)}
              placeholder="场景描写（AI 会读）"
              rows={3}
              className="mb-2 w-full resize-none rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--c-bg-soft)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
            />
            <input
              value={mapNote}
              onChange={(e) => setMapNote(e.target.value)}
              placeholder="地图角标 / 位置描述，如：帝都西门外"
              className="mb-2 w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--c-bg-soft)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
            />
            <input
              value={mapStyle}
              onChange={(e) => setMapStyle(e.target.value)}
              placeholder="样式：古堡 / 林地废墟 / 霓虹酒馆…"
              className="mb-2 w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--c-bg-soft)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
            />
            <div className="mb-3 flex gap-2">
              <input
                value={mapX}
                onChange={(e) => setMapX(e.target.value)}
                placeholder="地图 X%"
                className="w-1/2 rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--c-bg-soft)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
              />
              <input
                value={mapY}
                onChange={(e) => setMapY(e.target.value)}
                placeholder="地图 Y%"
                className="w-1/2 rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--c-bg-soft)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
              />
            </div>
            <p className="mb-2 text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
              选择在场角色（可空，之后再招）
            </p>
            <div className="mb-3 flex flex-wrap gap-2">
              {charList.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleChar(c.id)}
                  className="rounded-full px-3 py-1 text-[11px]"
                  style={{
                    background: participantIds.includes(c.id) ? 'var(--c-primary-soft)' : 'transparent',
                    border: `1px solid ${participantIds.includes(c.id) ? 'var(--c-primary)' : 'var(--c-border)'}`,
                    color: participantIds.includes(c.id) ? 'var(--c-primary)' : 'var(--c-text-dim)',
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={!name.trim()}
              className="w-full rounded-lg py-2.5 text-sm disabled:opacity-40"
              style={{ background: 'var(--c-primary)', color: '#fff' }}
            >
              创建地点并写入世界书
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
