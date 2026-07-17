import {
  Scroll,
  Swords,
  UserPlus,
  Camera,
  ShoppingBag,
  Users,
  Home,
  UserCog,
  Trophy,
  MessagesSquare,
  Star,
  HeartHandshake,
  Landmark,
  User,
  Backpack,
  Gift,
  FlaskConical,
  Flag,
  CalendarDays,
  Briefcase,
  BookOpen,
  Contact,
} from 'lucide-react'
import { usePassportStore } from '@/store/passportStore'
import { useProfileStore } from '@/store/profileStore'
import { useSettingsStore } from '@/store/settingsStore'
import { FeatureCard, FeatureCardGrid } from '@/ui/shared/FeatureCard'
import type { TavernSubView } from '@/store/uiStore'

export function TavernHub({ onNavigate }: { onNavigate: (v: TavernSubView) => void }) {
  const partyCount = usePassportStore((s) => s.partyIds.length)
  const homeCount = usePassportStore((s) => s.homeIds.length)
  const conquered = usePassportStore(
    (s) => Object.values(s.bonds).filter((b) => b.status === 'conquered').length,
  )
  const profile = useProfileStore((s) =>
    s.profiles.find((p) => p.id === useSettingsStore.getState().settings.ui.activeProfileId),
  )

  return (
    <div className="tome-page">
      <header className="tome-page__header">
        <h1 className="tome-page__title">冒险者酒馆</h1>
        <p className="tome-page__subtitle">
          公会委托、出征、养成与经营皆在此。对照规则书 Ch1 / Ch5 / Ch20–29。
        </p>
      </header>

      <div className="tome-stat-grid">
        <div className="tome-stat">
          <div className="tome-stat__value tome-stat__value--gold">{profile?.coins ?? 0}</div>
          <div className="tome-stat__label">金币</div>
        </div>
        <div className="tome-stat">
          <div className="tome-stat__value tome-stat__value--accent">{partyCount}/4</div>
          <div className="tome-stat__label">出征编组</div>
        </div>
        <div className="tome-stat">
          <div className="tome-stat__value">{conquered}</div>
          <div className="tome-stat__label">已攻略</div>
        </div>
        <div className="tome-stat">
          <div className="tome-stat__value">{homeCount}</div>
          <div className="tome-stat__label">酒馆驻留</div>
        </div>
      </div>

      <section className="tome-section">
        <div className="tome-section__title">核心服务</div>
        <FeatureCardGrid>
          <FeatureCard icon={Scroll} label="冒险任务" sub="公会委托 E–A" color="#d4b06a" onClick={() => onNavigate('quests')} />
          <FeatureCard icon={Briefcase} label="委托会" sub="日工·接单结算" color="#e8c878" onClick={() => onNavigate('commissions')} />
          <FeatureCard
            icon={Swords}
            label="出发冒险"
            sub="编组后出征"
            color="#c45c7a"
            badge={partyCount ? `${partyCount}人` : undefined}
            onClick={() => onNavigate('departure')}
          />
          <FeatureCard icon={UserPlus} label="招募召唤" sub="随机/自定义男主" color="#8b5cf6" onClick={() => onNavigate('recruit')} />
          <FeatureCard icon={Camera} label="留影石" sub="合照留念" color="#4ecdc4" onClick={() => onNavigate('photo_stone')} />
        </FeatureCardGrid>
      </section>

      <section className="tome-section">
        <div className="tome-section__title">杂谈与日记</div>
        <FeatureCardGrid>
          <FeatureCard icon={MessagesSquare} label="酒馆杂谈" sub="撰旅奇说·论坛" color="#3a9e9a" onClick={() => onNavigate('gossip')} />
          <FeatureCard icon={BookOpen} label="窥探日记" sub="自己/队伍·偷看私语" color="#7eb8d4" onClick={() => onNavigate('diary')} />
          <FeatureCard icon={Contact} label="卡片名册" sub="卡片·指令弹窗" color="#e06c88" onClick={() => onNavigate('roster')} />
          <FeatureCard icon={Users} label="出征编组" sub="编组上限 4" color="#c45c7a" onClick={() => onNavigate('party')} />
        </FeatureCardGrid>
      </section>

      <section className="tome-section">
        <div className="tome-section__title">档案与补给</div>
        <FeatureCardGrid>
          <FeatureCard icon={User} label="冒险者档案" sub="玩家人设·保存后AI读取" color="#e8b4c4" onClick={() => onNavigate('adventurer')} />
          <FeatureCard icon={ShoppingBag} label="酒馆商店" sub="装备·药剂·卷轴" color="#f5b85c" onClick={() => onNavigate('shop')} />
          <FeatureCard icon={Backpack} label="背包" sub="持有物品一览" color="#7eb8d4" onClick={() => onNavigate('backpack')} />
          <FeatureCard icon={FlaskConical} label="炼金工坊" sub="媚药·治疗剂" color="#3a9e9a" onClick={() => onNavigate('craft')} />
        </FeatureCardGrid>
      </section>

      <section className="tome-section">
        <div className="tome-section__title">队伍与驻留</div>
        <FeatureCardGrid>
          <FeatureCard icon={Home} label="酒馆驻留" sub="私语与养成" color="#22c55e" onClick={() => onNavigate('residents')} />
          <FeatureCard icon={UserCog} label="仆从管理" sub="指令·转正·释放" color="#7b68ee" onClick={() => onNavigate('servants')} />
          <FeatureCard icon={Gift} label="赠礼" sub="纪念日礼物" color="#c96b8a" onClick={() => onNavigate('gifts')} />
        </FeatureCardGrid>
      </section>

      <section className="tome-section">
        <div className="tome-section__title">声望与经营</div>
        <FeatureCardGrid>
          <FeatureCard icon={Star} label="区域声望" sub="八域 -100～+100" color="#d4b06a" onClick={() => onNavigate('reputation')} />
          <FeatureCard icon={HeartHandshake} label="服从度" sub="五阶递进" color="#c45c7a" onClick={() => onNavigate('obedience')} />
          <FeatureCard icon={Landmark} label="产业经营" sub="日结收入" color="#f5b85c" onClick={() => onNavigate('industry')} />
          <FeatureCard icon={Flag} label="阵营" sub="主线第三章后" color="#a84a4a" onClick={() => onNavigate('faction')} />
        </FeatureCardGrid>
      </section>

      <section className="tome-section">
        <div className="tome-section__title">扩展</div>
        <FeatureCardGrid>
          <FeatureCard icon={Trophy} label="竞技场" sub="开战掷骰" color="#a84a4a" onClick={() => onNavigate('arena')} />
          <FeatureCard icon={CalendarDays} label="日历档案" sub="纪念日·挑战" color="#7eb8d4" onClick={() => onNavigate('calendar')} />
          <FeatureCard
            icon={CalendarDays}
            label="节日系统"
            sub="预设/自定义·写入世界书"
            color="#e8c878"
            onClick={() => onNavigate('festivals')}
          />
        </FeatureCardGrid>
      </section>
    </div>
  )
}
