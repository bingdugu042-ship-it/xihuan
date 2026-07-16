/** 邀请码 · 由 scripts/gen-invite-codes.mjs 生成，勿手改 */
export const ADMIN_INVITE_CODE = 'XY-ADMIN-MASTER-2026'

export const INVITE_CODES: readonly string[] = [
  'XY-0277AE',
  'XY-099543',
  'XY-09A2C3',
  'XY-0C375F',
  'XY-1397EF',
  'XY-159292',
  'XY-200823',
  'XY-232069',
  'XY-23CEEF',
  'XY-27BF94',
  'XY-2BDFDF',
  'XY-2C691D',
  'XY-2C6E53',
  'XY-2F6481',
  'XY-32F149',
  'XY-39145D',
  'XY-3FB31E',
  'XY-43DB26',
  'XY-4D02DC',
  'XY-4D1C92',
  'XY-50F601',
  'XY-55FAC5',
  'XY-572FD1',
  'XY-57DA42',
  'XY-637C5B',
  'XY-648EF2',
  'XY-680801',
  'XY-691569',
  'XY-69AA28',
  'XY-6AEE16',
  'XY-8F0846',
  'XY-914E71',
  'XY-95AFEB',
  'XY-97FECD',
  'XY-9CF2AF',
  'XY-A9FCC0',
  'XY-B5A0E9',
  'XY-B5D942',
  'XY-C3EE4F',
  'XY-CEEFE8',
  'XY-D10284',
  'XY-D35335',
  'XY-D58B45',
  'XY-DFF954',
  'XY-E4C7E2',
  'XY-EF1F4D',
  'XY-EF89A7',
  'XY-F5FA0F',
  'XY-F85BA4',
  'XY-FA180E',
] as const

export type InviteRole = 'admin' | 'user'

export function verifyInviteCode(raw: string): InviteRole | null {
  const code = raw.trim().toUpperCase().replace(/\s+/g, '')
  if (!code) return null
  if (code === ADMIN_INVITE_CODE) return 'admin'
  if ((INVITE_CODES as readonly string[]).includes(code)) return 'user'
  return null
}
