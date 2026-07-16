import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera,
  ScrollText,
  Crown,
  Check,
  ChevronLeft,
  ChevronRight,
  Dices,
  Swords,
} from 'lucide-react'
import { useProfileStore } from '@/store/profileStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useUIStore } from '@/store/uiStore'
import { useBodyStatsStore, type PlayerGender } from '@/store/bodyStatsStore'
import { useAdventureStatsStore } from '@/store/adventureStatsStore'
import {
  ADVENTURE_CLASSES,
  ATTR_DEFAULTS,
  ATTR_LABELS,
  STAT_POINT_POOL,
  STAT_SINGLE_MAX,
  STAT_SINGLE_MIN,
  spentStatPoints,
  type AdventureAttributes,
  type AdventureClassId,
  type AttrKey,
} from '@/data/adventureAttributes'
import { RACES } from '@/data/races'
import './onboarding.css'

const STEPS = ['身份', '身体', '职业', '加点', '规则'] as const

interface FormData {
  name: string
  age: string
  race: string
  background: string
  avatar: string
  gender: PlayerGender
  bodyType: string
  bodyDesc: string
  classId: AdventureClassId | null
  attributes: AdventureAttributes
  diceMode: 'on' | 'off' | 'mixed'
  dirtyTalk: 'off' | 'light' | 'medium' | 'hard'
  publicMode: boolean
  pregnancy: boolean
  bodyImpact: boolean
}

const EMPTY: FormData = {
  name: '',
  age: '',
  race: '人类',
  background: '',
  avatar: '',
  gender: 'female',
  bodyType: '匀称',
  bodyDesc: '',
  classId: null,
  attributes: { ...ATTR_DEFAULTS },
  diceMode: 'mixed',
  dirtyTalk: 'off',
  publicMode: false,
  pregnancy: false,
  bodyImpact: true,
}

