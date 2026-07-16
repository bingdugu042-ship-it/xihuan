import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useDiceUiStore } from '@/store/diceUiStore'
import { useSessionStore } from '@/store/sessionStore'
import { formatDiceNarration, type DiceRollResult } from '@/utils/dice'

function D20Mesh({ spinning, targetRoll }: { spinning: boolean; targetRoll: number }) {
  const mesh = useRef<THREE.Mesh>(null)
  const speed = useRef(18)

  useFrame((_, dt) => {
    if (!mesh.current) return
    if (spinning) {
      speed.current = Math.max(4, speed.current)
      mesh.current.rotation.x += dt * speed.current
      mesh.current.rotation.y += dt * speed.current * 1.3
    } else {
      // 缓停到与点数相关的姿态
      const aimX = (targetRoll / 20) * Math.PI * 2
      const aimY = ((21 - targetRoll) / 20) * Math.PI * 2
      mesh.current.rotation.x += (aimX - mesh.current.rotation.x) * Math.min(1, dt * 4)
      mesh.current.rotation.y += (aimY - mesh.current.rotation.y) * Math.min(1, dt * 4)
    }
  })

  return (
    <mesh ref={mesh} castShadow>
      <icosahedronGeometry args={[1.15, 0]} />
      <meshStandardMaterial
        color="#c9a35a"
        metalness={0.45}
        roughness={0.35}
        emissive="#5a3a10"
        emissiveIntensity={0.25}
      />
    </mesh>
  )
}

function DiceScene({ spinning, roll }: { spinning: boolean; roll: number }) {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 3]} intensity={1.2} />
      <pointLight position={[-3, 2, -2]} intensity={0.4} color="#e8b4c4" />
      <D20Mesh spinning={spinning} targetRoll={roll} />
    </>
  )
}

export function DiceOverlay() {
  const open = useDiceUiStore((s) => s.open)
  const payload = useDiceUiStore((s) => s.payload)
  const hide = useDiceUiStore((s) => s.hide)
  const appendSystemMessage = useSessionStore((s) => s.appendSystemMessage)
  const [spinning, setSpinning] = useState(true)
  const [revealed, setRevealed] = useState(false)
  const committed = useRef(false)

  const result = payload?.result

  useEffect(() => {
    if (!open || !result) return
    setSpinning(true)
    setRevealed(false)
    committed.current = false
    const t1 = window.setTimeout(() => setSpinning(false), 1400)
    const t2 = window.setTimeout(() => setRevealed(true), 1800)
    const t3 = window.setTimeout(() => {
      void finish(result)
    }, 2800)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, result?.roll, result?.total])

  const finish = async (r: DiceRollResult) => {
    if (committed.current) return
    committed.current = true
    if (payload?.commitToChat !== false) {
      await appendSystemMessage(formatDiceNarration(r), 'dice')
    }
    window.dispatchEvent(new CustomEvent('azeria-dice-done', { detail: r }))
    hide()
  }

  const verdict = useMemo(() => {
    if (!result) return ''
    if (result.critSuccess) return '大成功'
    if (result.critFail) return '大失败'
    return result.success ? '成功' : '失败'
  }, [result])

  if (!open || !result) return null

  const mod = result.modifier >= 0 ? `+${result.modifier}` : `${result.modifier}`
  const verdictColor = result.critSuccess
    ? '#f5d76e'
    : result.critFail
      ? '#e57373'
      : result.success
        ? '#3dd68c'
        : '#e57373'

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{ background: 'rgba(8, 5, 4, 0.78)', backdropFilter: 'blur(6px)' }}
      onClick={() => {
        if (revealed) void finish(result)
      }}
    >
      <p className="mb-2 text-sm tracking-widest" style={{ color: 'var(--c-gold)' }}>
        {payload?.title ?? `判定 · ${result.skillLabel}`}
      </p>
      <div className="h-[220px] w-[220px]">
        <Canvas camera={{ position: [0, 0, 4.2], fov: 42 }}>
          <DiceScene spinning={spinning} roll={result.roll} />
        </Canvas>
      </div>

      <div
        className="mt-2 min-h-[72px] text-center transition-opacity duration-300"
        style={{ opacity: revealed ? 1 : 0.35 }}
      >
        <div className="font-serif text-4xl font-bold" style={{ color: '#f5e6d3' }}>
          {spinning ? '…' : result.roll}
        </div>
        {revealed && (
          <>
            <p className="mt-1 text-sm" style={{ color: 'var(--c-text-dim)' }}>
              1d20({result.roll}) {mod} = {result.total} vs DC {result.dc}
            </p>
            <p className="mt-1 text-lg font-semibold" style={{ color: verdictColor }}>
              {verdict}
            </p>
            <p className="mt-2 text-[10px]" style={{ color: 'var(--c-text-muted)' }}>
              点击关闭
            </p>
          </>
        )}
      </div>
    </div>
  )
}
