import { useEffect, useState } from 'react'
import { CalendarHeart, Plus, Trash2 } from 'lucide-react'
import { PRESET_FESTIVALS } from '@/data/festivals'
import { useFestivalStore } from '@/store/festivalStore'
import { useUIStore } from '@/store/uiStore'
import { TomeSubShell } from '@/ui/shared/TomeSubShell'

/** 节日系统：预设 + 自定义，写入后全局 AI / NPC 遵从 */
export function TavernFestivals({ onBack }: { onBack: () => void }) {
  const load = useFestivalStore((s) => s.load)
  const loaded = useFestivalStore((s) => s.loaded)
  const custom = useFestivalStore((s) => s.custom)
  const forcedOn = useFestivalStore((s) => s.forcedOn)
  const forcedOff = useFestivalStore((s) => s.forcedOff)
  const activeFestivals = useFestivalStore((s) => s.activeFestivals)
  const addCustom = useFestivalStore((s) => s.addCustom)
  const removeCustom = useFestivalStore((s) => s.removeCustom)
  const setEnabled = useFestivalStore((s) => s.setEnabled)
  const showToast = useUIStore((s) => s.showToast)

  const [name, setName] = useState('')
  const [blurb, setBlurb] = useState('')
  const [worldbook, setWorldbook] = useState('')
  const [behaviors, setBehaviors] = useState('提及节日,送礼,共庆')

  useEffect(() => {
    if (!loaded) void load()
  }, [loaded, load])

  const active = activeFestivals()
  const isOn = (id: string) => !forcedOff.includes(id) && (forcedOn.includes(id) || active.some((a) => a.id === id))

  const create = () => {
    if (!name.trim()) {
      showToast('请填写节日名')
      return
    }
    addCustom({
      name: name.trim(),
      blurb: blurb.trim() || '自定义节日氛围',
      worldbook:
        worldbook.trim() ||
        `【全球节日 · ${name.trim()}】\n${blurb.trim() || '全员沉浸此节日，言行需呼应。'}`,
      npcBehaviors: behaviors
        .split(/[,，、]/)
        .map((s) => s.trim())
        .filter(Boolean),
    })
    showToast('节日已写入世界书', '全体 NPC 将遵从')
    setName('')
    setBlurb('')
    setWorldbook('')
  }

  return (
    <TomeSubShell title="节日系统" onBack={onBack}>
      <p className="tome-hint mb-3">
        开启或自定义节日后，会注入全局世界书：对话、委托、驻留中的 NPC / 男主都会做节日相关动作。
      </p>

      <section className="tome-card tome-card--glow mb-3">
        <div className="tome-section__title">
          <CalendarHeart size={14} /> 当前生效（{active.length}）
        </div>
        {active.length === 0 ? (
          <p className="tome-hint mt-2">今日无自然节日，可强制开启预设或创建自定义。</p>
        ) : (
          <ul className="tome-list mt-2">
            {active.map((f) => (
              <li key={f.id} className="tome-list-item flex-col !items-stretch">
                <div className="tome-list-item__name">{f.name}</div>
                <div className="tome-list-item__meta">{f.blurb}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="tome-section">
        <div className="tome-section__title">预设节日</div>
        <ul className="tome-list">
          {PRESET_FESTIVALS.map((f) => (
            <li key={f.id} className="tome-list-item">
              <div>
                <div className="tome-list-item__name">{f.name}</div>
                <div className="tome-list-item__meta">
                  {f.dateKey ? `日期 ${f.dateKey}` : '无固定日'} · {f.blurb}
                </div>
              </div>
              <button
                type="button"
                className={`tome-btn${isOn(f.id) ? ' tome-btn--accent' : ''}`}
                onClick={() => {
                  setEnabled(f.id, !isOn(f.id))
                  showToast(isOn(f.id) ? '已关闭节日' : '节日已开启', f.name)
                }}
              >
                {isOn(f.id) ? '关闭' : '开启'}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="tome-card mt-3">
        <div className="tome-section__title mb-2">
          <Plus size={14} /> 自定义节日
        </div>
        <input
          className="tome-card mb-2 w-full text-sm"
          style={{ color: 'var(--c-text)' }}
          placeholder="节日名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="tome-card mb-2 w-full text-sm"
          style={{ color: 'var(--c-text)' }}
          placeholder="一句话氛围"
          value={blurb}
          onChange={(e) => setBlurb(e.target.value)}
        />
        <textarea
          className="tome-card mb-2 w-full text-sm"
          style={{ color: 'var(--c-text)' }}
          rows={3}
          placeholder="世界书正文（写入 AI）"
          value={worldbook}
          onChange={(e) => setWorldbook(e.target.value)}
        />
        <input
          className="tome-card mb-2 w-full text-sm"
          style={{ color: 'var(--c-text)' }}
          placeholder="NPC 行为关键词，逗号分隔"
          value={behaviors}
          onChange={(e) => setBehaviors(e.target.value)}
        />
        <button type="button" className="tome-btn tome-btn--accent w-full" onClick={create}>
          创建并立即生效
        </button>
      </section>

      {custom.length > 0 && (
        <section className="tome-section mt-3">
          <div className="tome-section__title">我的自定义</div>
          <ul className="tome-list">
            {custom.map((f) => (
              <li key={f.id} className="tome-list-item">
                <div>
                  <div className="tome-list-item__name">{f.name}</div>
                  <div className="tome-list-item__meta">{f.blurb}</div>
                </div>
                <button
                  type="button"
                  className="tome-btn tome-btn--ghost"
                  onClick={() => {
                    removeCustom(f.id)
                    showToast('已删除节日', f.name)
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </TomeSubShell>
  )
}
