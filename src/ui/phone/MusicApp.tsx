import { useRef } from 'react'
import { Upload, Play, Trash2, Disc3, Pause, Square } from 'lucide-react'
import { useMusicStore, hardStopMusicAudio } from '@/store/musicStore'
import { PhoneAppShell } from './PhoneAppShell'

export function MusicApp() {
  const fileRef = useRef<HTMLInputElement>(null)
  const { tracks, playingId, isPaused, addTrack, removeTrack, playTrack, togglePause, pauseAll, stopAll, setOrbVisible } =
    useMusicStore()

  const onUpload = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      void addTrack(file.name.replace(/\.[^.]+$/, ''), reader.result as string).then((t) => {
        playTrack(t.id)
      })
    }
    reader.readAsDataURL(file)
  }

  const stopCurrent = () => {
    hardStopMusicAudio()
    stopAll()
  }

  return (
    <PhoneAppShell title="音乐">
      <button
        onClick={() => fileRef.current?.click()}
        className="glass-card mb-4 flex w-full items-center justify-center gap-2 py-3 text-sm"
        style={{ color: 'var(--c-primary)' }}
      >
        <Upload size={16} /> 上传本地音乐
      </button>
      <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />

      {playingId && (
        <button
          type="button"
          onClick={stopCurrent}
          className="glass-card mb-4 flex w-full items-center justify-center gap-2 py-2.5 text-sm"
          style={{ color: '#e57373' }}
        >
          <Square size={14} /> 停止播放并关闭 CD
        </button>
      )}

      <p className="mb-3 text-center text-[10px]" style={{ color: 'var(--c-text-dim)' }}>
        悬浮 CD：单击暂停/播放 · 拖动改位置 · 拖至底部暂停并隐藏
      </p>

      {tracks.length === 0 ? (
        <p className="text-center text-xs" style={{ color: 'var(--c-text-dim)' }}>
          上传后会显示悬浮 CD 球，点击播放
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {tracks.map((t) => {
            const active = playingId === t.id
            const playing = active && !isPaused
            return (
              <div key={t.id} className="glass-card flex items-center gap-3 p-3">
                <Disc3 size={20} style={{ color: 'var(--c-primary)' }} />
                <span className="min-w-0 flex-1 truncate text-sm">{t.name}</span>
                <button
                  onClick={() => {
                    if (active) togglePause()
                    else playTrack(t.id)
                    setOrbVisible(true)
                  }}
                  className="rounded-lg p-2"
                  style={{ color: playing ? 'var(--c-accent)' : 'var(--c-text-dim)' }}
                >
                  {playing ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                  onClick={() => {
                    if (active) {
                      hardStopMusicAudio()
                      pauseAll()
                    }
                    void removeTrack(t.id)
                  }}
                  className="rounded-lg p-2"
                  style={{ color: 'var(--c-text-dim)' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </PhoneAppShell>
  )
}
