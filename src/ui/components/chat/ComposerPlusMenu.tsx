import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone,
  Camera,
  Gift,
  Smile,
  ImagePlus,
  Banknote,
  RotateCcw,
  AtSign,
  ChevronLeft,
  Terminal,
  Backpack,
  FlaskConical,
  Shield,
  Dices,
  MapPin,
  Swords,
} from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useSessionStore } from '@/store/sessionStore'
import { useDataStore } from '@/store/dataStore'
import { WESTERN_COMMANDS } from '@/data/commands'

interface ComposerPlusMenuProps {
  open: boolean
  onClose: () => void
  onInsertCommand?: (text: string) => void
}

const SOCIAL_ITEMS = [
  { id: 'commands', label: '指令', icon: Terminal },
  { id: 'bag', label: '背包', icon: Backpack },
  { id: 'potion', label: '用药', icon: FlaskConical },
  { id: 'equip', label: '装备', icon: Shield },
  { id: 'dice', label: '投骰', icon: Dices },
  { id: 'move', label: '换点', icon: MapPin },
  { id: 'combat', label: '开战', icon: Swords },
  { id: 'voice', label: '语音', icon: Phone },
  { id: 'photo', label: '拍照', icon: Camera },
  { id: 'gift', label: '礼物', icon: Gift },
  { id: 'emoji', label: '表情', icon: Smile },
  { id: 'image', label: '图片', icon: ImagePlus },
  { id: 'transfer', label: '转账', icon: Banknote },
  { id: 'retry', label: '重说', icon: RotateCcw },
] as const

type ItemId = (typeof SOCIAL_ITEMS)[number]['id'] | 'mention'

