import {
  Eye,
  Cat,
  Waves,
  Glasses,
  ScanEye,
  Bath,
  Stethoscope,
  GraduationCap,
  Swords,
  UtensilsCrossed,
  BookOpen,
  Clapperboard,
  Flower2,
  Microscope,
  EyeOff,
  Gavel,
  Camera,
  Dices,
  Moon,
  Sprout,
  Scale,
  TrainFront,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import type { FacilityIcon as FacilityIconName } from '@/data/facilities'

const MAP: Record<FacilityIconName, LucideIcon> = {
  Eye,
  Cat,
  Waves,
  Glasses,
  ScanEye,
  Bath,
  Stethoscope,
  GraduationCap,
  Swords,
  UtensilsCrossed,
  BookOpen,
  Clapperboard,
  Flower2,
  Microscope,
  EyeOff,
  Gavel,
  Camera,
  Dices,
  Moon,
  Sprout,
  Scale,
  TrainFront,
}

interface Props {
  icon: FacilityIconName
  size?: number
  className?: string
  style?: React.CSSProperties
}

export function FacilityIcon({ icon, size = 20, className, style }: Props) {
  const Icon = MAP[icon] ?? Sparkles
  return <Icon size={size} className={className} style={style} />
}
