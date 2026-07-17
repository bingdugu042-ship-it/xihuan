import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MapPin, X, Compass, Swords, User, ChevronLeft, Plus, Beer, Home } from 'lucide-react'
import { FACILITIES, FACILITY_MAP, getZone } from '@/data/facilities'
import {
  AZERIA_WORLD_REGION_MAP,
  resolveLocationCopy,
  type AzeriaPoi,
  type AzeriaWorldRegion,
} from '@/data/azeriaWorldRegions'
import { AZERIA_MAP_HOTSPOTS, AZERIA_MAP_SIZE, AZERIA_TAVERN_PIN, hotspotToPx } from '@/data/azeriaMapHotspots'
import { useDataStore } from '@/store/dataStore'
import { usePassportStore } from '@/store/passportStore'
import { useUIStore } from '@/store/uiStore'
import { useSessionStore } from '@/store/sessionStore'
import { useCustomRegionStore } from '@/store/customRegionStore'
import { resolveAzeriaRegion } from '@/worldview/azeriaRegionMap'
import { ZoneDetailPage } from './ZoneDetailPage'
import type { FacilityDef, ThemeZoneId } from '@/data/facilities'
import { getCharacterImageCandidates, characterPlaceholder } from '@/utils/image'
import type { BondRecord, CharacterCard, Region } from '@/types'
import {
  enterTavernHallChat,
  enterTavernStayGroup,
  enterTavernStayPrivate,
  openTavernHub,
} from '@/utils/tavernStay'
import { HOME_PRESET_MAP } from '@/data/homes'

const MAP_WIDTH = AZERIA_MAP_SIZE.width
const MAP_HEIGHT = AZERIA_MAP_SIZE.height
const MIN_SCALE = 0.35
const MAX_SCALE = 4

function leadPortrait(char?: CharacterCard | null, fallbackName = '?'): string {
  if (!char) return characterPlaceholder(fallbackName, 'lead')
  return getCharacterImageCandidates(char)[0] ?? characterPlaceholder(char.name, char.id)
}

