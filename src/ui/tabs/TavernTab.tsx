import { useUIStore } from '@/store/uiStore'
import { TavernHub } from '@/ui/tavern/TavernHub'
import { TavernQuests } from '@/ui/tavern/TavernQuests'
import { TavernDeparture } from '@/ui/tavern/TavernDeparture'
import { TavernRecruit } from '@/ui/tavern/TavernRecruit'
import { TavernPhotoStone } from '@/ui/tavern/TavernPhotoStone'
import { TavernShopPanel } from '@/ui/tavern/TavernShopPanel'
import { TavernPartyPanel } from '@/ui/tavern/TavernPartyPanel'
import { TavernResidents } from '@/ui/tavern/TavernResidents'
import { TavernServants, TavernArena } from '@/ui/tavern/TavernServants'
import { TavernGossip } from '@/ui/tavern/TavernGossip'
import { TavernCommissions } from '@/ui/tavern/TavernCommissions'
import { TavernDiary } from '@/ui/tavern/TavernDiary'
import { TavernRoster } from '@/ui/tavern/TavernRoster'
import { TavernReputation, TavernObedience, TavernIndustry } from '@/ui/tavern/TavernPlayPanels'
import {
  TavernAdventurer,
  TavernBackpack,
  TavernGifts,
  TavernCraft,
  TavernFaction,
  TavernCalendar,
} from '@/ui/tavern/TavernMorePanels'
import { TavernFestivals } from '@/ui/tavern/TavernFestivals'

export function TavernTab() {
  const sub = useUIStore((s) => s.tavernSubView)
  const setTavernSubView = useUIStore((s) => s.setTavernSubView)
  const back = () => setTavernSubView('hub')

  switch (sub) {
    case 'quests':
      return <TavernQuests onBack={back} />
    case 'commissions':
      return <TavernCommissions onBack={back} />
    case 'departure':
      return <TavernDeparture onBack={back} />
    case 'recruit':
      return <TavernRecruit onBack={back} />
    case 'photo_stone':
      return <TavernPhotoStone onBack={back} />
    case 'shop':
      return <TavernShopPanel onBack={back} />
    case 'party':
      return <TavernPartyPanel onBack={back} />
    case 'roster':
      return <TavernRoster onBack={back} />
    case 'residents':
      return <TavernResidents onBack={back} />
    case 'servants':
      return <TavernServants onBack={back} />
    case 'arena':
      return <TavernArena onBack={back} />
    case 'forum':
    case 'gossip':
      return <TavernGossip onBack={back} />
    case 'diary':
      return <TavernDiary onBack={back} />
    case 'reputation':
      return <TavernReputation onBack={back} />
    case 'obedience':
      return <TavernObedience onBack={back} />
    case 'industry':
      return <TavernIndustry onBack={back} />
    case 'adventurer':
      return <TavernAdventurer onBack={back} />
    case 'backpack':
      return <TavernBackpack onBack={back} />
    case 'gifts':
      return <TavernGifts onBack={back} />
    case 'craft':
      return <TavernCraft onBack={back} />
    case 'faction':
      return <TavernFaction onBack={back} />
    case 'calendar':
      return <TavernCalendar onBack={back} />
    case 'festivals':
      return <TavernFestivals onBack={back} />
    default:
      return <TavernHub onNavigate={setTavernSubView} />
  }
}
