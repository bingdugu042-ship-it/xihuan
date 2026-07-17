import { useEffect, useState } from 'react'
import { TomeSubShell } from '@/ui/shared/TomeSubShell'
import {
  ADVENTURE_CLASSES,
  ATTR_LABELS,
  formatAdventureStatsPanel,
  modifierFromScore,
  type AttrKey,
} from '@/data/adventureAttributes'
import { useAdventureStatsStore } from '@/store/adventureStatsStore'
import { useBodyStatsStore, FEMALE_STAT_LABELS, MALE_STAT_LABELS } from '@/store/bodyStatsStore'
import { useShopStore } from '@/store/shopStore'
import { usePassportStore } from '@/store/passportStore'
import { useProfileStore } from '@/store/profileStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useUIStore } from '@/store/uiStore'
import { useAzeriaProgressStore } from '@/store/azeriaProgressStore'
import { AZERIA_GIFTS, CRAFT_RECIPES, FACTIONS } from '@/data/azeriaGifts'
import { CULTIVATION_LABELS, CULTIVATION_MAX, type CultivationKey } from '@/data/cultivation'

type PersonaDraft = {
  name: string
  age: string
  gender: string
  assets: string
  livingEnvironment: string
  homeLayout: string
  persona: string
}

export function TavernAdventurer({ onBack }: { onBack: () => void }) {
  const attributes = useAdventureStatsStore((s) => s.attributes)
  const setAttributes = useAdventureStatsStore((s) => s.setAttributes)
  const classId = useAdventureStatsStore((s) => s.classId)
  const setClass = useAdventureStatsStore((s) => s.setClass)
  const level = useAdventureStatsStore((s) => s.level)
  const xp = useAdventureStatsStore((s) => s.xp)
  const skillPoints = useAdventureStatsStore((s) => s.skillPoints)
  const spendSkillPoint = useAdventureStatsStore((s) => s.spendSkillPoint)
  const race = useAdventureStatsStore((s) => s.race)
  const bodyType = useAdventureStatsStore((s) => s.bodyType)
  const background = useAdventureStatsStore((s) => s.background)
  const setMeta = useAdventureStatsStore((s) => s.setMeta)
  const cultivation = usePassportStore((s) => s.cultivation)
  const { gender, stats, stateLabels } = useBodyStatsStore()
  const labels = gender === 'male' ? MALE_STAT_LABELS : FEMALE_STAT_LABELS
  const cls = ADVENTURE_CLASSES.find((c) => c.id === classId)
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const showToast = useUIStore((s) => s.showToast)
  const profiles = useProfileStore((s) => s.profiles)
  const updateProfile = useProfileStore((s) => s.updateProfile)
  const createProfile = useProfileStore((s) => s.createProfile)
  const canCreate = useProfileStore((s) => s.canCreate)
  const activeProfileId = useSettingsStore((s) => s.settings.ui.activeProfileId)
  const updateUI = useSettingsStore((s) => s.updateUI)
  const profile = profiles.find((p) => p.id === activeProfileId) ?? profiles[0]

  const [draft, setDraft] = useState<PersonaDraft>({
    name: '',
    age: '',
    gender: '',
    assets: '',
    livingEnvironment: '',
    homeLayout: '',
    persona: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!profile) return
    setDraft({
      name: profile.name ?? '',
      age: profile.age ?? '',
      gender: profile.gender ?? '',
      assets: profile.assets ?? '',
      livingEnvironment: profile.livingEnvironment ?? '',
      homeLayout: profile.homeLayout ?? '',
      persona: profile.persona ?? '',
    })
  }, [profile?.id])

  const patchDraft = (partial: Partial<PersonaDraft>) =>
    setDraft((d) => ({ ...d, ...partial }))

  const savePersona = async () => {
    if (!draft.name.trim()) {
      showToast('请填写角色姓名', '这是你在对话里扮演的人')
      return
    }
    setSaving(true)
    try {
      if (profile) {
        await updateProfile(profile.id, {
          name: draft.name.trim(),
          age: draft.age.trim(),
          gender: draft.gender.trim(),
          assets: draft.assets.trim(),
          livingEnvironment: draft.livingEnvironment.trim(),
          homeLayout: draft.homeLayout.trim(),
          persona: draft.persona.trim(),
        })
        if (profile.id !== activeProfileId) {
          await updateUI({ activeProfileId: profile.id })
        }
      } else if (canCreate()) {
        const created = await createProfile({
          name: draft.name.trim(),
          avatar: '',
          age: draft.age.trim(),
          gender: draft.gender.trim(),
          assets: draft.assets.trim(),
          livingEnvironment: draft.livingEnvironment.trim(),
          homeLayout: draft.homeLayout.trim(),
          persona: draft.persona.trim(),
        })
        if (created) await updateUI({ activeProfileId: created.id })
      } else {
        showToast('无法创建', '模板已满，请先在设置里清理')
        return
      }
      showToast('冒险者档案已保存', '聊天时 AI 将按此角色与你对话')
    } finally {
      setSaving(false)
    }
  }

  const depart = () => {
    showToast('以此身份出发', '请在地图选择地区或 POI')
    setActiveTab('adventure')
  }

  const field = (
    label: string,
    key: keyof PersonaDraft,
    opts?: { rows?: number; placeholder?: string },
  ) => (
    <label className="mt-2 block text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
      {label}
      {opts?.rows ? (
        <textarea
          className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
          rows={opts.rows}
          style={{ background: 'var(--c-bg)', color: 'var(--c-text)', border: '1px solid var(--c-border)' }}
          value={draft[key]}
          onChange={(e) => patchDraft({ [key]: e.target.value })}
          placeholder={opts.placeholder}
        />
      ) : (
        <input
          className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
          style={{ background: 'var(--c-bg)', color: 'var(--c-text)', border: '1px solid var(--c-border)' }}
          value={draft[key]}
          onChange={(e) => patchDraft({ [key]: e.target.value })}
          placeholder={opts?.placeholder}
        />
      )}
    </label>
  )

  return (
    <TomeSubShell title="冒险者档案" onBack={onBack}>
      <p className="tome-hint mb-3">
        与设置「我的模板」同一套。这里保存的是你操控的角色：聊天时你扮演此人，AI 只扮演男主，不会视角错乱。
      </p>

      <section className="tome-card mb-3">
        <div className="tome-section__title">玩家角色卡（AI 读取）</div>
        {field('角色姓名 *', 'name', { placeholder: '对话气泡与 AI 识别用此名' })}
        <div className="mt-2 grid grid-cols-2 gap-2">
          {field('年龄', 'age', { placeholder: '如 22' })}
          {field('性别', 'gender', { placeholder: '女 / 男 / 其他' })}
        </div>
        {field('人设自述 *', 'persona', {
          rows: 5,
          placeholder: '外貌、性格、说话方式、过往、对男主的态度……越详细，男主越能对上你。',
        })}
        {field('资产 / 社会身份', 'assets', {
          rows: 2,
          placeholder: '金币、爵位、行会身份、随身物…',
        })}
        {field('居住环境', 'livingEnvironment', {
          rows: 2,
          placeholder: '常住何处、旅行习惯…',
        })}
        {field('家庭 / 私密空间布置', 'homeLayout', {
          rows: 2,
          placeholder: '酒馆阁楼布置、喜欢的氛围…',
        })}
        <button
          type="button"
          className="tome-btn tome-btn--accent mt-3 w-full"
          disabled={saving}
          onClick={() => void savePersona()}
        >
          {saving ? '保存中…' : '保存角色卡 · AI 按此读取'}
        </button>
        <p className="tome-hint mt-2">
          保存后立即生效于下一句对话。设置里的「我的模板」会同步这份内容。
        </p>
      </section>

      <button type="button" className="tome-btn mb-3 w-full" onClick={depart}>
        以此身份出发 · 打开地图
      </button>

      <div className="tome-stat-grid mb-3">
        <div className="tome-stat">
          <div className="tome-stat__value tome-stat__value--gold">Lv.{level ?? 1}</div>
          <div className="tome-stat__label">等级</div>
        </div>
        <div className="tome-stat">
          <div className="tome-stat__value">{xp ?? 0}</div>
          <div className="tome-stat__label">经验</div>
        </div>
        <div className="tome-stat">
          <div className="tome-stat__value tome-stat__value--accent">{skillPoints ?? 0}</div>
          <div className="tome-stat__label">技能点</div>
        </div>
        <div className="tome-stat">
          <div className="tome-stat__value">{cls?.name ?? '未选'}</div>
          <div className="tome-stat__label">职业</div>
        </div>
      </div>
      {(skillPoints ?? 0) > 0 && (
        <p className="tome-hint mb-2">
          有 {skillPoints} 点技能点：点击下方属性旁的「+」分配（委托成功可升级）。
        </p>
      )}

      <section className="tome-card mb-3">
        <div className="tome-section__title">冒险身份（并入 AI 读取）</div>
        <label className="mt-2 block text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
          种族
          <input
            className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
            style={{ background: 'var(--c-bg)', color: 'var(--c-text)', border: '1px solid var(--c-border)' }}
            value={race ?? ''}
            onChange={(e) => void setMeta({ race: e.target.value })}
            placeholder="人类 / 混血…"
          />
        </label>
        <label className="mt-2 block text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
          体型气质
          <input
            className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
            style={{ background: 'var(--c-bg)', color: 'var(--c-text)', border: '1px solid var(--c-border)' }}
            value={bodyType ?? ''}
            onChange={(e) => void setMeta({ bodyType: e.target.value })}
            placeholder="纤细 / 高挑 / 结实…"
          />
        </label>
        <label className="mt-2 block text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
          冒险背景
          <textarea
            className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
            rows={2}
            style={{ background: 'var(--c-bg)', color: 'var(--c-text)', border: '1px solid var(--c-border)' }}
            value={background ?? ''}
            onChange={(e) => void setMeta({ background: e.target.value })}
            placeholder="出身与过往…"
          />
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {ADVENTURE_CLASSES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`tome-btn${classId === c.id ? ' tome-btn--accent' : ''}`}
              onClick={() => void setClass(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
        {cls && (
          <p className="mt-1 text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
            {cls.role} · {cls.skill}
          </p>
        )}
      </section>

      <section className="tome-section">
        <div className="tome-section__title">六维属性</div>
        <div className="tome-grid-2">
          {(Object.keys(ATTR_LABELS) as AttrKey[]).map((k) => (
            <div key={k} className="tome-card py-2.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>{ATTR_LABELS[k]}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="tome-btn"
                    onClick={() =>
                      void setAttributes({ ...attributes, [k]: Math.max(8, attributes[k] - 1) })
                    }
                  >
                    −
                  </button>
                  <span style={{ color: 'var(--c-gold)', minWidth: 48, textAlign: 'center' }}>
                    {attributes[k]}（{modifierFromScore(attributes[k]) >= 0 ? '+' : ''}
                    {modifierFromScore(attributes[k])}）
                  </span>
                  <button
                    type="button"
                    className="tome-btn"
                    title={(skillPoints ?? 0) > 0 ? '消耗 1 技能点' : '手动调整'}
                    onClick={() => {
                      if ((skillPoints ?? 0) > 0) {
                        void spendSkillPoint(k).then((ok) => {
                          if (ok) showToast('技能点已分配', ATTR_LABELS[k])
                        })
                        return
                      }
                      void setAttributes({ ...attributes, [k]: Math.min(18, attributes[k] + 1) })
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="tome-section">
        <div className="tome-section__title">轻养成</div>
        <div className="tome-card">
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(CULTIVATION_LABELS) as CultivationKey[]).map((k) => (
              <div key={k} className="text-xs">
                <div className="flex justify-between">
                  <span>{CULTIVATION_LABELS[k].name}</span>
                  <span>
                    {cultivation[k]}/{CULTIVATION_MAX}
                  </span>
                </div>
                <div className="tome-progress mt-1.5">
                  <div
                    className="tome-progress__bar"
                    style={{ width: `${(cultivation[k] / CULTIVATION_MAX) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="tome-section">
        <div className="tome-section__title">身体状态</div>
        <ul className="tome-list">
          {Object.entries(labels).map(([key, label]) => (
            <li key={key} className="tome-list-item">
              <span className="tome-list-item__name">{label}</span>
              <span style={{ color: 'var(--c-accent)' }}>{stats[key] ?? 0}%</span>
            </li>
          ))}
        </ul>
        <p className="tome-hint mt-2">
          状态：{stateLabels.lower ?? '—'} · {stateLabels.stamina ?? '—'} · {stateLabels.mind ?? '—'}
        </p>
      </section>

      <pre
        className="tome-card mt-3 whitespace-pre-wrap text-[10px]"
        style={{ color: 'var(--c-text-dim)' }}
      >
        {formatAdventureStatsPanel(attributes, classId)}
      </pre>
    </TomeSubShell>
  )
}

export function TavernBackpack({ onBack }: { onBack: () => void }) {
  const inventory = useShopStore((s) => s.inventory)
  const getItem = useShopStore((s) => s.getItem)
  const showToast = useUIStore((s) => s.showToast)

  return (
    <TomeSubShell title="背包" onBack={onBack}>
      <p className="tome-hint mb-3">规则书 Ch2 / `$背包`。商店购买与炼金产物均存于此。</p>
      {inventory.length === 0 && <p className="tome-hint">背包为空。可去「酒馆商店」或「炼金工坊」。</p>}
      <ul className="tome-list">
        {inventory.map((e) => {
          const item = getItem(e.itemId)
          return (
            <li key={e.itemId} className="tome-list-item">
              <div>
                <div className="tome-list-item__name">{item?.name ?? e.itemId}</div>
                <div className="tome-list-item__meta">{item?.desc?.slice(0, 48) ?? ''}</div>
              </div>
              <button
                type="button"
                className="tome-btn"
                onClick={() => showToast('持有', `×${e.count} · ${item?.effect ?? '可在场景中使用'}`)}
              >
                ×{e.count}
              </button>
            </li>
          )
        })}
      </ul>
    </TomeSubShell>
  )
}

export function TavernGifts({ onBack }: { onBack: () => void }) {
  const bonds = usePassportStore((s) => s.bonds)
  const giftItem = useShopStore((s) => s.giftItem)
  const inventory = useShopStore((s) => s.inventory)
  const buyItem = useShopStore((s) => s.buyItem)
  const allItems = useShopStore((s) => s.allItems)
  const { profiles, spendCoins } = useProfileStore()
  const settings = useSettingsStore((s) => s.settings)
  const showToast = useUIStore((s) => s.showToast)
  const addAnniversary = useAzeriaProgressStore((s) => s.addAnniversary)
  const profile = profiles.find((p) => p.id === settings.ui.activeProfileId)
  const conquered = Object.values(bonds).filter((b) => b.status === 'conquered' || b.status === 'courting')

  const sendGift = async (giftId: string, characterId: string, displayName: string, raceId: string) => {
    const gift = AZERIA_GIFTS.find((g) => g.id === giftId)
    if (!gift || !profile) return
    const okRace = gift.races.includes('*') || gift.races.includes(raceId)
    if (!okRace) {
      showToast('不太合适', `${gift.name} 更适合其他种族`)
      return
    }
    if (gift.price > 0) {
      const shopItem = allItems().find((i) => i.id === giftId)
      const owned = inventory.find((e) => e.itemId === giftId)
      if (!owned || owned.count <= 0) {
        if (shopItem) {
          const bought = await buyItem(shopItem, profile.id, (n) => spendCoins(profile.id, n))
          if (!bought) {
            showToast('金币不足', gift.name)
            return
          }
        } else {
          const paid = await spendCoins(profile.id, gift.price)
          if (!paid) {
            showToast('金币不足', gift.name)
            return
          }
        }
      }
    }
    await giftItem(giftId, characterId, gift.name)
    await addAnniversary({ characterId, displayName, bondedAt: Date.now() })
    showToast('赠礼成功', `${displayName} · ${gift.note}`)
  }

  return (
    <TomeSubShell title="赠礼与纪念日" onBack={onBack}>
      <p className="tome-hint mb-3">规则书 Ch29。好感≥70 后记录羁绊纪念日。</p>
      {conquered.length === 0 && <p className="tome-hint">尚无可赠礼对象。</p>}
      {conquered.map((b) => (
        <section key={b.characterId} className="tome-section">
          <div className="tome-section__title">{b.displayName}</div>
          <div className="flex flex-wrap gap-2">
            {AZERIA_GIFTS.filter((g) => g.races.includes('*') || g.races.includes(b.raceId)).map((g) => (
              <button
                key={g.id}
                type="button"
                className="tome-btn"
                onClick={() => void sendGift(g.id, b.characterId, b.displayName, b.raceId)}
              >
                {g.name}
                {g.price > 0 ? ` · ${g.price}G` : ''}
              </button>
            ))}
          </div>
        </section>
      ))}
      <p className="tome-hint mt-2">持有金币：{profile?.coins ?? 0} G</p>
    </TomeSubShell>
  )
}

export function TavernCraft({ onBack }: { onBack: () => void }) {
  const { profiles, spendCoins } = useProfileStore()
  const settings = useSettingsStore((s) => s.settings)
  const showToast = useUIStore((s) => s.showToast)
  const profile = profiles.find((p) => p.id === settings.ui.activeProfileId)

  const craft = async (recipe: (typeof CRAFT_RECIPES)[number]) => {
    if (!profile) return
    const ok = await spendCoins(profile.id, recipe.cost)
    if (!ok) {
      showToast('金币不足', recipe.name)
      return
    }
    await useShopStore.getState().grantItem(recipe.resultItemId, 1)
    showToast('炼成', recipe.resultName)
  }

  return (
    <TomeSubShell title="炼金工坊" onBack={onBack}>
      <p className="tome-hint mb-3">规则书 Ch25：炼金媚药与基础药剂（简化制作）。</p>
      <ul className="tome-list">
        {CRAFT_RECIPES.map((r) => (
          <li key={r.id} className="tome-list-item flex-col !items-stretch gap-2">
            <div className="tome-list-item__name">{r.name}</div>
            <div className="tome-list-item__meta">
              材料：{r.need} · 工费 {r.cost} G
            </div>
            <button type="button" className="tome-btn tome-btn--accent self-end" onClick={() => void craft(r)}>
              制作
            </button>
          </li>
        ))}
      </ul>
    </TomeSubShell>
  )
}

export function TavernFaction({ onBack }: { onBack: () => void }) {
  const faction = useAzeriaProgressStore((s) => s.faction)
  const setFaction = useAzeriaProgressStore((s) => s.setFaction)
  const mainChapter = useAzeriaProgressStore((s) => s.mainChapter)
  const load = useAzeriaProgressStore((s) => s.load)
  const showToast = useUIStore((s) => s.showToast)

  useEffect(() => {
    void load()
  }, [load])

  const locked = mainChapter < 3

  return (
    <TomeSubShell title="阵营选择" onBack={onBack}>
      <p className="tome-hint mb-3">
        规则书 Ch12。主线第三章后解锁。当前章节 {mainChapter}/6
        {locked ? '（未达第三章，仅可预览）' : ''}。
      </p>
      <ul className="tome-list">
        {FACTIONS.filter((f) => f.id !== 'none').map((f) => (
          <li key={f.id} className={`tome-list-item flex-col !items-stretch gap-2 ${faction === f.id ? 'tome-card--glow' : ''}`}>
            <div className="tome-list-item__name">{f.name}</div>
            <p className="text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
              {f.desc}
            </p>
            <button
              type="button"
              className="tome-btn tome-btn--accent self-end"
              disabled={locked && f.id !== faction}
              onClick={() => {
                if (locked) {
                  showToast('尚未解锁', '推进主线至第三章')
                  return
                }
                void setFaction(f.id).then(() => showToast('阵营已选定', f.name))
              }}
            >
              {faction === f.id ? '当前阵营' : locked ? '锁定' : '选择'}
            </button>
          </li>
        ))}
      </ul>
    </TomeSubShell>
  )
}

export function TavernCalendar({ onBack }: { onBack: () => void }) {
  const anniversaries = useAzeriaProgressStore((s) => s.anniversaries)
  const challengeLog = useAzeriaProgressStore((s) => s.challengeLog)
  const load = useAzeriaProgressStore((s) => s.load)

  useEffect(() => {
    void load()
  }, [load])

  return (
    <TomeSubShell title="日历与档案" onBack={onBack}>
      <section className="tome-section">
        <div className="tome-section__title">羁绊纪念日</div>
        {anniversaries.length === 0 && <p className="tome-hint">赠礼或攻略后自动记录。</p>}
        <ul className="tome-list">
          {anniversaries.map((a) => (
            <li key={a.characterId} className="tome-list-item">
              <div className="tome-list-item__name">{a.displayName}</div>
              <div className="tome-list-item__meta">{new Date(a.bondedAt).toLocaleDateString('zh-CN')}</div>
            </li>
          ))}
        </ul>
      </section>
      <section className="tome-section">
        <div className="tome-section__title">挑战记录（$档案）</div>
        {challengeLog.length === 0 && <p className="tome-hint">开启 `$挑战` 并完成目标后出现于此。</p>}
        <div className="tome-card text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
          {challengeLog.map((l, i) => (
            <p key={i} className="mb-1">
              {l}
            </p>
          ))}
        </div>
      </section>
    </TomeSubShell>
  )
}
