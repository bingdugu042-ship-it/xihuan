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

  const [name, setName] = useState('')
  const [premise, setPremise] = useState('')
  const [participantIds, setParticipantIds] = useState<string[]>([])

  const toggleChar = (id: string) => {
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const submit = async () => {
    if (!name.trim() || participantIds.length === 0) return
    await add({
      name: name.trim(),
      premise: premise.trim() || `线下·${name.trim()}。`,
      participantIds,
      type: participantIds.length > 1 ? 'group' : 'private',
    })
    setName('')
    setPremise('')
    setParticipantIds([])
    setOpen(false)
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
            className="glass-card fixed left-1/2 top-1/2 z-[121] w-[92%] max-w-[400px] -translate-x-1/2 -translate-y-1/2 p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium">世界树 · 自定义线下地点</h3>
              <button type="button" onClick={() => setOpen(false)} className="p-1">
                <X size={18} />
              </button>
            </div>
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
              placeholder="场景前提（AI 会读）"
              rows={3}
              className="mb-3 w-full resize-none rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--c-bg-soft)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
            />
            <p className="mb-2 text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
              选择在场角色
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
              onClick={submit}
              disabled={!name.trim() || participantIds.length === 0}
              className="w-full rounded-lg py-2.5 text-sm disabled:opacity-40"
              style={{ background: 'var(--c-primary)', color: '#fff' }}
            >
              添加到世界树
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