export function ScrollMap() {
  const regions = useDataStore((s) => s.regions)
  const staticChars = useDataStore((s) => s.characters)
  const runtimeChars = useDataStore((s) => s.runtimeCharacters)
  const characters = useMemo(
    () => ({ ...staticChars, ...runtimeChars }),
    [staticChars, runtimeChars],
  )
  const stamps = usePassportStore((s) => s.stamps)
  const stampedCount = Object.keys(stamps).length
  const hasStamp = (facilityId: string) => Boolean(stamps[facilityId])
  const openFacilityPlayPage = useUIStore((s) => s.openFacilityPlayPage)
  const setRegionHue = useUIStore((s) => s.setRegionHue)
  const selectedRegionId = useUIStore((s) => s.selectedRegionId)
  const setSelectedRegionId = useUIStore((s) => s.setSelectedRegionId)
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const createSession = useSessionStore((s) => s.createSession)
  const activeSession = useSessionStore((s) => s.activeSession)
  const customRegions = useCustomRegionStore((s) => s.regions)
  const setWorldTreeModalOpen = useUIStore((s) => s.setWorldTreeModalOpen)
  const homeIds = usePassportStore((s) => s.homeIds)
  const bonds = usePassportStore((s) => s.bonds)
  const homePresetId = usePassportStore((s) => s.homePresetId)

  const activeWorldId = activeSession?.regionId ? regions[activeSession.regionId]?.worldId : undefined
  const isAzeriaWorld = !activeWorldId || activeWorldId === 'azeria' || activeWorldId === 'aetherion'

  const [panelOpen, setPanelOpen] = useState(false)
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<AzeriaPoi | null>(null)
  const [detailZoneId, setDetailZoneId] = useState<ThemeZoneId | null>(null)
  const [tavernOpen, setTavernOpen] = useState(false)

  const selectedRegion =
    panelOpen && selectedRegionId ? AZERIA_WORLD_REGION_MAP[selectedRegionId] : null
  const selectedFacility = selectedFacilityId ? FACILITY_MAP[selectedFacilityId] : null

  const markers = useMemo(() => {
    return AZERIA_MAP_HOTSPOTS.map((h) => {
      const region = AZERIA_WORLD_REGION_MAP[h.regionId]
      const facilityId = region?.facilityIds?.[0]
      const facility = facilityId ? FACILITY_MAP[facilityId] : undefined
      const leads = h.leadIds.map((id) => characters[id]).filter(Boolean) as CharacterCard[]
      // 区域本身始终可点；设施缺失只影响「玩法入域」，不锁地图
      const unlocked = true
      const stamped = facilityId ? hasStamp(facilityId) : false
      return {
        ...h,
        pos: hotspotToPx(h),
        region,
        facility,
        leads,
        unlocked,
        stamped,
      }
    })
  }, [characters, regions, stamps])

  const selectRegion = (regionId: string) => {
    setTavernOpen(false)
    setSelectedRegionId(regionId)
    setPanelOpen(true)
    setSelectedFacilityId(null)
    setSelectedLocation(null)
    const hotspot = AZERIA_MAP_HOTSPOTS.find((h) => h.regionId === regionId)
    if (hotspot) setRegionHue(hotspot.hue)
  }

  const openTavernPin = () => {
    setPanelOpen(false)
    setSelectedFacilityId(null)
    setSelectedLocation(null)
    setSelectedRegionId(null)
    setRegionHue(AZERIA_TAVERN_PIN.hue)
    setTavernOpen(true)
  }

  const closeRegionPanel = () => {
    setPanelOpen(false)
    setSelectedFacilityId(null)
    setSelectedLocation(null)
    setTavernOpen(false)
  }

  const enterFacility = (facilityId: string) => {
    if (!regions[facilityId]) {
      useUIStore.getState().showToast('尚未解锁', '该冒险域数据未载入')
      return
    }
    openFacilityPlayPage(facilityId)
  }

  const freeRoamInto = async (
    facilityId: string,
    location?: AzeriaPoi | string,
    worldRegionId?: string,
  ) => {
    const region = regions[facilityId]
    if (!region) {
      useUIStore.getState().showToast('无法进入', '关联冒险域未载入，请检查游戏数据')
      return
    }
    const loc =
      typeof location === 'string'
        ? ({ id: location, name: location, blurb: location } as AzeriaPoi)
        : location
    const titleHint = loc?.name
    const { buildFreeRoamParticipants, freeRoamSessionTitle } = await import('@/utils/freeRoamParty')
    const pids = buildFreeRoamParticipants(facilityId, worldRegionId)
    await createSession({
      regionId: facilityId,
      participantIds: pids,
      type: pids.length > 1 ? 'group' : 'private',
      title: freeRoamSessionTitle(facilityId, titleHint),
      withIntro: true,
      playMode: '自由游玩',
      exploreStyle: 'free',
    })
    if (loc && selectedRegion) {
      const copy = resolveLocationCopy(loc, selectedRegion)
      await useSessionStore.getState().appendSystemMessage(
        `【抵达 · ${copy.name}】\n${copy.lore}\n\n${copy.worldbook}`,
        'narrator',
      )
    }
    useUIStore.getState().setImmersionMode('explore')
    closeRegionPanel()
    setActiveTab('chat')
  }

  const enterCustomRegion = async (region: Region) => {
    const pids = (region.defaultParticipants ?? []).filter((id) => characters[id] || runtimeChars[id])
    await createSession({
      regionId: region.id,
      participantIds: pids.length ? pids : [],
      type: region.type ?? (pids.length > 1 ? 'group' : 'private'),
      title: `${region.name} · 自定义`,
      withIntro: true,
      playMode: '自由游玩',
      exploreStyle: 'free',
    })
    if (region.worldbook || region.premise) {
      await useSessionStore.getState().appendSystemMessage(
        `【抵达 · ${region.name}】\n${region.worldbook || region.premise}`,
        'narrator',
      )
    }
    useUIStore.getState().setImmersionMode('explore')
    setActiveTab('chat')
  }

  const primaryFacilityId = (region: AzeriaWorldRegion) =>
    region.facilityIds?.find((id) => regions[id]) ?? region.facilityIds?.[0]

  const mapSrc = isAzeriaWorld
    ? `${import.meta.env.BASE_URL}assets/worldmap/azeria/map.png`
    : `${import.meta.env.BASE_URL}assets/worldmap/aetherion/map.png`
  const mapAlt = isAzeriaWorld ? '艾泽利亚大陆地图' : '艾尔茜利恩大陆地图'
  const mapCaptionTitle = isAzeriaWorld ? '艾泽利亚大陆' : '艾尔茜利恩'

  return (
    <div className="scroll-map">
      <div className="scroll-map__tools">
        <button
          type="button"
          className="scroll-map__tool-btn"
          onClick={() => setWorldTreeModalOpen(true)}
        >
          <Plus size={14} /> 添加地点
        </button>
        <button
          type="button"
          className="scroll-map__tool-btn scroll-map__tool-btn--tavern"
          onClick={openTavernPin}
        >
          <Beer size={14} /> 酒馆
        </button>
      </div>

      <div className="scroll-map__frame">
        <div className="scroll-map__rod scroll-map__rod--top" aria-hidden />
        <MapCanvas
          markers={markers}
          customPins={customRegions}
          selectedRegionId={selectedRegionId}
          tavernSelected={tavernOpen}
          onSelect={selectRegion}
          onSelectTavern={openTavernPin}
          onSelectCustom={(r) => void enterCustomRegion(r)}
          stampCount={stampedCount}
          mapSrc={mapSrc}
          mapAlt={mapAlt}
          mapCaptionTitle={mapCaptionTitle}
        />
        <div className="scroll-map__rod scroll-map__rod--bottom" aria-hidden />
      </div>

      <AnimatePresence>
        {tavernOpen && (
          <TavernMapPanel
            residents={homeIds.map((id) => bonds[id]).filter(Boolean)}
            presetName={HOME_PRESET_MAP[homePresetId]?.name ?? '酒馆阁楼'}
            lead={characters[AZERIA_TAVERN_PIN.leadId] ?? null}
            onClose={closeRegionPanel}
            onOpenHub={() => {
              closeRegionPanel()
              openTavernHub()
            }}
            onHallChat={() => void enterTavernHallChat().then(() => closeRegionPanel())}
            onGroupChat={() => void enterTavernStayGroup().then(() => closeRegionPanel())}
            onPrivate={(id) => void enterTavernStayPrivate(id).then(() => closeRegionPanel())}
            onManageResidents={() => {
              closeRegionPanel()
              useUIStore.getState().setTavernSubView('residents')
              useUIStore.getState().setActiveTab('tavern')
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedRegion && !selectedFacility && !selectedLocation && !tavernOpen && (
          <RegionPanel
            region={selectedRegion}
            cityLabel={AZERIA_MAP_HOTSPOTS.find((h) => h.regionId === selectedRegion.id)?.cityLabel}
            leads={
              (AZERIA_MAP_HOTSPOTS.find((h) => h.regionId === selectedRegion.id)?.leadIds ?? [])
                .map((id) => characters[id])
                .filter(Boolean) as CharacterCard[]
            }
            onClose={closeRegionPanel}
            onPickFacility={(fid) => {
              setSelectedFacilityId(fid)
            }}
            onPickLocation={(loc) => setSelectedLocation(loc)}
            onEnterPrimary={() => {
              const fid = primaryFacilityId(selectedRegion)
              if (fid) enterFacility(fid)
              else useUIStore.getState().showToast('尚未解锁', '本域暂无可用冒险域')
            }}
            onFreeRoam={() => {
              const fid = primaryFacilityId(selectedRegion)
              if (fid) {
                void freeRoamInto(
                  fid,
                  AZERIA_MAP_HOTSPOTS.find((h) => h.regionId === selectedRegion.id)?.cityLabel
                    ? {
                        id: selectedRegion.id,
                        name:
                          AZERIA_MAP_HOTSPOTS.find((h) => h.regionId === selectedRegion.id)
                            ?.cityLabel ?? selectedRegion.name,
                        blurb: selectedRegion.description,
                        lore: selectedRegion.description,
                        worldbook: `【区域世界书 · ${selectedRegion.name}】\n${selectedRegion.description}\n环境：${selectedRegion.env} · 统治：${selectedRegion.race}`,
                      }
                    : undefined,
                  selectedRegion.id,
                )
              } else {
                useUIStore.getState().showToast('无法进入', '本域暂无可用冒险域数据')
              }
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedRegion && selectedLocation && !selectedFacility && (
          <LocationPanel
            region={selectedRegion}
            location={selectedLocation}
            onClose={closeRegionPanel}
            onBack={() => setSelectedLocation(null)}
            onEnter={() => {
              const fid = primaryFacilityId(selectedRegion)
              if (fid) void freeRoamInto(fid, selectedLocation, selectedRegion.id)
              else useUIStore.getState().showToast('无法进入', '本域暂无可用冒险域数据')
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedFacility && (
          <FacilityPanel
            facility={selectedFacility}
            onClose={closeRegionPanel}
            onBack={() => setSelectedFacilityId(null)}
            onEnter={() => enterFacility(selectedFacility.id)}
            onZoneGuide={() => setDetailZoneId(selectedFacility.zone)}
            portraitSrc={leadPortrait(
              selectedRegion?.fixedLeadId ? characters[selectedRegion.fixedLeadId] : null,
              selectedFacility.npcArchetype,
            )}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailZoneId && (
          <ZoneDetailPage zoneId={detailZoneId} onClose={() => setDetailZoneId(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

type MapMarker = (typeof AZERIA_MAP_HOTSPOTS)[number] & {
  pos: { x: number; y: number }
  region?: AzeriaWorldRegion
  facility?: FacilityDef
  leads: CharacterCard[]
  unlocked: boolean
  stamped: boolean
}

interface MapCanvasProps {
  markers: MapMarker[]
  customPins: Region[]
  selectedRegionId: string | null
  tavernSelected: boolean
  onSelect: (regionId: string) => void
  onSelectTavern: () => void
  onSelectCustom: (region: Region) => void
  stampCount: number
  mapSrc: string
  mapAlt: string
  mapCaptionTitle: string
}

function MapCanvas({
  markers,
  customPins,
  selectedRegionId,
  tavernSelected,
  onSelect,
  onSelectTavern,
  onSelectCustom,
  stampCount,
  mapSrc,
  mapAlt,
  mapCaptionTitle,
}: MapCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const gestureRef = useRef({
    active: false,
    mode: 'none' as 'none' | 'pan' | 'pinch',
    startPointer: { x: 0, y: 0 },
    startTransform: { x: 0, y: 0, scale: 1 },
    pointers: new Map<number, { x: number; y: number }>(),
    lastCenter: { x: 0, y: 0 },
    lastDist: 0,
    moved: false,
  })

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

  const getBounds = (scale: number) => {
    const viewport = viewportRef.current
    if (!viewport) return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
    const vw = viewport.clientWidth
    const vh = viewport.clientHeight
    const imgW = MAP_WIDTH * scale
    const imgH = MAP_HEIGHT * scale
    const minX = Math.min(0, vw - imgW * 0.85)
    const maxX = Math.max(0, vw - imgW * 0.15)
    const minY = Math.min(0, vh - imgH * 0.85)
    const maxY = Math.max(0, vh - imgH * 0.15)
    return { minX, maxX, minY, maxY }
  }

  const fitToBounds = (next: { x: number; y: number; scale: number }) => {
    const bounds = getBounds(next.scale)
    return {
      scale: next.scale,
      x: clamp(next.x, bounds.minX, bounds.maxX),
      y: clamp(next.y, bounds.minY, bounds.maxY),
    }
  }

  const initTransform = () => {
    const viewport = viewportRef.current
    if (!viewport) return
    const vw = viewport.clientWidth
    const vh = viewport.clientHeight
    // 竖图优先铺满高度，略放大方便点城邦
    const scale = Math.max(vw / MAP_WIDTH, vh / MAP_HEIGHT) * 0.92
    const x = (vw - MAP_WIDTH * scale) / 2
    const y = (vh - MAP_HEIGHT * scale) / 2
    setTransform(fitToBounds({ x, y, scale }))
  }

  useEffect(() => {
    initTransform()
    const viewport = viewportRef.current
    if (!viewport) return
    const ro = new ResizeObserver(() => initTransform())
    ro.observe(viewport)
    return () => ro.disconnect()
  }, [])

  const updatePointers = (touches: TouchList | React.TouchList) => {
    const g = gestureRef.current
    g.pointers.clear()
    for (let i = 0; i < touches.length; i++) {
      const t = touches[i]
      g.pointers.set(t.identifier, { x: t.clientX, y: t.clientY })
    }
  }

  const getCenterAndDist = () => {
    const pts = Array.from(gestureRef.current.pointers.values())
    if (pts.length < 2) return null
    return {
      center: { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 },
      dist: Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y),
    }
  }

  const onTouchStart = (e: React.TouchEvent) => {
    // 点在立绘上时不启动拖图，避免吞掉点击
    const target = e.target as HTMLElement | null
    if (target?.closest?.('.azeria-pin')) {
      gestureRef.current.active = false
      gestureRef.current.moved = false
      gestureRef.current.mode = 'none'
      return
    }
    const g = gestureRef.current
    updatePointers(e.touches)
    g.active = true
    g.moved = false
    g.startTransform = { ...transform }
    if (e.touches.length === 1) {
      g.mode = 'pan'
      g.startPointer = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    } else if (e.touches.length >= 2) {
      g.mode = 'pinch'
      const cd = getCenterAndDist()
      if (cd) {
        g.lastCenter = cd.center
        g.lastDist = cd.dist
      }
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    const g = gestureRef.current
    if (!g.active) return
    e.preventDefault()
    updatePointers(e.touches)
    if (g.mode === 'pan' && e.touches.length === 1) {
      const dx = e.touches[0].clientX - g.startPointer.x
      const dy = e.touches[0].clientY - g.startPointer.y
      if (Math.abs(dx) > 12 || Math.abs(dy) > 12) g.moved = true
      setTransform(
        fitToBounds({
          x: g.startTransform.x + dx,
          y: g.startTransform.y + dy,
          scale: g.startTransform.scale,
        }),
      )
    } else if (g.mode === 'pinch' && e.touches.length >= 2) {
      const cd = getCenterAndDist()
      if (!cd) return
      g.moved = true
      const scaleDelta = cd.dist / g.lastDist
      const newScale = clamp(g.startTransform.scale * scaleDelta, MIN_SCALE, MAX_SCALE)
      const viewport = viewportRef.current
      if (!viewport) return
      const rect = viewport.getBoundingClientRect()
      const oldCenter = { x: g.lastCenter.x - rect.left, y: g.lastCenter.y - rect.top }
      const newCenter = { x: cd.center.x - rect.left, y: cd.center.y - rect.top }
      const ratio = newScale / g.startTransform.scale
      setTransform(
        fitToBounds({
          x: oldCenter.x - (oldCenter.x - g.startTransform.x) * ratio + (newCenter.x - oldCenter.x),
          y: oldCenter.y - (oldCenter.y - g.startTransform.y) * ratio + (newCenter.y - oldCenter.y),
          scale: newScale,
        }),
      )
    }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    const g = gestureRef.current
    updatePointers(e.touches)
    if (e.touches.length === 0) {
      g.active = false
      g.mode = 'none'
    } else if (e.touches.length === 1) {
      g.mode = 'pan'
      g.startPointer = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      g.startTransform = { ...transform }
    }
  }

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const viewport = viewportRef.current
    if (!viewport) return
    const rect = viewport.getBoundingClientRect()
    const center = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    const newScale = clamp(transform.scale * (e.deltaY > 0 ? 0.9 : 1.1), MIN_SCALE, MAX_SCALE)
    const ratio = newScale / transform.scale
    setTransform(
      fitToBounds({
        x: center.x - (center.x - transform.x) * ratio,
        y: center.y - (center.y - transform.y) * ratio,
        scale: newScale,
      }),
    )
  }

  const mouseRef = useRef({ down: false, startX: 0, startY: 0, startTransform: { x: 0, y: 0, scale: 1 } })
  const onMouseDown = (e: React.MouseEvent) => {
    mouseRef.current = { down: true, startX: e.clientX, startY: e.clientY, startTransform: { ...transform } }
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!mouseRef.current.down) return
    setTransform(
      fitToBounds({
        x: mouseRef.current.startTransform.x + (e.clientX - mouseRef.current.startX),
        y: mouseRef.current.startTransform.y + (e.clientY - mouseRef.current.startY),
        scale: mouseRef.current.startTransform.scale,
      }),
    )
  }
  const onMouseUp = () => {
    mouseRef.current.down = false
  }

  const handleMarkerClick = (e: React.MouseEvent | React.PointerEvent, regionId: string) => {
    e.stopPropagation()
    // 仅在明显拖动后忽略点击（阈值约 12px）
    if (gestureRef.current.moved) return
    onSelect(regionId)
  }

  return (
    <div
      ref={viewportRef}
      className="scroll-map__viewport no-scrollbar"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <div
        className="scroll-map__content"
        style={{
          width: MAP_WIDTH,
          height: MAP_HEIGHT,
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
        }}
      >
        <img
          src={mapSrc}
          alt={mapAlt}
          className="scroll-map__image"
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
          draggable={false}
        />

        {markers.map((m) => {
          const active = selectedRegionId === m.regionId
          const lead = m.leads[0]
          const src = leadPortrait(lead, m.cityLabel)
          return (
            <button
              key={m.regionId}
              type="button"
              className={`azeria-pin ${active ? 'azeria-pin--active' : ''}`}
              style={{
                left: m.pos.x,
                top: m.pos.y,
                ['--pin-hue' as string]: m.hue,
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => handleMarkerClick(e, m.regionId)}
              aria-label={`${m.region?.name ?? m.regionId} · ${m.cityLabel}`}
            >
              <span className="azeria-pin__pulse" />
              <span className="azeria-pin__ring">
                <img src={src} alt="" className="azeria-pin__avatar" />
                {m.leads.length > 1 && (
                  <img
                    src={leadPortrait(m.leads[1], '兄弟')}
                    alt=""
                    className="azeria-pin__avatar azeria-pin__avatar--twin"
                  />
                )}
              </span>
              <span className="azeria-pin__label">{m.cityLabel}</span>
              {m.stamped && <span className="azeria-pin__stamp">✦</span>}
            </button>
          )
        })}

        <button
          type="button"
          className={`azeria-pin azeria-pin--tavern ${tavernSelected ? 'azeria-pin--active' : ''}`}
          style={{
            left: (AZERIA_TAVERN_PIN.xPct / 100) * MAP_WIDTH,
            top: (AZERIA_TAVERN_PIN.yPct / 100) * MAP_HEIGHT,
            ['--pin-hue' as string]: AZERIA_TAVERN_PIN.hue,
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            if (gestureRef.current.moved) return
            onSelectTavern()
          }}
          aria-label={AZERIA_TAVERN_PIN.label}
        >
          <span className="azeria-pin__pulse" />
          <span className="azeria-pin__ring azeria-pin__ring--tavern">
            <Beer size={18} />
          </span>
          <span className="azeria-pin__label">{AZERIA_TAVERN_PIN.label}</span>
        </button>

        {customPins.map((r) => {
          const xPct = typeof r.mapX === 'number' ? r.mapX : 50
          const yPct = typeof r.mapY === 'number' ? r.mapY : 50
          const left = (MAP_WIDTH * Math.min(100, Math.max(0, xPct))) / 100
          const top = (MAP_HEIGHT * Math.min(100, Math.max(0, yPct))) / 100
          return (
            <button
              key={r.id}
              type="button"
              className="azeria-pin azeria-pin--custom"
              style={{ left, top, ['--pin-hue' as string]: '#c9a35a' }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                if (gestureRef.current.moved) return
                onSelectCustom(r)
              }}
              aria-label={`自定义地点 · ${r.name}`}
              title={r.mapNote || r.name}
            >
              <span className="azeria-pin__pulse" />
              <span className="azeria-pin__ring azeria-pin__ring--custom">
                <MapPin size={16} />
              </span>
              <span className="azeria-pin__label">{r.name}</span>
            </button>
          )
        })}

        <div className="scroll-map__caption">
          <div className="scroll-map__caption-title">
            <Compass size={14} />
            {mapCaptionTitle}
          </div>
          <div className="scroll-map__caption-sub">
            点城邦立绘 · 酒馆可驻留聊天 · 已契约 {stampCount} / {FACILITIES.length}
            {customPins.length > 0 ? ` · 自定义 ${customPins.length}` : ''}
          </div>
        </div>
      </div>
    </div>
  )
}

function RegionPanel({
  region,
  cityLabel,
  leads,
  onClose,
  onPickFacility,
  onPickLocation,
  onEnterPrimary,
  onFreeRoam,
}: {
  region: AzeriaWorldRegion
  cityLabel?: string
  leads: CharacterCard[]
  onClose: () => void
  onPickFacility: (id: string) => void
  onPickLocation: (loc: AzeriaPoi) => void
  onEnterPrimary: () => void
  onFreeRoam: () => void
}) {
  const regions = useDataStore((s) => s.regions)
  const facilities = (region.facilityIds ?? []).map((id) => FACILITY_MAP[id]).filter(Boolean)

  return (
    <motion.div
      className="scroll-map__panel no-scrollbar"
      initial={{ y: '110%' }}
      animate={{ y: 0 }}
      exit={{ y: '110%' }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
    >
      <button type="button" className="scroll-map__panel-close" onClick={onClose}>
        <X size={16} />
      </button>

      <div className="azeria-region-panel__leads">
        {leads.map((c) => (
          <div key={c.id} className="azeria-region-panel__lead">
            <img src={leadPortrait(c)} alt="" />
            <div>
              <div className="azeria-region-panel__lead-name">{c.name}</div>
              <div className="azeria-region-panel__lead-title">{c.title}</div>
            </div>
          </div>
        ))}
      </div>

      <h3 className="scroll-map__panel-name">{region.name}</h3>
      <p className="scroll-map__panel-archetype">{cityLabel ?? region.cities[0]?.name}</p>
      <p className="scroll-map__panel-desc">{region.description}</p>
      <p className="scroll-map__panel-tagline">
        环境：{region.env} · 统治：{region.race} · 危险 {'★'.repeat(region.danger)}
        {'☆'.repeat(Math.max(0, 5 - region.danger))}
      </p>

      {region.cities.length > 0 && (
        <div className="scroll-map__panel-section">
          <div className="scroll-map__panel-section-title">
            <MapPin size={12} /> 本域城邦与地点
          </div>
          <p className="scroll-map__panel-hint">点任一地点查看背景与世界书，再进入游玩</p>
          <div className="azeria-region-panel__entries">
            {region.cities.map((c) => (
              <button
                key={c.id}
                type="button"
                className="tome-btn azeria-region-panel__loc-btn"
                onClick={() => onPickLocation(c)}
              >
                {c.name}
                <span className="azeria-region-panel__poi-blurb"> · {c.blurb}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {region.pois.length > 0 && (
        <div className="scroll-map__panel-section">
          <div className="scroll-map__panel-section-title">
            <Compass size={12} /> 可探索区域
          </div>
          <p className="scroll-map__panel-hint">每个区域都可点进详情后游玩</p>
          <div className="azeria-region-panel__entries">
            {region.pois.map((p) => (
              <button
                key={p.id}
                type="button"
                className="tome-btn azeria-region-panel__loc-btn"
                onClick={() => onPickLocation(p)}
              >
                {p.name}
                <span className="azeria-region-panel__poi-blurb"> · {p.blurb}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {facilities.length > 0 && (
        <div className="scroll-map__panel-section">
          <div className="scroll-map__panel-section-title">
            <Swords size={12} /> 可进入的冒险域
          </div>
          <div className="azeria-region-panel__entries">
            {facilities.map((f) => (
              <button
                key={f.id}
                type="button"
                className="tome-btn"
                disabled={!regions[f.id]}
                onClick={() => onPickFacility(f.id)}
              >
                {f.name}
                {!regions[f.id] ? ' · 未解锁' : ''}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="scroll-map__panel-actions scroll-map__panel-actions--stack">
        <button type="button" className="scroll-map__panel-enter" onClick={onFreeRoam}>
          <Compass size={14} /> 自由游玩 · 接入 AI
        </button>
        <button type="button" className="scroll-map__panel-more" onClick={onEnterPrimary}>
          <MapPin size={14} /> 玩法入域（选身份）
        </button>
      </div>
    </motion.div>
  )
}

function LocationPanel({
  region,
  location,
  onClose,
  onBack,
  onEnter,
}: {
  region: AzeriaWorldRegion
  location: AzeriaPoi
  onClose: () => void
  onBack: () => void
  onEnter: () => void
}) {
  const copy = resolveLocationCopy(location, region)

  return (
    <motion.div
      className="scroll-map__panel no-scrollbar"
      initial={{ y: '110%' }}
      animate={{ y: 0 }}
      exit={{ y: '110%' }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
    >
      <button type="button" className="scroll-map__panel-close" onClick={onClose}>
        <X size={16} />
      </button>
      <button type="button" className="tome-btn tome-btn--ghost mb-2" onClick={onBack}>
        <ChevronLeft size={12} className="inline" /> 返回区域
      </button>

      <h3 className="scroll-map__panel-name">{copy.name}</h3>
      <p className="scroll-map__panel-archetype">
        {region.name} · {copy.blurb}
      </p>

      <div className="scroll-map__panel-section">
        <div className="scroll-map__panel-section-title">
          <MapPin size={12} /> 背景介绍
        </div>
        <p className="scroll-map__panel-desc" style={{ margin: 0 }}>
          {copy.lore}
        </p>
      </div>

      <div className="scroll-map__panel-section">
        <div className="scroll-map__panel-section-title">
          <Compass size={12} /> 地点世界书
        </div>
        <pre className="scroll-map__worldbook">{copy.worldbook}</pre>
      </div>

      <div className="scroll-map__panel-actions scroll-map__panel-actions--stack">
        <button type="button" className="scroll-map__panel-enter" onClick={onEnter}>
          <MapPin size={14} /> 进入此处游玩
        </button>
        <button type="button" className="scroll-map__panel-more" onClick={onBack}>
          先看看别的地点
        </button>
      </div>
    </motion.div>
  )
}

function FacilityPanel({
  facility,
  onClose,
  onBack,
  onEnter,
  onZoneGuide,
  portraitSrc,
}: {
  facility: FacilityDef
  onClose: () => void
  onBack: () => void
  onEnter: () => void
  onZoneGuide: () => void
  portraitSrc: string
}) {
  const zone = getZone(facility.zone)
  const azeriaRegion = resolveAzeriaRegion(facility.id)
  const [avatarError, setAvatarError] = useState(false)

  return (
    <motion.div
      className="scroll-map__panel"
      initial={{ y: '110%' }}
      animate={{ y: 0 }}
      exit={{ y: '110%' }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
    >
      <button type="button" className="scroll-map__panel-close" onClick={onClose}>
        <X size={16} />
      </button>
      <button type="button" className="tome-btn tome-btn--ghost mb-2" onClick={onBack}>
        <ChevronLeft size={12} className="inline" /> 返回区域
      </button>

      <div className="scroll-map__panel-header">
        <div className="scroll-map__panel-avatar" style={{ borderColor: zone?.color }}>
          {avatarError ? (
            <span className="scroll-map__panel-avatar-fallback">
              <User size={20} />
            </span>
          ) : (
            <img src={portraitSrc} alt={facility.npcArchetype} onError={() => setAvatarError(true)} />
          )}
        </div>
        <div className="scroll-map__panel-title">
          <h3 className="scroll-map__panel-name">
            {facility.name}
          </h3>
          <p className="scroll-map__panel-archetype">{facility.npcArchetype}</p>
          <p className="scroll-map__panel-tagline">{facility.tagline}</p>
        </div>
      </div>

      <p className="scroll-map__panel-desc">{facility.scene}</p>

      {azeriaRegion && (
        <div className="scroll-map__panel-section">
          <div className="scroll-map__panel-section-title">
            <Compass size={12} /> 区域风险
          </div>
          <p className="scroll-map__panel-tagline" style={{ margin: 0 }}>
            危险度：{azeriaRegion.danger} · {azeriaRegion.env}
          </p>
        </div>
      )}

      <div className="scroll-map__panel-section">
        <div className="scroll-map__panel-section-title">
          <Swords size={12} /> 玩法模式
        </div>
        <div className="scroll-map__panel-modes">
          {facility.playModes.map((mode) => (
            <span key={mode} className="scroll-map__panel-mode">
              {mode}
            </span>
          ))}
        </div>
      </div>

      <div className="scroll-map__panel-actions">
        <button type="button" className="scroll-map__panel-enter" onClick={onEnter}>
          <MapPin size={14} /> 进入此地
        </button>
        <button type="button" className="scroll-map__panel-more" onClick={onZoneGuide}>
          区域导览 →
        </button>
      </div>
    </motion.div>
  )
}

function TavernMapPanel({
  residents,
  presetName,
  lead,
  onClose,
  onOpenHub,
  onHallChat,
  onGroupChat,
  onPrivate,
  onManageResidents,
}: {
  residents: BondRecord[]
  presetName: string
  lead: CharacterCard | null
  onClose: () => void
  onOpenHub: () => void
  onHallChat: () => void
  onGroupChat: () => void
  onPrivate: (characterId: string) => void
  onManageResidents: () => void
}) {
  return (
    <motion.div
      className="scroll-map__panel no-scrollbar"
      initial={{ y: '110%' }}
      animate={{ y: 0 }}
      exit={{ y: '110%' }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
    >
      <button type="button" className="scroll-map__panel-close" onClick={onClose}>
        <X size={16} />
      </button>

      {lead && (
        <div className="azeria-region-panel__leads">
          <div className="azeria-region-panel__lead">
            <img src={leadPortrait(lead)} alt="" />
            <div>
              <div className="azeria-region-panel__lead-name">{lead.name}</div>
              <div className="azeria-region-panel__lead-title">{lead.title}</div>
            </div>
          </div>
        </div>
      )}

      <h3 className="scroll-map__panel-name">冒险者酒馆</h3>
      <p className="scroll-map__panel-archetype">帝都东南 · 驻留氛围「{presetName}」</p>
      <p className="scroll-map__panel-desc">
        想和驻留角色说话，就在这里点开。也可进大厅管委托、编组，或直接在酒馆闲聊。
      </p>

      <div className="scroll-map__panel-section">
        <div className="scroll-map__panel-section-title">
          <Home size={12} /> 驻留对象（{residents.length}）
        </div>
        {residents.length === 0 ? (
          <p className="scroll-map__panel-hint">暂无驻留。可先开酒馆大厅，从名册安置对象。</p>
        ) : (
          <div className="azeria-region-panel__entries">
            {residents.map((b) => (
              <button
                key={b.characterId}
                type="button"
                className="tome-btn azeria-region-panel__loc-btn"
                onClick={() => onPrivate(b.characterId)}
              >
                私语 · {b.displayName}
              </button>
            ))}
          </div>
        )}
        {residents.length >= 2 && (
          <button type="button" className="tome-btn mt-2 w-full" onClick={onGroupChat}>
            驻留群聊（{residents.length} 人）
          </button>
        )}
        <button type="button" className="tome-btn tome-btn--ghost mt-2 w-full" onClick={onManageResidents}>
          管理驻留 / 切换氛围
        </button>
      </div>

      <div className="scroll-map__panel-actions scroll-map__panel-actions--stack">
        <button type="button" className="scroll-map__panel-enter" onClick={onHallChat}>
          <Beer size={14} /> 酒馆大厅闲聊
        </button>
        <button type="button" className="scroll-map__panel-more" onClick={onOpenHub}>
          <MapPin size={14} /> 进入酒馆功能大厅
        </button>
      </div>
    </motion.div>
  )
}
