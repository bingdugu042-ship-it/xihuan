import { AdventureBook3D } from './AdventureBook3D'

/** 重播序章时复用同一本 3D 书 */
export function Cutscene({ onComplete }: { onComplete: () => void }) {
  return <AdventureBook3D onFinished={onComplete} />
}
