/** 声纹起伏动画 */
export function VoiceWaveform({ active, color = '#fff' }: { active: boolean; color?: string }) {
  return (
    <div className="flex h-6 items-end justify-center gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-1 rounded-full transition-all"
          style={{
            background: color,
            height: active ? `${8 + (i % 3) * 6}px` : '4px',
            animation: active ? `voiceBar 0.${5 + i}s ease-in-out infinite alternate` : undefined,
          }}
        />
      ))}
      <style>{`
        @keyframes voiceBar {
          from { transform: scaleY(0.4); opacity: 0.6; }
          to { transform: scaleY(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
