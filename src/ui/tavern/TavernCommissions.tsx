import { useEffect, useState } from 'react'
import { AlertTriangle, Briefcase, Loader2, RefreshCw } from 'lucide-react'
import { useSettingsStore } from '@/store/settingsStore'
import { useUIStore } from '@/store/uiStore'
import { useProfileStore } from '@/store/profileStore'
import { usePassportStore } from '@/store/passportStore'
import { useTavernLifeStore } from '@/store/tavernLifeStore'
import { useGeneratedStore } from '@/store/generatedStore'
import { generateCommissionBoard, resolveCommissionRun } from '@/ai/contentClient'
import { TomeSubShell } from '@/ui/shared/TomeSubShell'
import type { CommissionJob, CommissionReport } from '@/data/tavernLife'

export function TavernCommissions({ onBack }: { onBack: () => void }) {
  const settings = useSettingsStore((s) => s.settings)
  const activeProfileId = useSettingsStore((s) => s.settings.ui.activeProfileId)
  const showToast = useUIStore((s) => s.showToast)
  const profiles = useProfileStore((s) => s.profiles)
  const earnCoins = useProfileStore((s) => s.earnCoins)
  const bumpCultivation = usePassportStore((s) => s.bumpCultivation)
  const loaded = useTavernLifeStore((s) => s.loaded)
  const load = useTavernLifeStore((s) => s.load)
  const ensureStaminaDay = useTavernLifeStore((s) => s.ensureStaminaDay)
  const commissions = useTavernLifeStore((s) => s.commissions)
  const workStamina = useTavernLifeStore((s) => s.workStamina)
  const lastReport = useTavernLifeStore((s) => s.lastReport)
  const setCommissions = useTavernLifeStore((s) => s.setCommissions)
  const spendStamina = useTavernLifeStore((s) => s.spendStamina)
  const setActiveCommission = useTavernLifeStore((s) => s.setActiveCommission)
  const markCommissionDone = useTavernLifeStore((s) => s.markCommissionDone)
  const setLastReport = useTavernLifeStore((s) => s.setLastReport)
  const addRecord = useGeneratedStore((s) => s.addRecord)

  const [busy, setBusy] = useState(false)
  const [runningId, setRunningId] = useState<string | null>(null)
  const [report, setReport] = useState<CommissionReport | null>(lastReport)

  const profile = profiles.find((p) => p.id === activeProfileId) ?? profiles[0]

  useEffect(() => {
    if (!loaded) void load()
  }, [loaded, load])

  useEffect(() => {
    if (loaded) ensureStaminaDay()
  }, [loaded, ensureStaminaDay])

  useEffect(() => {
    if (loaded && commissions.length === 0 && !busy) {
      void refresh(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded])

  const refresh = async (toast = true) => {
    if (busy) return
    setBusy(true)
    if (toast) showToast('委托刷新中…', '村庄告示牌')
    try {
      const jobs = await generateCommissionBoard(settings)
      setCommissions(jobs)
      if (toast) showToast('委托已更新', `${jobs.length} 条可接`)
    } catch (e) {
      showToast('刷新失败', e instanceof Error ? e.message : '未知错误')
    } finally {
      setBusy(false)
    }
  }

  const accept = async (job: CommissionJob) => {
    if (runningId || job.status !== 'open') return
    if (!spendStamina(job.staminaCost)) {
      showToast('体力不足', `需要 ${job.staminaCost} 点可投入体力`)
      return
    }
    setRunningId(job.id)
    setActiveCommission(job.id)
    setCommissions(commissions.map((c) => (c.id === job.id ? { ...c, status: 'accepted' } : c)))
    showToast('接单中…', job.title)
    try {
      const result = await resolveCommissionRun(settings, job, profile?.name ?? '旅者')
      const rec: CommissionReport = {
        commissionId: job.id,
        title: job.title,
        narrative: result.narrative,
        outcome: result.outcome,
        coinsDelta: result.coinsDelta,
        staminaSpent: result.staminaSpent,
        at: Date.now(),
      }
      markCommissionDone(job.id)
      setLastReport(rec)
      setReport(rec)
      if (profile && result.coinsDelta > 0) {
        await earnCoins(profile.id, result.coinsDelta)
      }
      if (result.outcome === 'success') {
        await bumpCultivation({ allure: 1 })
      }
      await addRecord({
        type: 'commission',
        title: `${job.title} · ${result.outcome}`,
        content: result.narrative,
        meta: {
          coins: String(result.coinsDelta),
          outcome: result.outcome,
        },
      })
      showToast(
        result.outcome === 'fail' ? '一无所获' : `结算 +${result.coinsDelta} 金`,
        result.outcome === 'success' ? '圆满完成' : result.outcome === 'partial' ? '部分完成' : '委托失败',
      )
    } catch (e) {
      showToast('结算失败', e instanceof Error ? e.message : '未知错误')
    } finally {
      setRunningId(null)
    }
  }

  return (
    <TomeSubShell title="委托会" onBack={onBack}>
      <div className="tavern-job">
        <div className="tavern-forum__toolbar">
          <div>
            <p className="tome-hint mb-0">村庄告示牌 · 第1年·本月</p>
            <p className="tavern-job__cta">
              <Briefcase size={14} /> 今天有什么活适合你？
            </p>
          </div>
          <button type="button" className="tome-btn" disabled={busy} onClick={() => void refresh(true)}>
            {busy ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            刷新
          </button>
        </div>

        <div className="tavern-job__stats">
          <div className="tavern-job__stat">
            <span className="tavern-job__stat-label">可投入体力</span>
            <span className="tavern-job__stat-value">{workStamina}</span>
          </div>
          <div className="tavern-job__stat">
            <span className="tavern-job__stat-label">钱包余额</span>
            <span className="tavern-job__stat-value tavern-job__stat-value--gold">
              {profile?.coins ?? 0}
            </span>
          </div>
        </div>

        <div className="tavern-job__list">
          {commissions.map((job) => (
            <article key={job.id} className="tavern-job__card">
              <div className="tavern-job__card-top">
                <h3>{job.title}</h3>
                <span className="tavern-job__pay">{job.reward}</span>
              </div>
              <p className="tavern-job__employer">{job.employer}</p>
              <p className="tavern-job__summary">{job.summary}</p>
              <div className="tavern-job__tags">
                {job.tags.map((t) => (
                  <span key={t} className="tome-tag">
                    {t}
                  </span>
                ))}
              </div>
              <ul className="tavern-job__meta">
                <li>地点 · {job.location}</li>
                <li>时段 · {job.timeSlot}</li>
                <li>体力 · {job.staminaCost}</li>
              </ul>
              <p className="tavern-job__risk">
                <AlertTriangle size={12} /> {job.risk}
              </p>
              <button
                type="button"
                className="tavern-job__accept"
                disabled={job.status !== 'open' || Boolean(runningId) || busy}
                onClick={() => void accept(job)}
              >
                {runningId === job.id
                  ? '沟通接单中…'
                  : job.status === 'done'
                    ? '已完成'
                    : job.status === 'accepted'
                      ? '进行中'
                      : '立即沟通并接单'}
              </button>
            </article>
          ))}
        </div>
      </div>

      {report && (
        <div className="tavern-modal" role="dialog" aria-modal="true">
          <div className="tavern-modal__panel">
            <h3 className="tavern-modal__title">{report.title}</h3>
            <p className="tavern-modal__outcome">
              {report.outcome === 'success'
                ? '成功'
                : report.outcome === 'partial'
                  ? '部分完成'
                  : '一无所获'}
              {report.coinsDelta > 0 ? ` · +${report.coinsDelta} 金` : ''}
            </p>
            <p className="tavern-modal__body">{report.narrative}</p>
            <button type="button" className="tome-btn tome-btn--accent w-full" onClick={() => setReport(null)}>
              收下
            </button>
          </div>
        </div>
      )}
    </TomeSubShell>
  )
}