export function Onboarding() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const createProfile = useProfileStore((s) => s.createProfile)
  const updateUI = useSettingsStore((s) => s.updateUI)
  const setFlowStage = useUIStore((s) => s.setFlowStage)
  const setGender = useBodyStatsStore((s) => s.setGender)
  const saveAdventure = useAdventureStatsStore((s) => s.saveAll)

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) => setForm((p) => ({ ...p, [k]: v }))

  const onPickAvatar = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set('avatar', reader.result as string)
    reader.readAsDataURL(file)
  }

  const pointsLeft = STAT_POINT_POOL - spentStatPoints(form.attributes)

  const bumpAttr = (key: AttrKey, delta: number) => {
    const cur = form.attributes[key]
    const next = cur + delta
    if (next < STAT_SINGLE_MIN || next > STAT_SINGLE_MAX) return
    if (key === 'cha' && next < ATTR_DEFAULTS.cha) return
    const trial = { ...form.attributes, [key]: next }
    if (spentStatPoints(trial) > STAT_POINT_POOL) return
    set('attributes', trial)
  }

  const canNext = () => {
    if (step === 0) return form.name.trim().length > 0
    if (step === 2) return form.classId !== null
    if (step === 3) return pointsLeft === 0
    return true
  }

  const submit = async () => {
    if (submitting) return
    setSubmitting(true)

    const genderLabel = form.gender === 'male' ? '男' : form.gender === 'female' ? '女' : '其他'
    const cls = ADVENTURE_CLASSES.find((c) => c.id === form.classId)
    const persona = [
      form.bodyDesc.trim(),
      `种族：${form.race}；职业：${cls?.name ?? '冒险者'}。`,
      form.background.trim(),
    ]
      .filter(Boolean)
      .join('\n')

    const profile = await createProfile({
      name: form.name.trim(),
      avatar: form.avatar,
      age: form.age || '外表适龄',
      gender: genderLabel,
      assets: form.background.trim() || '初到艾泽利亚的冒险者',
      livingEnvironment: '中央平原·冒险者公会分部',
      homeLayout: cls?.name ?? '冒险者',
      persona,
    })

    await setGender(form.gender)
    await saveAdventure({
      attributes: form.attributes,
      classId: form.classId ?? undefined,
      race: form.race,
      bodyType: form.bodyType,
      background: form.background,
      level: 1,
    })

    if (profile) {
      await updateUI({
        onboardingCompleted: true,
        activeProfileId: profile.id,
        cutscenePlayed: true,
        azeriaDiceMode: form.diceMode,
        azeriaDirtyTalkLevel: form.dirtyTalk,
        azeriaPublicMode: form.publicMode,
        azeriaPregnancyEnabled: form.pregnancy,
        azeriaBodyImpactEnabled: form.bodyImpact,
      })
    } else {
      await updateUI({
        onboardingCompleted: true,
        cutscenePlayed: true,
        azeriaDiceMode: form.diceMode,
        azeriaDirtyTalkLevel: form.dirtyTalk,
        azeriaPublicMode: form.publicMode,
        azeriaPregnancyEnabled: form.pregnancy,
        azeriaBodyImpactEnabled: form.bodyImpact,
      })
    }

    if (useSettingsStore.getState().settings.ui.inviteVerified) {
      setFlowStage('main')
      useUIStore.getState().setActiveTab('adventure')
    } else {
      setFlowStage('invite')
    }
  }

  const next = () => {
    if (!canNext()) return
    if (step < STEPS.length - 1) setStep((s) => s + 1)
    else void submit()
  }

  const prev = () => setStep((s) => Math.max(0, s - 1))

  return (
    <div className="ob-root">
      <motion.div
        className="ob-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="ob-head">
          <div className="ob-head__row">
            <div className="ob-eyebrow">
              <ScrollText size={14} /> 开局 · 规则书 Ch3/Ch10
            </div>
            <span className="ob-step-meta">
              {step + 1}/{STEPS.length} {STEPS[step]}
            </span>
          </div>
          <h1 className="ob-title">
            {step === 0 && '你是谁？'}
            {step === 1 && '身体设定'}
            {step === 2 && '选择职业'}
            {step === 3 && '六维加点'}
            {step === 4 && '规则偏好'}
          </h1>
          <div className="ob-progress">
            {STEPS.map((_, i) => (
              <div key={i} className={`ob-progress__seg${i <= step ? ' is-on' : ''}`} />
            ))}
          </div>
        </div>

        <div className="ob-body">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                <div className="ob-avatar-row">
                  <button type="button" onClick={() => fileRef.current?.click()} className="ob-avatar">
                    {form.avatar ? (
                      <img src={form.avatar} alt="" />
                    ) : (
                      <Camera size={18} />
                    )}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPickAvatar(e.target.files?.[0])} />
                  <p className="ob-hint" style={{ margin: 0 }}>
                    立绘可选。名讳必填。
                  </p>
                </div>
                <Field label="名讳 *" value={form.name} onChange={(v) => set('name', v)} placeholder="你在此世被称呼的名字" />
                <Field label="貌龄" value={form.age} onChange={(v) => set('age', v)} placeholder="例：二十二" />
                <label className="ob-field">
                  种族
                  <select
                    value={form.race}
                    onChange={(e) => set('race', e.target.value)}
                    className="ob-select"
                  >
                    <option value="人类">人类</option>
                    {RACES.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                    <option value="兽人">兽人</option>
                    <option value="其他">其他 / 混血</option>
                  </select>
                </label>
                <Field
                  label="背景"
                  value={form.background}
                  onChange={(v) => set('background', v)}
                  placeholder="身世、来到艾泽利亚的缘由…"
                  textarea
                />
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                <p className="ob-hint">规则书 Ch3.2：性别与体型影响叙事与部分判定。</p>
                <div className="ob-chip-row">
                  {(
                    [
                      ['female', '女'],
                      ['male', '男'],
                      ['other', '其他'],
                    ] as const
                  ).map(([g, label]) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => set('gender', g)}
                      className={`ob-chip${form.gender === g ? ' is-on' : ''}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <Field label="体型" value={form.bodyType} onChange={(v) => set('bodyType', v)} placeholder="纤细 / 匀称 / 丰满…" />
                <Field
                  label="外貌自述"
                  value={form.bodyDesc}
                  onChange={(v) => set('bodyDesc', v)}
                  placeholder="发色、瞳色、气质、显著特征…"
                  textarea
                />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                <p className="ob-hint" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Swords size={12} /> 九职业选一，决定初始技能与主属性。
                </p>
                <div>
                  {ADVENTURE_CLASSES.map((c) => {
                    const selected = form.classId === c.id
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => set('classId', c.id)}
                        className={`ob-class${selected ? ' is-on' : ''}`}
                      >
                        <div className="ob-class__top">
                          <span className="ob-class__name">{c.name}</span>
                          <span className="ob-class__attr">{c.mainAttr}</span>
                        </div>
                        <p className="ob-class__meta">
                          {c.role} · {c.skill}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                <p className="ob-hint">20 点自由分配 · 魅力已 +4（基础 14）· 单项上限 18</p>
                <p className={`ob-points${pointsLeft === 0 ? ' is-done' : ''}`}>剩余点数：{pointsLeft}</p>
                {(Object.keys(ATTR_LABELS) as AttrKey[]).map((key) => (
                  <div key={key} className="ob-stat">
                    <span className="ob-stat__label">{ATTR_LABELS[key]}</span>
                    <button type="button" onClick={() => bumpAttr(key, -1)} className="ob-stat__btn">
                      −
                    </button>
                    <span className="ob-stat__val">{form.attributes[key]}</span>
                    <button type="button" onClick={() => bumpAttr(key, 1)} className="ob-stat__btn">
                      +
                    </button>
                  </div>
                ))}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                <p className="ob-hint" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Dices size={12} /> 规则书 Ch10 开局偏好，可在设置页随时修改。
                </p>
                <PrefRow label="H 骰子">
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(['on', 'mixed', 'off'] as const).map((v) => (
                      <MiniBtn key={v} active={form.diceMode === v} onClick={() => set('diceMode', v)}>
                        {v === 'on' ? '开' : v === 'mixed' ? '混合' : '关'}
                      </MiniBtn>
                    ))}
                  </div>
                </PrefRow>
                <PrefRow label="粗口">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(
                      [
                        ['off', '关'],
                        ['light', '轻'],
                        ['medium', '中'],
                        ['hard', '重'],
                      ] as const
                    ).map(([v, label]) => (
                      <MiniBtn key={v} active={form.dirtyTalk === v} onClick={() => set('dirtyTalk', v)}>
                        {label}
                      </MiniBtn>
                    ))}
                  </div>
                </PrefRow>
                <PrefRow label="公共场合 H">
                  <MiniBtn active={form.publicMode} onClick={() => set('publicMode', !form.publicMode)}>
                    {form.publicMode ? '开' : '关'}
                  </MiniBtn>
                </PrefRow>
                <PrefRow label="怀孕系统">
                  <MiniBtn active={form.pregnancy} onClick={() => set('pregnancy', !form.pregnancy)}>
                    {form.pregnancy ? '开' : '关'}
                  </MiniBtn>
                </PrefRow>
                <PrefRow label="身体影响判定">
                  <MiniBtn active={form.bodyImpact} onClick={() => set('bodyImpact', !form.bodyImpact)}>
                    {form.bodyImpact ? '开' : '关'}
                  </MiniBtn>
                </PrefRow>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="ob-foot">
          {step > 0 && (
            <button type="button" onClick={prev} className="ob-btn-back">
              <ChevronLeft size={14} /> 上一步
            </button>
          )}
          <button type="button" disabled={!canNext() || submitting} onClick={next} className="ob-btn-next">
            {step < STEPS.length - 1 ? (
              <>
                下一步 <ChevronRight size={14} />
              </>
            ) : (
              <>
                <Crown size={14} />
                {submitting ? '铭刻中…' : '踏入艾泽利亚'}
                <Check size={14} />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  textarea?: boolean
}) {
  return (
    <label className="ob-field">
      {label}
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="ob-textarea"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="ob-input"
        />
      )}
    </label>
  )
}

function PrefRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p className="ob-pref-label">{label}</p>
      {children}
    </div>
  )
}

function MiniBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button type="button" onClick={onClick} className={`ob-mini${active ? ' is-on' : ''}`}>
      {children}
    </button>
  )
}
