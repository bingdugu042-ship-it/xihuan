import { useState } from 'react'
import { useDataStore } from '@/store/dataStore'
import { useSessionStore } from '@/store/sessionStore'
import { useUIStore } from '@/store/uiStore'
import type { FacilityDef } from '@/data/facilities'
import { openFacilityEntry, isAdventureRegion } from '@/utils/facilityEntry'

export function useTemplateActions() {
  const { regions } = useDataStore()
  const createSession = useSessionStore((s) => s.createSession)
  const appendUserMessage = useSessionStore((s) => s.appendUserMessage)
  const activeSession = useSessionStore((s) => s.activeSession)
  const [arrivalBanner, setArrivalBanner] = useState<string | null>(null)

  const enterFacility = async (f: FacilityDef) => {
    if (isAdventureRegion(f.id)) {
      openFacilityEntry(f.id, { switchToWorld: false })
      setArrivalBanner(`请选择身份与玩法：${f.name}`)
      window.setTimeout(() => setArrivalBanner(null), 2800)
      return
    }
    const region = regions[f.id]
    if (!region) return
    await createSession({
      regionId: f.id,
      participantIds: region.defaultParticipants ?? [],
      type: region.type ?? 'private',
      title: f.name,
      withIntro: true,
    })
    useUIStore.getState().setActiveTab('chat')
    setArrivalBanner(`你已到达：${f.name}`)
    window.setTimeout(() => setArrivalBanner(null), 2800)
  }

  const runCommand = async (cmd: string) => {
    await appendUserMessage(cmd)
  }

  return {
    enterFacility,
    runCommand,
    arrivalBanner,
    activeFacilityId: activeSession?.regionId ?? null,
    activeSession,
  }
}
