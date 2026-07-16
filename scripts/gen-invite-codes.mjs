#!/usr/node
/** 生成邀请码 → src/data/inviteCodes.ts */
import { randomBytes } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dir = dirname(fileURLToPath(import.meta.url))
const ADMIN = 'XY-ADMIN-MASTER-2026'
const codes = new Set()
while (codes.size < 3) {
  codes.add(`XY-${randomBytes(3).toString('hex').toUpperCase()}`)
}
const list = [...codes].sort()

const out = `/** 邀请码 · 由 scripts/gen-invite-codes.mjs 生成，勿手改 */
export const ADMIN_INVITE_CODE = '${ADMIN}'

export const INVITE_CODES: readonly string[] = [
${list.map((c) => `  '${c}',`).join('\n')}
] as const

export type InviteRole = 'admin' | 'user'

export function verifyInviteCode(raw: string): InviteRole | null {
  const code = raw.trim().toUpperCase().replace(/\\s+/g, '')
  if (!code) return null
  if (code === ADMIN_INVITE_CODE) return 'admin'
  if ((INVITE_CODES as readonly string[]).includes(code)) return 'user'
  return null
}
`

writeFileSync(join(__dir, '../src/data/inviteCodes.ts'), out, 'utf8')
console.log('Admin:', ADMIN)
console.log('Generated', list.length, 'codes → src/data/inviteCodes.ts')
