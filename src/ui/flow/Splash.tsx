import { AdventureBook3D } from './AdventureBook3D'

/** 开场：Three.js 立体冒险之书，翻页后进入后续流程 */
export function Splash({ onEnter }: { onEnter: () => void }) {
  return <AdventureBook3D onFinished={onEnter} />
}
