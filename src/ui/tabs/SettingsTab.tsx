import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Sliders, Bot, ImageIcon, Mic, Palette, Upload, Trash2, Plus, Check, Users, Film, LayoutGrid, Stamp, StickyNote, Wifi, WifiOff, CircleDot, Paintbrush, Dices, BookOpen, Wrench, Sparkles } from 'lucide-react'
import { useSettingsStore } from '@/store/settingsStore'
import { useProfileStore } from '@/store/profileStore'
import { useUIStore } from '@/store/uiStore'
import { usePassportStore } from '@/store/passportStore'
import { useSessionStore } from '@/store/sessionStore'
import { corruptionStageFromValue } from '@/ai/npcGenerator'
import { allFacilityIds } from '@/store/passportStore'
import { applyAmbiance, type ColorPalette } from '@/theme/ambiance'

import { getUserCSS, putUserCSS, clearUserCSS } from '@/storage/db'
import { injectUserCSS, readCSSFile } from '@/utils/customCSS'
import { applyCustomColors, CHAT_APPEARANCE_PRESETS, type CustomColors } from '@/utils/customColors'
import {
  fetchModelList,
  testApiConnection,
  filterTtsModels,
  filterSttModels,
  getDetectedProviderLabel,
} from '@/ai/openaiClient'
import { hasTextApiConfigured } from '@/ai/textClient'
import {
  formatOutputCharHint,
  formatContextHint,
  formatCreativityHint,
  formatSpeedHint,
  formatTopPHint,
  formatFreshnessHint,
  formatAiParamsLiveSummary,
  getMaxTokensForOutput,
  formatGroupInterruptHint,
} from '@/ai/aiParams'
import { testTtsConnection } from '@/ai/ttsClient'
import { testSttConnection } from '@/ai/sttClient'

export function SettingsTab() {
  return (
    <div
      className="settings-tab no-scrollbar flex-1 overflow-y-auto px-4 py-5"
      style={{ background: '#faf7f1' }}
    >
      <div className="mx-auto flex max-w-[520px] flex-col gap-5">
        <ColorPaletteSection />
        <ProfilesSection />
        <AzeriaRulebookSection />
        <PrefsShortcutSection />
        <ApiConnectivityCard />
        <AiGenerationSection />
        <OpeningReplaySection />
        <ChatSizeSection />
        <LayoutTemplateSection />
        <ChatAppearanceSection />
        <GroupChatSection />
        <ImageSection />
        <TtsSection />
        <CustomCssSection />
        <NpcCheatSection />
        <StampCheatSection />
        <div className="h-4" />
      </div>
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: typeof User
  title: string
  desc?: string
  children: React.ReactNode
}) {
  return (
    <motion.section
      className="glass-card settings-section p-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <div className="mb-3 flex items-start gap-2">
        <Icon size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--c-primary)' }} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-bold leading-tight" style={{ color: '#0f0d0a' }}>
            {title}
          </h3>
          {desc && (
            <p className="mt-0.5 text-[12px] leading-snug" style={{ color: '#2a241c' }}>
              {desc}
            </p>
          )}
        </div>
      </div>
      {children}
    </motion.section>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-[13px] font-bold" style={{ color: '#0f0d0a' }}>
      {children}
    </label>
  )
}

/* ---------------- 全局配色方案 ---------------- */
function ColorPaletteSection() {
  const { settings, updateUI } = useSettingsStore()
  const showToast = useUIStore((s) => s.showToast)
  const palette = (settings.ui.colorPalette ?? 'sanctum') as ColorPalette
  const lightOn = settings.ui.lightOn ?? true

  const pick = async (next: ColorPalette) => {
    await updateUI({ colorPalette: next })
    applyAmbiance({ colorPalette: next, lightOn })
    showToast(next === 'sanctum' ? '圣殿白金' : '经典配色', '全局界面已切换')
  }

  return (
    <Section icon={Sparkles} title="界面配色" desc="两种世界观皮肤 · 即时切换全站">
      <div className="palette-switch">
        <button
          type="button"
          className={`palette-switch__card palette-switch__card--sanctum${palette === 'sanctum' ? ' is-active' : ''}`}
          onClick={() => void pick('sanctum')}
        >
          <div className="palette-switch__name">圣殿白金</div>
          <div className="palette-switch__desc">西欧圣堂 · 象牙石与金箔 · Cinzel 铭文</div>
        </button>
        <button
          type="button"
          className={`palette-switch__card palette-switch__card--classic${palette === 'classic' ? ' is-active' : ''}`}
          onClick={() => void pick('classic')}
        >
          <div className="palette-switch__name">经典夜湾</div>
          <div className="palette-switch__desc">原暖湾 / 夜港金 · 可再开关灯</div>
        </button>
      </div>

      {palette === 'classic' && (
        <div className="mt-3">
          <Label>经典方案 · 开灯</Label>
          <div className="flex gap-2">
            {([true, false] as const).map((on) => {
              const active = lightOn === on
              return (
                <button
                  key={String(on)}
                  type="button"
                  onClick={() => {
                    void updateUI({ lightOn: on })
                    applyAmbiance({ colorPalette: 'classic', lightOn: on })
                  }}
                  className="min-h-[40px] flex-1 rounded-xl text-xs font-bold"
                  style={{
                    background: active
                      ? 'linear-gradient(135deg, #c9a35a, #8a6a3a)'
                      : '#f3eee6',
                    color: active ? '#1a120c' : 'var(--c-text)',
                  }}
                >
                  {on ? '浅湾薄雾' : '夜港湾'}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </Section>
  )
}

function SliderRow({
  label,
  value,
  onChange,
  hint,
  min = 10,
  max = 100,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  hint: string
  min?: number
  max?: number
}) {
  return (
    <div className="settings-slider">
      <div className="mb-1 flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <span className="text-[12px] font-bold tabular-nums" style={{ color: '#0f0d0a' }}>
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: '#6b5420' }}
      />
      <p className="mt-1 text-[11px] leading-snug" style={{ color: '#2a241c' }}>
        {hint}
      </p>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'var(--c-bg-elevated, #ffffff)',
  color: 'var(--c-text)',
  border: '1px solid var(--c-border)',
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-[border-color,box-shadow]"
      style={inputStyle}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'var(--c-primary)'
        e.currentTarget.style.boxShadow = '0 0 0 3px var(--c-primary-soft)'
        props.onFocus?.(e)
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'var(--c-border)'
        e.currentTarget.style.boxShadow = 'none'
        props.onBlur?.(e)
      }}
    />
  )
}

function SegBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 rounded-lg px-2 py-2 text-[11px] transition-colors"
      style={{
        background: active ? 'var(--c-gold)' : '#f3eee6',
        color: active ? '#1a120c' : 'var(--c-text)',
        border: `1px solid ${active ? 'var(--c-gold)' : 'var(--c-border)'}`,
        fontWeight: active ? 700 : 500,
      }}
    >
      {children}
    </button>
  )
}

