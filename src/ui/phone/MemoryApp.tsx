import { useState, useEffect, useMemo } from 'react'
import { Sparkles, Check, Loader2, Pencil, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSessionStore } from '@/store/sessionStore'
import { useDataStore } from '@/store/dataStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useUIStore } from '@/store/uiStore'
import {
  listAllMemories,
  putMemory,
  genId,
  updateMemory,
  deleteMemory,
} from '@/storage/db'
import { SHARED_MEMORY_CHARACTER_ID } from '@/types'
import { compressSessionMemory, hasTextApiConfigured } from '@/ai/textClient'
import { filterMemoriesForParticipants } from '@/ai/memoryUtils'
import { PhoneAppShell } from './PhoneAppShell'

type CompressState = 'idle' | 'loading' | 'done'
type RangeMode = '5' | '10' | '20' | 'all' | 'custom'

export function MemoryApp() {
  const { sessions, activeSession, loadSessions } = useSessionStore()
  const { characters } = useDataStore()
  const { settings } = useSettingsStore()
  const showToast = useUIStore((s) => s.showToast)

  const [memories, setMemories] = useState<
    {
      id: string
      characterId: string
      text: string
      type?: string
      tags?: string[]
      facilityId?: string
      originSessionId: string
      timestamp: number
    }[]
  >([])
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [loaded, setLoaded] = useState(false)
  const [compressState, setCompressState] = useState<Record<string, CompressState>>({})
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [rangeMode, setRangeMode] = useState<RangeMode>('10')
  const [customStart, setCustomStart] = useState(0)
  const [customEnd, setCustomEnd] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')

  const allSessions = useMemo(
    () => sessions.filter((s) => s.status === 'active' || s.status === 'archived'),
    [sessions],
  )

  const targetSession = allSessions.find((s) => s.id === selectedSessionId) ?? activeSession

  useEffect(() => {
    void loadSessions()
  }, [loadSessions])

  useEffect(() => {
    if (!selectedSessionId && activeSession) setSelectedSessionId(activeSession.id)
  }, [activeSession, selectedSessionId])

  const loadMem = async () => {
    const list = await listAllMemories()
    setMemories(
      list.map((m) => ({
        id: m.id,
        characterId: m.characterId,
        text: m.text,
        type: m.type,
        tags: m.tags,
        facilityId: m.facilityId,
        originSessionId: m.originSessionId,
        timestamp: m.timestamp,
      })),
    )
    setLoaded(true)
  }

  useEffect(() => {
    void loadMem()
  }, [])

  const dialogMsgs = useMemo(() => {
    if (!targetSession) return []
    return targetSession.messages.filter((m) => m.role === 'user' || m.role === 'character')
  }, [targetSession])

  useEffect(() => {
    if (dialogMsgs.length > 0) {
      setCustomEnd(dialogMsgs.length - 1)
      setCustomStart(Math.max(0, dialogMsgs.length - 10))
    }
  }, [dialogMsgs.length, selectedSessionId])

  const getRangeMessages = () => {
    if (dialogMsgs.length === 0) return []
    if (rangeMode === 'all') return dialogMsgs
    if (rangeMode === 'custom') {
      const s = Math.max(0, Math.min(customStart, dialogMsgs.length - 1))
      const e = Math.max(s, Math.min(customEnd, dialogMsgs.length - 1))
      return dialogMsgs.slice(s, e + 1)
    }
    const n = Number(rangeMode)
    return dialogMsgs.slice(-n)
  }

  const compress = async (charId: string) => {
    if (!targetSession || compressState[charId] === 'loading') return
    const char = characters[charId]
    if (!char) return

    const rangeMsgs = getRangeMessages().filter(
      (m) => m.role === 'user' || m.characterId === charId,
    )
    if (rangeMsgs.length === 0) {
      showToast('该段无相关对话', `${char.name} 在此范围内没有消息`)
      return
    }

    const key = `${targetSession.id}_${charId}_${rangeMode}`
    setCompressState((s) => ({ ...s, [key]: 'loading' }))
    showToast('正在压缩记忆…', `${char.name} · ${targetSession.title}`)

    try {
      let summary: string
      if (hasTextApiConfigured(settings)) {
        const all = await listAllMemories()
        const relevant = filterMemoriesForParticipants(all, [char])
        summary = await compressSessionMemory({
          settings,
          character: char,
          messages: rangeMsgs,
          existingMemories: relevant,
        })
      } else {
        summary = rangeMsgs
          .map((m) => (m.role === 'user' ? `我：${m.text}` : `${char.name}：${m.text}`))
          .join('\n')
          .slice(0, 800)
      }

      if (!summary.trim()) return
      const rangeLabel =
        rangeMode === 'custom'
          ? `第${customStart + 1}-${customEnd + 1}条`
          : rangeMode === 'all'
            ? '全部'
            : `最近${rangeMode}轮`

      await putMemory({
        id: genId('mem'),
        characterId: SHARED_MEMORY_CHARACTER_ID,
        text: `【${char.name}·${targetSession.title}·${rangeLabel}】\n${summary.trim()}`,
        type: 'daily',
        originSessionId: targetSession.id,
        timestamp: Date.now(),
      })
      await loadMem()
      setCompressState((s) => ({ ...s, [key]: 'done' }))
      showToast('记忆压缩完成', `${char.name} · ${rangeLabel}`)
      window.setTimeout(() => setCompressState((s) => ({ ...s, [key]: 'idle' })), 1800)
    } catch (e) {
      showToast('压缩失败', e instanceof Error ? e.message : '未知错误')
      setCompressState((s) => ({ ...s, [key]: 'idle' }))
    }
  }

  const saveEdit = async (id: string) => {
    await updateMemory(id, editDraft.trim())
    setEditingId(null)
    await loadMem()
    showToast('记忆已更新')
  }

  const removeMem = async (id: string) => {
    await deleteMemory(id)
    await loadMem()
    showToast('已删除该条记忆')
  }

  const sessionTitle = (sid: string) =>
    allSessions.find((s) => s.id === sid)?.title ?? sid.slice(0, 8)

  const TYPE_LABEL: Record<string, string> = {
    milestone: '里程碑',
    daily: '日常',
    conflict: '冲突',
    secret: '秘密',
    preference: '偏好',
    facility: '冒险域',
    npc_bond: '羁绊',
  }

  const visibleMemories =
    typeFilter === 'all' ? memories : memories.filter((m) => m.type === typeFilter)

  return (
    <PhoneAppShell title="记忆">
      <div className="glass-card mb-4 p-3">
        <p className="mb-2 text-xs" style={{ color: 'var(--c-text)' }}>
          统一记忆池 · 所有对话的记忆整合在此
        </p>
        <p className="mb-3 text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
          选择一段对话与范围，按角色压缩；可逐条编辑已存记忆
        </p>

        <p className="mb-1 text-[10px]" style={{ color: 'var(--c-text-dim)' }}>选择对话</p>
        <select
          value={selectedSessionId}
          onChange={(e) => setSelectedSessionId(e.target.value)}
          className="mb-3 w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--c-bg-soft)', border: '1px solid var(--c-border)', color: 'var(--c-text)' }}
        >
          {allSessions.length === 0 && <option value="">暂无对话</option>}
          {allSessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title} ({s.status === 'archived' ? '已封存' : '进行中'})
            </option>
          ))}
        </select>

        {targetSession && (
          <>
            <p className="mb-1 text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
              压缩范围（共 {dialogMsgs.length} 条消息）
            </p>
            <div className="mb-2 flex flex-wrap gap-1">
              {(['5', '10', '20', 'all', 'custom'] as RangeMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setRangeMode(m)}
                  className="rounded-full px-2.5 py-1 text-[10px]"
                  style={{
                    background: rangeMode === m ? 'var(--c-primary)' : 'var(--c-bg-soft)',
                    color: rangeMode === m ? '#fff' : 'var(--c-text)',
                  }}
                >
                  {m === '5' ? '最近5轮' : m === '10' ? '最近10轮' : m === '20' ? '最近20轮' : m === 'all' ? '全部' : '自定义'}
                </button>
              ))}
            </div>

            {rangeMode === 'custom' && dialogMsgs.length > 0 && (
              <div className="mb-3 flex items-center gap-2 text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
                <span>从第</span>
                <input
                  type="number"
                  min={1}
                  max={dialogMsgs.length}
                  value={customStart + 1}
                  onChange={(e) => setCustomStart(Math.max(0, Number(e.target.value) - 1))}
                  className="w-12 rounded px-1 py-0.5 text-center"
                  style={{ background: 'var(--c-bg-soft)', color: 'var(--c-text)' }}
                />
                <span>到第</span>
                <input
                  type="number"
                  min={1}
                  max={dialogMsgs.length}
                  value={customEnd + 1}
                  onChange={(e) => setCustomEnd(Math.min(dialogMsgs.length - 1, Number(e.target.value) - 1))}
                  className="w-12 rounded px-1 py-0.5 text-center"
                  style={{ background: 'var(--c-bg-soft)', color: 'var(--c-text)' }}
                />
                <span>条</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {targetSession.participantIds.map((id) => {
                const key = `${targetSession.id}_${id}_${rangeMode}`
                const state = compressState[key] ?? 'idle'
                const name = characters[id]?.name ?? id
                return (
                  <motion.button
                    key={id}
                    type="button"
                    animate={state === 'loading' ? { scale: [1, 0.96, 1] } : state === 'done' ? { scale: [1, 1.06, 1] } : {}}
                    onClick={() => void compress(id)}
                    disabled={state === 'loading'}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs disabled:opacity-50"
                    style={{
                      background: state === 'done' ? 'var(--c-accent)' : 'var(--c-primary-soft)',
                      color: state === 'done' ? '#fff' : 'var(--c-primary)',
                    }}
                  >
                    {state === 'loading' && <Loader2 size={11} className="animate-spin" />}
                    {state === 'done' && <Check size={11} />}
                    压缩 · {name}
                  </motion.button>
                )
              })}
            </div>
          </>
        )}
      </div>

      <p className="mb-2 flex items-center gap-1 text-xs" style={{ color: 'var(--c-primary)' }}>
        <Sparkles size={14} /> 已存记忆 ({visibleMemories.length}/{memories.length})
      </p>
      <div className="mb-3 flex flex-wrap gap-1">
        {(['all', 'preference', 'facility', 'npc_bond', 'milestone', 'secret', 'daily', 'conflict'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(t)}
            className="rounded-full px-2 py-0.5 text-[10px]"
            style={{
              background: typeFilter === t ? 'var(--c-primary)' : 'var(--c-bg-soft)',
              color: typeFilter === t ? '#fff' : 'var(--c-text-dim)',
            }}
          >
            {t === 'all' ? '全部' : TYPE_LABEL[t] ?? t}
          </button>
        ))}
      </div>

      {!loaded ? (
        <p className="text-center text-[11px]" style={{ color: 'var(--c-text-dim)' }}>加载中…</p>
      ) : visibleMemories.length === 0 ? (
        <p className="text-center text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
          暂无记忆，选择对话与范围后压缩
        </p>
      ) : (
        visibleMemories.map((m) => (
          <div key={m.id} className="glass-card mb-2 p-3">
            <p className="mb-1 flex flex-wrap items-center gap-1 text-[9px]" style={{ color: 'var(--c-text-dim)' }}>
              <span
                className="rounded px-1 py-0.5"
                style={{ background: 'var(--c-primary-soft)', color: 'var(--c-primary)' }}
              >
                {TYPE_LABEL[m.type ?? 'daily'] ?? m.type}
              </span>
              {m.facilityId && <span>@{m.facilityId}</span>}
              <span>
                {sessionTitle(m.originSessionId)} · {new Date(m.timestamp).toLocaleString('zh-CN')}
              </span>
            </p>
            {m.tags && m.tags.length > 0 && (
              <p className="mb-1 text-[9px]" style={{ color: 'var(--c-accent)' }}>
                #{m.tags.slice(0, 6).join(' #')}
              </p>
            )}
            {editingId === m.id ? (
              <>
                <textarea
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  rows={4}
                  className="mb-2 w-full rounded-lg px-2 py-1 text-[11px] outline-none"
                  style={{ background: 'var(--c-bg-soft)', color: 'var(--c-text)', border: '1px solid var(--c-border)' }}
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => void saveEdit(m.id)} className="text-[10px]" style={{ color: 'var(--c-primary)' }}>
                    保存
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
                    取消
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-[11px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--c-text-dim)' }}>
                  {m.text}
                </p>
                <div className="mt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setEditingId(m.id); setEditDraft(m.text) }}
                    className="flex items-center gap-0.5 text-[10px]"
                    style={{ color: 'var(--c-primary)' }}
                  >
                    <Pencil size={10} /> 编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeMem(m.id)}
                    className="flex items-center gap-0.5 text-[10px]"
                    style={{ color: 'var(--c-text-dim)' }}
                  >
                    <Trash2 size={10} /> 删除
                  </button>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </PhoneAppShell>
  )
}
