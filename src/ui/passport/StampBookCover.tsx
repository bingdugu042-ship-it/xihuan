import { motion } from 'framer-motion'
import { Sparkles, Star } from 'lucide-react'

interface StampBookCoverProps {
  open: boolean
  onOpen: () => void
  count: number
  total: number
  isGolden: boolean
}

const noiseBg =
  "url(\"data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.8' numOctaves='3'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.25'/></svg>"
  ) +
  "\")"

function formatCount(count: number, total: number) {
  return `${count} / ${total}`
}

export function StampBookCover({ open, onOpen, count, total, isGolden }: StampBookCoverProps) {
  return (
    <motion.div
      className="absolute inset-0 cursor-pointer overflow-hidden rounded-2xl"
      style={{
        transformOrigin: 'left center',
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
        zIndex: open ? 0 : 30,
        pointerEvents: open ? 'none' : 'auto',
      }}
      initial={false}
      animate={{ rotateY: open ? -170 : 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => {
        if (!open) onOpen()
      }}
    >
      {isGolden ? (
        <GoldenCover count={count} total={total} />
      ) : (
        <BlueCover count={count} total={total} />
      )}
    </motion.div>
  )
}

function BlueCover({ count, total }: { count: number; total: number }) {
  return (
    <div
      className="relative flex h-full flex-col items-center justify-center px-6 text-center"
      style={{
        background: 'linear-gradient(135deg, #5ec8e8 0%, #2a9ec4 50%, #1a7a9a 100%)',
        boxShadow: '0 20px 50px rgba(0,100,140,0.35), inset 0 0 80px rgba(0,0,0,0.12)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{ backgroundImage: noiseBg }}
      />

      <div
        className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.45)' }}
      >
        <Star size={32} style={{ color: '#f5b85c' }} />
      </div>

      <h2
        className="relative text-3xl font-medium tracking-[0.15em]"
        style={{ fontFamily: 'var(--font-dialogue)', color: '#ffffff' }}
      >
        集印章本
      </h2>
      <p className="relative mt-2 text-xs tracking-[0.3em]" style={{ color: 'rgba(255,255,255,0.75)' }}>
        STAMP COLLECTION
      </p>

      <div className="relative mt-8 flex flex-col items-center gap-1">
        <div className="h-px w-24" style={{ background: 'rgba(255,255,255,0.35)' }} />
        <p className="text-[10px] tracking-widest" style={{ color: 'rgba(255,255,255,0.7)' }}>
          轻触打开
        </p>
        <div className="h-px w-24" style={{ background: 'rgba(255,255,255,0.35)' }} />
      </div>

      <div
        className="absolute bottom-5 flex items-center gap-1 text-[10px]"
        style={{ color: 'rgba(255,255,255,0.65)' }}
      >
        <span>{formatCount(count, total)}</span>
        <span>· 艾尔茜利恩</span>
      </div>
    </div>
  )
}

function GoldenCover({
  count,
  total,
}: {
  count: number
  total: number
}) {
  return (
    <div
      className="relative flex h-full flex-col items-center justify-center px-6 text-center"
      style={{
        background: 'linear-gradient(135deg, #f5d78e 0%, #f5b85c 45%, #c98a20 100%)',
        boxShadow: '0 20px 50px rgba(180,130,30,0.45), inset 0 0 80px rgba(255,255,255,0.25)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{ backgroundImage: noiseBg }}
      />

      {/* 光芒装饰 */}
      <motion.div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
      >
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute h-full w-px"
            style={{
              background:
                'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
              transform: `rotate(${i * 15}deg)`,
            }}
          />
        ))}
      </motion.div>

      <motion.div
        className="relative mb-3 flex h-16 w-16 items-center justify-center rounded-full"
        style={{
          background: 'rgba(255,255,255,0.35)',
          border: '2px solid rgba(255,255,255,0.7)',
          boxShadow: '0 0 24px rgba(255,255,255,0.35)',
        }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Star size={32} style={{ color: '#7a4e08' }} />
      </motion.div>

      <div
        className="relative mb-2 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold"
        style={{ background: 'rgba(122,78,8,0.18)', color: '#5a3a05' }}
      >
        <Sparkles size={10} />
        集章完成
        <Sparkles size={10} />
      </div>

      <h2
        className="relative text-3xl font-medium tracking-[0.15em]"
        style={{ fontFamily: 'var(--font-dialogue)', color: '#4a2e04' }}
      >
        集印章本
      </h2>
      <p className="relative mt-2 text-xs tracking-[0.3em]" style={{ color: 'rgba(90,58,5,0.75)' }}>
        STAMP COLLECTION
      </p>

      <div className="relative mt-8 flex flex-col items-center gap-1">
        <div className="h-px w-24" style={{ background: 'rgba(90,58,5,0.35)' }} />
        <p className="text-[10px] tracking-widest" style={{ color: 'rgba(90,58,5,0.7)' }}>
          金色典藏
        </p>
        <div className="h-px w-24" style={{ background: 'rgba(90,58,5,0.35)' }} />
      </div>

      <div
        className="absolute bottom-5 flex items-center gap-1 text-[10px] font-bold"
        style={{ color: 'rgba(90,58,5,0.8)' }}
      >
        <span>{formatCount(count, total)}</span>
        <span>· 艾尔茜利恩</span>
      </div>
    </div>
  )
}