function ToggleRow({
  label,
  desc,
  on,
  onToggle,
}: {
  label: string
  desc?: string
  on: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-sm" style={{ color: 'var(--c-text)' }}>
          {label}
        </p>
        {desc && (
          <p className="text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
            {desc}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onToggle}
        className="relative h-7 w-12 shrink-0 rounded-full transition-colors"
        style={{ background: on ? 'var(--c-primary)' : 'var(--c-border)' }}
        aria-pressed={on}
      >
        <span
          className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform"
          style={{ left: on ? '22px' : '2px' }}
        />
      </button>
    </div>
  )
}

function AzeriaRulebookSection() {
  const { settings, updateUI } = useSettingsStore()
  const ui = settings.ui
  const diceMode = ui.azeriaDiceMode ?? 'mixed'
  const dirtyLevel = ui.azeriaDirtyTalkLevel ?? 'off'
  const publicOn = ui.azeriaPublicMode ?? false
  const pregnancyOn = ui.azeriaPregnancyEnabled ?? false
  const bodyImpactOn = ui.azeriaBodyImpactEnabled ?? true

  return (
    <Section
      icon={BookOpen}
      title="艾泽利亚规则书"
      desc="对应 $骰子 / $粗口 / $公开 / $怀孕，写入 AI 监管层"
    >
      <div className="space-y-4">
        <div>
          <Label>H 骰子模式</Label>
          <div className="flex gap-1">
            {(
              [
                ['on', '开'],
                ['mixed', '混合'],
                ['off', '关'],
              ] as const
            ).map(([v, label]) => (
              <SegBtn
                key={v}
                active={diceMode === v}
                onClick={() => void updateUI({ azeriaDiceMode: v })}
              >
                {label}
              </SegBtn>
            ))}
          </div>
        </div>

        <div>
          <Label>粗口等级</Label>
          <div className="flex flex-wrap gap-1">
            {(
              [
                ['off', '关'],
                ['light', '轻度'],
                ['medium', '中度'],
                ['hard', '重度'],
              ] as const
            ).map(([v, label]) => (
              <SegBtn
                key={v}
                active={dirtyLevel === v}
                onClick={() => void updateUI({ azeriaDirtyTalkLevel: v })}
              >
                {label}
              </SegBtn>
            ))}
          </div>
        </div>

        <ToggleRow
          label="公共场合 H"
          desc="允许在城镇/街道等公开场景描写"
          on={publicOn}
          onToggle={() => void updateUI({ azeriaPublicMode: !publicOn })}
        />
        <ToggleRow
          label="怀孕系统"
          desc="开启跨种族受孕与孕期叙事"
          on={pregnancyOn}
          onToggle={() => void updateUI({ azeriaPregnancyEnabled: !pregnancyOn })}
        />
        <ToggleRow
          label="身体影响判定"
          desc="关闭则不回写/不保底微涨身体数值（仅保留叙事）"
          on={bodyImpactOn}
          onToggle={() => void updateUI({ azeriaBodyImpactEnabled: !bodyImpactOn })}
        />

        <p className="text-[10px] leading-relaxed" style={{ color: 'var(--c-text-dim)' }}>
          <Dices size={10} className="mr-1 inline" />
          亦可在聊天输入 $骰子 / $粗口 / $公开 / $怀孕 切换；完整规则见「规则书」Tab。
        </p>
      </div>
    </Section>
  )
}

function PrefsShortcutSection() {
  const prefs = useSettingsStore((s) => s.settings.ui.playerPreferences)
  const updateUI = useSettingsStore((s) => s.updateUI)
  const showToast = useUIStore((s) => s.showToast)
  const [draft, setDraft] = useState({
    likes: prefs?.likes ?? '',
    dislikes: prefs?.dislikes ?? '',
    taboos: prefs?.taboos ?? '',
    notes: prefs?.notes ?? '',
  })

  useEffect(() => {
    setDraft({
      likes: prefs?.likes ?? '',
      dislikes: prefs?.dislikes ?? '',
      taboos: prefs?.taboos ?? '',
      notes: prefs?.notes ?? '',
    })
  }, [prefs?.likes, prefs?.dislikes, prefs?.taboos, prefs?.notes])

  return (
    <Section icon={StickyNote} title="偏好贴纸" desc="男主会读取并遵守">
      <p className="mb-3 text-[11px] leading-relaxed" style={{ color: 'var(--c-text-dim)' }}>
        喜欢 / 避雷 / 禁忌会注入 AI（禁忌作负面提示词）。
      </p>
      {(
        [
          ['likes', '喜欢 · 希望发生'],
          ['dislikes', '避雷 · 不想要'],
          ['taboos', '禁忌 · 负面提示词'],
          ['notes', '补充说明'],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="mb-2 block">
          <span className="mb-1 block text-[11px]" style={{ color: 'var(--c-text)', fontWeight: 700 }}>
            {label}
          </span>
          <textarea
            value={draft[key]}
            onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
            rows={2}
            className="w-full rounded-lg px-3 py-2 text-sm"
            style={{
              background: '#ffffff',
              color: 'var(--c-text)',
              border: '1px solid var(--c-border)',
            }}
          />
        </label>
      ))}
      <button
        type="button"
        onClick={() => void updateUI({ playerPreferences: draft }).then(() => showToast('偏好已保存'))}
        className="mt-1 w-full rounded-xl py-2.5 text-sm"
        style={{
          background: 'var(--c-gold)',
          color: '#1a120c',
          border: '1px solid var(--c-gold)',
          fontWeight: 700,
        }}
      >
        保存贴纸
      </button>
    </Section>
  )
}

/* ---------------- 我的模板 ---------------- */
function ProfilesSection() {
  const { profiles, createProfile, updateProfile, removeProfile, canCreate } = useProfileStore()
  const { settings, updateUI } = useSettingsStore()
  const activeId = settings.ui.activeProfileId
  const [editingId, setEditingId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState<{
    name: string
    avatar: string
    age: string
    gender: string
    assets: string
    livingEnvironment: string
    homeLayout: string
    persona: string
  } | null>(null)

  const startCreate = () => {
    setDraft({
      name: '',
      avatar: '',
      age: '',
      gender: '',
      assets: '',
      livingEnvironment: '',
      homeLayout: '',
      persona: '',
    })
    setEditingId('__new__')
  }

  const onPickAvatar = (file?: File) => {
    if (!file || !draft) return
    const reader = new FileReader()
    reader.onload = () => setDraft((d) => (d ? { ...d, avatar: reader.result as string } : d))
    reader.readAsDataURL(file)
  }

  const saveDraft = async () => {
    if (!draft || !draft.name.trim()) return
    if (editingId === '__new__') {
      const p = await createProfile(draft)
      if (p) await updateUI({ activeProfileId: p.id })
    } else if (editingId) {
      await updateProfile(editingId, draft)
    }
    setDraft(null)
    setEditingId(null)
  }

  return (
    <Section icon={User} title="我的模板" desc="最多 3 个，可切换玩家身份">
      <div className="flex flex-col gap-2">
        {profiles.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-xl p-2"
            style={{
              border: `1px solid ${p.id === activeId ? 'var(--c-primary)' : 'var(--c-border)'}`,
              background: p.id === activeId ? 'var(--c-primary-soft)' : 'transparent',
            }}
          >
            <img
              src={p.avatar || placeholderImg(p.name)}
              alt={p.name}
              className="h-10 w-10 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm" style={{ color: 'var(--c-text)' }}>
                {p.name}{' '}
                {p.id === activeId && (
                  <span className="text-[10px]" style={{ color: 'var(--c-primary)' }}>
                    · 当前
                  </span>
                )}
              </p>
              <p className="truncate text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
                {p.age} · {p.gender || '—'} · {p.persona.slice(0, 16) || '—'}
              </p>
            </div>
            {p.id !== activeId && (
              <button
                onClick={() => updateUI({ activeProfileId: p.id })}
                className="rounded px-2 py-1 text-[11px]"
                style={{ background: 'var(--c-primary-soft)', color: 'var(--c-primary)' }}
              >
                切换
              </button>
            )}
            <button
              onClick={() => {
                setEditingId(p.id)
                setDraft({
                  name: p.name,
                  avatar: p.avatar,
                  age: p.age,
                  gender: p.gender,
                  assets: p.assets,
                  livingEnvironment: p.livingEnvironment,
                  homeLayout: p.homeLayout,
                  persona: p.persona,
                })
              }}
              className="rounded px-2 py-1 text-[11px]"
              style={{ color: 'var(--c-text-dim)' }}
            >
              编辑
            </button>
            <button
              onClick={() => {
                removeProfile(p.id)
                if (p.id === activeId) updateUI({ activeProfileId: null })
              }}
              className="rounded p-1"
              style={{ color: 'var(--c-text-dim)' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {profiles.length === 0 && (
          <p className="py-2 text-center text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
            尚未创建模板
          </p>
        )}

        {canCreate() && editingId === null && (
          <button
            onClick={startCreate}
            className="flex items-center justify-center gap-1 rounded-xl py-2 text-sm"
            style={{ background: 'var(--c-primary-soft)', color: 'var(--c-primary)' }}
          >
            <Plus size={14} /> 新建模板
          </button>
        )}

        {editingId && draft && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 rounded-xl p-3"
            style={{ border: '1px solid var(--c-border)' }}
          >
            <div className="mb-3 flex items-center gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full"
                style={{ border: '1px dashed var(--c-border)' }}
              >
                {draft.avatar ? (
                  <img src={draft.avatar} className="h-full w-full object-cover" alt="" />
                ) : (
                  <Plus size={18} style={{ color: 'var(--c-text-dim)' }} />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickAvatar(e.target.files?.[0])}
              />
              <TextInput
                placeholder="姓名"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <TextInput placeholder="年龄" value={draft.age} onChange={(e) => setDraft({ ...draft, age: e.target.value })} />
              <TextInput placeholder="性别" value={draft.gender} onChange={(e) => setDraft({ ...draft, gender: e.target.value })} />
              <TextInput placeholder="资产" value={draft.assets} onChange={(e) => setDraft({ ...draft, assets: e.target.value })} />
              <TextInput placeholder="居住环境" value={draft.livingEnvironment} onChange={(e) => setDraft({ ...draft, livingEnvironment: e.target.value })} />
              <TextInput placeholder="家庭布置" value={draft.homeLayout} onChange={(e) => setDraft({ ...draft, homeLayout: e.target.value })} />
              <TextInput placeholder="人设自述" value={draft.persona} onChange={(e) => setDraft({ ...draft, persona: e.target.value })} />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={saveDraft}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-sm"
                style={{ background: 'var(--c-primary)', color: '#fff' }}
              >
                <Check size={14} /> 保存
              </button>
              <button
                onClick={() => {
                  setDraft(null)
                  setEditingId(null)
                }}
                className="rounded-lg px-4 py-2 text-sm"
                style={{ color: 'var(--c-text-dim)' }}
              >
                取消
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </Section>
  )
}

/* ---------------- 重看开机动画 ---------------- */
function OpeningReplaySection() {
  const replayOpeningAnimation = useUIStore((s) => s.replayOpeningAnimation)
  const flowStage = useUIStore((s) => s.flowStage)
  const busy = flowStage === 'splash' || flowStage === 'cutscene'

  return (
    <Section icon={Film} title="开场动画" desc="重播仪式与过场">
      <p className="mb-3 text-[11px] leading-relaxed" style={{ color: 'var(--c-text-dim)' }}>
        从立体冒险之书翻页重温序章。翻至终页后自动回到主界面。
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={replayOpeningAnimation}
        className="w-full rounded-xl px-4 py-2.5 text-sm transition-opacity disabled:opacity-45"
        style={{ background: 'var(--c-primary-soft)', color: 'var(--c-primary)' }}
      >
        {busy ? '正在播放…' : '重看开机动画'}
      </button>
    </Section>
  )
}

/* ---------------- 聊天界面尺寸 ---------------- */
function ChatSizeSection() {
  const { settings, updateUI } = useSettingsStore()
  const { chatWidth, chatHeight, chatScale, characterMode } = settings.ui
  return (
    <Section icon={Sliders} title="界面尺寸" desc="宽高与缩放 · 实时作用于整个界面">
      <div className="flex flex-col gap-4">
        <div className="settings-slider">
          <Label>宽度：{chatWidth}px</Label>
          <input
            type="range"
            min={320}
            max={520}
            step={5}
            value={chatWidth}
            onChange={(e) => updateUI({ chatWidth: Number(e.target.value) })}
            className="w-full"
            style={{ accentColor: 'var(--c-primary)' }}
          />
        </div>
        <div className="settings-slider">
          <Label>高度：{chatHeight}px</Label>
          <input
            type="range"
            min={640}
            max={960}
            step={8}
            value={chatHeight}
            onChange={(e) => updateUI({ chatHeight: Number(e.target.value) })}
            className="w-full"
            style={{ accentColor: 'var(--c-primary)' }}
          />
        </div>
        <div className="settings-slider">
          <Label>整体缩放：{chatScale.toFixed(2)}x</Label>
          <input
            type="range"
            min={0.65}
            max={1.25}
            step={0.01}
            value={chatScale}
            onChange={(e) => updateUI({ chatScale: Number(e.target.value) })}
            className="w-full"
            style={{ accentColor: 'var(--c-primary)' }}
          />
        </div>
        <p className="text-[10px] leading-relaxed" style={{ color: 'var(--c-text-dim)' }}>
          手机端会自动铺满宽度并适配安全区；桌面端按上面数值缩放。改缩放后立刻作用于对话壳。
        </p>
        <div className="flex gap-2">
          {(['chat', 'preview'] as const).map((m) => (
            <button
              key={m}
              onClick={() => updateUI({ characterMode: m })}
              className="min-h-[44px] flex-1 rounded-lg py-2 text-xs"
              style={{
                background: characterMode === m ? 'var(--c-primary-soft)' : 'transparent',
                color: characterMode === m ? 'var(--c-primary)' : 'var(--c-text-dim)',
                border: '1px solid var(--c-border)',
              }}
            >
              {m === 'chat' ? '聊天模式（对话气泡）' : '预览模式（纯立绘欣赏）'}
            </button>
          ))}
        </div>
        <LayoutModeSection />
      </div>
    </Section>
  )
}

/* ---------------- 界面方向 ---------------- */
function LayoutModeSection() {
  const { settings, updateUI } = useSettingsStore()
  const mode = settings.ui.layoutMode ?? 'portrait'
  return (
    <div className="flex flex-col gap-2 pt-2">
      <Label>界面方向</Label>
      <div className="flex gap-2">
        {(['portrait', 'landscape'] as const).map((m) => (
          <button
            key={m}
            onClick={() => updateUI({ layoutMode: m })}
            className="min-h-[44px] flex-1 rounded-lg py-2 text-xs"
            style={{
              background: mode === m ? 'var(--c-primary-soft)' : 'transparent',
              color: mode === m ? 'var(--c-primary)' : 'var(--c-text-dim)',
              border: '1px solid var(--c-border)',
            }}
          >
            {m === 'portrait' ? '竖版（书页）' : '横版（桌面）'}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------------- 界面布局（已统一） ---------------- */
function LayoutTemplateSection() {
  return (
    <Section icon={LayoutGrid} title="界面布局" desc="预言之书经典布局">
      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--c-text-dim)' }}>
        已统一为底部六栏：冒险 / 沉浸 / 规则书 / 酒馆 / 图鉴 / 设置。旧版「手机」与多套模板布局已并入酒馆与设置。
      </p>
    </Section>
  )
}

/* ---------------- 多人对话 ---------------- */
function GroupChatSection() {
  const { settings, updateUI } = useSettingsStore()
  const interval = settings.ui.groupInterruptInterval ?? 0
  const enabled = interval > 0

  return (
    <Section icon={Users} title="多人对话" desc="争宠抢话、角色互怼">
      <div className="flex flex-col gap-3">
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm" style={{ color: 'var(--c-text)' }}>
            启用争宠抢话
          </span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) =>
              updateUI({ groupInterruptInterval: e.target.checked ? 3 : 0 })
            }
            style={{ accentColor: 'var(--c-primary)' }}
          />
        </label>
        {enabled && (
          <div>
            <Label>抢话间隔：每 {interval} 轮</Label>
            <p className="mb-1 text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
              {formatGroupInterruptHint(interval)}
            </p>
            <input
              type="range"
              min={2}
              max={12}
              step={1}
              value={interval}
              onChange={(e) => updateUI({ groupInterruptInterval: Number(e.target.value) })}
              className="w-full"
              style={{ accentColor: 'var(--c-primary)' }}
            />
            <p className="mt-1 text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
              到达间隔后必定抢话；间隔未到但存在吃醋角色时，也有概率打断刚发言的那位——争宠、拆台、抢风头。@ 指定回复时不会抢话。
            </p>
          </div>
        )}
      </div>
    </Section>
  )
}

/* ---------------- AI 生成参数 ---------------- */
function AiGenerationSection() {
  const { settings, updateUI } = useSettingsStore()
  const {
    aiContextLength,
    aiCreativity,
    aiOutputLength,
    aiResponseSpeed,
    aiTopP = 80,
    aiFreshness = 40,
  } = settings.ui
  const apiOk = hasTextApiConfigured(settings)
  const last = settings.ui.apiTextLastStatus
  const linked = apiOk && last?.ok

  return (
    <Section
      icon={Bot}
      title="AI 对话参数"
      desc={
        linked
          ? '已联通 · 下列滑条会写入下一句聊天请求'
          : apiOk
            ? '已填密钥 · 请先在上方联通卡点「测试连接」'
            : '未配置 API · 演示模式仅部分参数生效'
      }
    >
      <div className="flex flex-col gap-4">
        <div
          className="settings-ai-summary rounded-xl px-3 py-2.5 text-[11px] leading-relaxed whitespace-pre-line"
          style={{
            background: '#eef6fa',
            border: '1px solid #7aa8bc',
            color: '#0f0d0a',
          }}
        >
          <span className="mb-1 block text-[12px] font-bold" style={{ color: '#1a4a5c' }}>
            本轮实际发给模型
          </span>
          {formatAiParamsLiveSummary(settings)}
        </div>

        <SliderRow
          label="上下文长度"
          value={aiContextLength}
          onChange={(v) => updateUI({ aiContextLength: v })}
          hint={formatContextHint(aiContextLength)}
        />
        <SliderRow
          label="生成活跃度"
          value={aiCreativity}
          onChange={(v) => updateUI({ aiCreativity: v })}
          hint={formatCreativityHint(aiCreativity)}
        />
        <SliderRow
          label="取样聚焦"
          value={aiTopP}
          onChange={(v) => updateUI({ aiTopP: v })}
          hint={formatTopPHint(aiTopP)}
        />
        <SliderRow
          label="新鲜度 / 去重"
          value={aiFreshness}
          min={0}
          onChange={(v) => updateUI({ aiFreshness: v })}
          hint={formatFreshnessHint(aiFreshness)}
        />
        <SliderRow
          label="输出长度"
          value={aiOutputLength ?? 50}
          onChange={(v) => updateUI({ aiOutputLength: v })}
          hint={`${formatOutputCharHint(aiOutputLength ?? 50)} · max_tokens ${getMaxTokensForOutput(aiOutputLength ?? 50)}`}
        />
        <SliderRow
          label="回复速度"
          value={aiResponseSpeed ?? 50}
          onChange={(v) => updateUI({ aiResponseSpeed: v })}
          hint={formatSpeedHint(aiResponseSpeed ?? 50)}
        />

        <div>
          <Label>H 阶段模式</Label>
          <p className="mb-2 text-[11px]" style={{ color: '#2a241c' }}>
            软：AI 可灵活切换阶段。硬：每阶段至少互动一次才前进；选项强制 ≤2。
          </p>
          <div className="flex gap-2">
            {(['soft', 'hard'] as const).map((mode) => {
              const active = (settings.ui.hPhaseMode ?? 'soft') === mode
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateUI({ hPhaseMode: mode })}
                  className="min-h-[44px] flex-1 rounded-xl py-2 text-xs font-bold"
                  style={{
                    background: active
                      ? 'linear-gradient(135deg, #c9a35a, #8a6a3a)'
                      : '#f0ebe2',
                    color: active ? '#0f0d0a' : '#0f0d0a',
                    border: active ? 'none' : '1px solid rgba(90,66,24,0.35)',
                  }}
                >
                  {mode === 'soft' ? '软引导' : '硬状态机'}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <Label>男主 API 润色</Label>
          <p className="mb-2 text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
            入域时先本地随机生成，再可选调用文本 API 润色名字/口吻/开场（需已配置 API；失败则保留本地稿）。
          </p>
          <div className="flex gap-2">
            {([false, true] as const).map((on) => {
              const active = Boolean(settings.ui.npcApiRefine) === on
              return (
                <button
                  key={String(on)}
                  type="button"
                  onClick={() => updateUI({ npcApiRefine: on })}
                  className="min-h-[44px] flex-1 rounded-xl py-2 text-xs font-medium"
                  style={{
                    background: active
                      ? 'linear-gradient(135deg, #c9a35a, #8a6a3a)'
                      : 'var(--c-surface-2, rgba(255,255,255,0.06))',
                    color: active ? '#fff' : 'var(--c-text-dim)',
                    border: active ? 'none' : '1px solid rgba(42,158,196,0.2)',
                  }}
                >
                  {on ? '开启润色' : '仅本地生成'}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </Section>
  )
}

const API_PRESETS = [
  { id: 'openai', label: 'OpenAI', baseURL: 'https://api.openai.com/v1' },
  { id: 'deepseek', label: 'DeepSeek', baseURL: 'https://api.deepseek.com/v1' },
  { id: 'siliconflow', label: '硅基流动', baseURL: 'https://api.siliconflow.cn/v1' },
  { id: 'glm', label: '智谱 GLM', baseURL: 'https://open.bigmodel.cn/api/paas/v4' },
  { id: 'claude', label: 'Claude', baseURL: 'https://api.anthropic.com/v1' },
  { id: 'custom', label: '自定义', baseURL: '' },
] as const

/* ---------------- API 联通卡片 ---------------- */
function ApiConnectivityCard() {
  const { settings, updateApi, updateUI } = useSettingsStore()
  const { text, proxyURL } = settings.api
  const [models, setModels] = useState<string[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelError, setModelError] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [expanded, setExpanded] = useState(true)

  const configured = hasTextApiConfigured(settings)
  const last = settings.ui.apiTextLastStatus
  const status: 'linked' | 'ready' | 'offline' = last?.ok && configured ? 'linked' : configured ? 'ready' : 'offline'

  const statusMeta = {
    linked: {
      label: '已联通',
      tip: '聊天将调用此接口；下方滑块参数会写入请求体',
      color: '#3dd68c',
      Icon: Wifi,
    },
    ready: {
      label: '待测连',
      tip: '密钥已填好：未测连也会直连真实 API；手机网页请填 CORS 代理（本地开发可填 /cors-proxy）',
      color: '#f0c34a',
      Icon: CircleDot,
    },
    offline: {
      label: '离线 / 演示',
      tip: '未配置完整文本 API，对话走本地演示回复',
      color: '#e57373',
      Icon: WifiOff,
    },
  }[status]

  const pullModels = async () => {
    if (!text.baseURL.trim() || !text.apiKey.trim()) return
    setLoadingModels(true)
    setModelError(null)
    try {
      const list = await fetchModelList(text.baseURL, text.apiKey, proxyURL, text.model)
      setModels(list)
      if (list.length && !list.includes(text.model)) {
        await updateApi({ text: { ...text, model: list[0] } })
      }
      if (list.length === 0) setModelError('连接成功但未返回模型，可手动输入模型名')
    } catch (e) {
      setModels([])
      setModelError(e instanceof Error ? e.message : '拉取模型失败')
    } finally {
      setLoadingModels(false)
    }
  }

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (text.baseURL.trim() && text.apiKey.trim()) void pullModels()
    }, 600)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text.baseURL, text.apiKey, proxyURL])

  const onTest = async () => {
    setTesting(true)
    const res = await testApiConnection(text.baseURL, text.apiKey, text.model, proxyURL)
    await updateUI({
      apiTextLastStatus: { ok: res.ok, message: res.message, at: Date.now() },
    })
    setTesting(false)
    if (res.ok && models.length === 0) void pullModels()
  }

  const StatusIcon = statusMeta.Icon

  return (
    <Section icon={Wifi} title="API 联通" desc="聊天文本接口 · 先通再调滑块">
      <div className="flex flex-col gap-3">
        <div
          className="flex items-start gap-3 rounded-xl px-3 py-3"
          style={{
            background: 'rgba(42,158,196,0.1)',
            border: `1px solid ${statusMeta.color}55`,
          }}
        >
          <div
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: `${statusMeta.color}22`, color: statusMeta.color }}
          >
            <StatusIcon size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: statusMeta.color, boxShadow: `0 0 8px ${statusMeta.color}` }}
              />
              <span className="text-sm font-medium" style={{ color: 'var(--c-text)' }}>
                {statusMeta.label}
              </span>
              {text.model && (
                <span className="truncate text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
                  {text.model}
                </span>
              )}
            </div>
            <p className="mt-1 text-[10px] leading-relaxed" style={{ color: 'var(--c-text-dim)' }}>
              {statusMeta.tip}
              {text.baseURL.trim() && (
                <span className="ml-1 opacity-80">
                  · 适配 {getDetectedProviderLabel(text.baseURL, text.model)}
                </span>
              )}
            </p>
            {last?.message && (
              <p
                className="mt-1 text-[10px] leading-relaxed"
                style={{ color: last.ok ? 'var(--c-accent)' : '#e57373' }}
              >
                上次测连：{last.message}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 text-[10px]"
            style={{ color: 'var(--c-primary)' }}
          >
            {expanded ? '收起' : '配置'}
          </button>
        </div>

        {expanded && (
          <>
            <div>
              <Label>一键预设</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {API_PRESETS.map((p) => {
                  const active =
                    p.id === 'custom'
                      ? !API_PRESETS.some((x) => x.id !== 'custom' && x.baseURL === text.baseURL)
                      : text.baseURL === p.baseURL
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        if (p.baseURL) void updateApi({ text: { ...text, baseURL: p.baseURL } })
                      }}
                      className="min-h-[36px] rounded-lg px-2.5 py-1.5 text-[11px]"
                      style={{
                        background: active ? 'var(--c-primary-soft)' : 'transparent',
                        color: active ? 'var(--c-primary)' : 'var(--c-text-dim)',
                        border: `1px solid ${active ? 'var(--c-primary)' : 'var(--c-border)'}`,
                      }}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <Label>Base URL</Label>
              <TextInput
                value={text.baseURL}
                onChange={(e) => {
                  void updateApi({ text: { ...text, baseURL: e.target.value } })
                  void updateUI({ apiTextLastStatus: undefined })
                }}
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div>
              <Label>API Key</Label>
              <TextInput
                type="password"
                value={text.apiKey}
                onChange={(e) => {
                  void updateApi({ text: { ...text, apiKey: e.target.value } })
                  void updateUI({ apiTextLastStatus: undefined })
                }}
                placeholder="sk-..."
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <Label>模型</Label>
                <button
                  type="button"
                  onClick={() => void pullModels()}
                  disabled={loadingModels}
                  className="text-[10px]"
                  style={{ color: 'var(--c-primary)' }}
                >
                  {loadingModels ? '拉取中…' : '重新拉取模型'}
                </button>
              </div>
              {models.length > 0 ? (
                <select
                  value={text.model}
                  onChange={(e) => updateApi({ text: { ...text, model: e.target.value } })}
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={inputStyle}
                >
                  {models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              ) : (
                <TextInput
                  value={text.model}
                  onChange={(e) => updateApi({ text: { ...text, model: e.target.value } })}
                  placeholder="gpt-4o-mini / deepseek-chat"
                />
              )}
            </div>
            <div>
              <Label>CORS 代理（可选）</Label>
              <TextInput
                value={proxyURL ?? ''}
                onChange={(e) => updateApi({ proxyURL: e.target.value })}
                placeholder="本地开发填 /cors-proxy；手机跨域必填"
              />
              <p className="mt-1 text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
                手机浏览器直连多数 AI API 会被跨域拦截。本地 `npm run dev` 时可填
                <code className="mx-0.5">/cors-proxy</code>
                ；线上需自备 HTTPS 代理。
              </p>
            </div>
            {modelError && (
              <p className="text-[11px] leading-relaxed" style={{ color: '#e57373' }}>
                {modelError}
              </p>
            )}
            <button
              type="button"
              onClick={() => void onTest()}
              disabled={testing || !configured}
              className="mt-1 flex min-h-[44px] items-center justify-center gap-1 rounded-xl py-2.5 text-sm font-medium"
              style={{
                background: 'linear-gradient(135deg, #c9a35a, #8a6a3a)',
                color: '#fff',
                opacity: testing || !configured ? 0.55 : 1,
              }}
            >
              {testing ? '测连中…' : '测试连接并写入联通状态'}
            </button>
            <p className="text-[10px] leading-relaxed" style={{ color: 'var(--c-text-dim)' }}>
              测通后，聊天页顶栏会显示联通灯；发送消息时会带上你在「AI 对话参数」里调的 temperature / top_p /
              max_tokens / 去重惩罚。
            </p>
          </>
        )}
      </div>
    </Section>
  )
}

function ImageSection() {
  const { settings, updateApi } = useSettingsStore()
  const { image, proxyURL } = settings.api
  const [models, setModels] = useState<string[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelError, setModelError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [testing, setTesting] = useState(false)

  const pullModels = async () => {
    if (!image.baseURL.trim() || !image.apiKey.trim()) return
    setLoadingModels(true)
    setModelError(null)
    try {
      const list = await fetchModelList(image.baseURL, image.apiKey, proxyURL)
      setModels(list)
      if (list.length && !list.includes(image.model)) {
        await updateApi({ image: { ...image, model: list[0] } })
      }
    } catch (e) {
      setModels([])
      setModelError(e instanceof Error ? e.message : '拉取模型失败')
    } finally {
      setLoadingModels(false)
    }
  }

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (image.baseURL.trim() && image.apiKey.trim()) void pullModels()
    }, 600)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image.baseURL, image.apiKey, proxyURL])

  const onTest = async () => {
    setTesting(true)
    const res = await testApiConnection(image.baseURL, image.apiKey, image.model, proxyURL)
    setTestResult(res)
    setTesting(false)
  }

  return (
    <Section icon={ImageIcon} title="生图接口" desc="拉取模型 · 测试连接 · 多模态识图请用文本模型">
      <div className="flex flex-col gap-2">
        <div>
          <Label>提供商</Label>
          <select
            value={image.provider}
            onChange={(e) => updateApi({ image: { ...image, provider: e.target.value as typeof image.provider } })}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={inputStyle}
          >
            <option value="openai">OpenAI Images</option>
            <option value="sdwebui">SD WebUI</option>
            <option value="custom">自定义</option>
          </select>
        </div>
        <div>
          <Label>Base URL</Label>
          <TextInput value={image.baseURL} onChange={(e) => updateApi({ image: { ...image, baseURL: e.target.value } })} />
        </div>
        <div>
          <Label>API Key</Label>
          <TextInput type="password" value={image.apiKey} onChange={(e) => updateApi({ image: { ...image, apiKey: e.target.value } })} />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <Label>模型</Label>
            <button type="button" onClick={() => void pullModels()} disabled={loadingModels} className="text-[10px]" style={{ color: 'var(--c-primary)' }}>
              {loadingModels ? '拉取中…' : '重新拉取'}
            </button>
          </div>
          {models.length > 0 ? (
            <select
              value={image.model}
              onChange={(e) => updateApi({ image: { ...image, model: e.target.value } })}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={inputStyle}
            >
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          ) : (
            <TextInput value={image.model} onChange={(e) => updateApi({ image: { ...image, model: e.target.value } })} placeholder="dall-e-3" />
          )}
        </div>
        {modelError && (
          <p className="text-[11px] leading-relaxed" style={{ color: '#e57373' }}>
            {modelError}
          </p>
        )}
        <button type="button" onClick={() => void onTest()} disabled={testing} className="mt-1 flex items-center justify-center gap-1 rounded-lg py-2 text-sm" style={{ background: 'var(--c-primary-soft)', color: 'var(--c-primary)' }}>
          {testing ? '测试中…' : '测试连接'}
        </button>
        {testResult && (
          <p className="text-[11px]" style={{ color: testResult.ok ? 'var(--c-accent)' : '#e57373' }}>{testResult.message}</p>
        )}
      </div>
    </Section>
  )
}

function TtsSection() {
  const { settings, updateApi } = useSettingsStore()
  const { tts, text, proxyURL } = settings.api
  const [ttsModels, setTtsModels] = useState<string[]>([])
  const [sttModels, setSttModels] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [ttsTest, setTtsTest] = useState<{ ok: boolean; message: string } | null>(null)
  const [sttTest, setSttTest] = useState<{ ok: boolean; message: string } | null>(null)

  const baseURL = tts.baseURL || text.baseURL
  const apiKey = tts.apiKey || text.apiKey

  const pullModels = async () => {
    if (!baseURL.trim() || !apiKey.trim()) return
    setLoading(true)
    try {
      const list = await fetchModelList(baseURL, apiKey, proxyURL)
      const ttsList = filterTtsModels(list)
      const sttList = filterSttModels(list)
      setTtsModels(ttsList.length ? ttsList : ['tts-1', 'tts-1-hd'])
      setSttModels(sttList.length ? sttList : ['whisper-1'])
    } catch {
      setTtsModels(['tts-1'])
      setSttModels(['whisper-1'])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (baseURL.trim() && apiKey.trim()) void pullModels()
    }, 600)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseURL, apiKey, proxyURL])

  return (
    <Section icon={Mic} title="语音接口" desc="STT 识别 + TTS 朗读 · 用于语音通话">
      <div className="flex flex-col gap-2">
        <div>
          <Label>提供商</Label>
          <select
            value={tts.provider}
            onChange={(e) => updateApi({ tts: { ...tts, provider: e.target.value as typeof tts.provider } })}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={inputStyle}
          >
            <option value="browser">浏览器原生（免费）</option>
            <option value="openai">OpenAI TTS</option>
            <option value="edge">Edge TTS</option>
            <option value="custom">自定义</option>
          </select>
        </div>
        {tts.provider !== 'browser' && (
          <>
            <div>
              <Label>Base URL</Label>
              <TextInput value={tts.baseURL} onChange={(e) => updateApi({ tts: { ...tts, baseURL: e.target.value } })} placeholder={text.baseURL} />
            </div>
            <div>
              <Label>API Key</Label>
              <TextInput type="password" value={tts.apiKey} onChange={(e) => updateApi({ tts: { ...tts, apiKey: e.target.value } })} placeholder="留空则使用文本 API Key" />
            </div>
            <div>
              <div className="mb-1 flex justify-between">
                <Label>TTS 模型</Label>
                <button type="button" onClick={() => void pullModels()} className="text-[10px]" style={{ color: 'var(--c-primary)' }}>{loading ? '…' : '拉取'}</button>
              </div>
              {ttsModels.length > 0 ? (
                <select value={tts.model} onChange={(e) => updateApi({ tts: { ...tts, model: e.target.value } })} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
                  {ttsModels.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              ) : (
                <TextInput value={tts.model} onChange={(e) => updateApi({ tts: { ...tts, model: e.target.value } })} placeholder="tts-1" />
              )}
            </div>
            <div>
              <Label>STT 模型（Whisper）</Label>
              {sttModels.length > 0 ? (
                <select value={tts.sttModel} onChange={(e) => updateApi({ tts: { ...tts, sttModel: e.target.value } })} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
                  {sttModels.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              ) : (
                <TextInput value={tts.sttModel} onChange={(e) => updateApi({ tts: { ...tts, sttModel: e.target.value } })} placeholder="whisper-1" />
              )}
            </div>
          </>
        )}
        <div>
          <Label>音色 ID</Label>
          <TextInput value={tts.voiceId} onChange={(e) => updateApi({ tts: { ...tts, voiceId: e.target.value } })} placeholder="zh-CN-XiaoxiaoNeural / alloy" />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={async () => { setTtsTest(await testTtsConnection(settings)) }} className="flex-1 rounded-lg py-2 text-xs" style={{ background: 'var(--c-primary-soft)', color: 'var(--c-primary)' }}>
            测试 TTS
          </button>
          <button type="button" onClick={async () => { setSttTest(await testSttConnection(settings)) }} className="flex-1 rounded-lg py-2 text-xs" style={{ background: 'var(--c-primary-soft)', color: 'var(--c-primary)' }}>
            测试 STT
          </button>
        </div>
        {ttsTest && <p className="text-[11px]" style={{ color: ttsTest.ok ? 'var(--c-accent)' : '#e57373' }}>{ttsTest.message}</p>}
        {sttTest && <p className="text-[11px]" style={{ color: sttTest.ok ? 'var(--c-accent)' : '#e57373' }}>{sttTest.message}</p>}
      </div>
    </Section>
  )
}

/* ---------------- 自定义 CSS ---------------- */
function ChatAppearanceSection() {
  const { settings, updateUI } = useSettingsStore()
  const colors = settings.ui.customColors ?? {}

  const patchColors = async (partial: CustomColors) => {
    const next: CustomColors = { ...colors, ...partial }
    // 清空「默认」时去掉空字符串键
    for (const key of Object.keys(next) as (keyof CustomColors)[]) {
      const v = next[key]
      if (v === '' || v === undefined) delete next[key]
    }
    await updateUI({ customColors: next })
    applyCustomColors(Object.keys(next).length ? next : undefined)
  }

  const applyPreset = async (id: string) => {
    const preset = CHAT_APPEARANCE_PRESETS.find((p) => p.id === id)
    if (!preset) return
    await updateUI({ customColors: { ...preset.colors } })
    applyCustomColors(Object.keys(preset.colors).length ? preset.colors : undefined)
  }

  const resetAll = async () => {
    await updateUI({ customColors: {} })
    applyCustomColors(undefined)
  }

  const ColorRow = ({
    label,
    colorKey,
    opacityKey,
    defaultColor,
    defaultOpacity,
  }: {
    label: string
    colorKey: keyof CustomColors
    opacityKey: keyof CustomColors
    defaultColor: string
    defaultOpacity: number
  }) => {
    const colorVal = (colors[colorKey] as string | undefined) || defaultColor
    const opVal =
      typeof colors[opacityKey] === 'number' ? (colors[opacityKey] as number) : defaultOpacity
    return (
      <div className="rounded-xl px-3 py-2.5" style={{ background: '#f7f2ea' }}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <Label>{label}</Label>
          <input
            type="color"
            value={colorVal.startsWith('#') ? colorVal.slice(0, 7) : defaultColor}
            onChange={(e) => void patchColors({ [colorKey]: e.target.value } as CustomColors)}
            className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent"
            title={label}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
            透明 {Math.round(opVal * 100)}%
          </span>
          <input
            type="range"
            min={20}
            max={100}
            step={1}
            value={Math.round(opVal * 100)}
            onChange={(e) =>
              void patchColors({ [opacityKey]: Number(e.target.value) / 100 } as CustomColors)
            }
            className="min-w-0 flex-1"
            style={{ accentColor: 'var(--c-primary)' }}
          />
        </div>
      </div>
    )
  }

  return (
    <Section icon={Paintbrush} title="聊天外观" desc="气泡 · 旁白 · 背景色调 · 预设与半透明">
      <div className="flex flex-col gap-3">
        <div>
          <Label>预设方案</Label>
          <div className="flex flex-wrap gap-1.5">
            {CHAT_APPEARANCE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => void applyPreset(p.id)}
                className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
                style={{
                  background: 'var(--c-primary-soft)',
                  color: 'var(--c-primary)',
                  border: '1px solid rgba(42,158,196,0.2)',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <ColorRow
          label="我的气泡"
          colorKey="bubbleMine"
          opacityKey="bubbleMineOpacity"
          defaultColor="#d96b7a"
          defaultOpacity={0.88}
        />
        <ColorRow
          label="对方气泡"
          colorKey="bubbleHer"
          opacityKey="bubbleHerOpacity"
          defaultColor="#fffcfa"
          defaultOpacity={0.82}
        />
        <ColorRow
          label="旁白气泡"
          colorKey="bubbleNarrator"
          opacityKey="bubbleNarratorOpacity"
          defaultColor="#f5b85c"
          defaultOpacity={0.42}
        />

        <div className="rounded-xl px-3 py-2.5" style={{ background: '#f7f2ea' }}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <Label>旁白文字色</Label>
            <input
              type="color"
              value={(colors.bubbleNarratorText || '#c9a35a').slice(0, 7)}
              onChange={(e) => void patchColors({ bubbleNarratorText: e.target.value })}
              className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent"
            />
          </div>
        </div>

        <ColorRow
          label="聊天背景色调"
          colorKey="chatBg"
          opacityKey="chatBgOpacity"
          defaultColor="#1c2f3a"
          defaultOpacity={0.22}
        />

        <div
          className="flex items-center justify-center gap-3 rounded-xl px-3 py-3"
          style={{ background: '#f3eee6' }}
        >
          <span
            className="rounded-2xl rounded-br-md px-3 py-1.5 text-[11px] text-white"
            style={{ background: 'var(--c-bubble-mine)' }}
          >
            我的气泡
          </span>
          <span
            className="rounded-2xl rounded-bl-md px-3 py-1.5 text-[11px]"
            style={{ background: 'var(--c-bubble-her)', color: 'var(--c-bubble-text)' }}
          >
            对方
          </span>
          <span
            className="rounded-lg px-3 py-1.5 text-[11px]"
            style={{
              background: 'var(--c-bubble-narrator)',
              color: 'var(--c-bubble-narrator-text)',
            }}
          >
            旁白
          </span>
        </div>

        <button
          type="button"
          onClick={() => void resetAll()}
          className="rounded-xl py-2 text-xs"
          style={{ color: 'var(--c-text-dim)' }}
        >
          恢复主题默认外观
        </button>
      </div>
    </Section>
  )
}

function CustomCssSection() {
  const [css, setCss] = useState('')
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getUserCSS().then((c) => setCss(c ?? ''))
  }, [])

  const apply = async () => {
    injectUserCSS(css)
    await putUserCSS(css)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  const clear = async () => {
    setCss('')
    injectUserCSS('')
    await clearUserCSS()
  }

  const onUpload = async (file?: File) => {
    if (!file) return
    const text = await readCSSFile(file)
    setCss(text)
  }

  return (
    <Section icon={Palette} title="自定义美化 CSS" desc="覆盖主题，可粘贴或上传 .css">
      <div className="flex flex-col gap-2">
        <textarea
          value={css}
          onChange={(e) => setCss(e.target.value)}
          placeholder=":root { --c-primary: #ff6b9d; } .app-shell { ... }"
          rows={6}
          className="w-full resize-y rounded-lg px-3 py-2 font-mono text-xs outline-none"
          style={inputStyle}
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={apply}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm"
            style={{ background: 'var(--c-primary)', color: '#fff' }}
          >
            <Check size={14} /> {saved ? '已生效' : '应用并保存'}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm"
            style={{ background: 'var(--c-primary-soft)', color: 'var(--c-primary)' }}
          >
            <Upload size={14} /> 上传 .css
          </button>
          <button
            onClick={clear}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm"
            style={{ color: 'var(--c-text-dim)' }}
          >
            <Trash2 size={14} /> 清除
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".css,text/css"
            className="hidden"
            onChange={(e) => onUpload(e.target.files?.[0])}
          />
        </div>
      </div>
    </Section>
  )
}

/* ---------------- 角色调试作弊器 ---------------- */
function NpcCheatSection() {
  const activeSession = useSessionStore((s) => s.activeSession)
  const replyTarget = useUIStore((s) => s.replyTargetCharacterId)
  const updateDynamicNpc = useSessionStore((s) => s.updateDynamicNpc)
  const setCharacterRelationship = useSessionStore((s) => s.setCharacterRelationship)
  const showToast = useUIStore((s) => s.showToast)

  const focusId = replyTarget ?? activeSession?.participantIds[0] ?? null
  const dyn = activeSession?.dynamicNpc
  const targetId = dyn?.id ?? focusId
  const rel = targetId ? activeSession?.relationships[targetId] : null
  const name = dyn?.displayName ?? '当前焦点角色'

  if (!activeSession || !targetId) {
    return (
      <Section icon={Wrench} title="角色调试（作弊）" desc="需先进入一场对话">
        <p className="text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
          打开聊天会话后，可在此直接改好感 / 信任 / 依赖 / 堕落 / 关注（仅本地调试）。
        </p>
      </Section>
    )
  }

  const setRel = (key: 'favor' | 'trust' | 'dependence', value: number) => {
    void setCharacterRelationship(targetId, { [key]: value })
  }

  const setDynNum = (key: 'corruption' | 'attention' | 'possessiveness', value: number) => {
    if (!dyn) {
      showToast('当前会话无动态男主', '关系值仍可调')
      return
    }
    const n = Math.max(0, Math.min(100, Math.round(value)))
    if (key === 'corruption') {
      void updateDynamicNpc({
        corruption: n,
        corruptionStage: corruptionStageFromValue(n),
      })
      return
    }
    void updateDynamicNpc({ [key]: n })
  }

  return (
    <Section
      icon={Wrench}
      title="角色调试（作弊）"
      desc={`本地调试 · ${name}（不写云端）`}
    >
      <div className="flex flex-col gap-3">
        <p className="text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
          拖动后立即写回当前会话。仅用于测试节奏与阈值，正式游玩请勿依赖。
        </p>
        {(
          [
            ['favor', '好感', rel?.favor ?? 0, (v: number) => setRel('favor', v)],
            ['trust', '信任', rel?.trust ?? 0, (v: number) => setRel('trust', v)],
            ['dependence', '依赖', rel?.dependence ?? 0, (v: number) => setRel('dependence', v)],
          ] as const
        ).map(([key, label, val, onChange]) => (
          <div key={key}>
            <Label>
              {label}：{val}
            </Label>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={val}
              onChange={(e) => onChange(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: 'var(--c-gold)' }}
            />
          </div>
        ))}
        {dyn &&
          (
            [
              ['corruption', '堕落', dyn.corruption, (v: number) => setDynNum('corruption', v)],
              ['attention', '关注', dyn.attention, (v: number) => setDynNum('attention', v)],
              [
                'possessiveness',
                '独占',
                dyn.possessiveness,
                (v: number) => setDynNum('possessiveness', v),
              ],
            ] as const
          ).map(([key, label, val, onChange]) => (
            <div key={key}>
              <Label>
                {label}：{val}%
                {key === 'corruption' ? ` · 阶段 ${dyn.corruptionStage}` : ''}
              </Label>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={val}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: 'var(--c-accent)' }}
              />
            </div>
          ))}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setRel('favor', 90)
              setRel('trust', 80)
              setRel('dependence', 70)
              if (dyn) {
                void updateDynamicNpc({
                  corruption: 80,
                  corruptionStage: corruptionStageFromValue(80),
                  attention: 90,
                  possessiveness: 70,
                })
              }
              showToast('已拉满调试数值')
            }}
            className="rounded-xl py-2.5 text-sm font-medium"
            style={{
              background: 'linear-gradient(135deg, var(--c-gold), var(--c-accent))',
              color: '#1a120c',
            }}
          >
            一键拉满
          </button>
          <button
            type="button"
            onClick={() => {
              setRel('favor', 10)
              setRel('trust', 8)
              setRel('dependence', 0)
              if (dyn) {
                void updateDynamicNpc({
                  corruption: 0,
                  corruptionStage: 1,
                  attention: 20,
                  possessiveness: 10,
                })
              }
              showToast('已重置调试数值')
            }}
            className="rounded-xl py-2.5 text-sm"
            style={{ background: '#f3eee6', color: 'var(--c-text-dim)' }}
          >
            重置
          </button>
        </div>
      </div>
    </Section>
  )
}

/* ---------------- 印章测试工具 ---------------- */
function StampCheatSection() {
  const stampCount = usePassportStore((s) => s.stampCount)
  const stamps = usePassportStore((s) => s.stamps)
  const clearStamps = usePassportStore((s) => s.clearStamps)
  const addStamp = usePassportStore((s) => s.addStamp)
  const showToast = useUIStore((s) => s.showToast)
  const total = allFacilityIds().length

  const [value, setValue] = useState(stampCount())
  const timeoutRef = useRef<number | null>(null)
  const applyingRef = useRef(false)

  useEffect(() => {
    setValue(stampCount())
  }, [stamps])

  const applyStampCount = async (target: number) => {
    if (applyingRef.current) return
    applyingRef.current = true
    try {
      await clearStamps()
      const ids = allFacilityIds()
      const n = Math.max(0, Math.min(target, ids.length))
      for (let i = 0; i < n; i++) {
        await addStamp(ids[i])
      }
    } finally {
      applyingRef.current = false
    }
  }

  const onSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    setValue(v)
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => {
      void applyStampCount(v)
    }, 120)
  }

  const clearAll = async () => {
    await clearStamps()
    showToast('印章已清空')
  }

  return (
    <Section icon={Stamp} title="印章测试" desc="本地调试契约章数量">
      <div className="flex flex-col gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Stamp size={14} style={{ color: 'var(--c-gold)' }} />
            <Label>
              印章数量：{value} / {total}
            </Label>
          </div>
          <input
            type="range"
            min={0}
            max={total}
            step={1}
            value={value}
            onChange={onSliderChange}
            className="w-full"
            style={{ accentColor: 'var(--c-gold)' }}
          />
        </div>
        <button
          type="button"
          onClick={() => void clearAll()}
          className="flex w-full items-center justify-center gap-1 rounded-xl py-2.5 text-sm"
          style={{ background: '#f3eee6', color: 'var(--c-text-dim)' }}
        >
          <Trash2 size={14} /> 清空印章
        </button>
      </div>
    </Section>
  )
}

function placeholderImg(name: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' fill='#3a2f55'/><text x='50%' y='50%' fill='#a182d4' font-size='28' text-anchor='middle' dominant-baseline='middle'>${name.slice(0, 1) || '?'}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
