import { useEffect, useRef, useState, useCallback } from 'react'
import './adventure-book.css'

interface PageDef {
  title: string
  subtitle: string
  lines: string[]
}

const PAGES: PageDef[] = [
  {
    title: 'I · 失衡',
    subtitle: 'THE TILT',
    lines: ['天使与恶魔曾共执天平，', '而今砝码锈蚀，界限崩解。', '世界在无声的倾斜中等待坠落。'],
  },
  {
    title: 'II · 空王座',
    subtitle: 'THE EMPTY THRONE',
    lines: ['魔王之位已空缺千年。', '诸神不敢落座，亦不忍毁去。', '他们说：那把椅子在等一个名字。'],
  },
  {
    title: 'III · 预言',
    subtitle: 'THE PROPHECY',
    lines: ['古老岩壁刻着前半句：', '「当银月坠地，笙歌将止战。」', '后半句——藏在某个未降生的灵魂里。'],
  },
  {
    title: 'IV · 无名者',
    subtitle: 'THE NAMELESS',
    lines: ['人们称她为明月笙。', '她以为是自己在寻找命运，', '却不知命运一直在寻找她。'],
  },
  {
    title: 'V · 终章揭幕',
    subtitle: 'THE UNWRITTEN',
    lines: ['书页至此只剩空白。', '后半句将由你的指尖落下。', '轻触，踏入艾尔茜利恩。'],
  },
]

function Particles() {
  return (
    <div className="ab-particles" aria-hidden>
      {Array.from({ length: 48 }).map((_, i) => (
        <span
          key={i}
          className="ab-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDuration: `${4 + Math.random() * 6}s`,
            animationDelay: `${Math.random() * 5}s`,
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
          }}
        />
      ))}
    </div>
  )
}

export function AdventureBook3D({ onFinished }: { onFinished: () => void }) {
  const [step, setStep] = useState(0) // 0=cover, 1..5=pages, 6=done
  const [musicStarted, setMusicStarted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const finishing = useRef(false)

  const advance = useCallback(() => {
    if (finishing.current) return

    if (!musicStarted) {
      const audio = audioRef.current
      if (audio) {
        audio.volume = 0.7
        audio.play().catch(() => {
          /* 浏览器自动播放策略：等用户点击后再播 */
        })
        setMusicStarted(true)
      }
    }

    if (step >= PAGES.length) {
      finishing.current = true
      window.setTimeout(onFinished, 600)
      return
    }
    setStep((s) => s + 1)
  }, [step, musicStarted, onFinished])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance])

  const coverOpen = step >= 1

  return (
    <div className="ab-root">
      <audio ref={audioRef} src="/opening-theme.mp3" preload="auto" loop={false} />
      <Particles />

      <div className="ab-glow" />
      <div className="ab-vignette" />

      <div className="ab-scene" onClick={advance}>
        <div className="ab-book">
          {/* back cover (left side, fixed) */}
          <div className="ab-back-cover">
            <div className="ab-back-cover-inner" />
          </div>

          {/* pages */}
          {PAGES.map((page, i) => {
            const pageIndex = i + 1 // 1..5
            const isTurned = step > pageIndex
            const isActive = step === pageIndex
            return (
              <div
                key={i}
                className={`ab-page ${isTurned ? 'ab-page--turned' : ''} ${isActive ? 'ab-page--active' : ''}`}
                style={{ zIndex: 100 - i }}
              >
                <div className="ab-page-front ab-paper">
                  <div className="ab-page-noise" />
                  <div className="ab-page-content">
                    <p className="ab-page-subtitle">{page.subtitle}</p>
                    <h2 className="ab-page-title">{page.title}</h2>
                    <div className="ab-page-divider" />
                    {page.lines.map((line, idx) => (
                      <p key={idx} className="ab-page-line">
                        {line}
                      </p>
                    ))}
                    <div className="ab-page-footer">{pageIndex}</div>
                  </div>
                </div>
                <div className="ab-page-back ab-paper">
                  <div className="ab-page-noise" />
                </div>
              </div>
            )
          })}

          {/* front cover */}
          <div
            className={`ab-cover ${coverOpen ? 'ab-cover--open' : ''}`}
            style={{ zIndex: 200 }}
          >
            <div className="ab-cover-front">
              <div className="ab-cover-ornament ab-cover-ornament--tl" />
              <div className="ab-cover-ornament ab-cover-ornament--tr" />
              <div className="ab-cover-ornament ab-cover-ornament--bl" />
              <div className="ab-cover-ornament ab-cover-ornament--br" />
              <div className="ab-cover-border" />
              <div className="ab-cover-inner-border" />
              <p className="ab-cover-series">AETHERION</p>
              <h1 className="ab-cover-title">预言之书</h1>
              <p className="ab-cover-subtitle">The Book of Falling Moon</p>
              <p className="ab-cover-hint">点击封面 · 揭开预言</p>
            </div>
            <div className="ab-cover-back ab-paper">
              <div className="ab-page-noise" />
            </div>
          </div>
        </div>
      </div>

      <div className="ab-bottom-hint">
        {step === 0 && '点击封面或按空格键开始'}
        {step >= 1 && step <= PAGES.length && '点击书页或按空格键翻页'}
      </div>
    </div>
  )
}
