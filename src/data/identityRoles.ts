import type { FacilityDef, FacilityIdentity } from './facilities'
import { FACILITY_MAP } from './facilities'
import { getIdentityDeepLexicon } from './identityDeepLexicon'

/** 玩家身份 id → NPC 对位身份 id */
const NPC_COUNTERPART_BY_FACILITY: Record<string, Record<string, string>> = {
  solar_sanctum: { wanderer: 'local', local: 'wanderer' },
  void_throne: { wanderer: 'local', local: 'wanderer' },
  succubus_office: { wanderer: 'local', local: 'wanderer' },
  moonwood: { wanderer: 'local', local: 'wanderer' },
  drake_crag: { wanderer: 'local', local: 'wanderer' },
  tidegate: { wanderer: 'local', local: 'wanderer' },
  dice_tavern: { wanderer: 'local', local: 'wanderer' },
  relic_auction: { wanderer: 'local', local: 'wanderer' },
}

export interface ResolvedIdentityRoles {
  player: FacilityIdentity
  npc: FacilityIdentity
  facility: FacilityDef
}

export function resolveIdentityRoles(
  facilityId: string,
  playerIdentityId?: string | null,
): ResolvedIdentityRoles | null {
  const facility = FACILITY_MAP[facilityId]
  if (!facility?.identities.length) return null

  const player =
    facility.identities.find((i) => i.id === playerIdentityId) ?? facility.identities[0]

  const counterpartId = NPC_COUNTERPART_BY_FACILITY[facilityId]?.[player.id]
  let npc =
    (counterpartId
      ? facility.identities.find((i) => i.id === counterpartId)
      : undefined) ?? facility.identities.find((i) => i.id !== player.id)

  if (!npc || npc.id === player.id) {
    npc = facility.identities.find((i) => i.id !== player.id) ?? {
      id: `${player.id}_counterpart`,
      name: `${facility.npcArchetype}（对位）`,
      description: `配合「${player.name}」的对位角色。`,
      promptHint: `配合「${player.name}」互动，绝不可自称「${player.name}」。`,
    }
  }

  return { player, npc, facility }
}

function rewriteAsUserRoleGuide(identity: FacilityIdentity, facilityId: string): string {
  const raw = identity.promptHint
    .replace(/^玩家扮演/g, '')
    .replace(/^玩家以.+?身份/g, '')
    .replace(/^玩家作为/g, '')
    .replace(/^玩家是/g, '')
    .replace(/^玩家/g, '')
    .trim()
  const deep = getIdentityDeepLexicon(facilityId, identity.id)
  return [
    `用户（人类）固定为「${identity.name}」。`,
    `互动时应把用户当作「${identity.name}」来对待。`,
    identity.description,
    raw ? `场景细节：${raw}` : '',
    deep ? `深化扮演：${deep}` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function rewriteAsNpcRoleGuide(
  npc: FacilityIdentity,
  player: FacilityIdentity,
  facilityId: string,
): string {
  const raw = npc.promptHint
    .replace(/^玩家扮演/g, '')
    .replace(/^玩家以.+?身份/g, '')
    .replace(/^玩家作为/g, '')
    .replace(/^玩家是/g, '')
    .replace(/^玩家/g, '')
    .trim()
  const deep = getIdentityDeepLexicon(facilityId, npc.id)
  return [
    `你（AI / 男主）本人就是「${npc.name}」，只能以「${npc.name}」的口吻、立场与权力说话。`,
    `绝对禁止自称「${player.name}」，绝对禁止把用户说成「${npc.name}」。`,
    `对面的用户是「${player.name}」——按这个权力关系互动。`,
    npc.description,
    raw ? `职责细节：${raw}` : '',
    deep ? `深化扮演：${deep}` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

export function formatIdentityPerspectivePrompt(roles: ResolvedIdentityRoles): string {
  const { player, npc, facility } = roles
  return [
    '',
    '## 身份视角锁定（最高优先级）',
    `场域：${facility.name}`,
    `用户 = 「${player.name}」｜你（AI） = 「${npc.name}」`,
    `### 用户侧 · 「${player.name}」`,
    rewriteAsUserRoleGuide(player, facility.id),
    `### 你侧 · 「${npc.name}」`,
    rewriteAsNpcRoleGuide(npc, player, facility.id),
    '禁止抢位、串戏、颠倒身份。',
  ].join('\n')
}

export function formatIdentityTurnReminder(roles: ResolvedIdentityRoles): string {
  const { player, npc } = roles
  return `【身份锁定】用户=「${player.name}」｜你=「${npc.name}」。勿抢用户身份。`
}

export function formatAtmosphereTurnReminder(params: {
  roles: ResolvedIdentityRoles | null
  eroticIntensity?: string | null
  exploreStyle?: string | null
}): string {
  const bits: string[] = []
  if (params.roles) bits.push(formatIdentityTurnReminder(params.roles))
  const inten =
    params.eroticIntensity === 'light'
      ? '轻度'
      : params.eroticIntensity === 'high'
        ? '高度'
        : params.eroticIntensity === 'extreme'
          ? '极致'
          : params.eroticIntensity === 'medium'
            ? '中度'
            : ''
  if (inten) bits.push(`尺度·${inten}`)
  if (params.exploreStyle === 'guided') bits.push('硬指引')
  if (params.exploreStyle === 'free') bits.push('自由探索')
  return bits.length ? bits.join(' · ') : ''
}
