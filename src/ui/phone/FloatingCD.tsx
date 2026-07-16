import { useRef, useEffect, useState } from 'react'
import { useMusicStore, getSharedMusicAudio, hardStopMusicAudio } from '@/store/musicStore'
import { useSettingsStore } from '@/store/settingsStore'

const DISMISS_ZONE_HEIGHT = 80
const DRAG_THRESHOLD = 8

/** 悬浮 CD：单击暂停/播放，拖动只改位置，拖至底部暂停并隐藏 */
export function FloatingCD() {
  const { tracks, playingId, isPaused, orbVisible, togglePause, pauseAll, setOrbVisible } = useMusicStore()
  const volume = useSettingsStore((s) => s.settings.ui.volume)
  const audio = getSharedMusicAudio()
  const [pos, setPos] = useState({ x: 16, y: 120 })
  const drag = useRef<{ dx: number; dy: number; moved: boolean; startX: number; startY: number } | null>(null)

  const track = tracks.find((t) => t.id === playingId)
  const shouldPlay = !!track && !isPaused && orbVisible

  useEffect(() => {
    audio.volume = volume
    if (!track || !orbVisible) {
      audio.pause()
      return
    }
    if (audio.src !== track.src) {
      audio.src = track.src
    }
    if (shouldPlay) {
      void audio.play().catch(() => pauseAll())
    } else {
      audio.pause()
    }
  }, [track, shouldPlay, volume, orbVisible, audio, pauseAll])

  useEffect(() => {
    if (!playingId) hardStopMusicAudio()
  }, [playingId])

  if (!playingId || !track) return null

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = {
      dx: e.clientX - pos.x,
      dy: e.clientY - pos.y,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const dist = Math.hypot(e.clientX - drag.current.startX, e.clientY - drag.current.startY)
    if (dist > DRAG_THRESHOLD) drag.current.moved = true
    const nx = Math.max(8, Math.min(window.innerWidth - 56, e.clientX - drag.current.dx))
    const ny = Math.max(8, Math.min(window.innerHeight - 56, e.clientY - drag.current.dy))
    setPos({ x: nx, y: ny })
  }

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    if (!d) return

    const inDismissZone = e.clientY >= window.innerHeight - DISMISS_ZONE_HEIGHT
    if (d.moved && inDismissZone) {
      hardStopMusicAudio()
      pauseAll()
      setOrbVisible(false)
      return
    }
    if (!d.moved) togglePause()
  }

  if (!orbVisible) return null

  return (
    <button
      type="button"
      className={`cd-orb ${shouldPlay ? 'spinning' : ''}`}
      style={{ left: pos.x, top: pos.y, position: 'fixed', zIndex: 200, touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      title={shouldPlay ? '点击暂停' : '点击播放'}
      aria-label={shouldPlay ? '暂停音乐' : '播放音乐'}
    />
  )
}