/** 仿微信：输入栏下方功能格 · 限高可滚 · 不挡住对话 */
export function ComposerPlusMenu({ open, onClose, onInsertCommand }: ComposerPlusMenuProps) {
  const [subView, setSubView] = useState<'menu' | 'mention' | 'commands'>('menu')
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const setVoiceCallOpen = useUIStore((s) => s.setVoiceCallOpen)
  const setImagePickerOpen = useUIStore((s) => s.setImagePickerOpen)
  const setEmojiPickerOpen = useUIStore((s) => s.setEmojiPickerOpen)
  const setTransferModalOpen = useUIStore((s) => s.setTransferModalOpen)
  const setReplyTargetCharacterId = useUIStore((s) => s.setReplyTargetCharacterId)
  const setActionSheet = useUIStore((s) => s.setActionSheet)
  const openCombat = useUIStore((s) => s.openCombat)
  const showToast = useUIStore((s) => s.showToast)
  const regenerateLastCharacterReply = useSessionStore((s) => s.regenerateLastCharacterReply)
  const activeSession = useSessionStore((s) => s.activeSession)
  const { getAllCharacters } = useDataStore()
  const characters = getAllCharacters()
  const canMention = Boolean(activeSession && activeSession.participantIds.length > 0)

  useEffect(() => {
    if (!open) setSubView('menu')
  }, [open])

  const handle = async (id: ItemId) => {
    if (id === 'mention') {
      setSubView('mention')
      return
    }
    if (id === 'commands') {
      setSubView('commands')
      return
    }

    onClose()
    if (!activeSession && id !== 'gift') return

    switch (id) {
      case 'bag':
        setActiveTab('tavern')
        useUIStore.getState().setTavernSubView('backpack')
        break
      case 'potion':
        setActionSheet('potion')
        showToast('用药', '从行动坞选择药剂')
        break
      case 'equip':
        void useSessionStore.getState().appendUserMessage('$面板')
        showToast('已执行 $面板', '属性面板写入对话')
        break
      case 'dice':
        setActionSheet('dice')
        break
      case 'move':
        setActionSheet('move')
        break
      case 'combat':
        openCombat({
          enemyName: '遭遇战',
          dc: 14,
          regionId: activeSession?.regionId,
        })
        break
      case 'voice':
        setVoiceCallOpen(true)
        break
      case 'photo':
        setImagePickerOpen(true, 'photo')
        break
      case 'image':
        setImagePickerOpen(true, 'image')
        break
      case 'emoji':
        setEmojiPickerOpen(true)
        break
      case 'transfer':
        setTransferModalOpen(true)
        break
      case 'gift':
        setActiveTab('tavern')
        useUIStore.getState().setTavernSubView('gifts')
        break
      case 'retry':
        await regenerateLastCharacterReply()
        break
    }
  }

  const pickMention = (charId: string) => {
    const name =
      activeSession?.dynamicNpc?.id === charId
        ? activeSession.dynamicNpc.displayName
        : (characters[charId]?.name ?? charId)
    setReplyTargetCharacterId(charId)
    showToast(`已指定 @${name}`, '下一条消息将由 TA 回复')
    onClose()
  }

  const pickCommand = (insert: string) => {
    onInsertCommand?.(insert)
    showToast('已填入指令', insert)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="composer-plus-sheet overflow-hidden border-t"
          style={{
            borderColor: 'var(--c-glass-border)',
            background: 'var(--c-bg-elevated, var(--immerse-chrome-strong))',
          }}
        >
          {subView === 'commands' && (
            <div className="composer-plus-sheet__scroll no-scrollbar">
              <button
                type="button"
                onClick={() => setSubView('menu')}
                className="sticky top-0 z-[1] flex w-full items-center gap-2 border-b px-3 py-2 text-left text-xs"
                style={{
                  color: 'var(--c-text-dim)',
                  borderColor: 'var(--c-border)',
                  background: 'var(--c-bg-elevated)',
                }}
              >
                <ChevronLeft size={16} />
                指令手册 · $ 开头
              </button>
              {WESTERN_COMMANDS.map((c) => (
                <button
                  key={c.cmd}
                  type="button"
                  onClick={() => pickCommand(c.insert ?? c.cmd)}
                  className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors active:bg-[var(--c-primary-soft)]"
                >
                  <span className="font-mono text-xs" style={{ color: 'var(--c-accent)' }}>
                    {c.cmd}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
                    {c.desc}
                  </span>
                </button>
              ))}
            </div>
          )}

          {subView === 'mention' && canMention && activeSession && (
            <div className="composer-plus-sheet__scroll px-2 py-2">
              <button
                type="button"
                onClick={() => setSubView('menu')}
                className="mb-2 flex w-full items-center gap-2 px-2 py-1 text-left text-xs"
                style={{ color: 'var(--c-text-dim)' }}
              >
                <ChevronLeft size={16} />
                选择要 @ 的角色
              </button>
              <div className="grid grid-cols-4 gap-2">
                {activeSession.participantIds.map((id) => {
                  const c = characters[id]
                  const name =
                    activeSession.dynamicNpc?.id === id
                      ? activeSession.dynamicNpc.displayName
                      : (c?.name ?? id)
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => pickMention(id)}
                      className="composer-plus-item flex flex-col items-center gap-1 rounded-xl py-2 active:scale-95"
                      style={{ background: 'var(--c-bg-soft)' }}
                    >
                      <AtSign size={18} style={{ color: 'var(--c-primary)' }} />
                      <span
                        className="max-w-full truncate px-0.5 text-[10px] font-medium"
                        style={{ color: 'var(--c-text)' }}
                      >
                        {name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {subView === 'menu' && (
            <div className="composer-plus-sheet__scroll px-2 py-2">
              <div className="grid grid-cols-4 gap-1.5">
                {canMention && (
                  <button
                    type="button"
                    onClick={() => handle('mention')}
                    className="composer-plus-item flex flex-col items-center gap-1 rounded-xl py-2 active:scale-95"
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: 'var(--c-bg-soft)', border: '1px solid var(--c-border)' }}
                    >
                      <AtSign size={18} style={{ color: 'var(--c-primary)' }} />
                    </div>
                    <span className="text-[10px] font-medium" style={{ color: 'var(--c-text)' }}>
                      @ 回复
                    </span>
                  </button>
                )}
                {SOCIAL_ITEMS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => void handle(id)}
                    className="composer-plus-item flex flex-col items-center gap-1 rounded-xl py-2 active:scale-95"
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: 'var(--c-bg-soft)', border: '1px solid var(--c-border)' }}
                    >
                      <Icon size={18} style={{ color: 'var(--c-primary)' }} />
                    </div>
                    <span className="text-[10px] font-medium" style={{ color: 'var(--c-text)' }}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
