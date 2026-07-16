/** 邀请码 · 由 scripts/gen-invite-codes.mjs 生成，勿手改 */
export const ADMIN_INVITE_CODE = 'XY-ADMIN-MASTER-2026'

export const INVITE_CODES: readonly string[] = [
  'XY-3294D0',
  'XY-B5CB19',
  'XY-D601B9',
] as const

export type InviteRole = 'admin' | 'user'

export function verifyInviteCode(raw: string): InviteRole | null {
  const code = raw.trim().toUpperCase().replace(/\s+/g, '')
  if (!code) return null
  if (code === ADMIN_INVITE_CODE) return 'admin'
  if ((INVITE_CODES as readonly string[]).includes(code)) return 'user'
  return null
}
