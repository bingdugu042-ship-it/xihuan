import { useEffect } from 'react'
import type { GeneratedRecord } from '@/types'
import { useGeneratedStore } from '@/store/generatedStore'

interface HistoryListProps {
  records: GeneratedRecord[]
  emptyHint: string
  onRemove?: (id: string) => void
}

export function GeneratedHistoryList({ records, emptyHint, onRemove }: HistoryListProps) {
  if (records.length === 0) {
    return (
      <p className="mt-3 text-center text-[11px]" style={{ color: 'var(--c-text-dim)' }}>
        {emptyHint}
      </p>
    )
  }

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-medium" style={{ color: 'var(--c-primary)' }}>
        历史记录
      </p>
      <div className="flex flex-col gap-2">
        {records.map((r) => (
          <HistoryItem key={r.id} record={r} onRemove={onRemove} />
        ))}
      </div>
    </div>
  )
}

function HistoryItem({
  record,
  onRemove,
}: {
  record: GeneratedRecord
  onRemove?: (id: string) => void
}) {
  const time = new Date(record.createdAt).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="glass-card p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium" style={{ color: 'var(--c-text)' }}>
          {record.title}
        </p>
        <span className="shrink-0 text-[9px]" style={{ color: 'var(--c-text-dim)' }}>
          {time}
        </span>
      </div>
      <p className="text-[11px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--c-text-dim)' }}>
        {record.content}
      </p>
      {record.imageUrl && (
        <img src={record.imageUrl} alt="" className="mt-2 w-full rounded-lg" />
      )}
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(record.id)}
          className="mt-2 text-[10px]"
          style={{ color: 'var(--c-text-dim)' }}
        >
          删除此条
        </button>
      )}
    </div>
  )
}

export function useGeneratedHistory(type: GeneratedRecord['type']) {
  const allRecords = useGeneratedStore((s) => s.records)
  const loaded = useGeneratedStore((s) => s.loaded)
  const load = useGeneratedStore((s) => s.load)
  const removeRecord = useGeneratedStore((s) => s.removeRecord)
  const records = allRecords.filter((r) => r.type === type)

  useEffect(() => {
    void load()
  }, [load])

  return { records, loaded, removeRecord, reload: () => load() }
}
