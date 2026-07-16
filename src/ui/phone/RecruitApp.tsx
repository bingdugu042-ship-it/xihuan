import { PhoneAppShell } from './PhoneAppShell'
import { UserPlus } from 'lucide-react'

export function RecruitApp() {
  return (
    <PhoneAppShell title="招聘系统">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl" style={{ background: 'rgba(139,92,246,0.12)' }}>
          <UserPlus size={40} style={{ color: '#8b5cf6' }} />
        </div>
        <h2 className="text-lg font-medium" style={{ color: 'var(--c-text)' }}>招聘系统</h2>
        <p className="text-sm" style={{ color: 'var(--c-text-dim)' }}>自定义捏造 NPC，导入你的专属角色</p>
        <p className="text-xs" style={{ color: 'var(--c-text-muted)' }}>即将开放</p>
      </div>
    </PhoneAppShell>
  )
}
