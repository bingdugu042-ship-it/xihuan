import { FACILITY_MAP, type FacilityDef, type FacilityIdentity } from './facilities'
import { getFacilityWorldbook } from './facilityWorldbook'
import { resolveIdentityRoles } from './identityRoles'

function buildNarrator(
  facility: FacilityDef,
  player: FacilityIdentity | undefined,
  playMode: string | undefined,
  npcIdentity: FacilityIdentity | undefined,
): string {
  const book = getFacilityWorldbook(facility.id)
  const scene = book?.scene ?? facility.scene
  const lines = [
    `【旁白 · ${facility.name}】`,
    scene,
    player ? `你以「${player.name}」踏入此地。${player.description}` : '',
  ]
  if (npcIdentity) {
    lines.push(`对面男主将以「${npcIdentity.name}」与你对峙——不会抢走你的权柄。`)
  }
  if (playMode) lines.push(`本卷篇章：${playMode}。`)
  if (book?.stamp) {
    lines.push(`（推进至高潮后可缔结契约印记：${book.stamp}。缔结后仍可继续冒险。）`)
  }
  return lines.filter(Boolean).join('\n')
}

const CURATED_NPC_LINES: Record<string, Record<string, string>> = {
  solar_sanctum: {
    wanderer: '圣光很烫。请……退后半步。不对，留下也可以。',
    local: '受审者？不。你身上的气味不像凡人。',
  },
  void_throne: {
    wanderer: '空席在响。你听见了吗？像是在叫你的名字。',
    local: '访客礼节我懂。可条文没写该如何接待「你这样的人」。',
  },
  succubus_office: {
    wanderer: '按手册第三节……等等，条款里没有「被盯着就不会结巴」。',
    local: '委托事项请写清楚。我、我会尽量正经完成。',
  },
  moonwood: {
    wanderer: '弓弦比情话准。你若再走近一步，我就当是主动。',
    local: '迷途？月林从不迷途。迷途的是人心。',
  },
  drake_crag: {
    wanderer: '力量说话。你要挑战还是要我靠着？',
    local: '庇护可以给。体温另算。',
  },
  tidegate: {
    wanderer: '今日潮汐偏雄性相。另一面……再往深处走。',
    local: '落水的人运气不好，或运气太好。',
  },
  dice_tavern: {
    wanderer: '骰子转起来之前，先说你敢赌什么。',
    local: '观赛也要下注。你的目光已经下了。',
  },
  relic_auction: {
    wanderer: '出价声像心跳。你是来买，还是来被买？',
    local: '展台上的人不能随便眨眼——可你眨了，我也想。',
  },
}

function buildNpcLine(
  facility: FacilityDef,
  player: FacilityIdentity,
  npc: FacilityIdentity,
): string {
  const curated = CURATED_NPC_LINES[facility.id]?.[player.id]
  if (curated) return curated
  return `我是「${npc.name}」。${player.name}，今晚的节奏……交给你，也交给我。`
}

export function getFacilityOpening(
  facilityId: string,
  identityId?: string | null,
  playMode?: string | null,
): { narrator: string; npcLine: string } {
  const facility = FACILITY_MAP[facilityId]
  if (!facility) {
    return {
      narrator: '你踏入艾尔茜利恩的某处边域。空气里带着硫磺、圣油与潮汐的混合气味。',
      npcLine: '……欢迎。预言说会有人来——没想到是你。',
    }
  }
  const roles = resolveIdentityRoles(facilityId, identityId)
  const player = roles?.player ?? facility.identities[0]
  const npc =
    roles?.npc ?? facility.identities.find((i) => i.id !== player?.id) ?? facility.identities[0]
  if (!player) {
    return {
      narrator: `你踏入「${facility.name}」。`,
      npcLine: `欢迎来到${facility.name}。`,
    }
  }
  return {
    narrator: buildNarrator(facility, player, playMode ?? undefined, npc),
    npcLine: buildNpcLine(facility, player, npc!),
  }
}

/** 动态男主：保留身份口吻，替换为具体名字 */
export function personalizeNpcOpening(line: string, displayName: string, greeting?: string): string {
  if (greeting?.trim()) return greeting.trim()
  if (!line) return `${displayName}看着你，轻声开口。`
  let out = line
  if (out.includes('旅者')) out = out.replaceAll('旅者', '你')
  if (out.includes('男主')) out = out.replaceAll('男主', displayName)
  return out.includes(displayName) ? out : `${displayName}：「${out}」`
}
